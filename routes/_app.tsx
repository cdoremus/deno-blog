/** @jsx h */
import { h } from "preact";
import { asset, Head } from "$fresh/runtime.ts";
import { AppProps } from "$fresh/src/server/types.ts";
import { tw } from "twind";

export default function App({ Component }: AppProps) {
  const urlPath = import.meta.url?.split(".")[0]?.split("/").pop();
  const urlPathText = `${urlPath?.charAt(0).toLocaleUpperCase()} ${urlPath?.slice(1)}`;
  return (
    <html data-custom="data">
      <Head>
        <link rel="stylesheet" href={asset("style.css")} />
      </Head>
      <body class={tw`m-x-50 m-y-0 p-4 mx-auto max-w-screen-md`}>
        <header class={tw`flex flex-row justify-between border border-black p-2 pb-5`}>
          <h1 class={tw`grow-1 text-center text-xl font-bold ml-20`}>Craig's Deno Blog</h1>
          <nav class={tw`mt-3`}><div><a href="/">Home</a></div></nav>
        </header>
        <Component />
        <footer class={tw`mt-5 border`}>
          <div class={tw`m-5 text-center`}>Copyright &copy; {new Date().getFullYear()} Craig Doremus</div>
        </footer>
      </body>
    </html>
  );
}
