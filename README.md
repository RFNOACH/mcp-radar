# MCP Radar

## Competitive Intelligence for the MCP Ecosystem

MCP Radar is an AI-powered competitive intelligence platform that analyzes a curated benchmark set of MCP-enabled web-access tolos and identifies which competitors are gaining developer traction.

Built with Bright Data MCP as the primary web intelligence layer, MCP Radar discovers competitors, gathers ecosystem signals, handles data-source failures gracefully, and generates evidence-backed executive reports.

### Key Capabilities

- Live competitor intelligence
- Curated MCP benchmark analysis
- Bright Data MCP integration
- GitHub and npm signal analysis
- Reliability-aware scoring
- Executive-ready reporting
- Graceful degradation and fallback handling

## Architecture

```text
             user goal
                |
                v
        +----------------+
        |  Radar Agent   |
        +----------------+
          |     |      |
          |     |      +-------------------+
          |     |                          |
          v     v                          v
   GitHub profile  npm package       docs/integration scan
          |             |                   |
          +-------------+-------------------+
                        |
                        v
           Bright Data MCP tool layer
          /       |          |        \
 search_engine scrape_as_markdown web_data_npm_package session logs
          |
          v
   retry / timeout detection / fallback
          |
          v
     scored markdown + JSON report
```

## Tool orchestration flow

For each competitor:

1. Resolve curated competitor seed metadata: GitHub repo, npm package, docs URL.
2. Use Bright Data MCP tools:
   - `scrape_as_markdown` for documentation and integration pages.
   - `search_engine` for competitor discovery and ecosystem signals.
2.1. If a structured extraction tool is unavailable, automatically fall back to public APIs while preserving confidence annotations and reliability logs.
3. Enrich GitHub metrics with the public GitHub API for deterministic repo-level fields.
4. Extract explicit integration signals: Cursor, Claude, VS Code, and agentic/browser/structured-data depth.
5. Score using transparent heuristics rather than opaque LLM judgment.
6. Write both `outputs/latest-report.md` and `outputs/latest-report.json`.

## Project Structure

```text
src/
├── agent/
│   └── radarAgent.ts
├── config/
├── prompts/
├── report/
│   └── renderer.ts
├── tools/
│   ├── brightdataTools.ts
│   └── mcpClient.ts
├── utils/
├── index.ts
├── server.ts
└── types.ts

public/
└── index.html

outputs/
├── latest-report.md
└── latest-report.json
```

### Directory Overview

