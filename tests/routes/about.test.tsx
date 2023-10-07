import { createHandlerContext } from "$fresh-testing-library";
import { describe, it } from "std/testing/bdd.ts";
import { handler} from "../../routes/about.tsx";
import manifest from "../../fresh.gen.ts";
import { assert, assertEquals } from "std/assert/mod.ts";

describe("routes/About.tsx handler", () => {

  it("should respond to GET request...s", async () => {
    assert(handler.GET);
    const req = new Request("http://localhost:8000/abosut");
    const ctx = createHandlerContext(req, { manifest });
    ctx.state.data =  {blog: ""};

    const res = await handler.GET(req, ctx);
    assertEquals(res.status, 200);

  })
});