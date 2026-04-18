import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' })); // For receipt images

  const PORT = Number(process.env.PORT) || 3000;
  
  // Initialize Gemini on the server where process.env is reliable
  const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

  // API Route for Spending Insights
  app.post('/api/ai/insights', async (req, res) => {
    try {
      if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured on server");
      const { prompt } = req.body;
      const response = await genAI.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [{ parts: [{ text: prompt }] }],
      });
      res.json({ text: response.text });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'AI Error' });
    }
  });

  // API Route for Receipt Scanning
  app.post('/api/ai/scan-receipt', async (req, res) => {
    try {
      if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured on server");
      const { imageBase64 } = req.body;
      const response = await genAI.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [
          {
            parts: [
              { text: "Analyze this receipt image and extract the items. Return a JSON array." },
              {
                inlineData: {
                  mimeType: "image/jpeg",
                  data: imageBase64.split(',')[1] || imageBase64
                }
              }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                description: { type: Type.STRING },
                amount: { type: Type.NUMBER },
                date: { type: Type.STRING },
                category: { type: Type.STRING }
              },
              required: ["description", "amount", "date", "category"]
            }
          }
        }
      });
      
      res.json(JSON.parse(response.text));
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Scan Error' });
    }
  });

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
}

startServer();
