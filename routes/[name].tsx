/** @jsx h */
import { h } from "preact";
import { tw } from "twind";
import { Handlers, HandlerContext, PageProps } from "$fresh/server.ts";
import { CSS, render } from "gfm";
import "https://esm.sh/prismjs@1.27.0/components/prism-typescript?no-check";

type GreetProps = {
  name: string;
}

export const handler: Handlers = {
  async GET(_: Request, ctx: HandlerContext) {
    const name = ctx.params.name;
    const fileName = `${name}.md`;
    const path = `./posts/${fileName}`;
    const contents = await Deno.readTextFile(path);
    // const fileStats = await Deno.stat(path);
    // console.log(`FILE STATS for ${fileName}`, JSON.stringify(fileStats));
    const baseUrl = Deno.env.get("IS_PROD") ? "https://deno-blog.deno.dev" : "https://localhost:8000";
    const blog = render(contents, {baseUrl});
    return ctx.render({blog});
  }
}

export default function Greet({data}: PageProps) {
    const { blog } = data;
    return (
      <div>
        <style>{CSS}</style>
        <hr class={tw`mb-5`}/>
        <div data-color-mode="light" data-light-theme="light" data-dark-theme="dark" class="markdown-body" dangerouslySetInnerHTML={{__html: blog}}>
          {blog}
        </div>
      </div>
    )
}
