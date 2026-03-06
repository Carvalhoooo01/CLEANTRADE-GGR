import { defineConfig } from '@prisma/config';
import "dotenv/config"; // Esta linha é obrigatória para ler seu .env

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL, 
  },
});