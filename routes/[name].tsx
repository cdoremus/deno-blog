/** @jsx h */
import { Fragment, h } from "preact";
import { tw } from "twind";
import { Handlers, HandlerContext, PageProps } from "$fresh/server.ts";
import { render } from "gfm"
import { format, parse } from "datetime";
type GreetProps = {
  name: string;
}

export const handler: Handlers = {
  async GET(_: Request, ctx: HandlerContext) {
    const name = ctx.params.name;
    const blogName = name.replaceAll("_", " ");
    const path = `./posts/${name}.md`;
    const contents = await Deno.readTextFile(path);
    const modDate = (await Deno.stat(path)).mtime;
    const baseUrl = Deno.env.get("IS_PROD") ? "https://deno-blog.deno.dev" : "https://localhost:8000";
    const blog = render(contents, {baseUrl});
    return ctx.render({blog, blogName, modDate});
  }
}

export default function Greet({data}: PageProps) {
    const { blog, blogName, modDate } = data;
    return (
      <Fragment>
        <h1>{blogName}</h1>
        <div class={tw`text-l`}>{format(modDate, "yyyy-MM-dd")}</div>
        <hr class={tw`mb-5`}/>
        <div dangerouslySetInnerHTML={{__html: blog}}>
          {blog}
        </div>
      </Fragment>
    )
}
