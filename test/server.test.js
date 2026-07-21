import assert from "node:assert/strict";
import test from "node:test";
import { once } from "node:events";
import { createAppServer, createOpenAIAdapter } from "../server.js";

async function withServer(run) {
  const server = createAppServer().listen(0, "127.0.0.1");
  await once(server, "listening");
  const { port } = server.address();
  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    server.close();
    await once(server, "close");
  }
}

test("serves the EmberTrace application and static assets", async () => {
  await withServer(async (baseUrl) => {
    const home = await fetch(baseUrl);
    assert.equal(home.status, 200);
    assert.match(home.headers.get("content-type"), /text\/html/);
    assert.match(await home.text(), /EMBERTRACE/);

    const script = await fetch(`${baseUrl}/app.js`);
    assert.equal(script.status, 200);
    assert.match(script.headers.get("content-type"), /javascript/);
  });
});

test("keeps the AI adapter opt-in when no server key is configured", async () => {
  await withServer(async (baseUrl) => {
    assert.equal((await fetch(baseUrl, { method: "POST" })).status, 405);
    assert.equal((await fetch(`${baseUrl}/missing-file`)).status, 404);
    const adapter = await fetch(`${baseUrl}/api/draft`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sourceIds: ["cad"] }) });
    assert.equal(adapter.status, 503);
    assert.equal((await adapter.json()).error, "AI_ADAPTER_NOT_CONFIGURED");
  });
});

test("proxies selected evidence through a validated GPT-5.6 adapter", async () => {
  let requestBody;
  const adapter = createOpenAIAdapter({ apiKey: "test-key", fetchImpl: async (_url, options) => {
    requestBody = JSON.parse(options.body);
    return new Response(JSON.stringify({ output_text: JSON.stringify({
      summary: "Dispatch record supports the response.", operations: "Operations require review.", observations: "No origin conclusion is supported.",
      review_required: ["Confirm civilian assessment."], used_source_ids: ["cad", "not-selected"]
    }) }), { status: 200, headers: { "content-type": "application/json" } });
  } });
  const server = createAppServer({ aiAdapter: adapter }).listen(0, "127.0.0.1");
  await once(server, "listening");
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/draft`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sourceIds: ["cad", "unknown"], crewNotes: ["No civilian assessment documented."] }) });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.deepEqual(body.draft.used_source_ids, ["cad"]);
    assert.equal(requestBody.model, "gpt-5.6-terra");
    assert.equal(requestBody.store, false);
    assert.match(requestBody.input, /No civilian assessment documented/);
  } finally {
    server.close();
    await once(server, "close");
  }
});
