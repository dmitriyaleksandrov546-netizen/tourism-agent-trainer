import { createApp } from './app.js';

const port = Number(process.env.PORT || 5173);
const app = createApp({ serveStatic: true });

app.listen(port, '0.0.0.0', () => {
  console.log(`Tourism trainer running on http://0.0.0.0:${port}`);
});
