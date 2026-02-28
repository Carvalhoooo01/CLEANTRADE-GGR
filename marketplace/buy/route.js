import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

async function gerarSerial(country, standard, projectId, year) {
  const prefix = `${country}-${standard}-${projectId}-${year}-`;
  const ultimo = await prisma.certificado.findFirst({
    where:   { serial: { startsWith: prefix } },
    orderBy: { serial: "desc" },
  });
  const proximoNum = ultimo ? parseInt(ultimo.serial.split("-").pop()) + 1 : 1;
  return prefix + String(proximoNum).padStart(8, "0");
}

export async function POST(request) {
  try {
    const { compradorId, vendedorId, loteId, quantidade, precoUnitario, total, tipo, cert } = await request.json();

    if (!compradorId || !loteId || !quantidade || !total)
      return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });

    const comprador = await prisma.user.findUnique({ where: { id: compradorId } });
    if (!comprador) return NextResponse.json({ error: "Comprador não encontrado" }, { status: 404 });
    if (comprador.saldo < total) return NextResponse.json({ error: "Saldo insuficiente" }, { status: 400 });

    const lote = await prisma.lote.findUnique({ where: { id: loteId } });
    if (!lote) return NextResponse.json({ error: "Lote não encontrado" }, { status: 404 });
    if (lote.quantidade < quantidade) return NextResponse.json({ error: "Estoque insuficiente" }, { status: 400 });

    // Transação atômica
    const [transacao, venda] = await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: compradorId }, data: { saldo: { decrement: total } } });

      const t = await tx.transacao.create({
        data: { userId: compradorId, type: tipo || "BUY", cert: cert || "—", amount: quantidade, price: precoUnitario, total, status: "pago" },
      });

      await tx.lote.update({ where: { id: loteId }, data: { quantidade: { decrement: quantidade } } });

      let v = null;
      if (vendedorId) {
        v = await tx.venda.create({
          data: { loteId, compradorId, vendedorId, quantidade, valorTotal: total },
        });
        await tx.user.update({ where: { id: vendedorId }, data: { saldo: { increment: total } } });
      }

      return [t, v];
    });

    // Gera certificados para o comprador (1 por tCO2 inteira)
    const certificados = [];
    const qtdCerts = Math.floor(quantidade);
    const projectId = lote.id.slice(0, 4).toUpperCase();
    const year      = new Date().getFullYear().toString();

    for (let i = 0; i < qtdCerts; i++) {
      const serial = await gerarSerial("BR", "VCS", projectId, year);
      const c = await prisma.certificado.create({
        data: {
          serial,
          country:   "BR",
          standard:  "VCS",
          projectId,
          year,
          status:    "disponivel",
          ownerId:   compradorId,
          loteId,
          vendaId:   venda?.id || null,
        },
      });
      certificados.push({
        ...c,
        date: new Date(c.createdAt).toLocaleDateString("pt-BR"),
      });
    }

    const compradorAtualizado = await prisma.user.findUnique({ where: { id: compradorId } });
    const fmtDate = (d) => new Date(d).toLocaleDateString("pt-BR") + " " + new Date(d).toLocaleTimeString("pt-BR").slice(0, 5);

    return NextResponse.json({
      novoSaldo:    compradorAtualizado.saldo,
      transacao:    { ...transacao, date: fmtDate(transacao.createdAt) },
      venda:        venda ? { ...venda, data: fmtDate(venda.createdAt) } : null,
      certificados,
    }, { status: 201 });

  } catch (error) {
    console.error("Erro na compra:", error);
    return NextResponse.json({ error: "Erro ao processar compra" }, { status: 500 });
  }
}