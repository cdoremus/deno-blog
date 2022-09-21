import { asset, Head } from "$fresh/runtime.ts";
import { AppProps } from "$fresh/src/server/types.ts";
import MenuLink from "../islands/MenuLink.tsx";

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
        <meta name="msapplication-TileColor" content="#da532c" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="twitter:site" content="@deno_diary" />
        <meta name="twitter:creator" content="@deno_diary" />
        <meta name="description" content="Craig's Deno Diary is a blog that covers the JavaScript and TypeScript runtime Deno and focuses on how to write Deno programs and use Deno libraries." />
        <meta
          name="keywords"
          content="Deno, blog, JavaScript, TypeScript"
        />
      </Head>
      <body class="m-x-50 m-y-0 pt-4 mx-auto max-w-screen-lg bg-blue-100">
        <header
          class="flex flex-row border border-black pt-2 pr-2 ml-2 justify-between"
          style="background-image:url('/img/DenoBannerWater.webp');background-repeat:no-repeat"
        >
          <div
            class="h-21 flex flex-row justify-center content-center md:ml-10 sm:ml-1 pb-2">
            <div>
              <img
                style="width:100px;height:100px;" alt="Deno Diary logo"
                src="/img/deno-diary-logo_smallcircle.webp" />
            </div>
            <h1
              class="md:text-5xl sm:text-3xl font-bold md:ml-3 sm:ml-1 pt-4"
              style="color:beige;text-shadow:4px 4px darkcyan;"
              >
              Craig's Deno Diary
            </h1>
          </div>
          <div
            class="flex flex-col justify-left mt-4 pt-4 md:text-xl sm:text-med text-white font-bold border-0"
            style="color:beige;text-shadow:2px 2px darkcyan;"
          >
            <MenuLink />
          </div>
        </header>
        <main class="ml-5 mr-5 mt-2">
          <Component />
        </main>
        <footer
          class="m-3 p-2 border bg-green-100 text-white"
          style="background-color:#006666;"
        >
          <div class="text-center sm:text-sm md:text-xl">
            Copyright &copy; {new Date().getFullYear()} Craig Doremus
          </div>
          <div class="flex flex-row justify-between">
            <div class="text-sm text-left">
              <a href="https://github.com/cdoremus/deno-blog">Source</a>
              {' '}|{' '}<a href="/credits">Credits</a>
            </div>
            <div>
              <a href="https://twitter.com/deno_diary">
                <img class="w-7 h-7" alt="Twitter logo" src="/img/twitter_logo.svg" />
              </a>
            </div>
            <div class="flex flex-row text-sm text-right">
              Built with{" "}
              <a class="ml-1" href="https://fresh.deno.dev">FRESH</a>
              <img class="w-6 h-6" alt="Deno Fresh logo" src="/img/fresh_logo.svg" />
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
