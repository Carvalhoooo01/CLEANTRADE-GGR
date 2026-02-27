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
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar lotes" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    
    // Tratamento de decimais: aceita vírgula ou ponto vindo do front
    const quant = String(data.quantidade).replace(',', '.');
    const vlr = String(data.preco).replace(',', '.');

    const novoLote = await prisma.lote.create({
      data: {
        nome:          data.nome,
        tipo:          data.tipo,
        descricao:     data.descricao || null,
        quantidade:    parseFloat(quant),
        preco:         parseFloat(vlr),
        certificadora: data.certificadora || "Verra VCS",
        userId:        data.userId,
        status:        "ativo",
      },
    });
    return NextResponse.json(novoLote, { status: 201 });
  } catch (error) {
    console.error("Erro no POST:", error);
    return NextResponse.json({ error: "Erro ao publicar lote" }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const { id, status, quantidade, vendidos } = await request.json();
    if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });

    const data = {};
    if (status !== undefined) data.status = status;
    if (quantidade !== undefined) {
       data.quantidade = parseFloat(String(quantidade).replace(',', '.'));
    }
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

    await prisma.lote.delete({ where: { id } });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro no DELETE:", error);
    
    // Erro P2003: Restrição de integridade (lote com vendas vinculadas)
    if (error.code === 'P2003') {
      return NextResponse.json({ 
        error: "Este lote possui vendas registradas e não pode ser excluído. Tente pausar a oferta." 
      }, { status: 400 });
    }

    return NextResponse.json({ error: "Erro interno ao remover lote" }, { status: 500 });
  }
}