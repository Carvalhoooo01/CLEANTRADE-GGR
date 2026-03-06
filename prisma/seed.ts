import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seed vazio — nenhum dado inicial criado.");
  // A cooperativa e criada automaticamente pela rota /api/cooperativa/contribuir
  // quando o primeiro vendedor faz uma contribuicao.
}

main()
  .catch(e => { console.error("❌ Erro no seed:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());