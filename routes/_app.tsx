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
        <title>Craig's Deno Diary</title>
        <link rel="stylesheet" href={asset("style.css")} />
        <link rel="icon" href="/favicon.ico" sizes="32x32" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        {/* <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#5bbad5" /> */}
        <meta name="msapplication-TileColor" content="#da532c" />
        <meta name="theme-color" content="#ffffff" />
      </Head>
      <body class={tw`m-x-50 m-y-0 pt-4 mx-auto max-w-screen-lg bg-blue-100`}>
        <header
          class={tw`flex flex-row border border-black pt-2 pr-2 ml-2 justify-between bg-green-100`}
        >
          <div class={tw`h-21 flex flex-row justify-center content-center ml-10 pb-2`}>
            <div>
              <img id="logo" src="/img/deno-diary-logo_smallcircle.png" />
            </div>
            <h1 class={tw`text-4xl font-bold ml-3 pt-4`}>
              Craig's Deno Diary
            </h1>
          </div>
          <nav class={tw`mt-3 pt-4`}>
            <div>
              <a href="/">Home</a>
            </div>
          </nav>
        </header>
        <main class={tw`ml-5 mr-5 mt-2`}>
          <Component />
        </main>
        <footer class={tw`m-3 p-2 border bg-green-100`}>
          <div class={tw`text-center`}>
            Copyright &copy; {new Date().getFullYear()} Craig Doremus
          </div>
          <div class={tw`flex flex-row justify-between`}>
            <div class={tw`text-sm text-left`}>
              <a href="https://github.com/cdoremus/deno-blog">Source</a>
            </div>
            <div>
              <a href="https://twitter.com/deno_diary">
                <img class={tw`w-7 h7`} src="/img/twitter_logo.svg" />
              </a>
            </div>
            <div class={tw`flex flex-row text-sm text-right`}>
              Coded in{" "}
              <a class={tw`ml-1`} href="https://fresh.deno.dev">FRESH</a>
              <img class={tw`w-6 h-6`} src="/img/fresh_logo.svg" />
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
