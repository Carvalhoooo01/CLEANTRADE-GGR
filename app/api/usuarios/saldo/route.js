import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(request) {
  try {
    const { userId, saldo } = await request.json();

    if (!userId || saldo == null) {
      return NextResponse.json({ error: "userId e saldo são obrigatórios" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { saldo: parseFloat(saldo) },
    });

    const { senha, ...safeUser } = user;
    return NextResponse.json(safeUser);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao atualizar saldo" }, { status: 500 });
  }
}
