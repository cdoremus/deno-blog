# My Deno Blog

This is my attempt at creating a blog using the [FRESH](https://fresh.deno.dev)
framework. The subject of this blog is the [Deno](https://deno.land) JavaScript
runtime which Fresh runs on. This code now runs on Deno 2.0.

### Usage

Use this command to run the project on a local server:

```
deno task start
```

The project directory and the server restarted when files are saved.

### Deployment

Deployment of the app is done to [Deno Deploy](https://deno.dev). This repo is
linked to my account on Deno Deploy, so when new or updated code is pushed the
the `main` branch here, the app is automatically deployed.

### Blog Posts

Blog posts written in Markdown are stored in the `posts` folder. In order for
the app to pick up a new post, the post file name must follow a strict naming
convention. Here is an example:

`My_post.2022-05-04.md`

There are three sections to the name separated by a period:

- Post title, using underscores (_) to separate words of the title.
- The date posted in yyyy-MM-dd format.
- The `md` Markdown file extension.

The post title is used in the display of a post in a list of posts while the
date is used to sort the post list in chronological order.

Any post file whose name is prefixed with 'DRAFT' is ignored in production (Deno
Deploy), but will be visible when the app is run on a local server.

This app is deployed to the url [https://deno-blog.com](https://deno-blog.com)

---

[![Made with Fresh](https://fresh.deno.dev/fresh-badge.svg)](https://fresh.deno.dev)
