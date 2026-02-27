import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    let coop = await prisma.cooperativa.findFirst({
      include: {
        membros:    { include: { user: { select: { id: true, nome: true, email: true, role: true } } } },
        movimentos: { orderBy: { createdAt: "desc" }, take: 20 },
      },
    });

    // Cria a cooperativa padrão se não existir
    if (!coop) {
      coop = await prisma.cooperativa.create({
        data: {
          nome:      "CarbonCoop Cascavel",
          descricao: "Cooperativa digital de créditos de carbono",
        },
        include: { membros: true, movimentos: true },
      });
    }

    return NextResponse.json(coop);
  } catch (error) {
    console.error("Cooperativa GET:", error);
    return NextResponse.json({ error: "Erro ao buscar cooperativa" }, { status: 500 });
  }
}
