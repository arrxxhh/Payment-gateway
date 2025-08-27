import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectToDatabase } from './setup/db.js';
import { errorHandler, notFoundHandler } from './setup/errorHandlers.js';
import authRouter from './routes/auth.js';
import transactionsRouter from './routes/transactions.js';

dotenv.config();

const app = express();

// Basic middleware
app.use(express.json());
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || '*',
}));

// Health check
app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

// Routes
app.use('/api', authRouter);
app.use('/api', transactionsRouter);

// 404 and errors
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

// Start server after DB connection
connectToDatabase()
  .then(() => {
    app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`Backend listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Failed to connect to database', err);
    process.exit(1);
  });


