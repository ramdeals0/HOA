import { createApp } from './app';
import { prisma } from './lib/prisma';
import { ensureWhisperGrovesDemoDocuments } from './lib/demo-documents';

const PORT = Number(process.env.PORT ?? process.env.API_PORT ?? 4000);
const app = createApp();

async function start() {
  if (process.env.ENSURE_DEMO_DOCUMENTS !== 'false') {
    await ensureWhisperGrovesDemoDocuments(prisma);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`HOA API running on port ${PORT}`);
  });
}

start().catch((error) => {
  console.error('Failed to start API:', error);
  process.exit(1);
});
