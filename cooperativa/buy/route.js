import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { compradorId, quantidade, total } = await request.json();

    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Desconta o saldo do comprador
      const comprador = await tx.user.update({
        where: { id: compradorId },
        data: { saldo: { decrement: total } }
      });

      if (comprador.saldo < 0) throw new Error("Saldo insuficiente");

      // 2. Desconta do Pool da Cooperativa
      const coop = await tx.cooperativa.findFirst();
      await tx.cooperativa.update({
        where: { id: coop.id },
        data: { poolTotal: { decrement: quantidade } }
      });

      // 3. Cria a venda coletiva para registro
      const venda = await tx.vendaColetiva.create({
        data: {
          cooperativaId: coop.id,
          totalTCO2: quantidade,
          precoUnitario: total / quantidade,
          totalArrecadado: total,
          comissao: coop.comissao
        }
      });

      return { novoSaldo: comprador.saldo, venda };
    });

    return NextResponse.json(resultado);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}