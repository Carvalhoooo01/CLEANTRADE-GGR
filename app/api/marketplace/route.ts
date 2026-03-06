import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const COTACAO = 88.42; // R$/tCO₂

export async function GET() {
  try {
    // Lotes individuais ativos com saldo disponível
    const lotesIndividuais = await prisma.lote.findMany({
      where: {
        status:        "ativo",
        certificadora: { not: "CarbonCorp" }, // exclui lotes coletivos
        quantidade:    { gt: 0 },
      },
      include: { vendedor: { select: { id: true, nome: true, empresa: true } } },
    });

    // Lotes CarbonCorp ativos com saldo disponível
    const lotesCarbon = await prisma.lote.findMany({
      where: {
        tipo:          "Coletivo",
        certificadora: "CarbonCorp",
        status:        "ativo",
        quantidade:    { gt: 0 },
      },
      include: {
        contribuicoes: {
          include: { user: { select: { id: true, nome: true } } },
          where:   { status: "no_pool" },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const items = [
      // Lotes CarbonCorp primeiro (destaque)
      ...lotesCarbon.map((l, i) => ({
        id:         l.id,
        name:       lotesCarbon.length > 1 ? `CarbonCorp #${i + 1}` : "CarbonCorp",
        type:       "Coletivo",
        cert:       "CarbonCorp",
        available:  l.quantidade - (l.vendidos || 0),
        price:      COTACAO,
        vendedorId: "coop",
        isCoop:     true,
        produtores: l.contribuicoes.length,
      })),

      // Lotes individuais
      ...lotesIndividuais.map(l => ({
        id:         l.id,
        name:       l.nome,
        type:       l.tipo,
        cert:       l.certificadora,
        available:  l.quantidade - (l.vendidos || 0),
        price:      l.preco,
        vendedorId: l.userId,
        isCoop:     false,
      })),
    ];

    return NextResponse.json(items);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao carregar mercado" }, { status: 500 });
  }
}