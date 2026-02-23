import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(request) {
  try {
    const { userId, saldo } = await request.json();

    const user = await prisma.user.update({
      where: { id: userId },
      data: { saldo }
    });

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao atualizar saldo" }, { status: 500 });
  }
}