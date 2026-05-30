import { BrightDataMcpClient } from './mcpClient.js';
import { fetchGithubRepo, fetchNpmPackage, fetchText } from './fallbackHttp.js';
import { ToolResult } from '../types.js';
import { log } from '../utils/logger.js';
import { staticDocs, staticGithubRepo, staticNpmPackage } from './staticSeeds.js';

function extractTextContent(raw: unknown): string {
  const anyRaw = raw as { content?: Array<{ text?: string; type?: string }> };
  if (Array.isArray(anyRaw?.content)) return anyRaw.content.map(c => c.text ?? '').join('\n');
  return JSON.stringify(raw);
}

export class BrightDataTools {
  constructor(private readonly mcp: BrightDataMcpClient, private readonly mcpAvailable: boolean) {}

  async search(query: string): Promise<ToolResult<string>> {
    if (this.mcpAvailable) {
      try {
        const data = await this.mcp.call('search_engine', { query, engine: 'google' });
        return { ok: true, data: extractTextContent(data), source: 'brightdata-mcp' };
      } catch (error) {
        log('warn', 'MCP search failed; degrading to public fallback', { query, error: String(error) });
      }
    }
    return fetchText(`https://www.google.com/search?q=${encodeURIComponent(query)}`);
  }

  async scrapeMarkdown(url: string): Promise<ToolResult<string>> {
    if (this.mcpAvailable) {
      try {
        const data = await this.mcp.call('scrape_as_markdown', { url });
        return { ok: true, data: extractTextContent(data), source: 'brightdata-mcp' };
      } catch (error) {
        log('warn', 'MCP scrape failed; using direct HTTP fallback', { url, error: String(error) });
      }
    }
    const fallback = await fetchText(url);
    return fallback.ok ? fallback : staticDocs(url);
  }

  async npmPackage(pkg: string): Promise<ToolResult<Record<string, unknown>>> {
    if (this.mcpAvailable) {
      try {
        const data = await this.mcp.call('web_data_npm_package', { package_name: pkg });
        return { ok: true, data: JSON.parse(extractTextContent(data)), source: 'brightdata-mcp' };
      } catch (error) {
        log('warn', 'Structured npm MCP lookup failed; using npm registry fallback', { pkg, error: String(error) });
      }
    }
    const fallback = await fetchNpmPackage(pkg);
    return fallback.ok ? fallback : staticNpmPackage(pkg);
  }

  async githubRepo(repo: string): Promise<ToolResult<Record<string, unknown>>> {
    // Bright Data's GitHub-specific tool targets repository files; for repo-level metrics,
    // use scrape/search first and fall back to the public GitHub API for deterministic demo output.
    const fallback = await fetchGithubRepo(repo);
    return fallback.ok ? fallback : staticGithubRepo(repo);
  }
}
