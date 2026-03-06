import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const role   = searchParams.get("role");

    if (!userId) return NextResponse.json({ error: "userId obrigatorio" }, { status: 400 });

    const vendas = await prisma.venda.findMany({
      where: role === "vendedor" ? { vendedorId: userId } : { compradorId: userId },
      include: {
        lote:      { select: { nome: true } },
        vendedor:  { select: { nome: true } },
        comprador: { select: { nome: true } },
      },
      orderBy: { data: "desc" },
    });

    const formatted = vendas.map((v: any) => ({
      id:          v.id,
      lote:        v.lote?.nome      || "-",
      loteId:      v.loteId,
      comprador:   v.comprador?.nome || "-",
      compradorId: v.compradorId,
      vendedor:    v.vendedor?.nome  || "-",
      vendedorId:  v.vendedorId,
      quantidade:  v.quantidade,
      valorTotal:  v.valorTotal,
      total:       v.valorTotal,
      data:        new Date(v.data).toLocaleDateString("pt-BR") + " " +
                   new Date(v.data).toLocaleTimeString("pt-BR").slice(0, 5),
      status:      "pago",
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Erro vendas GET:", error);
    return NextResponse.json({ error: "Erro ao buscar vendas" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { loteId, compradorId, vendedorId, quantidade, valorTotal } = await request.json();

    // 1. Registra a venda, atualiza lote e saldo do vendedor
    const [venda] = await prisma.$transaction([
      prisma.venda.create({
        data: { loteId, compradorId, vendedorId, quantidade, valorTotal },
      }),
      prisma.lote.update({
        where: { id: loteId },
        data: { vendidos: { increment: quantidade } },
      }),
      prisma.user.update({
        where: { id: vendedorId },
        data: { saldo: { increment: valorTotal } },
      }),
    ]);

    // 2. Transfere automaticamente os certificados disponiveis do lote
    //    para o comprador e marca como "transferido"
    const certsDoLote = await prisma.certificado.findMany({
      where: {
        loteId,
        status: "disponivel",
        ownerId: vendedorId,
      },
      take: Math.ceil(quantidade), // pega exatamente a quantidade vendida
    });

    if (certsDoLote.length > 0) {
      await prisma.$transaction(
        certsDoLote.map((cert: any) =>
          prisma.certificado.update({
            where: { id: cert.id },
            data: {
              status:  "transferido",
              ownerId: compradorId,
              vendaId: venda.id,
            },
          })
        )
      );
    }

    return NextResponse.json(venda, { status: 201 });
  } catch (error) {
    console.error("Erro vendas POST:", error);
    return NextResponse.json({ error: "Erro ao registrar venda" }, { status: 500 });
  }
}