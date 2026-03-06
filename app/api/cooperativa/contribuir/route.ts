import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const CAPACIDADE = 100; // tCO₂ por lote CarbonCorp

async function buscarOuCriarLoteCarbon(tx: any, userId: string) {
  // Busca lote ativo com espaco disponivel
  let lote = await tx.lote.findFirst({
    where: {
      tipo:          "Coletivo",
      certificadora: "CarbonCorp",
      status:        "ativo",
      quantidade:    { lt: CAPACIDADE },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!lote) {
    // Conta quantos lotes CarbonCorp ja existem para numerar
    const total = await tx.lote.count({ where: { certificadora: "CarbonCorp" } });
    const nome  = total === 0 ? "CarbonCorp" : `CarbonCorp #${total + 1}`;

    lote = await tx.lote.create({
      data: {
        nome,
        tipo:          "Coletivo",
        certificadora: "CarbonCorp",
        quantidade:    0,
        vendidos:      0,
        preco:         88.42,
        status:        "ativo",
        userId,
        descricao:     "Lote coletivo CleanTrade — varios produtores, distribuicao proporcional.",
      },
    });
  }

  return lote;
}

export async function POST(request: Request) {
  try {
    const { userId, loteId, quantidade } = await request.json();

    if (!userId || !loteId || !quantidade || quantidade <= 0) {
      return NextResponse.json({ error: "Dados invalidos" }, { status: 400 });
    }

    const resultado = await prisma.$transaction(async (tx) => {

      // 1. Verifica lote de origem
      const loteOrigem = await tx.lote.findUnique({ where: { id: loteId } });
      if (!loteOrigem || loteOrigem.userId !== userId) {
        throw new Error("Lote nao encontrado ou acesso negado.");
      }
      const disponivel = loteOrigem.quantidade - (loteOrigem.vendidos || 0);
      if (disponivel < quantidade) {
        throw new Error(`Saldo insuficiente. Disponivel: ${disponivel.toFixed(2)} tCO2.`);
      }

      // 2. Busca cooperativa (cria se nao existir)
      let coop = await tx.cooperativa.findFirst();
      if (!coop) {
        coop = await tx.cooperativa.create({
          data: {
            nome:       "CarbonCorp",
            cnpj:       "00.000.000/0001-00",
            descricao:  "Pool coletivo CleanTrade",
            taxaAdesao: 0,
            comissao:   0,
            saldoFundo: 0,
            poolTotal:  0,
          },
        });
      }

      // 3. Garante que o vendedor e membro (sem taxa)
      let membro = await tx.membro.findUnique({ where: { userId } });
      if (!membro) {
        membro = await tx.membro.create({
          data: { userId, cooperativaId: coop.id, plano: "basico", taxaPaga: false },
        });
      }

      // 4. Desconta TUDO do lote de origem de uma vez
      await tx.lote.update({
        where: { id: loteId },
        data:  { vendidos: { increment: quantidade } },
      });

      // 5. Distribui a quantidade entre lotes CarbonCorp
      //    (pode precisar de mais de um lote se a quantidade for grande)
      let restante         = quantidade;
      const lotesUsados:   { nome: string; qtd: number }[] = [];
      let   ultimoLote:    any = null;

      while (restante > 0) {
        const loteCarbon = await buscarOuCriarLoteCarbon(tx, userId);
        const espaco     = CAPACIDADE - loteCarbon.quantidade;
        const qtdAgora   = Math.min(restante, espaco);

        // Adiciona ao lote CarbonCorp
        ultimoLote = await tx.lote.update({
          where: { id: loteCarbon.id },
          data:  { quantidade: { increment: qtdAgora } },
        });

        // Registra contribuicao neste lote
        await tx.contribuicao.create({
          data: {
            cooperativaId: coop.id,
            membroId:      membro.id,
            userId,
            loteId:        loteCarbon.id,
            quantidade:    qtdAgora,
            status:        "no_pool",
          },
        });

        lotesUsados.push({ nome: loteCarbon.nome, qtd: qtdAgora });
        restante -= qtdAgora;

        // Se encheu, nao altera status — a proxima iteracao cria novo lote
        // (o filtro `quantidade: { lt: CAPACIDADE }` ja exclui lotes cheios)
      }

      // 6. Atualiza poolTotal da cooperativa
      await tx.cooperativa.update({
        where: { id: coop.id },
        data:  { poolTotal: { increment: quantidade } },
      });

      // 7. Movimento de historico
      const descLotes = lotesUsados.map(l => `${l.qtd.toFixed(2)}t → ${l.nome}`).join(", ");
      await tx.movimento.create({
        data: {
          tipo:          "CONTRIBUICAO",
          descricao:     `Contribuicao de ${quantidade} tCO2 do lote ${loteOrigem.nome} (${descLotes})`,
          valor:         0,
          userId,
          cooperativaId: coop.id,
        },
      });

      return {
        qtdContribuida: quantidade,
        lotesUsados,
        loteEncheu: ultimoLote?.quantidade >= CAPACIDADE,
        novosLotesCriados: lotesUsados.length > 1 ? lotesUsados.length - 1 : 0,
      };
    });

    return NextResponse.json({ success: true, data: resultado });
  } catch (error: any) {
    console.error("Erro na contribuicao:", error);
    return NextResponse.json({ error: error.message || "Erro interno" }, { status: 500 });
  }
}