import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "userId obrigatório" }, { status: 400 });

    const properties = await prisma.property.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(properties);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar propriedades" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { name, area, car, status, co2, userId } = await request.json();
    if (!name || !area || !userId)
      return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });

    const property = await prisma.property.create({
      data: { name, area: parseFloat(area), car: car || null, status: status || "ativo", co2: parseFloat(co2) || 0, userId },
    });
    return NextResponse.json(property, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao criar propriedade" }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const { id, name, area, car, status, co2 } = await request.json();
    if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });

    const data = {};
    if (name   !== undefined) data.name   = name;
    if (area   !== undefined) data.area   = parseFloat(area);
    if (car    !== undefined) data.car    = car;
    if (status !== undefined) data.status = status;
    if (co2    !== undefined) data.co2    = parseFloat(co2);

    const property = await prisma.property.update({ where: { id }, data });
    return NextResponse.json(property);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao atualizar propriedade" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });
    await prisma.property.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao deletar propriedade" }, { status: 500 });
  }
}
