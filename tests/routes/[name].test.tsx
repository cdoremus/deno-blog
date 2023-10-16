import { createHandlerContext } from "$fresh-testing-library/server.ts";
import { assert, assertEquals, fail } from "std/assert/mod.ts";
import { handler } from "../../routes/[name].tsx";

import manifest from "../../fresh.gen.ts";


Deno.test("[name].tsx tests...", async (t) => {

  await t.step("should pass with status=200...", async () => {
    const req = new Request("https://localhost:8000/posts/How_I_made_this_blog.2022-08-07");
    // @ts-ignore ignores "type ... is not assignable to type Manifest" error
    const ctx = createHandlerContext(req, { manifest });
    ctx.params['name'] = "How_I_made_this_blog.2022-08-07";
    assert(handler.GET);
    const resp = await handler.GET(req, ctx);
    assertEquals(200, resp.status);
  });

  await t.step("should throw error...", async () => {
    const req = new Request("https://localhost:8000/");
    // @ts-ignore ignores "type ... is not assignable to type Manifest" error
    const ctx = createHandlerContext(req, { manifest });
    ctx.params['name'] = "";
    assert(handler.GET);
    try {
      const resp = await handler.GET(req, ctx);
      // should not get here
      fail();
    } catch(e) {
      // ignore
    }
  });
});