import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

async function gerarSerial(country: string, standard: string, projectId: string, year: string) {
  const prefix  = `${country}-${standard}-${projectId}-${year}-`;
  const ultimo  = await prisma.certificado.findFirst({
    where:   { serial: { startsWith: prefix } },
    orderBy: { serial: "desc" },
  });
  const proximoNum = ultimo ? parseInt(ultimo.serial.split("-").pop()!) + 1 : 1;
  return prefix + String(proximoNum).padStart(8, "0");
}

// Distribui proporcional entre contribuidores do lote CarbonCorp
async function distribuirCarbonCorp(
  tx: any,
  loteId: string,
  quantidade: number,
  valorTotal: number,
  compradorId: string
) {
  const lote = await tx.lote.findUnique({
    where:   { id: loteId },
    include: {
      contribuicoes: {
        where:   { status: "no_pool" },
        include: { user: { select: { id: true, nome: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  const totalPool = lote.contribuicoes.reduce((s: number, c: any) => s + c.quantidade, 0);
  if (totalPool <= 0) throw new Error("Sem contribuicoes no pool.");

  const coop = await tx.cooperativa.findFirst();

  for (const contrib of lote.contribuicoes) {
    const proporcao      = contrib.quantidade / totalPool;
    const qtdDescontada  = proporcao * quantidade;
    const valorProdutor  = proporcao * valorTotal;

    if (qtdDescontada <= 0) continue;

    // Credita produtor
    await tx.user.update({
      where: { id: contrib.userId },
      data:  { saldo: { increment: valorProdutor } },
    });

    // Extrato do produtor
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

    // Atualiza contribuicao
    const novaQtd = contrib.quantidade - qtdDescontada;
    await tx.contribuicao.update({
      where: { id: contrib.id },
      data:  { quantidade: novaQtd, status: novaQtd <= 0 ? "vendido" : "no_pool" },
    });
  }

  // Atualiza vendidos no lote CarbonCorp
  const loteAtualizado = await tx.lote.update({
    where: { id: loteId },
    data:  { vendidos: { increment: quantidade } },
  });

  // Se zerou, fecha o lote
  const disponivel = loteAtualizado.quantidade - loteAtualizado.vendidos;
  if (disponivel <= 0) {
    await tx.lote.update({ where: { id: loteId }, data: { status: "vendido" } });
  }

  // Atualiza poolTotal da cooperativa
  if (coop) {
    await tx.cooperativa.update({
      where: { id: coop.id },
      data:  { poolTotal: { decrement: quantidade } },
    });

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

    await tx.movimento.create({
      data: {
        tipo:          "VENDA_COLETIVA",
        descricao:     `Venda de ${quantidade} tCO2 do ${lote.nome}`,
        valor:         valorTotal,
        cooperativaId: coop.id,
      },
    });
  }
}

export async function POST(request: Request) {
  try {
    const { compradorId, vendedorId, loteId, quantidade, precoUnitario, total, tipo, cert } = await request.json();

    if (!compradorId || !loteId || !quantidade || !total)
      return NextResponse.json({ error: "Campos obrigatorios faltando" }, { status: 400 });

    const comprador = await prisma.user.findUnique({ where: { id: compradorId } });
    if (!comprador) return NextResponse.json({ error: "Comprador nao encontrado" }, { status: 404 });
    if (comprador.saldo < total) return NextResponse.json({ error: "Saldo insuficiente" }, { status: 400 });

    const lote = await prisma.lote.findUnique({ where: { id: loteId } });
    if (!lote) return NextResponse.json({ error: "Lote nao encontrado" }, { status: 404 });

    const disponivelLote = lote.quantidade - (lote.vendidos || 0);
    if (disponivelLote < quantidade) return NextResponse.json({ error: "Estoque insuficiente" }, { status: 400 });

    const isCarbonCorp = lote.certificadora === "CarbonCorp";

    const [transacao, venda] = await prisma.$transaction(async (tx) => {

      // 1. Debita comprador
      await tx.user.update({ where: { id: compradorId }, data: { saldo: { decrement: total } } });

      // 2. Registra transacao no extrato do comprador
      const t = await tx.transacao.create({
        data: {
          userId: compradorId,
          type:   tipo || "BUY",
          cert:   cert || lote.certificadora || "-",
          amount: quantidade,
          price:  precoUnitario,
          total,
          status: "pago",
        },
      });

      let v = null;

      if (isCarbonCorp) {
        // Lote CarbonCorp: distribui proporcional entre contribuidores
        await distribuirCarbonCorp(tx, loteId, quantidade, total, compradorId);
      } else {
        // Lote individual: credita vendedor diretamente
        await tx.lote.update({ where: { id: loteId }, data: { vendidos: { increment: quantidade } } });

        if (vendedorId) {
          v = await tx.venda.create({
            data: { loteId, compradorId, vendedorId, quantidade, valorTotal: total },
          });
          await tx.user.update({ where: { id: vendedorId }, data: { saldo: { increment: total } } });
        }
      }

      return [t, v];
    });

    // Gera certificados para o comprador
    const certificados = [];
    const qtdCerts  = Math.floor(quantidade);
    const projectId = lote.id.slice(0, 4).toUpperCase();
    const year      = new Date().getFullYear().toString();

    for (let i = 0; i < qtdCerts; i++) {
      const serial = await gerarSerial("BR", "VCS", projectId, year);
      const c = await prisma.certificado.create({
        data: {
          serial,
          country:   "BR",
          standard:  lote.certificadora === "CarbonCorp" ? "CarbonCorp" : "VCS",
          projectId,
          year,
          status:    "disponivel",
          ownerId:   compradorId,
          loteId,
          vendaId:   venda?.id || null,
        },
      });
      certificados.push({ ...c, date: new Date(c.createdAt).toLocaleDateString("pt-BR") });
    }

    const compradorAtualizado = await prisma.user.findUnique({ where: { id: compradorId } });
    const fmtDate = (d: Date) =>
      new Date(d).toLocaleDateString("pt-BR") + " " + new Date(d).toLocaleTimeString("pt-BR").slice(0, 5);

    return NextResponse.json({
      novoSaldo:    compradorAtualizado!.saldo,
      transacao:    { ...transacao, date: fmtDate(transacao.createdAt) },
      venda:        venda ? { ...venda, data: fmtDate(venda.data) } : null,
      certificados,
      isCarbonCorp,
    }, { status: 201 });

  } catch (error: any) {
    console.error("Erro na compra:", error);
    return NextResponse.json({ error: error.message || "Erro ao processar compra" }, { status: 500 });
  }
}