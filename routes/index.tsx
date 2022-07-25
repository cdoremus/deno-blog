/** @jsx h */
import { h } from "preact";
import { tw } from "@twind";
import { HandlerContext, Handlers, PageProps } from "$fresh/server.ts";
import PostList from "../components/PostList.tsx";

export const handler: Handlers = {
  async GET(_: Request, ctx: HandlerContext) {
    const files: string[] = []
    for await (const dirEntry of Deno.readDir("./posts")) {
      if (dirEntry.isFile) {
        const file = dirEntry.name;
        files.push(file);
      }
    }
    console.log("Files", files)
    // files.sort(postDateSorter);
    return await ctx.render({files});
  }
}

export default function Home({data}: PageProps) {
  const {files} = data;
  return (
    <div class={tw`p-4 mx-auto max-w-screen-md`}>
      <h1>Posts</h1>
      <div>
        <PostList files={files} />
      </div>
    </div>
  );
}
