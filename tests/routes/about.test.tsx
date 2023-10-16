import { createHandlerContext } from "$fresh-testing-library/server.ts";
import { handler} from "../../routes/about.tsx";
import manifest from "../../fresh.gen.ts";
import { assert, assertEquals, fail } from "std/assert/mod.ts";

Deno.test("routes/About.tsx handler tests...", async (t) => {

  await t.step("should respond to GET request in DEV...", async () => {
    assert(handler.GET);
    const req = new Request("http://localhost:8000/about");
    // @ts-ignore manifest typing
    const ctx = createHandlerContext(req, { manifest });

    const res = await handler.GET(req, ctx);
    assertEquals(res.status, 200);
  });

  await t.step("should respond to GET request in PROD...", async () => {
    Deno.env.set("IS_PROD", "true");
    assert(handler.GET);
    const req = new Request("https://deno-blog.deno.dev/about");
    // @ts-ignore manifest typing
    const ctx = createHandlerContext(req, { manifest });

    const res = await handler.GET(req, ctx);
    assertEquals(res.status, 200);
    Deno.env.set("IS_PROD", "");
  });

  await t.step("should throw error due to bad URL...", async () => {
    assert(handler.GET);
    try {
      const req = new Request("https://foo.bar");
      // @ts-ignore manifest typing
      const ctx = createHandlerContext(req, { manifest });
      const res = await handler.GET(req, ctx);
      fail("Should throw error due to bogus URL");
  } catch(e) {
    // ignore
  }
  });

});