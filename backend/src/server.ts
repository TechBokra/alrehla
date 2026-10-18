import 'dotenv/config';
import cors from 'cors';
import express, { type Request, type Response } from 'express';
import { API_ROUTES } from '@system-design/shared';

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.use(cors());
app.use(express.json());

app.get(API_ROUTES.health, (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'backend', timestamp: new Date().toISOString() });
});

app.get(API_ROUTES.message, (_req: Request, res: Response) => {
  res.json({ message: 'Hello from the Express backend!' });
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(port, () => {
  console.log(`Backend running at http://localhost:${port}`);
});
