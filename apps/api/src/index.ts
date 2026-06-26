import { createApp } from './app';

const PORT = Number(process.env.PORT ?? process.env.API_PORT ?? 4000);
const app = createApp();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`HOA API running on port ${PORT}`);
});
