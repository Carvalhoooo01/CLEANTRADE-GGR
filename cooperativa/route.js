import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const coop = await prisma.cooperativa.findFirst({
      include: {
        membros: { include: { user: { select: { id: true, nome: true } } } },
        movimentos: { orderBy: { createdAt: "desc" }, take: 20 },
        contribuicoes: {
          include: {
            user:  { select: { id: true, nome: true } },
            lote:  { select: { id: true, nome: true, tipo: true, certificadora: true } },
            membro: true,
          },
          where: { status: "no_pool" },
          orderBy: { createdAt: "desc" },
        },
        vendasColetivas: { orderBy: { createdAt: "desc" }, take: 10 },
      },
    });
    if (!coop) return NextResponse.json({ error: "Cooperativa não encontrada" }, { status: 404 });
    return NextResponse.json(coop);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao buscar cooperativa" }, { status: 500 });
  }
}
