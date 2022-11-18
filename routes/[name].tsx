import { HandlerContext, Handlers, PageProps } from "$fresh/server.ts";
import { CSS, render } from "gfm";
import SyntaxHighlighter from "https://esm.sh/react-syntax-highlighter@15.5.0";
import "https://esm.sh/prismjs@1.27.0/components/prism-typescript?no-check";
import "https://esm.sh/prismjs@1.27.0/components/prism-shell-session.js?no-check";

export const handler: Handlers = {
  async GET(_: Request, ctx: HandlerContext) {
    const name = ctx.params.name;
    const fileName = `${name}.md`;
    const path = `./posts/${fileName}`;
    let contents = "";
    try {
      contents = await Deno.readTextFile(path);
    } catch(e) {
      console.error(`File ${path} not found: `, e);
      contents = `# File Not Found: ${path}`;
    }
    const baseUrl = Deno.env.get("IS_PROD")
      ? "https://deno-blog.deno.dev"
      : "http://localhost:8000";
    const blog = render(contents, { baseUrl });
    return ctx.render({ blog });
  },
};

export default function BlogPostPage({ data }: PageProps) {
  const { blog } = data;
  return (
    <div class="pt-0 pr-3 pl-3 sm:p-4">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <hr class="mb-5" />
      <div
        class="bg-white p-1 sm:p-5 markdown-body"
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
