#### 2022-10-23

# Using the Ultra full-stack framework

**Ultra** is a full-stack framework that allows React webapps to run on Deno
without the need for a manual build or bundling step. Ultra ??just released??
version 2.0 which is a lot more full-featured and flexible than v1. It is the
brainchild of dev Omar Maashal and James Edmonds from Melbourne Australia. With
2,600 Github stars, it ranks third next to Fresh and Aleph from Deno core-team
members.

While Fresh uses Preact and Aleph focusses on supporting multiple frameworks,
Ultra has honed its React compatibility where it runs oft-used React libraries
such as React Router, React-Query and Material UI.

The Ultra server is built upon [Hono](https://honojs.dev/) and, in doing so,
gets middleware support and a variety of
[middleware plugins](https://honojs.dev/docs/builtin-middleware/) for things
like authentication, cors and request validation.

In this post, I will lead you through creating a **Ultra** app with various
features. Source code can be found at
[https://github.com/cdoremus/deno-blog-code/tree/main/using_ultra](https://github.com/cdoremus/deno-blog-code/tree/main/using_ultra).
Each step of the app creation will be put in a separate git branch.

## Creating the app

**Ultra** has a command-line utility to create a new app. Use it with this
command:

```
deno run -A -r https://deno.land/x/ultra/create.ts
```

The utility asks a couple of questions, the first one being "Where do you want
to initialise your new project?" which refers to the folder you want to create
the new project. The resulting page that is created when you move into the
project directory and run `deno task dev` looks like this:

![Create script resulting page](/img/blog/using_ultra/CreateScript-BareBonesPage.png)

The starter app created using the `create.ts` script is found in the
[ultra-starter branch](???????)

## Layout with Material UI

A common way create page layout in React is with a parent Layout components that
encapsulate the layout. We're going to do that in one file in this case. One of
the features of Ultra is that it supports the Material UI (MUI) react component
library. MUI allows

## CSS options

There are four options when it comes to using CSS with Ultra

1. Old-fashioned CSS file You can always put CSS in a file and reference it from
   a link tag like you did in the Web 1.0 days.
2. Tailwind
3. Stitches
4. Emotion

## Using Markdown

## Data fetching

- fetch function
- react-query

## Ultra as an API server

## Router options

- react-router
- wouter

## Added markup to head tag

One of the first things you want to do with the app is to add markup to the head
tag like a title element, and link element containing metadate and pointing to
CSS files. You do that using the React-Helmet-Async library,

## Gesture support

- useGesture example

## Islands architecture

- ultra islands example
- ultra marketing/blog example

## Build

- mesozoic: https://github.com/deckchairlabs/mesozoic

## Ultra deployment

- fly.io
- Deno Deploy
- Netlify

## Ultra References

- Website: https://ultrajs.dev/
- Source:https://github.com/exhibitionist-digital/ultra
