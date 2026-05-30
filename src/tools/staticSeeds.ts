import { ToolResult } from '../types.js';

const github: Record<string, Record<string, unknown>> = {
  'firecrawl/firecrawl-mcp-server': { stargazers_count: 6400, forks_count: 734, static_note: 'Seeded from public GitHub/directory observations; used only when live access fails.' },
  'apify/apify-mcp-server': { stargazers_count: 1300, forks_count: 168, static_note: 'Seeded from public GitHub observations; used only when live access fails.' },
  'brightdata/brightdata-mcp': { stargazers_count: 2400, forks_count: 306, static_note: 'Seeded from public GitHub observations; used only when live access fails.' },
};

const npm: Record<string, Record<string, unknown>> = {
  'firecrawl-mcp': { 'dist-tags': { latest: 'latest-live-required' }, versions: Object.fromEntries(Array.from({ length: 80 }, (_, i) => [`0.${i}.0`, {}])) },
  '@apify/actors-mcp-server': { 'dist-tags': { latest: '0.10.11' }, versions: Object.fromEntries(Array.from({ length: 100 }, (_, i) => [`0.${i}.0`, {}])) },
  '@brightdata/mcp': { 'dist-tags': { latest: 'latest-live-required' }, versions: Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`1.${i}.0`, {}])) },
};

const docs: Record<string, string> = {
  'https://docs.firecrawl.dev': 'Firecrawl docs mention MCP server, Cursor, Claude, Windsurf, web search, scrape, crawl, interact, structured extraction and browser interaction.',
  'https://docs.apify.com/platform/integrations/mcp': 'Apify MCP server supports Claude, VS Code, Cursor, streamable HTTP, OAuth, Actors, structured results, Google Search, social media, maps and ecommerce extraction.',
  'https://docs.brightdata.com/ai/mcp-server/tools': 'Bright Data MCP tools include search_engine, scrape_as_markdown, scrape_batch, extract, browser automation, structured data, npm package lookup, Cursor and Claude setup docs.',
};

export function staticGithubRepo(repo: string): ToolResult<Record<string, unknown>> {
  const data = github[repo];
  if (!data) return { ok: false, error: `No static GitHub seed for ${repo}`, retryable: false, source: 'static-seed' };
  return { ok: true, data, source: 'static-seed' };
}

export function staticNpmPackage(pkg: string): ToolResult<Record<string, unknown>> {
  const data = npm[pkg];
  if (!data) return { ok: false, error: `No static npm seed for ${pkg}`, retryable: false, source: 'static-seed' };
  return { ok: true, data, source: 'static-seed' };
}

export function staticDocs(url: string): ToolResult<string> {
  const data = docs[url];
  if (!data) return { ok: false, error: `No static docs seed for ${url}`, retryable: false, source: 'static-seed' };
  return { ok: true, data, source: 'static-seed' };
}
