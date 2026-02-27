// prisma.config.ts  ← já está correto no seu projeto
import { defineConfig } from '@prisma/config';
const dotenv = require('dotenv');
dotenv.config();

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL,
  },
});