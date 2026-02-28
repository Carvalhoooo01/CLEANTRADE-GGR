import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const TAXAS = { basico: 300, premium: 800, enterprise: 2000 };

export async function POST(request) {
  try {
    const { userId, plano = "basico" } = await request.json();
    if (!userId) return NextResponse.json({ error: "userId obrigatório" }, { status: 400 });

    const coop = await prisma.cooperativa.findFirst();
    if (!coop) return NextResponse.json({ error: "Cooperativa não encontrada" }, { status: 404 });

    const jaEMembro = await prisma.membro.findUnique({ where: { userId } });
    if (jaEMembro) return NextResponse.json({ error: "Usuário já é membro" }, { status: 400 });

    const taxa = TAXAS[plano] || 300;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    if (user.saldo < taxa)
      return NextResponse.json({ error: `Saldo insuficiente. Taxa de adesão: R$ ${taxa}` }, { status: 400 });

    const [membro] = await prisma.$transaction([
      prisma.membro.create({
        data: { userId, cooperativaId: coop.id, plano, taxaPaga: true },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { saldo: { decrement: taxa } },
      }),
      prisma.cooperativa.update({
        where: { id: coop.id },
        data: { saldoFundo: { increment: taxa } },
      }),
      prisma.movimento.create({
        data: {
          tipo:         "adesao",
          descricao:    `Adesão plano ${plano} — ${user.nome}`,
          valor:        taxa,
          userId,
          cooperativaId: coop.id,
        },
      }),
    ]);

    return NextResponse.json(membro, { status: 201 });
  } catch (error) {
    console.error("Aderir cooperativa:", error);
    return NextResponse.json({ error: "Erro ao aderir à cooperativa" }, { status: 500 });
  }
}
