#### 2020-08-01
# How I made this blog

Welcome to my blog! I'll be blogging about the JavaScript runtime [Deno](https://deno.land). I have been closely following Deno since it's 1.0 release, but I got really excited when the framework [Fresh](https://fresh.deno.dev) was recently released to enable full-stack Deno supported by the Deno core team.

This blog is built using Fresh. Fresh uses Preact under the covers and follows routing conventions popularized by NextJS. Fresh does not deploy JavaScript by default but allows for JS interactivity if needed (it was not needed at this time). [Twind](https://twind.dev/), a runtime compiler for [Tailwind](https://tailwindcss.com/),  was used to style the site with help from a utility provided by the Fresh devs (`util/twind.ts`). I'm sure you'll see a lot more about Fresh in future blog posts.

At this point the blog is a simple app that just iterates though files written in Markdown stored in a `posts` folder. I'm using the [gfm](https://deno.land/x/gfm) library to render the Markdown posts. I intend to go into more details on how this is done in a future article.

[Deno Deploy](https://deno.com/deploy) is used to deploy this blog. Deno Deploy's [github integration](https://deno.com/deploy/docs/deployments#git-integration) makes easy work of deploying a github repo to Deploy's edge platform.

I'm hoping to evolve the blog with new features and improved code quality as time goes on. Source code can be found in this repo: [https://github.com/cdoremus/fresh-blog](https://github.com/cdoremus/fresh-blog).

Please reach out to me on Twitter at [@cdoremus](https://twitter.com/cdoremus) to offer suggestions and ideas for this blog.
