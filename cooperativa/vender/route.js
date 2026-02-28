import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// POST — executa venda coletiva: distribui receita proporcionalmente
export async function POST(request) {
  try {
    const { precoUnitario } = await request.json();

    if (!precoUnitario || precoUnitario <= 0)
      return NextResponse.json({ error: "Preço unitário inválido" }, { status: 400 });

    const preco = parseFloat(precoUnitario);

    const coop = await prisma.cooperativa.findFirst({
      include: {
        contribuicoes: {
          where:   { status: "no_pool" },
          include: { user: true },
        },
      },
    });

    if (!coop) return NextResponse.json({ error: "Cooperativa não encontrada" }, { status: 404 });
    if (!coop.contribuicoes.length) return NextResponse.json({ error: "Nenhuma contribuição no pool" }, { status: 400 });

    const poolTotal       = coop.contribuicoes.reduce((s, c) => s + c.quantidade, 0);
    const totalArrecadado = poolTotal * preco;
    const taxaCooperativa = totalArrecadado * (coop.comissao / 100);
    const totalDistribuir = totalArrecadado - taxaCooperativa;

    // Calcula participação de cada membro
    const distribuicao = coop.contribuicoes.map(c => ({
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
      // Marca contribuições como vendidas
      prisma.contribuicao.updateMany({
        where: { cooperativaId: coop.id, status: "no_pool" },
        data:  { status: "vendido" },
      }),
      // Zera pool
      prisma.cooperativa.update({
        where: { id: coop.id },
        data:  { poolTotal: 0, saldoFundo: { increment: taxaCooperativa } },
      }),
      // Credita cada membro proporcionalmente
      ...distribuicao.map(d =>
        prisma.user.update({
          where: { id: d.contribuicao.userId },
          data:  { saldo: { increment: d.valor } },
        })
      ),
    ]);

    return NextResponse.json({
      totalTCO2:       poolTotal,
      totalArrecadado,
      taxaCooperativa,
      totalDistribuir,
      distribuicao:    distribuicao.map(d => ({
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
