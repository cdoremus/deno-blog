/** @jsx h */
import { h, Fragment } from "preact";
import { tw } from "@twind";
import { HandlerContext, Handlers, PageProps } from "$fresh/server.ts";
import { render } from "https://deno.land/x/gfm/mod.ts";

export const handler: Handlers = {
  async GET(_: Request, ctx: HandlerContext) {
    console.log("import.meta.url", import.meta.url);
    const contents = await Deno.readTextFile(`./posts/first_post.md`)
    const baseUrl = Deno.env.get("IS_PROD") ? "https://cdoremus-blog.deno.dev" : "https://localhost:8000";
    const blog = render(contents, {baseUrl});
    return ctx.render({blog});
  }
}


export default function Blog({data}: PageProps) {
  const { blog } = data
  return (
    <div dangerouslySetInnerHTML={{__html: blog}}>
      {blog}
    </div>
  )
}