/** @jsx h */
import { h } from "preact";
import { tw } from "@twind";
import { HandlerContext, Handlers, PageProps } from "$fresh/server.ts";
import PostList from "../components/PostList.tsx";
import { postDateSorter } from "../utils/stringFcns.ts";

export const handler: Handlers = {
  async GET(_: Request, ctx: HandlerContext) {
    const files: string[] = []
    for await (const dirEntry of Deno.readDir("./posts")) {
      if (dirEntry.isFile) {
        const file = dirEntry.name;
        files.push(file);
      }
    }
    const sortedFiles = files.sort(postDateSorter).reverse();
    return await ctx.render({files});
  }
}

export default function Home({data}: PageProps) {
  const {files} = data;
  return (
    <div class={tw`p-4 mr-5 ml-5mx-auto max-w-screen-lg`}>
      <p class={tw`text-xl text-center font-extralight mt-0`}>A blog about Deno</p>
      <hr/>
      <h1 class={tw`ml-3 mr-3`}>Blog Posts</h1>
      <div>
        <PostList files={files} />
      </div>
    </div>
  );
}
