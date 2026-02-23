import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { userId, senhaAtual, novaSenha } = await request.json();

    if (!userId || !senhaAtual || !novaSenha) {
      return NextResponse.json({ error: "Preencha todos os campos." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }

    if (user.senha !== senhaAtual) {
      return NextResponse.json({ error: "Senha atual incorreta." }, { status: 401 });
    }

    if (novaSenha.length < 6) {
      return NextResponse.json({ error: "Nova senha deve ter ao menos 6 caracteres." }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { senha: novaSenha },
    });

    return NextResponse.json({ message: "Senha alterada com sucesso!" });

  } catch (error) {
    console.error("Erro ao alterar senha:", error);
    return NextResponse.json({ error: "Erro interno no servidor." }, { status: 500 });
  }
}