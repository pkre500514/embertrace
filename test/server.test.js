import assert from "node:assert/strict";
import test from "node:test";
import { once } from "node:events";
import { createAppServer } from "../server.js";

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

test("rejects unsupported methods and does not expose unknown files", async () => {
  await withServer(async (baseUrl) => {
    assert.equal((await fetch(baseUrl, { method: "POST" })).status, 405);
    assert.equal((await fetch(`${baseUrl}/missing-file`)).status, 404);
  });
});
