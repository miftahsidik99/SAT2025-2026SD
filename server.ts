import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Body parser limit increased for large prompts/responses
  app.use(express.json({ limit: '10mb' }));

  // Gemini Setup
  let ai: GoogleGenAI | null = null;
  if (process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  app.post('/api/generate-naskah', async (req, res) => {
    if (!ai) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured.' });
    }

    try {
      const { prompt, schema } = req.body;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2, // Low temp for structured consistent answers
          systemInstruction: `You are an expert curriculum developer for Indonesian elementary schools (SD), deeply familiar with Permendikdasmen nomor 13 tahun 2026.
You are generating a full valid Sumatif Akhir Tahun (SAT) or Sumatif Akhir Semester (SAS).
The output must perfectly align with meaningful learning (HOTS/MOTS/LOTS). Avoid pure memorization questions. Ensure the test blueprint is strictly matched. Output strictly the requested JSON structure.
IMPORTANT: If the subject is Islamic Religious Education (Pendidikan Agama Islam / PAI), BTA, or any subject requiring Arabic text, explicitly generate the matching valid Arabic script for verses, surahs, or terms directly in the "stimulus" or "pertanyaan" fields (e.g. بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم). Ensure correct spelling and vocalizations (harakat) for the text.`,
        },
      });

      const text = response.text;
      if (!text) {
        return res.status(500).json({ error: 'Model returned empty response.' });
      }

      res.status(200).json({ result: JSON.parse(text) });
    } catch (error) {
      console.error('Error generating AI content:', error);
      res.status(500).json({ error: 'Failed to generate content.' });
    }
  });

  app.get('/api/proxy-image', async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) {
        return res.status(400).send('URL is required');
      }
      const fetchResponse = await fetch(url);
      if (!fetchResponse.ok) {
        return res.status(fetchResponse.status).send('Failed to fetch image');
      }
      const contentType = fetchResponse.headers.get('content-type');
      if (contentType) {
        res.setHeader('Content-Type', contentType);
      }
      const buffer = await fetchResponse.arrayBuffer();
      res.send(Buffer.from(buffer));
    } catch (e: any) {
      console.error('Image proxy error:', e);
      res.status(500).send('Proxy error');
    }
  });

  // Vite development middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
