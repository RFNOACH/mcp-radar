import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { BrightDataMcpClient } from './tools/mcpClient.js';
import { BrightDataTools } from './tools/brightdataTools.js';
import { McpRadarAgent } from './agent/radarAgent.js';
import { renderMarkdown } from './report/renderer.js';
import { log } from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.post('/api/analyze', async (req, res) => {
  try {
    const mcp = new BrightDataMcpClient();
    let mcpAvailable = false;

    try {
      mcpAvailable = await mcp.connect();
    } catch (error) {
      log('warn', 'Could not connect to Bright Data MCP; continuing with fallback mode', {
        error: String(error),
      });
    }

    const tools = new BrightDataTools(mcp, mcpAvailable);
    const agent = new McpRadarAgent(tools);

const prompt = String(req.body?.prompt ?? '').toLowerCase();

const competitors = [
  prompt.includes('firecrawl') ? 'firecrawl' : null,
  prompt.includes('apify') ? 'apify' : null,
  prompt.includes('bright data') || prompt.includes('brightdata')
    ? 'brightdata'
    : null,
].filter(Boolean) as string[];

const report = await agent.run(
  competitors.length > 0
    ? competitors
    : ['firecrawl', 'apify', 'brightdata']
);
    const markdown = renderMarkdown(report);

    res.type('text/plain').send(markdown);
  } catch (error) {
    log('error', 'Web analysis failed', {
      error: String(error),
    });

    res.status(500).type('text/plain').send(
      `MCP Radar failed gracefully.\n\nReason: ${String(error)}`
    );
  }
});

app.listen(port, () => {
  console.log(`MCP Radar Assistant running at http://localhost:${port}`);
});