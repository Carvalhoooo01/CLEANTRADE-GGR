import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    const lotes = await prisma.lote.findMany({
      where: userId ? { userId } : {},
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(lotes);
  } catch (err) {
    console.error("Erro GET /api/lotes:", err);
    return NextResponse.json({ error: "Erro ao buscar lotes" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    
    const novoLote = await prisma.lote.create({
      data: {
        nome:          data.nome,
        tipo:          data.tipo,
        descricao:     data.descricao || null,
        quantidade:    parseFloat(data.quantidade),
        preco:         parseFloat(data.preco),
        certificadora: data.certificadora || "Verra VCS",
        userId:        data.userId,
        status:        data.status || "ativo",
        
        // Novos campos mapeados para as colunas que você adicionou no Schema
        tipoCert:      data.tipoCert || "EXISTENTE", 
        serialVerra:   data.serialVerra || null,
        urlMapa:       data.urlMapa || null, // Onde o front envia o Número do CAR
      },
    });
    
    return NextResponse.json(novoLote, { status: 201 });
  } catch (error) {
    console.error("Erro Prisma Detalhado:", error);
    return NextResponse.json({ error: "Erro ao publicar lote", details: error.message }, { status: 500 });
  }
}

// Mantenha os métodos PATCH e DELETE que você já tem abaixo...

export async function PATCH(request) {
  try {
    const { id, status, quantidade, vendidos } = await request.json();
    if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });

    const data = {};
    if (status !== undefined) data.status = status;
    if (quantidade !== undefined) data.quantidade = quantidade;
    if (vendidos !== undefined) data.vendidos = vendidos;

    const lote = await prisma.lote.update({ where: { id }, data });
    return NextResponse.json(lote);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao atualizar lote" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });

    const vendas = await prisma.venda.count({ where: { loteId: id } });

    if (vendas > 0) {
      await prisma.lote.update({ where: { id }, data: { status: "arquivado" } });
      return NextResponse.json({ success: true, arquivado: true });
    }

    await prisma.lote.delete({ where: { id } });
    return NextResponse.json({ success: true, arquivado: false });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao remover lote" }, { status: 500 });
  }
}