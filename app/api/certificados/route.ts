import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Gera serial único no formato BR-VCS-1234-2022-00000001
async function gerarSerial(country, standard, projectId, year) {
  const prefix = `${country}-${standard}-${projectId}-${year}-`;
  const ultimo = await prisma.certificado.findFirst({
    where:   { serial: { startsWith: prefix } },
    orderBy: { serial: "desc" },
  });
  const proximoNum = ultimo
    ? parseInt(ultimo.serial.split("-").pop()) + 1
    : 1;
  return prefix + String(proximoNum).padStart(8, "0");
}

// GET /api/certificados?userId=xxx
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "userId obrigatório" }, { status: 400 });

    const certs = await prisma.certificado.findMany({
      where:   { ownerId: userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(certs.map(formatCert));
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao buscar certificados" }, { status: 500 });
  }
}

// POST /api/certificados — cria N certificados para um usuário (chamado internamente)
export async function POST(request) {
  try {
    const { ownerId, quantidade, loteId, vendaId, projectId, year, standard, country } = await request.json();

    const qtd = Math.floor(quantidade); // 1 cert por tCO2 inteira
    if (qtd < 1) return NextResponse.json([], { status: 201 });

    const criados = [];
    for (let i = 0; i < qtd; i++) {
      const serial = await gerarSerial(
        country    || "BR",
        standard   || "VCS",
        projectId  || "0001",
        year       || new Date().getFullYear().toString()
      );
      const cert = await prisma.certificado.create({
        data: { serial, country: country || "BR", standard: standard || "VCS", projectId: projectId || "0001", year: year || new Date().getFullYear().toString(), status: "disponivel", ownerId, loteId, vendaId },
      });
      criados.push(formatCert(cert));
    }

    return NextResponse.json(criados, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao criar certificados" }, { status: 500 });
  }
}

// PATCH /api/certificados — atualiza status (transferir, reservar)
export async function PATCH(request) {
  try {
    const { id, status } = await request.json();
    if (!id || !status) return NextResponse.json({ error: "id e status obrigatórios" }, { status: 400 });

    const cert = await prisma.certificado.update({
      where: { id },
      data:  { status },
    });

    return NextResponse.json(formatCert(cert));
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao atualizar certificado" }, { status: 500 });
  }
}

function formatCert(c) {
  return {
    ...c,
    date: c.createdAt ? new Date(c.createdAt).toLocaleDateString("pt-BR") : "—",
  };
}