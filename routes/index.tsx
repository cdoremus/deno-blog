import { HandlerContext, Handlers, PageProps } from "$fresh/server.ts";
import PostList from "../components/PostList.tsx";
import { postDateSorter } from "../utils/stringFcns.ts";

export const handler: Handlers = {
  async GET(_: Request, ctx: HandlerContext) {
    const files: string[] = [];
    for await (const dirEntry of Deno.readDir("./posts")) {
      if (dirEntry.isFile) {
        const file = dirEntry.name;
        files.push(file);
      }
    }
    const sortedFiles = files.sort(postDateSorter).reverse();
    return await ctx.render({ files });
  },
};

export default function Home({ data }: PageProps) {
  const { files } = data;
  return (
    <div class="pb-4 pl-4 pr-4 mr-5 ml-5mx-auto max-w-screen-lg">
      <div class="md:text-2xl sm:text-md text-center font-extralight mt-0">
        A blog about Deno
      </div>
      <div class="text-2xl font-bold ml-3 mr-3 mb-3">Blog Posts</div>
      <div>
        <PostList files={files} />
      </div>
    </div>
  );
}
