# Your Master Land Cruiser Know-It-All

Resource and troubleshooting guide for Toyota Land Cruiser (and Lexus LX) enthusiasts.

- **Global** Land Cruiser coverage: 40 / 55 / 60 / 70 / 80 / 100 / 200 / 300 series + Prado J90 / J120 / J150 / J250 + Lexus LX 450 / 470 / 570 / 600
- VIN lookup with series / chassis-code identification, including RoW-only diesel variants (1HZ, 1HD-FTE, 1KZ-TE, 1KD-FTV, 1VD-FTV, 1GD-FTV)
- AI-powered troubleshooting that suggests likely causes, diagnostic steps, **parts lists with vendor search links**, and curated resources
- Curated repair library: factory service manuals, write-ups, YouTube channels, parts vendors, and series-scoped forum links (ih8mud, AULRO, lcool.org, Expedition Portal)
- Parts vendors curated for the US, Australia, UK/EU, and JDM markets (OEM and aftermarket)

## Stack

- **Backend:** Node.js + Express (one service, no DB)
- **Frontend:** Vanilla HTML/CSS/JS, no build step
- **External APIs:** [NHTSA vPIC](https://vpic.nhtsa.dot.gov/api/) (free, no key) for VIN decode; [Anthropic Messages API](https://docs.anthropic.com/en/api/messages) (Claude) for troubleshooting
- **Hosting:** [Render.com](https://render.com) (single Web Service)

## Local development

```bash
git clone https://github.com/craigothelego/Your-Master-Land-Cruiser-Know-It-All.git
cd Your-Master-Land-Cruiser-Know-It-All
npm install
cp .env.example .env
# edit .env and set ANTHROPIC_API_KEY=sk-ant-...
npm run dev   # auto-restart on changes
```

Then open <http://localhost:3000>.

VIN lookup and the curated Resources page work without any API key. The AI troubleshooting endpoint requires `ANTHROPIC_API_KEY`; without it, the endpoint returns a 503 with a hint.

## Deploying to Render

This repo includes [render.yaml](render.yaml) so you can deploy as a [Render Blueprint](https://render.com/docs/blueprint-spec):

1. Push this repo to GitHub.
2. In Render, click **New +** -> **Blueprint** and select this repo.
3. Render reads `render.yaml` and creates a free Node web service.
4. In the new service's **Environment** tab, set:
   - `ANTHROPIC_API_KEY` = your Anthropic key (from <https://console.anthropic.com/settings/keys>)
   - (optional) `ANTHROPIC_MODEL` = e.g. `claude-sonnet-4-5` (default) or `claude-haiku-4-5` for cheaper runs
5. Deploy. The free tier spins down on idle, which is fine for a hobby site.

If you'd rather wire it up manually:

- Runtime: **Node**
- Build command: `npm install`
- Start command: `node server.js`
- Add env var `ANTHROPIC_API_KEY`

## Project layout

```
.
|-- server.js                       # Express app + all API endpoints
|-- data/
|   |-- landcruiser-series.js       # series catalog + VIN -> series mapper
|   `-- repair-resources.js         # curated FSMs, guides, YT, parts, forums
|-- public/
|   |-- index.html                  # 3-tab single-page UI
|   |-- styles.css
|   `-- app.js                      # client-side fetches + rendering
|-- render.yaml                     # Render Blueprint config
|-- .env.example
`-- package.json
```

## API

- `GET /api/health` - liveness check
- `GET /api/series` - returns the series catalog, system list, and resource type list
- `GET /api/vin/:vin` - decode a VIN; returns NHTSA fields plus `series` (chassis code, year range, blurb, likely engines)
- `GET /api/resources?seriesId=&system=&type=&q=` - filter the curated resources; if both `seriesId` and `q` are set, also returns a scoped ih8mud search URL
- `POST /api/troubleshoot` - body `{ symptoms, vin?, series?, year?, engine? }`; returns a JSON diagnosis with ranked likely causes, diagnostic steps, and per-cause linked resources

## Swapping the LLM provider

The Anthropic call lives in one block in [server.js](server.js) (the `/api/troubleshoot` handler). To switch to OpenAI, Groq, etc., replace that single `fetch(...)` block. The system prompt and JSON schema are provider-agnostic. JSON output is enforced via Anthropic's "assistant prefill" trick (the assistant turn starts with `{`, and we re-attach it before parsing).

## Notes & caveats

- Pre-1981 Land Cruisers used short chassis-style VINs that NHTSA cannot decode. The site detects these and surfaces what it can from the chassis prefix (e.g. `FJ40`, `FJ55`).
- Curated resource URLs in [data/repair-resources.js](data/repair-resources.js) may go stale over time - update them as needed.
- Not affiliated with Toyota, Lexus, or ih8mud.com.

## License

MIT (or whatever you pick - update this section before publishing).
