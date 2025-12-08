import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 8080;

// 1. API Backend Service
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'Claude Inspector Backend',
    timestamp: new Date().toISOString() 
  });
});

app.get('/api/info', (req, res) => {
  res.json({
    description: "This is a simple backend service running on Google Cloud Run.",
    features: ["Static File Serving", "Health Check API"]
  });
});

// 2. Serve Static Frontend (Build Artifacts)
app.use(express.static(path.join(__dirname, 'dist')));

// 3. Handle Client-Side Routing (SPA fallback)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});