import { Feed } from "feed";
import { HandlerContext, Handlers } from "$fresh/server.ts";
import { postDateSorter } from "../utils/utils.ts";
import { CSS, render } from "gfm";

export const handler: Handlers = {
  async GET(req: Request, _ctx: HandlerContext) {
    const currentYear = (new Date()).getFullYear();
    const feed = new Feed({
      title: "Craig's Deno Diary",
      description:
        "Craig's Deno Diary is a blog that covers the JavaScript and TypeScript runtime Deno and focuses on how to write Deno programs and use Deno libraries.",
      id: "https://deno-blog.com/",
      link: "https://deno-blog.com/",
      language: "en",
      image: "https://deno-blog.com/img/deno-diary-logo_smallcircle.png",
      favicon: "https://deno-blog.com/favicon.ico",
      feedLinks: {
        json: "https://deno-blog.com/feed?format=json",
        atom: "https://deno-blog.com/feed?format=atom",
        rss: "https://deno-blog.com/feed",
      },
      copyright: currentYear.toString(),
    });

    const files = (await Array.fromAsync(Deno.readDir("./posts")))
      .filter((entry) => entry.isFile)
      .map((entry) => entry.name)
      .filter((file) =>
        Deno.env.get("IS_PROD") ? !file.startsWith("DRAFT") : true
      )
      .sort(postDateSorter)
      .reverse()
      .slice(0, 10);
    for (const file of files) {
      const [slug, date] = file.split(".");
      const title = slug.replaceAll("_", " ");
      const url = `https://deno-blog.com/${slug}.${date}`;
      const rawContent = await Deno.readTextFile(`./posts/${file}`);
      const content = `<style>${CSS}</style>${
        render(rawContent, { baseUrl: url })
      }`;
      feed.addItem({
        title,
        id: url,
        link: url,
        description: title,
        content,
        author: [{
          name: "Craig Doremus",
          // A valid but not necessarily real email is needed for RSS
          email: "cdoremus@example.com",
        }],
        date: new Date(date),
      });
    }

    const format = new URL(req.url).searchParams.get("format");
    if (format === "json") {
      return new Response(feed.json1(), {
        headers: {
          "content-type": "application/json; charset=UTF-8",
        },
      });
    } else if (format === "atom") {
      return new Response(feed.atom1(), {
        headers: {
          "content-type": "application/atom+xml; charset=UTF-8",
        },
      });
    } else {
      return new Response(feed.rss2(), {
        headers: {
          "content-type": "application/rss+xml; charset=UTF-8",
        },
      });
    }
  },
};
