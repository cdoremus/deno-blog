/** @jsx h */
import { h } from "preact";
import { HandlerContext, Handlers, PageProps } from "$fresh/server.ts";
import { CSS, render } from "gfm";
import { tw } from "@twind";
import { IS_BROWSER } from "https://deno.land/x/fresh@1.0.1/runtime.ts";

const markdownFile = "Credits.md";
const baseUrl =  Deno.env.get('IS_PROD') ? "https://deno-blog.deno.dev" : "http://localhost:8000";

export const handler: Handlers = {
  async GET(_: Request, ctx: HandlerContext) {
    const fileName = markdownFile;
    const path = `${Deno.cwd()}/static/${fileName}`;
    const contents = await Deno.readTextFile(path);
    const blog = render(contents, { baseUrl });
    return ctx.render({ blog });
  },
};

export default function CreditsPage({ data }: PageProps) {
  const { blog } = data;
  return (
    <div class={tw`p-4 mx-auto max-w-screen-md`}>
      <div
        class={tw`bg-white p-5` + " markdown-body"}
        data-color-mode="light"
        data-light-theme="light"
        data-dark-theme="dark"
        dangerouslySetInnerHTML={{ __html: blog }}
      >
        {blog}
      </div>
    </div>
  );
}
