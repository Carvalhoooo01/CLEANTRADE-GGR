import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { userId, loteId, quantidade } = await request.json();

    if (!userId || !loteId || !quantidade || quantidade <= 0) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    // Iniciamos uma transação para garantir consistência total
    const resultado = await prisma.$transaction(async (tx) => {
      
      // 1. Verificamos se o lote do produtor existe e tem saldo
      const loteOrigem = await tx.lote.findUnique({
        where: { id: loteId }
      });

      if (!loteOrigem || loteOrigem.userId !== userId) {
        throw new Error("Lote não encontrado ou acesso negado.");
      }

      if (loteOrigem.quantidade < quantidade) {
        throw new Error("Saldo insuficiente no lote individual.");
      }

      // 2. Subtraímos a quantidade do lote individual do produtor
      const loteAtualizado = await tx.lote.update({
        where: { id: loteId },
        data: {
          quantidade: { decrement: quantidade }
        }
      });

      // 3. Registramos a contribuição na Cooperativa
      // Buscamos a cooperativa (assumindo que existe apenas uma ou a principal)
      const coop = await tx.cooperativa.findFirst();
      if (!coop) throw new Error("Cooperativa não configurada no sistema.");

      const novaContribuicao = await tx.movimento.create({
        data: {
          tipo: "UNIFICACAO",
          descricao: `Unificação de ${quantidade} tCO2 do lote ${loteOrigem.nome}`,
          valor: 0, // Valor financeiro é 0 na unificação, o ativo é CO2
          userId: userId,
          cooperativaId: coop.id,
          // Se você tiver uma tabela específica de 'Contribuicao', crie aqui.
          // Caso contrário, usamos o Movimento para histórico.
        }
      });

      // 4. Atualizamos o saldo total do Pool da Cooperativa
      await tx.cooperativa.update({
        where: { id: coop.id },
        data: {
          saldoFundo: { increment: quantidade } // Usando saldoFundo como pool de CO2
        }
      });

      return { loteAtualizado, novaContribuicao };
    });

    return NextResponse.json({ success: true, data: resultado });

  } catch (error) {
    console.error("Erro na unificação:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}