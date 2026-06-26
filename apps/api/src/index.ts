import { createApp } from './app';

const PORT = Number(process.env.API_PORT ?? 4000);
const app = createApp();

app.listen(PORT, () => {
  console.log(`HOA API running on http://localhost:${PORT}`);
});
