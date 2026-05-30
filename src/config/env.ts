import 'dotenv/config';
import { z } from 'zod';

const EnvSchema = z.object({
  API_TOKEN: z.string().optional(),
  WEB_UNLOCKER_ZONE: z.string().default('mcp_unlocker'),
  BROWSER_AUTH: z.string().optional(),
  GITHUB_TOKEN: z.string().optional(),
  MCP_RADAR_DEMO_MODE: z.enum(['true', 'false']).default('false'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export const env = EnvSchema.parse(process.env);
export const isDemoMode = env.MCP_RADAR_DEMO_MODE === 'true' || !env.API_TOKEN;
