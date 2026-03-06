import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// POST /api/cooperativa/distribuir
// Chamado automaticamente quando um comprador compra um lote CarbonCorp
// Body: { loteId, quantidade, compradorId }
export async function POST(request: Request) {
  try {
    const { loteId, quantidade, compradorId } = await request.json();

    if (!loteId || !quantidade || !compradorId) {
      return NextResponse.json({ error: "Dados invalidos" }, { status: 400 });
    }

    const resultado = await prisma.$transaction(async (tx) => {

      // 1. Verifica lote CarbonCorp
      const lote = await tx.lote.findUnique({
        where: { id: loteId },
        include: {
          contribuicoes: {
            where:   { status: "no_pool" },
            include: { user: { select: { id: true, nome: true } } },
          },
        },
      });

      if (!lote || lote.certificadora !== "CarbonCorp") {
        throw new Error("Lote CarbonCorp nao encontrado.");
      }

      const disponivelLote = lote.quantidade - (lote.vendidos || 0);
      if (disponivelLote < quantidade) {
        throw new Error(`Saldo insuficiente no lote. Disponivel: ${disponivelLote.toFixed(2)} tCO2.`);
      }

      const totalPool     = lote.contribuicoes.reduce((s, c) => s + c.quantidade, 0);
      const valorTotal    = quantidade * lote.preco; // quantidade * cotacao
      const coop          = await tx.cooperativa.findFirst();
      if (!coop) throw new Error("Cooperativa nao encontrada.");

      // 2. Distribui proporcionalmente para cada contribuidor
      const distribuicoes: { userId: string; nome: string; qtd: number; valor: number }[] = [];
      let qtdRestante = quantidade;

      // Ordena por mais antigo primeiro (FIFO entre contribuidores)
      const contribsOrdenadas = [...lote.contribuicoes].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      for (const contrib of contribsOrdenadas) {
        if (qtdRestante <= 0) break;

        // Proporcao desta contribuicao sobre o total do pool
        const proporcao  = contrib.quantidade / totalPool;
        const qtdDescontada = Math.min(contrib.quantidade, proporcao * quantidade);
        const valorProdutor = proporcao * valorTotal;

        if (qtdDescontada <= 0) continue;

        // Credita saldo do produtor
        await tx.user.update({
          where: { id: contrib.userId },
          data:  { saldo: { increment: valorProdutor } },
        });

        // Registra transacao no extrato do produtor
        await tx.transacao.create({
          data: {
            userId: contrib.userId,
            type:   "venda_coletiva",
            cert:   "CarbonCorp",
            amount: qtdDescontada,
            price:  lote.preco,
            total:  valorProdutor,
            status: "pago",
          },
        });

        // Atualiza quantidade da contribuicao
        const novaQtd = contrib.quantidade - qtdDescontada;
        await tx.contribuicao.update({
          where: { id: contrib.id },
          data:  {
            quantidade: novaQtd,
            status:     novaQtd <= 0 ? "vendido" : "no_pool",
          },
        });

        distribuicoes.push({
          userId: contrib.userId,
          nome:   contrib.user.nome,
          qtd:    qtdDescontada,
          valor:  valorProdutor,
        });

        qtdRestante -= qtdDescontada;
      }

      // 3. Atualiza lote CarbonCorp — marca como vendidos
      const loteAtualizado = await tx.lote.update({
        where: { id: loteId },
        data:  { vendidos: { increment: quantidade } },
      });

      // 4. Se lote zerou, fecha
      const disponivel = loteAtualizado.quantidade - loteAtualizado.vendidos;
      if (disponivel <= 0) {
        await tx.lote.update({
          where: { id: loteId },
          data:  { status: "vendido" },
        });
      }

      // 5. Atualiza poolTotal da cooperativa
      await tx.cooperativa.update({
        where: { id: coop.id },
        data:  { poolTotal: { decrement: quantidade } },
      });

      // 6. Registra venda coletiva
      await tx.vendaColetiva.create({
        data: {
          cooperativaId:   coop.id,
          totalTCO2:       quantidade,
          precoUnitario:   lote.preco,
          totalArrecadado: valorTotal,
          comissao:        0,
          status:          "concluida",
        },
      });

      // 7. Movimento historico
      await tx.movimento.create({
        data: {
          tipo:          "VENDA_COLETIVA",
          descricao:     `Venda de ${quantidade} tCO2 do lote ${lote.nome} — ${distribuicoes.length} produtores pagos`,
          valor:         valorTotal,
          cooperativaId: coop.id,
        },
      });

      return { valorTotal, distribuicoes, loteZerou: disponivel <= 0 };
    });

    return NextResponse.json({ success: true, data: resultado });
  } catch (error: any) {
    console.error("Erro na distribuicao:", error);
    return NextResponse.json({ error: error.message || "Erro interno" }, { status: 500 });
  }
}