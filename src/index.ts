import { mkdir, writeFile } from 'node:fs/promises';
import { BrightDataMcpClient } from './tools/mcpClient.js';
import { BrightDataTools } from './tools/brightdataTools.js';
import { McpRadarAgent } from './agent/radarAgent.js';
import { renderMarkdown } from './report/renderer.js';
import { log } from './utils/logger.js';

function parseCompetitors(): string[] {
  const idx = process.argv.indexOf('--competitors');
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1].split(',').map((s: string) => s.trim()).filter(Boolean);
  return ['firecrawl', 'apify', 'brightdata'];
}

async function main() {
  const mcp = new BrightDataMcpClient();
  let mcpAvailable = false;
  try { mcpAvailable = await mcp.connect(); }
  catch (error) { log('warn', 'Could not connect to Bright Data MCP; continuing with fallback mode', { error: String(error) }); }

  const tools = new BrightDataTools(mcp, mcpAvailable);
  const agent = new McpRadarAgent(tools);
  const report = await agent.run(parseCompetitors());
  const md = renderMarkdown(report);
  await mkdir('outputs', { recursive: true });
  await writeFile('outputs/latest-report.md', md);
  await writeFile('outputs/latest-report.json', JSON.stringify(report, null, 2));
  console.log(md);
}

main().catch(err => {
  log('error', 'Fatal agent error', { error: String(err), stack: err?.stack });
  process.exitCode = 1;
});
