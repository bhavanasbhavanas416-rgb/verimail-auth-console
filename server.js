import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

// Serve production static bundle
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback: send all navigation requests to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(Number(PORT), HOST, () => {
  console.log(`VeriMail Identity & Auth Console running at:`);
  console.log(`- Localhost: http://localhost:${PORT}/`);
  console.log(`- Network:   http://10.164.1.1:${PORT}/`);
});
