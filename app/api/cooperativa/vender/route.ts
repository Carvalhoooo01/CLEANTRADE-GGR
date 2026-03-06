import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// POST — executa venda coletiva: distribui receita proporcionalmente
export async function POST(request: Request) {
  try {
    const { precoUnitario } = await request.json();

    if (!precoUnitario || precoUnitario <= 0)
      return NextResponse.json({ error: "Preco unitario invalido" }, { status: 400 });

    const preco = parseFloat(precoUnitario);

    const coop = await prisma.cooperativa.findFirst({
      include: {
        contribuicoes: {
          where:   { status: "no_pool" },
          include: { user: true },
        },
      },
    });

    if (!coop) return NextResponse.json({ error: "Cooperativa nao encontrada" }, { status: 404 });
    if (!coop.contribuicoes.length) return NextResponse.json({ error: "Nenhuma contribuicao no pool" }, { status: 400 });

    const poolTotal       = coop.contribuicoes.reduce((s: number, c: any) => s + c.quantidade, 0);
    const totalArrecadado = poolTotal * preco;
    const taxaCooperativa = totalArrecadado * (coop.comissao / 100);
    const totalDistribuir = totalArrecadado - taxaCooperativa;

    const distribuicao = coop.contribuicoes.map((c: any) => ({
      contribuicao: c,
      percentual:   (c.quantidade / poolTotal) * 100,
      valor:        (c.quantidade / poolTotal) * totalDistribuir,
    }));

    await prisma.$transaction([
      // Registra venda coletiva
      prisma.vendaColetiva.create({
        data: {
          cooperativaId:   coop.id,
          totalTCO2:       poolTotal,
          precoUnitario:   preco,
          totalArrecadado,
          comissao:        coop.comissao,
          status:          "concluida",
        },
      }),

      // Marca contribuicoes como vendidas
      prisma.contribuicao.updateMany({
        where: { cooperativaId: coop.id, status: "no_pool" },
        data:  { status: "vendido" },
      }),

      // Zera pool
      prisma.cooperativa.update({
        where: { id: coop.id },
        data:  { poolTotal: 0, saldoFundo: { increment: taxaCooperativa } },
      }),

      // Credita cada membro proporcionalmente no saldo
      ...distribuicao.map((d: any) =>
        prisma.user.update({
          where: { id: d.contribuicao.userId },
          data:  { saldo: { increment: d.valor } },
        })
      ),

      // Registra no extrato (transacao) de cada membro
      ...distribuicao.map((d: any) =>
        prisma.transacao.create({
          data: {
            userId: d.contribuicao.userId,
            type:   "venda_coletiva",
            cert:   `Pool ${coop.nome}`,
            amount: d.contribuicao.quantidade,
            price:  preco,
            total:  d.valor,
            status: "pago",
          },
        })
      ),
    ]);

    return NextResponse.json({
      totalTCO2:       poolTotal,
      totalArrecadado,
      taxaCooperativa,
      totalDistribuir,
      distribuicao: distribuicao.map((d: any) => ({
        nome:       d.contribuicao.user.nome,
        quantidade: d.contribuicao.quantidade,
        percentual: d.percentual.toFixed(2),
        valor:      d.valor.toFixed(2),
      })),
    }, { status: 201 });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao executar venda coletiva" }, { status: 500 });
  }
}