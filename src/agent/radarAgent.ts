import { BrightDataTools } from '../tools/brightdataTools.js';
import { CompetitorProfile, Evidence, RadarReport, Signal } from '../types.js';
import { log } from '../utils/logger.js';

type Seed = { displayName: string; githubRepo: string; npmPackage: string; docsUrl: string };
const seeds: Record<string, Seed> = {
  brightdata: {
    displayName: 'Bright Data MCP',
    githubRepo: 'brightdata/brightdata-mcp',
    npmPackage: '@brightdata/mcp',
    docsUrl: 'https://docs.brightdata.com/ai/mcp-server/tools',
  },
  firecrawl: {
    displayName: 'Firecrawl',
    githubRepo: 'firecrawl/firecrawl-mcp-server',
    npmPackage: 'firecrawl-mcp',
    docsUrl: 'https://docs.firecrawl.dev',
  },
  apify: {
    displayName: 'Apify MCP Server',
    githubRepo: 'apify/apify-mcp-server',
    npmPackage: '@apify/actors-mcp-server',
    docsUrl: 'https://docs.apify.com/platform/integrations/mcp',
  },
};

function evidence(source: string, url: string, note: string, confidence: Evidence['confidence'] = 'high'): Evidence {
  return { source, url, note, confidence, observedAt: new Date().toISOString() };
}

function signal(name: string, value: Signal['value'], ev: Evidence[], confidence: Signal['confidence'] = 'medium'): Signal {
  return { name, value, confidence, evidence: ev };
}

function textHas(text: string, terms: string[]): boolean {
  const lower = text.toLowerCase();
  return terms.some(t => lower.includes(t.toLowerCase()));
}

export class McpRadarAgent {
  constructor(private readonly tools: BrightDataTools) {}

  async run(competitorIds = ['firecrawl', 'apify', 'brightdata']): Promise<RadarReport> {
    log('info', 'Starting MCP Radar run', { competitors: competitorIds });
    const profiles = await Promise.all(competitorIds.map(id => this.profile(id)));
    return this.synthesize(profiles);
  }

