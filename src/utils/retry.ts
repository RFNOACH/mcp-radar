import { log } from './logger.js';

export async function withRetry<T>(label: string, fn: () => Promise<T>, attempts = 2): Promise<T> {
  let last: unknown;
  for (let i = 1; i <= attempts; i++) {
    try { return await fn(); }
    catch (err) {
      last = err;
      const retryable = /timeout|rate|429|503|ECONNRESET|blocked/i.test(String(err));
      log(retryable ? 'warn' : 'debug', `${label} failed`, { attempt: i, retryable, error: String(err) });
      if (!retryable || i === attempts) break;
      await new Promise(r => setTimeout(r, 500 * i));
    }
  }
  throw last;
}
