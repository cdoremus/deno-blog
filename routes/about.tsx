import { HandlerContext, Handlers, PageProps } from "$fresh/server.ts";
import { CSS, render } from "gfm";

const markdownFile = "About.md";
const baseUrl = Deno.env.get("IS_PROD")
  ? "https://deno-blog.deno.dev"
  : "http://localhost:8000";

export const handler: Handlers = {
  async GET(_: Request, ctx: HandlerContext) {
    const fileName = markdownFile;
    const path = `${Deno.cwd()}/static/${fileName}`;
    const contents = await Deno.readTextFile(path);
    const blog = render(contents, { baseUrl });
    return ctx.render({ blog });
  },
};

export default function AboutPage({ data }: PageProps) {
  const { blog } = data;
  return (
    <div class="p-4 mx-auto max-w-screen-md">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div
        class="bg-white p-5 markdown-body"
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
