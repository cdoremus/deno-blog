import { createHandlerContext } from "$fresh-testing-library";
import { describe, it } from "std/testing/bdd.ts";
import { handler} from "../../routes/about.tsx";
import manifest from "../../fresh.gen.ts";
import { assert, assertEquals, fail } from "std/assert/mod.ts";

describe("routes/About.tsx handler", () => {

  it("should respond to GET request in DEV...", async () => {
    assert(handler.GET);
    const req = new Request("http://localhost:8000/about");
    // @ts-ignore manifest typing
    const ctx = createHandlerContext(req, { manifest });

    const res = await handler.GET(req, ctx);
    assertEquals(res.status, 200);
  });

  it("should respond to GET request in PROD...", async () => {
    Deno.env.set("IS_PROD", "true");
    assert(handler.GET);
    const req = new Request("https://deno-blog.deno.dev/about");
    // @ts-ignore manifest typing
    const ctx = createHandlerContext(req, { manifest });

    const res = await handler.GET(req, ctx);
    assertEquals(res.status, 200);
    Deno.env.set("IS_PROD", "");
  });

  it("should throw error due to bad URL...", async () => {
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


  // it("should respond......", async () => {

  //   const CONN_INFO: ServeHandlerInfo = {
  //     remoteAddr: { hostname: "127.0.0.1", port: 53496, transport: "tcp" },
  //   };

  //   //  @ts-ignore manifest typing
  //   const handler = await createHandler(manifest);
  //   const resp = await handler(new Request("http://127.0.0.1/about"), CONN_INFO);
  //   assertEquals(resp.status, 200);

  // });

});


