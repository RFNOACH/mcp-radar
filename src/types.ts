export type CompetitorId = 'brightdata' | 'firecrawl' | 'apify' | string;

export type Evidence = {
  source: string;
  url: string;
  observedAt: string;
  confidence: 'high' | 'medium' | 'low';
  note: string;
};

export type Signal = {
  name: string;
  value: string | number | boolean | null;
  confidence: 'high' | 'medium' | 'low';
  evidence: Evidence[];
};

export type CompetitorProfile = {
  id: CompetitorId;
  displayName: string;
  githubRepo?: string;
  npmPackage?: string;
  docsUrl?: string;
  signals: Record<string, Signal>;
  reliabilityEvents: string[];
};

export type RadarReport = {
  generatedAt: string;
  goal: string;
  competitors: CompetitorProfile[];
  ranking: { competitor: string; score: number; reason: string }[];
  tradeoffs: string[];
  failureHandling: string[];
  recommendation: string;
};

export type ToolResult<T = unknown> = {
  ok: true;
  data: T;
  source: 'brightdata-mcp' | 'fallback-http' | 'static-seed';
} | {
  ok: false;
  error: string;
  retryable: boolean;
  source: 'brightdata-mcp' | 'fallback-http' | 'static-seed';
};
