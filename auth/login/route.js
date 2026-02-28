import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email e senha são obrigatórios" }, { status: 400 });
    }

    let user;
    try {
      user = await prisma.user.findUnique({ where: { email } });
    } catch (dbError) {
      console.error("❌ ERRO DB (login):", dbError);
      return NextResponse.json(
        { error: `Erro de banco de dados: ${dbError.message}` },
        { status: 500 }
      );
    }

    if (!user || user.senha !== password) {
      return NextResponse.json({ error: "E-mail ou senha incorretos" }, { status: 401 });
    }

    const { senha, ...safeUser } = user;
    return NextResponse.json(safeUser, { status: 200 });

  } catch (error) {
    console.error("❌ ERRO GERAL (login):", error);
    return NextResponse.json({ error: `Erro no servidor: ${error.message}` }, { status: 500 });
  }
}