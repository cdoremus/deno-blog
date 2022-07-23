/** @jsx h */
import { h } from "preact";
import { asset, Head } from "$fresh/runtime.ts";
import { AppProps } from "$fresh/src/server/types.ts";
import { tw } from "twind";

export default function App({ Component }: AppProps) {
  return (
    <html data-custom="data">
      <Head>
        <link rel="stylesheet" href={asset("style.css")} />
      </Head>
      <body class={tw`m-x-50 m-y-0 p-4 mx-auto max-w-screen-md`}>
        <header class={tw`flex flex-row justify-between border border-black p-2 pb-5`}>
          <h1 class={tw`grow-1 text-center text-xl font-bold ml-20`}>Blog of Craig Doremus</h1>
          <div><a href="/">Home</a></div>
        </header>
        <Component />
        <footer class={tw`border`}>
          <div class={tw`text-center`}>Created with the <a href="https://fresh.deno.dev" target="_blank">FRESH<img class={tw`inline underline`} src="logo.svg"/></a> framework</div>
          {/* <div class={tw`mt-1.5 mr-2 text-right`}><a href="https://apiland.deno.dev" target="_blank"><span class={tw`underline`}>API Docs</span></a></div> */}
        </footer>
      </body>
    </html>
  );
}
