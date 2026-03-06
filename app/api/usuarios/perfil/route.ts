import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id obrigatorio" }, { status: 400 });

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, nome: true, email: true, empresa: true, documento: true, role: true, saldo: true, createdAt: true },
    });

    if (!user) return NextResponse.json({ error: "Usuario nao encontrado" }, { status: 404 });
    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: "Erro ao buscar perfil" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, nome, email, empresa, documento, senhaAtual, novaSenha, saldo } = body;

    if (!id) return NextResponse.json({ error: "id obrigatorio" }, { status: 400 });

    const data: Record<string, any> = {};
    if (nome      !== undefined) data.nome      = nome;
    if (email     !== undefined) data.email     = email;
    if (empresa   !== undefined) data.empresa   = empresa;
    if (documento !== undefined) data.documento = documento;
    if (saldo     !== undefined) data.saldo     = saldo;

    if (novaSenha) {
      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) return NextResponse.json({ error: "Usuario nao encontrado" }, { status: 404 });
      if (user.senha !== senhaAtual)
        return NextResponse.json({ error: "Senha atual incorreta" }, { status: 400 });
      data.senha = novaSenha;
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, nome: true, email: true, empresa: true, documento: true, role: true, saldo: true },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao atualizar perfil" }, { status: 500 });
  }
}