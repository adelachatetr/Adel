import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json());

// Serve static assets from production dist
const distPath = path.resolve(__dirname, 'dist');
app.use(express.static(distPath));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Transit SCHB' });
});

// Single Page Application fallback to index.html
app.get('*', (req, res) => {
  res.sendFile(path.resolve(distPath, 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Transit SCHB server running on port ${port}`);
});
