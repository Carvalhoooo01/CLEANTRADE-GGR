import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // 1. Busca todos os lotes individuais ativos
    const lotesIndividuais = await prisma.lote.findMany({
      where: { 
        status: "ativo",
        quantidade: { gt: 0 } 
      },
      include: { vendedor: true }
    });

    // 2. Busca o saldo unificado da Cooperativa
    const coop = await prisma.cooperativa.findFirst();
    
    const marketplaceItems = lotesIndividuais.map(l => ({
      id: l.id,
      name: l.nome,
      type: l.tipo,
      cert: l.certificadora,
      available: l.quantidade,
      price: l.preco,
      vendedorId: l.userId,
      isCoop: false
    }));

    // 3. Se a cooperativa tiver saldo, injeta ela como um "Super Lote"
    if (coop && coop.saldoFundo > 0) {
      marketplaceItems.unshift({
        id: `coop-${coop.id}`,
        name: `LOTE MESTRE - ${coop.nome}`,
        type: "Unificado (Vários)",
        cert: "CleanTrade Verified",
        available: coop.saldoFundo,
        price: 45.00, // Preço geralmente maior por ser um lote grande e auditado
        vendedorId: coop.id,
        isCoop: true
      });
    }

    return NextResponse.json(marketplaceItems);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao carregar mercado" }, { status: 500 });
  }
}