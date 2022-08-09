/** @jsx h */
import { h, Fragment } from "preact";
import { tw } from "twind";
import { Handlers, HandlerContext, PageProps } from "$fresh/server.ts";
import { CSS, render } from "gfm";

type GreetProps = {
  name: string;
}

export const handler: Handlers = {
  async GET(_: Request, ctx: HandlerContext) {
    const name = ctx.params.name;
    const fileName = `${name}.md`;
    const path = `./posts/${fileName}`;
    // console.log("FILE: ", path)
    const contents = await Deno.readTextFile(path);
    const baseUrl = Deno.env.get("IS_PROD") ? "https://deno-blog.deno.dev" : "http://localhost:8000";
    const blog = render(contents, {baseUrl});
    return ctx.render({blog});
  }
}

export default function Greet({data}: PageProps) {
    const { blog } = data;
    return (
      <div class={tw`p-4`}>
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        <hr class={tw`mb-5`}/>
        <div class={tw`bg-white p-5` + " markdown-body"}
          data-color-mode="light"
          data-light-theme="light" data-dark-theme="dark"
            dangerouslySetInnerHTML={{__html: blog}}>
          {blog}
        </div>
      </div>
    )
}
