import { env } from '../config/env.js';

type Level = 'debug' | 'info' | 'warn' | 'error';
const order: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };

export const log = (level: Level, message: string, meta?: Record<string, unknown>) => {
  if (order[level] < order[env.LOG_LEVEL]) return;
  const entry = { ts: new Date().toISOString(), level, message, ...(meta ? { meta } : {}) };
  console.error(JSON.stringify(entry));
};