  private async profile(id: string): Promise<CompetitorProfile> {
    const seed = seeds[id];
    if (!seed) throw new Error(`Unknown competitor: ${id}`);
    const reliabilityEvents: string[] = [];
    const signals: CompetitorProfile['signals'] = {};

const [repo, npm, docs, discovery] = await Promise.all([
  this.tools.githubRepo(seed.githubRepo),
  this.tools.npmPackage(seed.npmPackage),
  this.tools.scrapeMarkdown(seed.docsUrl),
  this.tools.search(`${seed.displayName} MCP server Cursor Claude GitHub npm`),
]);

if (!discovery.ok) {
  reliabilityEvents.push(`Search discovery failed for ${seed.displayName}: ${discovery.error}`);
} else if (discovery.source !== 'brightdata-mcp') {
  reliabilityEvents.push(`Search discovery for ${seed.displayName} used fallback source: ${discovery.source}.`);
}

    if (!repo.ok) reliabilityEvents.push(`GitHub repo lookup failed for ${seed.githubRepo}: ${repo.error}`);
    if (!npm.ok) reliabilityEvents.push(`npm lookup failed for ${seed.npmPackage}: ${npm.error}`);
    if (!docs.ok) reliabilityEvents.push(`Docs scrape failed for ${seed.docsUrl}: ${docs.error}`);

    if (repo.ok && repo.source === 'static-seed') reliabilityEvents.push(`GitHub live lookup unavailable for ${seed.githubRepo}; using static demo seed.`);
    if (npm.ok && npm.source === 'static-seed') reliabilityEvents.push(`npm live lookup unavailable for ${seed.npmPackage}; using static demo seed.`);
    if (docs.ok && docs.source === 'static-seed') reliabilityEvents.push(`Docs live scrape unavailable for ${seed.docsUrl}; using static demo seed.`);

    const repoData = repo.ok ? repo.data : {};
    const npmData = npm.ok ? npm.data : {};
    const docsText = docs.ok ? docs.data : '';

    signals.githubStars = signal('GitHub stars', Number(repoData.stargazers_count ?? 0), [
      evidence(repo.source, `https://github.com/${seed.githubRepo}`, 'Repository metadata'),
    ], repo.ok && repo.source !== 'static-seed' ? 'high' : repo.ok ? 'medium' : 'low');

    signals.githubForks = signal('GitHub forks', Number(repoData.forks_count ?? 0), [
      evidence(repo.source, `https://github.com/${seed.githubRepo}`, 'Repository metadata'),
    ], repo.ok && repo.source !== 'static-seed' ? 'high' : repo.ok ? 'medium' : 'low');

    const latestVersion = (npmData as any)?.['dist-tags']?.latest ?? (npmData as any)?.version ?? null;
    signals.npmLatestVersion = signal('npm latest version', latestVersion, [
      evidence(npm.source, `https://www.npmjs.com/package/${seed.npmPackage}`, 'npm package metadata'),
    ], npm.ok && npm.source !== 'static-seed' ? 'high' : npm.ok ? 'medium' : 'low');

    const versions = (npmData as any)?.versions ? Object.keys((npmData as any).versions).length : null;
    signals.npmVersionCount = signal('npm version count', versions, [
      evidence(npm.source, `https://www.npmjs.com/package/${seed.npmPackage}`, 'Version count as a release cadence proxy'),
    ], npm.ok && npm.source !== 'static-seed' ? 'medium' : npm.ok ? 'low' : 'low');

    signals.cursorSupport = signal('Cursor support in docs', textHas(docsText, ['Cursor']), [
      evidence(docs.source, seed.docsUrl, 'Docs mention Cursor client setup'),
    ], docs.ok && docs.source !== 'static-seed' ? 'medium' : docs.ok ? 'low' : 'low');

    signals.claudeSupport = signal('Claude support in docs', textHas(docsText, ['Claude', 'Claude Desktop', 'Claude Code']), [
      evidence(docs.source, seed.docsUrl, 'Docs mention Claude clients'),
    ], docs.ok && docs.source !== 'static-seed' ? 'medium' : docs.ok ? 'low' : 'low');

    signals.vscodeSupport = signal('VS Code support in docs', textHas(docsText, ['VS Code', 'Visual Studio Code']), [
      evidence(docs.source, seed.docsUrl, 'Docs mention VS Code integration'),
    ], docs.ok && docs.source !== 'static-seed' ? 'medium' : docs.ok ? 'low' : 'low');

    signals.agenticDepth = signal('Agentic depth', textHas(docsText, ['browser', 'interact', 'click', 'actor', 'structured', 'schema', 'scrape', 'search']), [
      evidence(docs.source, seed.docsUrl, 'Docs include more than raw fetch/search wording'),
    ], docs.ok && docs.source !== 'static-seed' ? 'medium' : docs.ok ? 'low' : 'low');

    return { id, ...seed, signals, reliabilityEvents };
  }

  private synthesize(competitors: CompetitorProfile[]): RadarReport {
    const ranking = competitors.map(c => {
      const stars = Number(c.signals.githubStars.value ?? 0);
      const forks = Number(c.signals.githubForks.value ?? 0);
      const versions = Number(c.signals.npmVersionCount.value ?? 0);
      const integrations = ['cursorSupport', 'claudeSupport', 'vscodeSupport', 'agenticDepth']
        .filter(k => c.signals[k]?.value === true).length;
      const score = Math.round(Math.log10(stars + 10) * 25 + Math.log10(forks + 10) * 10 + Math.min(versions, 100) * 0.3 + integrations * 12);
      return {
        competitor: c.displayName,
        score,
        reason: `${stars} GitHub stars, ${forks} forks, ${versions || 'unknown'} npm versions, ${integrations}/4 integration-depth signals.`,
      };
    }).sort((a, b) => b.score - a.score);

    return {
      generatedAt: new Date().toISOString(),
      goal: 'Assess which web-access MCP tools are gaining developer traction and why.',
      competitors,
      ranking,
      tradeoffs: [
        'Used deterministic public API fallbacks for repo/package metrics so the live demo survives MCP/API outages.',
        'Docs quality is scored with explicit keyword heuristics rather than subjective LLM judgment to keep the run explainable.',
        'The score is a decision aid, not a market-share claim; each signal carries evidence and confidence.',
      ],
      failureHandling: [
        'MCP timeout/block/rate-limit errors are detected, logged, retried once, then degraded to public HTTP fallback.',
        'Partial result handling: one failed source does not fail the whole competitor profile; the missing signal is marked low-confidence.',
        'Ambiguous competitor names are avoided via curated seed metadata; this is intentional for reliable executive demos.',
      ],
      recommendation: 'Bright Data should win developers by packaging MCP Radar-style adoption intelligence into a first-party “agent readiness kit”: one-command setup, verified tool recipes, schema-stable examples, and benchmarked failure recovery against common web tasks.',
    };
  }
}
