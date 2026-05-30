import { RadarReport } from '../types.js';

export function renderMarkdown(report: RadarReport): string {
  const lines: string[] = [];
  lines.push(`# MCP Radar Report`);
  lines.push('');
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push('');
  lines.push(`Goal: ${report.goal}`);
  lines.push('');
  lines.push('## Ranking');
  for (const row of report.ranking) lines.push(`- **${row.competitor}** — score ${row.score}. ${row.reason}`);
  lines.push('');
  lines.push('## Competitor Signals');
  for (const c of report.competitors) {
    lines.push(`### ${c.displayName}`);
    lines.push(`- GitHub: ${c.githubRepo}`);
    lines.push(`- npm: ${c.npmPackage}`);
    lines.push(`- Docs: ${c.docsUrl}`);
    for (const s of Object.values(c.signals)) {
      lines.push(`- ${s.name}: ${String(s.value)} (${s.confidence})`);
    }
    if (c.reliabilityEvents.length) {
      lines.push(`- Reliability events:`);
      for (const ev of c.reliabilityEvents) lines.push(`  - ${ev}`);
    }
    lines.push('');
  }
  lines.push('## Reliability / Failure Handling');
  report.failureHandling.forEach(x => lines.push(`- ${x}`));
  lines.push('');
  lines.push('## Tradeoffs');
  report.tradeoffs.forEach(x => lines.push(`- ${x}`));
  lines.push('');
  lines.push('## Recommendation');
  lines.push(report.recommendation);
  return lines.join('\n');
}
