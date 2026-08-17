import express from 'express';
import RunwayML from '@runwayml/sdk';

const app = express();
app.use(express.json({ limit: '10mb' }));

const port = process.env.PORT || 3000;
const apiKey = process.env.RUNWAYML_API_SECRET;

app.get('/', (_req, res) => {
  res.json({ service: 'NEXT Video Studio', status: 'online', runwayConfigured: Boolean(apiKey) });
});

app.get('/health', (_req, res) => {
  res.status(apiKey ? 200 : 503).json({ ok: Boolean(apiKey), service: 'NEXT Video Studio' });
});

app.post('/generate', async (req, res) => {
  if (!apiKey) return res.status(503).json({ error: 'RUNWAYML_API_SECRET is not configured' });

  const { prompt, duration = 5, ratio = '720:1280', model = 'gen4.5' } = req.body || {};
  if (!prompt || typeof prompt !== 'string') return res.status(400).json({ error: 'prompt is required' });

  try {
    const client = new RunwayML({ apiKey });
    const task = await client.textToVideo.create({
      model,
      promptText: prompt,
      ratio,
      duration
    });
    res.status(202).json({ taskId: task.id, status: 'submitted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error?.message || 'Runway request failed' });
  }
});

app.get('/task/:id', async (req, res) => {
  if (!apiKey) return res.status(503).json({ error: 'RUNWAYML_API_SECRET is not configured' });
  try {
    const client = new RunwayML({ apiKey });
    const task = await client.tasks.retrieve(req.params.id);
    res.json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error?.message || 'Could not retrieve Runway task' });
  }
});

app.listen(port, '0.0.0.0', () => console.log(`NEXT Video Studio listening on ${port}`));
