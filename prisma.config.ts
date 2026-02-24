// prisma.config.ts
import { defineConfig } from '@prisma/config';
import * as dotenv from 'dotenv';

// FORZAR la carga del archivo .env
dotenv.config();

export default defineConfig({
  schema: './prisma/schema.prisma',
  migrations: {
    // Añade esta línea:
    seed: 'npx ts-node ./prisma/seed.ts',
  },
  datasource: {
    // Usamos una alternativa por si process.env falla en el CLI
    url: process.env.DATABASE_URL,
  },
});