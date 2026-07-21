import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(process.cwd(), "public");
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".png": "image/png", ".wav": "audio/wav" };
const sourceCatalog = {
  camera: "Helmet camera: Engine 2 entered through the front entry. At 14:11, the visible fire was reported knocked down. Ventilation and overhaul followed.",
  radio: "TAC 3 radio traffic: dispatch and operational traffic from 00:18 through 04:09 supports the response timeline.",
  photos: "Scene photos: three images show smoke conditions, kitchen-area damage, and exterior crew staging. They do not establish origin or cause.",
  cad: "CAD dispatch record: Metroville Fire Department was dispatched at approximately 14:02 to 418 Juniper Street for a reported residential structure fire.",
  note: "Crew clarification: an attributed, reviewer-supplied clarification. It requires the same human review as all other evidence."
};
const sourceIds = Object.keys(sourceCatalog);

function sendJson(response, status, body) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  response.end(JSON.stringify(body));
}

async function readJson(request) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 100_000) throw new Error("Request too large");
  }
  return JSON.parse(body || "{}");
}

function normalizeDraft(value, allowedSourceIds) {
  const fields = ["summary", "operations", "observations"];
  if (!value || typeof value !== "object" || !fields.every((field) => typeof value[field] === "string" && value[field].trim())) throw new Error("Model draft is incomplete");
  return {
    summary: value.summary.trim().slice(0, 1800), operations: value.operations.trim().slice(0, 1800), observations: value.observations.trim().slice(0, 1800),
    review_required: Array.isArray(value.review_required) ? value.review_required.filter((item) => typeof item === "string").slice(0, 8) : [],
    used_source_ids: Array.isArray(value.used_source_ids) ? value.used_source_ids.filter((id) => allowedSourceIds.includes(id)) : []
  };
}

export function createOpenAIAdapter({ apiKey = process.env.OPENAI_API_KEY, fetchImpl = globalThis.fetch } = {}) {
  if (!apiKey) return null;
  const adapter = async ({ selectedSourceIds, crewNotes }) => {
    const evidence = selectedSourceIds.map((id) => ({ id, text: sourceCatalog[id] }));
    if (crewNotes.length) evidence.push({ id: "note", text: `Crew clarifications (unverified until human review): ${crewNotes.join("\n")}` });
    const apiResponse = await fetchImpl("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        model: "gpt-5.6-terra", store: false, reasoning: { effort: "low" },
        instructions: "Draft a concise fire incident report from only the supplied simulated evidence. Never infer origin, cause, injuries, names, addresses beyond supplied facts, or operational facts not supported by evidence. Put uncertainties in review_required. Return JSON matching the schema.",
        input: `Selected simulated evidence:\n${JSON.stringify(evidence)}`,
        text: { format: { type: "json_schema", name: "incident_draft", strict: true, schema: {
          type: "object", additionalProperties: false,
          properties: { summary: { type: "string" }, operations: { type: "string" }, observations: { type: "string" }, review_required: { type: "array", items: { type: "string" } }, used_source_ids: { type: "array", items: { type: "string", enum: sourceIds } } },
          required: ["summary", "operations", "observations", "review_required", "used_source_ids"]
        } } }
      })
    });
    if (!apiResponse.ok) throw new Error(`OpenAI request failed (${apiResponse.status})`);
    return normalizeDraft(JSON.parse((await apiResponse.json()).output_text), [...selectedSourceIds, ...(crewNotes.length ? ["note"] : [])]);
  };
  adapter.mode = "gpt-5.6-terra";
  return adapter;
}

export function createLocalDemoAdapter() {
  const adapter = async ({ selectedSourceIds, crewNotes }) => {
    const has = (id) => selectedSourceIds.includes(id);
    const usedSourceIds = [...selectedSourceIds, ...(crewNotes.length ? ["note"] : [])];
    return {
      summary: has("cad") ? "Local simulation: the selected dispatch record supports a response to a reported residential structure fire at approximately 14:02." : "Local simulation: no selected source supports a dispatch time or address.",
      operations: has("camera") || has("radio") ? "Local simulation: selected camera or radio evidence supports documenting interior attack, knockdown, ventilation, and overhaul; a reviewer must confirm the final timeline." : "Local simulation: no selected source supports field operations.",
      observations: has("photos") ? "Local simulation: selected scene photos support documenting smoke conditions and kitchen-area damage, but do not establish origin or cause." : "Local simulation: no selected scene photos support observations.",
      review_required: ["This is a local, deterministic simulation—not a GPT-5.6 response.", "Confirm all missing fields and any crew clarification before supervisor review."],
      used_source_ids: usedSourceIds
    };
  };
  adapter.mode = "local_simulation";
  return adapter;
}

export function createAppServer({ aiAdapter = createOpenAIAdapter() ?? createLocalDemoAdapter() } = {}) {
  return createServer(async (request, response) => {
    const pathname = new URL(request.url, "http://localhost").pathname;
    if (pathname === "/api/draft") {
      if (request.method !== "POST") return response.writeHead(405, { allow: "POST" }).end("Method not allowed");
      if (!aiAdapter) return sendJson(response, 503, { error: "AI_ADAPTER_NOT_CONFIGURED", message: "Set OPENAI_API_KEY on the server to enable the GPT-5.6 adapter." });
      try {
        const { sourceIds: requestedSourceIds, crewNotes: requestedCrewNotes } = await readJson(request);
        const selectedSourceIds = [...new Set(Array.isArray(requestedSourceIds) ? requestedSourceIds : [])].filter((id) => sourceIds.includes(id));
        if (!selectedSourceIds.length) return sendJson(response, 400, { error: "NO_EVIDENCE_SELECTED" });
        const crewNotes = (Array.isArray(requestedCrewNotes) ? requestedCrewNotes : []).filter((note) => typeof note === "string").map((note) => note.trim()).filter(Boolean).map((note) => note.slice(0, 1200)).slice(0, 5);
        return sendJson(response, 200, { draft: await aiAdapter({ selectedSourceIds, crewNotes }), mode: aiAdapter.mode ?? "custom" });
      } catch (error) {
        return sendJson(response, 502, { error: "AI_DRAFT_FAILED", message: error instanceof Error ? error.message : "AI draft failed" });
      }
    }
    if (request.method !== "GET" && request.method !== "HEAD") {
      response.writeHead(405, { allow: "GET, HEAD" }).end("Method not allowed");
      return;
    }
    const safePath = pathname === "/" ? "/index.html" : decodeURIComponent(pathname);
    if (safePath.includes("..") || safePath.includes("\0")) {
      response.writeHead(400).end("Invalid request");
      return;
    }
    try {
      const file = await readFile(join(root, safePath));
      response.writeHead(200, { "content-type": types[extname(safePath)] ?? "application/octet-stream" });
      response.end(request.method === "HEAD" ? undefined : file);
    } catch {
      response.writeHead(404).end("Not found");
    }
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  createAppServer().listen(4173, () => console.log("EmberTrace demo: http://localhost:4173"));
}
