import { env } from '../config/env.js';
import { ToolResult } from '../types.js';
import { withRetry } from '../utils/retry.js';

async function getJson<T>(url: string): Promise<T> {
  const headers: Record<string, string> = { 'User-Agent': 'mcp-radar-assignment' };
  if (env.GITHUB_TOKEN && url.includes('api.github.com')) headers.Authorization = `Bearer ${env.GITHUB_TOKEN}`;
  const res = await withRetry(`http:${url}`, () => fetch(url, { headers }), 2);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json() as Promise<T>;
}

export async function fetchGithubRepo(repo: string): Promise<ToolResult<Record<string, unknown>>> {
  try {
    const data = await getJson<Record<string, unknown>>(`https://api.github.com/repos/${repo}`);
    return { ok: true, data, source: 'fallback-http' };
  } catch (error) {
    return { ok: false, error: String(error), retryable: /429|rate|timeout/i.test(String(error)), source: 'fallback-http' };
  }
}

export async function fetchNpmPackage(pkg: string): Promise<ToolResult<Record<string, unknown>>> {
  try {
    const encoded = encodeURIComponent(pkg).replace('%40', '@');
    const data = await getJson<Record<string, unknown>>(`https://registry.npmjs.org/${encoded}`);
    return { ok: true, data, source: 'fallback-http' };
  } catch (error) {
    return { ok: false, error: String(error), retryable: /429|rate|timeout/i.test(String(error)), source: 'fallback-http' };
  }
}

export async function fetchText(url: string): Promise<ToolResult<string>> {
  try {
    const res = await withRetry(`http-text:${url}`, () => fetch(url, { headers: { 'User-Agent': 'mcp-radar-assignment' } }), 2);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return { ok: true, data: await res.text(), source: 'fallback-http' };
  } catch (error) {
    return { ok: false, error: String(error), retryable: /429|rate|timeout/i.test(String(error)), source: 'fallback-http' };
  }
}
