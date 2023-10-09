import { assertEquals } from "std/assert/assert_equals.ts";
import { createMiddlewareHandlerContext } from "$fresh-testing-library";
import { setCacheControlHeaders } from "../../routes/_middleware.ts";
import manifest from "../../fresh.gen.ts";

Deno.test("should set Cache-Control header", async () => {
  const req = new Request(`http://localhost:3000/`);
  // @ts-ignore ignores "type ... is not assignable to type Manifest" error
  const ctx = createMiddlewareHandlerContext(req, { manifest });
  let resp = new Response();
  const middleware = await setCacheControlHeaders();
  await middleware(req, ctx);
  resp = await ctx.next();
  assertEquals(resp.headers.get('Cache-control'), "public, max-age=21600, immutable");
});
