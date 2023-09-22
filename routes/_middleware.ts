import { MiddlewareHandlerContext } from "$fresh/server.ts";

interface State {
  data: string;
}

export function handler(
  _req: Request,
  _ctx: MiddlewareHandlerContext<State>,
) {
  return setCacheControlHeaders();
}

export function setCacheControlHeaders() {
  return async (_req: Request, ctx: MiddlewareHandlerContext<State>) => {
    const resp = await ctx.next();
    resp.headers.set("Cache-Control", "public, max-age=21600, immutable");
  }
}
