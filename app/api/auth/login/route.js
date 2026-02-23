import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    const user = await prisma.user.findUnique({ where: { email } });

    if (user && user.senha === password) {
      const { senha, ...safeUser } = user;
      return NextResponse.json(safeUser, { status: 200 });
    }
    return NextResponse.json({ error: "E-mail ou senha incorretos" }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}