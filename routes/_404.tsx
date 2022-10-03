import { Head } from "$fresh/runtime.ts";
import { UnknownPageProps } from "$fresh/server.ts";

export default function NotFoundPage({ url }: UnknownPageProps) {
  return (
    <div>
      <Head>Not Found - Craig's Deno Diary</Head>
      <h1>URL not Found</h1>
    </div>
  );
}