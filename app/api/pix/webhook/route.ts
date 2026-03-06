import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// POST /api/pix/webhook
// Chamado automaticamente pelo Banco Inter quando o pagamento é confirmado
// Documentação: https://developers.bancointer.com.br/reference/webhookpix
//
// Para ativar:
// 1. Obtenha credenciais no Portal Developer do Inter
// 2. Cadastre este URL como webhook no painel: https://seudominio.com/api/pix/webhook
// 3. Configure INTER_WEBHOOK_SECRET no .env.local

const WEBHOOK_SECRET = process.env.INTER_WEBHOOK_SECRET || "";

export async function POST(request: Request) {
  try {
    // Validação do segredo (quando Inter estiver configurado)
    if (WEBHOOK_SECRET) {
      const secret = request.headers.get("x-inter-webhook-secret") || "";
      if (secret !== WEBHOOK_SECRET) {
        console.warn("Webhook PIX: segredo invalido");
        return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
      }
    }

    const body = await request.json();

    // Formato do payload Inter (campo "pix" é um array de cobranças pagas)
    // Ref: https://developers.bancointer.com.br/reference/webhookpix
    const pagamentos: any[] = body?.pix || [body];

    for (const pix of pagamentos) {
      const txid  = pix?.txid || pix?.endToEndId;
      const valor = pix?.valor || pix?.amount;

      if (!txid) {
        console.warn("Webhook PIX: txid ausente no payload", pix);
        continue;
      }

      // Busca transação pendente
      const transacao = await prisma.transacao.findFirst({
        where: { txid, status: "pendente" },
      });

      if (!transacao) {
        console.warn(`Webhook PIX: transacao nao encontrada ou ja processada — txid: ${txid}`);
        continue;
      }

      // Confirma pagamento em uma única transação atômica
      await prisma.$transaction([
        // Marca transação como paga
        prisma.transacao.update({
          where: { id: transacao.id },
          data:  { status: "pago" },
        }),

        // Credita saldo no usuário
        prisma.user.update({
          where: { id: transacao.userId },
          data:  { saldo: { increment: transacao.total } },
        }),
      ]);

      console.log(`PIX confirmado: txid=${txid} | userId=${transacao.userId} | valor=R$${transacao.total}`);
    }

    // Inter espera 200 para não retentar o webhook
    return NextResponse.json({ received: true }, { status: 200 });

  } catch (err) {
    console.error("Erro no webhook PIX:", err);
    // Retorna 200 mesmo em erro para evitar retentativas em loop
    return NextResponse.json({ received: true }, { status: 200 });
  }
}