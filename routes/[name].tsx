/** @jsx h */
import { h } from "preact";
import { Handlers, HandlerContext, PageProps } from "$fresh/server.ts";
import { render } from "gfm"

type GreetProps = {
  name: string;
}

export const handler: Handlers = {
  async GET(_: Request, ctx: HandlerContext) {
    const name = ctx.params.name;
    const contents = await Deno.readTextFile(`./posts/${name}.md`);
    const baseUrl = Deno.env.get("IS_PROD") ? "https://cdoremus.deno.dev" : "https://localhost:8000";
    const blog = render(contents, {baseUrl});
    return ctx.render({blog});
  }
}

export default function Greet({data}: PageProps) {
    const { blog } = data;
    return (
      <div dangerouslySetInnerHTML={{__html: blog}}>
        {blog}
      </div>
    )
}
