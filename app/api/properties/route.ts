import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "userId obrigatorio" }, { status: 400 });

    const properties = await prisma.property.findMany({
      where:   { userId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(properties);
  } catch {
    return NextResponse.json({ error: "Erro ao buscar propriedades" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, area, car, status, co2, lat, lng, userId } = await request.json();
    if (!name || !area || !userId)
      return NextResponse.json({ error: "Campos obrigatorios faltando" }, { status: 400 });

    const property = await prisma.property.create({
      data: {
        name,
        area:   parseFloat(area),
        car:    car || null,
        status: status || "ativo",
        co2:    parseFloat(co2) || 0,
        lat:    lat ? parseFloat(lat) : null,
        lng:    lng ? parseFloat(lng) : null,
        userId,
      },
    });
    return NextResponse.json(property, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro ao criar propriedade" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, name, area, car, status, co2, lat, lng } = await request.json();
    if (!id) return NextResponse.json({ error: "id obrigatorio" }, { status: 400 });

    const data: {
      name?:   string;
      area?:   number;
      car?:    string | null;
      status?: string;
      co2?:    number;
      lat?:    number | null;
      lng?:    number | null;
    } = {};

    if (name   !== undefined) data.name   = name;
    if (area   !== undefined) data.area   = parseFloat(area);
    if (car    !== undefined) data.car    = car;
    if (status !== undefined) data.status = status;
    if (co2    !== undefined) data.co2    = parseFloat(co2);
    if (lat    !== undefined) data.lat    = lat ? parseFloat(lat) : null;
    if (lng    !== undefined) data.lng    = lng ? parseFloat(lng) : null;

    const property = await prisma.property.update({ where: { id }, data });
    return NextResponse.json(property);
  } catch {
    return NextResponse.json({ error: "Erro ao atualizar propriedade" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id obrigatorio" }, { status: 400 });
    await prisma.property.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro ao deletar propriedade" }, { status: 500 });
  }
}