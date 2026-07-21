# EmberTrace

> Evidence in. Time back.

EmberTrace is a local, evidence-grounded incident-report drafting demo for fire crews. It turns captured records into a reviewable draft while keeping every supported statement traceable, every gap visible, and every final decision with a human.

It is a hackathon prototype. It uses one simulated, de-identified structure-fire case only. It is not an official NERIS integration, a dispatch system, or a replacement for agency policy.

## What it demonstrates

- Cross-checks four local evidence types: helmet-camera frame, radio transcript, scene photos, and CAD record.
- Writes a report draft with source-linked citations.
- Keeps unsupported fields in `REVIEW REQUIRED` instead of inventing facts.
- Lets a reviewer inspect the underlying simulated evidence and selected crew clarifications.
- Requires two human confirmation checks before a draft is marked ready for supervisor review.
- Generates local SHA-256 evidence fingerprints in the browser.
- Never auto-submits a report, determines origin/cause, or uses external APIs.

## Run locally

### Prerequisites

- Node.js 20 or newer
- A modern browser

### Start

```bash
git clone <YOUR-REPOSITORY-URL>
cd embertrace
npm start
```

Open <http://localhost:4173>. No package install, API key, account, upload, or network service is required after the repository is cloned.

### Optional GPT-5.6 adapter

The default workflow is fully offline. To enable the optional **Enhance this simulated draft with GPT-5.6** control, set an API key only in the server environment and restart:

```powershell
$env:OPENAI_API_KEY="your_key_here"
npm start
```

The browser never receives the key. The server sends only the selected simulated evidence and any explicitly entered, redacted crew clarification to the Responses API using `gpt-5.6-terra`, requests a structured draft, validates its source IDs, and keeps the existing citation and human-review gates. Do not use real incident data in this demo adapter.

### Verify

```bash
npm test
```

The tests start the static server on an ephemeral local port, verify the app and JavaScript asset are available, and check that unsupported methods and unknown files are rejected.

## Demo flow

1. Select **1-minute demo**, or click **Cross-check evidence & draft**.
2. Review the source-linked claims in the generated draft.
3. Click a citation to inspect the simulated source material.
4. Select crew clarifications to show how new, attributed evidence changes the draft.
5. Choose **Review & approve**. Complete the two human checks, then print or save a local PDF.

For a narrated recording plan, see [DEMO_VIDEO_SCRIPT.md](./DEMO_VIDEO_SCRIPT.md). The matching English narration is in [DEMO_NARRATION_EN.txt](./DEMO_NARRATION_EN.txt).

## Sample data

All files in `public/assets/` are simulated and de-identified. They are intentionally bundled so judges can run the complete workflow offline:

- `simulated-helmet-frame.png`: a representative helmet-camera still.
- `simulated-scene-photo*.png`: three representative scene images.
- `simulated-radio-traffic*.wav`: demo audio assets; the UI displays a time-aligned transcript.

## Safety boundaries

- Original evidence is read-only in the demo.
- Unknowns remain unresolved until a human verifies them.
- The prototype does not infer medical status, origin, cause, or legal conclusions.
- The prototype does not connect to real agencies, emergency systems, or personal data.

## Architecture

```text
public/assets/ + selected crew-note cards
                |
                v
public/app.js: local rule-based drafting + citation links + browser SHA-256 receipt
                |
                v
editable draft -> mandatory human checks -> print/save or supervisor review
```

`server.js` is a dependency-free Node server. The interaction model and evidence rules live in `public/app.js`. By default there is no backend database or external AI request; an opt-in server-side GPT-5.6 adapter is available when `OPENAI_API_KEY` is configured.

## Built with Codex and GPT-5.6

Codex accelerated the product loop: shaping the evidence-first workflow, implementing the offline interaction model, tightening safety boundaries, adding local verification, and producing the test and submission documentation. GPT-5.6 was used through Codex for implementation and iteration. The design decision that remained fixed throughout: the system may draft from evidence, but it must never conceal uncertainty or replace human approval.

## License

MIT. See [LICENSE](./LICENSE).
