import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    
    // Filtrando apenas o que o Prisma aceita para evitar o Erro 500
    const { email, password, nome } = body;

    if (!email || !password || !nome) {
      return NextResponse.json({ error: "Preencha todos os campos obrigatórios." }, { status: 400 });
    }

    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) {
      return NextResponse.json({ error: "Este e-mail já existe." }, { status: 400 });
    }

    // Criando o usuário
 const newUser = await prisma.user.create({
  data: {
    nome: nome,          // ← era data.nome
    email: email,        // ← era data.email
    senha: password,     // ← era data.password
    role: "vendedor",
    saldo: 0
  }
});

    return NextResponse.json(newUser, { status: 201 });

  } catch (error) {
    // ESTE LOG É A CHAVE: Olhe o terminal do seu VS Code agora
    console.error("ERRO_SERVIDOR_PRISMA:", error);
    
    return NextResponse.json(
      { error: "Erro interno no servidor. Verifique o terminal do VS Code." }, 
      { status: 500 }
    );
  }
}