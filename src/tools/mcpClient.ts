import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { env, isDemoMode } from '../config/env.js';
import { log } from '../utils/logger.js';
import { withRetry } from '../utils/retry.js';

export class BrightDataMcpClient {
  private client?: Client;
  private connected = false;

  async connect(): Promise<boolean> {
    if (isDemoMode) {
      log('warn', 'Bright Data MCP disabled: running in demo/fallback mode');
      return false;
    }
    const transport = new StdioClientTransport({
      command: 'npx',
      args: ['-y', '@brightdata/mcp'],
      env: {
        ...process.env,
        API_TOKEN: env.API_TOKEN!,
        WEB_UNLOCKER_ZONE: env.WEB_UNLOCKER_ZONE,
        ...(env.BROWSER_AUTH ? { BROWSER_AUTH: env.BROWSER_AUTH } : {}),
      },
    });
    this.client = new Client({ name: 'mcp-radar', version: '1.0.0' });
    await this.client.connect(transport);
    this.connected = true;
    const tools = await this.client.listTools();
    log('info', 'Connected to Bright Data MCP', { tools: tools.tools.map(t => t.name).slice(0, 8), count: tools.tools.length });
    return true;
  }

  async call<T = unknown>(name: string, args: Record<string, unknown>): Promise<T> {
    if (!this.connected || !this.client) throw new Error('MCP client is not connected');
    return withRetry(`mcp:${name}`, async () => {
      const result = await this.client!.callTool({ name, arguments: args });
      return result as T;
    }, 2);
  }
}
