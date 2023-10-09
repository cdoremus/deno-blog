import { MiddlewareHandlerContext } from "$fresh/server.ts";

  export const handler = setCacheControlHeaders();

  export function setCacheControlHeaders() {
    return async (_req: Request, ctx: MiddlewareHandlerContext) => {
    const resp = await ctx.next();
    resp.headers.set("Cache-Control", "public, max-age=21600, immutable");
    return resp;
  }
}
