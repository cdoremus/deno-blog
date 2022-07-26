/** @jsx h */
import { h } from "preact";
import { asset, Head } from "$fresh/runtime.ts";
import { AppProps } from "$fresh/src/server/types.ts";
import { tw } from "twind";

export default function App({ Component }: AppProps) {
  const urlPath = import.meta.url?.split(".")[0]?.split("/").pop();
  return (
    <html data-custom="data">
      <Head>
        <link rel="stylesheet" href={asset("style.css")} />
        <link rel="icon" href="/favicon.ico" sizes="32x32"/>
      </Head>
      <body class={tw`m-x-50 m-y-0 pt-4 mx-auto max-w-screen-lg bg-blue-50`}>
        <header class={tw`flex flex-row border border-black pt-2 pr-2 ml-2 justify-between bg-green-50`}>
          <div class={tw`flex flex-row ml-10`}>
            <div><img class={tw`h-8 w-8 mt-2`} src="/deno_logo.svg"/></div>
            <h1 class={tw`text-center text-xl font-bold ml-1`}>Craig's Deno Ditties</h1>
          </div>
          <nav class={tw`mt-3`}>
            <div><a href="/">Home</a></div>
          </nav>
        </header>
        <main class={tw`ml-5 mr-5 p-0`}>
          <Component />
        </main>
        <footer class={tw`m-3 p-2 border bg-green-50`}>
          <div class={tw`text-center`}>Copyright &copy; {new Date().getFullYear()} Craig Doremus</div>
          <div class={tw`flex flex-row justify-between`}>
            <div class={tw`text-sm text-left`}><a href="https://github.com/cdoremus/fresh-blog">Source</a></div>
            <div>
              <a href="https://twitter.com/cdoremus">
                <img class={tw`w-8 h8`} src="/twitter_logo.svg"/>
              </a>
            </div>
            <div class={tw`flex flex-row text-sm text-right`}>Coded in <a class={tw`ml-1`}href="https://fresh.deno.dev"> FRESH</a><img class={tw`w-6 h-6`} src="/fresh_logo.svg"/></div>
          </div>
        </footer>
      </body>
    </html>
  );
}
