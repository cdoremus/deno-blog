import { createMiddlewareHandlerContext } from "$fresh-testing-library";
import { describe, it } from "std/testing/bdd.ts";
import { setCacheControlHeaders } from "../../routes/_middleware.ts";
import manifest from "../../fresh.gen.ts";
import { assertEquals } from "std/assert/assert_equals.ts";

describe("Caching headers (middleware.test.tsx)...", () => {
  it("should set Cache-Control header", async () => {
    const middleware = setCacheControlHeaders();
    const path = `/`;
    const req = new Request(`http://localhost:3000${path}`);
    // @ts-ignore fixes "type of property 'routes' is incompatible..." error
    const ctx = createMiddlewareHandlerContext(req, { manifest });
    // @ts-ignore fixes "Argument of type 'MiddlewareHandlerContext<Record<string, unknown>>' is not assignable to parameter of type 'MiddlewareHandlerContext<State>'..." error"
    await middleware(req, ctx);
    const resp = await ctx.next();
    assertEquals(resp.headers.get('Cache-control'), "public, max-age=21600, immutable");
  });
});
