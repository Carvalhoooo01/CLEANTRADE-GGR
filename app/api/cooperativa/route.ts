import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const coop = await prisma.cooperativa.findFirst({
      include: {
        movimentos:    { orderBy: { createdAt: "desc" }, take: 20 },
        contribuicoes: {
          include: {
            user: { select: { id: true, nome: true } },
            lote: { select: { id: true, nome: true, tipo: true } },
          },
          where:   { status: "no_pool" },
          orderBy: { createdAt: "desc" },
        },
        vendasColetivas: { orderBy: { createdAt: "desc" }, take: 10 },
      },
    });

    if (!coop) return NextResponse.json({ error: "Cooperativa nao encontrada" }, { status: 404 });

    // Busca lotes CarbonCorp ativos (tipo="Coletivo", certificadora="CarbonCorp")
    const lotesCarbon = await prisma.lote.findMany({
      where:   { tipo: "Coletivo", certificadora: "CarbonCorp", status: "ativo" },
      include: {
        contribuicoes: {
          include: { user: { select: { id: true, nome: true } } },
          where:   { status: "no_pool" },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ ...coop, lotesCarbon });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao buscar cooperativa" }, { status: 500 });
  }
}