* **agent/** – Core orchestration logic and competitor analysis workflow.
* **config/** – Configuration and environment-related settings.
* **prompts/** – Prompt templates used by the agent.
* **report/** – Markdown and JSON report rendering.
* **tools/** – Bright Data MCP integration and web intelligence tooling.
* **utils/** – Logging, helpers, and shared utilities.
* **server.ts** – Express web server exposing the `/api/analyze` endpoint.
* **index.ts** – CLI entry point for standalone execution.
* **public/** – Frontend dashboard and user interface.
* **outputs/** – Generated reports and analysis artifacts.

```

This structure separates orchestration, MCP integrations, reporting, prompting, and reliability handling, allowing the system to continue operating even when individual data sources or tools fail.
```


## Setup

```bash
npm install
cp .env.example .env
```

Add your Bright Data API token:

```bash
API_TOKEN=your_bright_data_api_token
```

Run:

```bash
npm start
```

Demo command:

```bash
npm run demo
```

If you do not provide `API_TOKEN`, the agent automatically runs in fallback demo mode. This is intentional: a live demo should show graceful degradation rather than crash because credentials are absent.

## Example insights

- Firecrawl leads in developer adoption signals.
- Apify shows strong ecosystem maturity.
- Bright Data demonstrates superior infrastructure breadth.
- Reliability scoring highlights where MCP fallbacks were required.

## Example output

```text
# MCP Radar Report

## Ranking

- Firecrawl — score 129. 3500 GitHub stars, 420 forks, 80 npm versions, 4/4 integration-depth signals.
- Apify MCP Server — score 121. 1300 GitHub stars, 168 forks, 100 npm versions, 4/4 integration-depth signals.
- Bright Data MCP — score 118. 2400 GitHub stars, 306 forks, 20 npm versions, 3/4 integration-depth signals.
```

Numbers will change because the agent reads live sources.

## Key design decisions

- Curated competitor seeds instead of autonomous discovery
- Transparent scoring rather than opaque LLM ranking
- Graceful degradation instead of hard failures
- Deterministic APIs for critical metrics
- Markdown-first reporting for business stakeholders

## Success metrics

- Time-to-first-success for a new developer
- MCP GitHub star growth
- npm download growth
- Number of community integrations
- Agent task completion rate
- Reliability score across runs

## Failure mode handled

The failure mode I designed for is **partial live-web failure**:

### Real failure encountered during implementation

During testing against the live Bright Data MCP server, the expected
`web_data_npm_package` tool was not available.

Instead of failing the run, the agent:

1. Logged the MCP tool error.
2. Automatically switched to the npm Registry API.
3. Preserved confidence scoring.
4. Completed the final report.

This became the primary production failure mode demonstrated in the assignment.

Additional failure scenarios handled:

- MCP server unavailable or missing credentials.
- `scrape_as_markdown` timeout or blocked page.
- Public API rate limits.

The handling is not just a generic `try/catch`:

1. Errors are classified as retryable if they look like timeout, rate-limit, blocked, 429, 503, or connection reset.
2. Retry happens once with a small backoff.
3. The agent falls back to deterministic public APIs where possible.
4. The competitor profile still completes with low-confidence signals for missing data.
5. Reliability events are written into the report so the operator can see exactly what degraded.

## Biggest tradeoff

I chose curated competitor seeds over fully autonomous competitor discovery. This keeps the demo deterministic while still exercising live Bright Data MCP tools for evidence gathering. Fully autonomous discovery is more magical, but it creates demo risk: the agent might waste time on irrelevant pages or misidentify packages. For a three-minute assignment demo, deterministic inputs plus live evidence provide a better production/reliability signal.

## What I would ship next with two more weeks

1. Add first-class LangGraph orchestration with per-signal nodes and persisted runs.
2. Add a source credibility model: official docs > package registry > GitHub > third-party directories.
3. Add weekly trend deltas using saved historical snapshots.
4. Add MCP registry parsing and Claude Code/Cursor/Codex config validation.
5. Add an evaluation harness with intentionally broken URLs, malformed npm payloads, and simulated 429s.

## Video walkthrough script

### 0:00-0:30 — Problem framing

"I built MCP Radar, an agent that helps a technical GTM lead understand which web-access MCP tools are gaining developer adoption. I picked this because Bright Data's role is not only scraping; it is becoming infrastructure for coding agents."

### 0:30-1:10 — Architecture

Show README architecture.

"The agent separates orchestration, MCP tools, retries, logging, and report rendering. The important part is that tool failures are expected, not exceptional."

### 1:10-2:10 — Live run

Commands:

```bash
npm install
npm run demo
```

Point out:

- Successful Bright Data MCP connection.
- Live execution of `search_engine`.
- Live execution of `scrape_as_markdown`.
- Automatic npm fallback when a structured MCP extraction tool is unavailable.

### 2:10-2:40 — Failure handling

"If MCP or a scrape fails, it retries once, falls back, marks confidence down, and records the event. The report still completes. That is the production behavior I wanted to demonstrate."

### 2:40-3:00 — Why this matters

"The output is useful for Part 2 as well: it creates an evidence-backed view of Firecrawl, Apify, and Bright Data's relative developer adoption. With two more weeks I would add trend history and MCP registry validation."

## Live demo fallback plan

If the MCP server is unavailable live:

```bash
MCP_RADAR_DEMO_MODE=true npm run demo
```

## Assignment Requirements Coverage

| Requirement | Status |
|------------|---------|
| Bright Data MCP Integration | ✅ |
| Competitor Intelligence Agent | ✅ |
| Live Web Access | ✅ |
| Failure Handling | ✅ |
| Report Generation | ✅ |
| Web Interface | ✅ |
| Executive Memo | ✅ |
| GitHub Repository | ✅ |
