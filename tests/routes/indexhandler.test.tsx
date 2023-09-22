import { createHandlerContext } from "$fresh-testing-library";

import { assert, assertEquals } from "std/assert/mod.ts";
import { describe, it } from "std/testing/bdd.ts";
import { handler } from "../../routes/index.tsx";
import manifest from "../../fresh.gen.ts";


describe("index.tsx (Home) handler...", () => {
  it("should...", async () => {
    assert(handler.GET);

    const req = new Request("http://localhost:8000/");
    // @ts-ignore fixes "type of property 'routes' is incompatible..." error
    const ctx = createHandlerContext(req, { manifest });

    const res = await handler.GET(req, ctx);
    console.log("RESPONSE", await res.text());
    assert(res);
  });
});