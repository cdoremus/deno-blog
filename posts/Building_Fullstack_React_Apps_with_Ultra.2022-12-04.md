#### 2020-12-04

# Building Fullstack React Apps with Ultra

[**Ultra**](https://ultrajs.dev) is a full stack framework for building Deno webapps
using [React](https://reactjs.org). **Ultra** recently released version 2.0 that is more customizable than v1.

Ultra works by streaming React-generated HTML markup from the server. Version 2 of the app is designed to run under React 18+ which supports React Suspense. Suspense allows asynchronous loading of components that need to do some time-intensive work on the server such as data fetching before they are rendered. The `React.Suspense` component provides a `fallback` prop to render a loading indicator component before the suspended child component is rendered.

This article will demonstrate how to use Ultra to create and deploy a React app. Source code can be found [in this Github repo](https://github.com/cdoremus/main/ultra2-demo) and the application is [deployed on Deno Deploy here](https://ultra2-demo.deno.dev).

## Creating an Ultra App

The best way to create a Ultra project is to use the create CLI script
(`create.ts`). You run it by invoking:

```ts
deno run -A -r https://deno.land/x/ultra/create.ts
```

The script will then ask for the project name and whether you want to use TypeScript or JavaScript. The project name will become the folder name where the project exists under the folder where you ran the script, so it's best not to have any spaces in the project name.

The script will then request what libraries you would like to use with your Ultra app. They are:

- Styling: Tailwind (twind), Stitches or no CSS library. Static CSS is still an option as the script will create a `style.css` file.
- Routing: React Router, Wouter or no routing are the options.
- HTML head management: To use React Helmet or nothing. Using static wrapper HTML including a Head element is an alternative. The app will wrap the JSX returned by the `app.tsx` component with HTML including a Head element.
- Data access: React Query or no data access library.

Other React libraries still can be used in a an Ultra app, These libraries and other options are demonstrated in the [`examples` folder of the Ultra repo](https://github.com/exhibitionist-digital/ultra/tree/main/examples).

### Key app files

The key files in an Ultra app are found in the root app folder (except `src/app.tsx`). They include code to compile and run the app, and setup code for many libraries so it is important to know what is going on in these files.

They include:
- `importMap.json`: The HTML-standard [import map](https://html.spec.whatwg.org/multipage/webappapis.html#import-maps) that allows an alias to be used in place of a JavaScript/TypeScript url in an ECMAScript import statement.

- `deno.json`: The [Deno config file](https://deno.land/manual@v1.28.3/getting_started/configuration_file) used for command line scripts (like the scripts section of `package.json`) under the `"tasks"` property. Invoke a task using the ```deno task <task name>``` command-line. Make sure you reference the path to the app's import map as the value of the `"importMap"` property. In the `"lint"` and `"fmt"` properties you'll want to exclude the `.ultra` folder.

- `server.ts`: This is the app's entry point as it is invoked on the Deno command line. It works with the [`Hono`](https://honojs.dev) server library. Twind (tailwind) and other libraries need to have setup code put in this file. This can be tricky which is why I suggest using the `create.ts` app to add libraries.

- `client.ts`: This is the client's entry point that hydrates the app when it is rendered in the browser. The `ClientApp` function returns the home page with components and should be wrapped in context providers that are needed for the app to function.

- `build.ts`: Used to build the app. Add any files you do not want to be deployed to the `builder.ignore` call in that file. Also put additional code into this file that needs to be compiled or transformed before deployment. For instance, an MDX compilation step is done in the `with-mdx` example.

- `src/app.tsx`: The app's entry point. The `create.ts` script will generate an `App` component in this file that returns example content wrapped in an HTML tag that includes HEAD and BODY elements.

## Demo app

I created an app that used Tailwind, React Router and React Query. I used the create script to scaffold out the app which adds context providers for the three libraries to `server.ts` and/or `client.ts`.

My app uses the [jsonplaceholder API](https://jsonplaceholder.typicode.com/) to display fake users and blog posts. You can see it in action [here](https://ultra2-demo.deno.dev).

### React Router

The [`React Router`](https://reactrouter.com/en/main) (v6) provider was setup in both `server.ts` and `client.ts`. Note that the `StaticRouter` is used for server-side rendering while the client file uses `BrowserRouter`.

The routes for both server and client are configured in `app.tsx`. Here's what that looks like:
```ts
  <Routes>
    <Route path="/" element={<Layout />}>
      <Route index element={<HomePage />} />
      <Route path="about" element={<AboutPage />} />
      <Route path="user_details/:userId" element={<UserDetailsPage />} />
      <Route path="*" element={<RouteNotFound />} />
    </Route>
  </Routes>
```
Each of the routes point to a page component that wraps the page's content. The `Layout` component defines a Layout Route which forms a shell around other components containing the app's header and footer. Routes defined inside the Layout Route hold the content (`HomePage`, `AboutPage`, `UserDetailsPage` and `RouteNotFound` page in this case).

The `Layout` component uses an `Outlet` component to defined where the child components go as the `children` prop did previously. This is what that component would return (styling removed):
```ts
  <>
    <header>
      <nav>
        <NavLink to="/">Home</NavLink>
        <NavLink to="/about">About</NavLink>
      </nav>
      <div>
        <h1>Ultra Demo App</h1>
      </div>
    </header>
    <main>
      <Outlet/> {/* Child components here */}
    </main>
    <footer>
      <div>
        <a href="https://ultrajs.dev">
          Built with Ultra
        </a>💎
      </div>
    </footer>
  </>
```
See the [React Router docs](https://reactrouter.com/en/main) for more details on version 6 of the library.


### React Query

[`ReactQuery`](https://tanstack.com/query/v4/docs/adapters/react-query) is a data management API that is used in the app to make API calls for user data. It provides intelligent caching, prefetching, pagination features among others. Version 4 also supports React suspense for asynchronous data fetching.

React Query setup in **Ultra** is somewhat complicated, so it is advised that you bring it in when running the `create.ts` project-creation script. You'll noticed that a `src/react-query` folder has been created. The `query-client.ts` file initializes a `QueryClient` class containing a `suspense: true` option for React suspense support.

The `useDehydrateReactQuery.tsx` file in the `react-query` folder uses the helper hook `useServerInsertedHTML` included in the **Ultra** distribution. The `useDehydrateReactQuery` function serializes the query client's fetched data on the server side. The data is stored in a `window` property called `__REACT_QUERY_DEHYDRATED_STATE` that can be retrieved on the client. This is all done when `server.tsx` is invoked at app startup.

Query data rehydration is done in `client.tsx` using the `Hydrate` component from react-query.

```ts
import { Hydrate } from "@tanstack/react-query";
```
This component is added to the JSX returned from the `ClientApp()` function:

```ts
  // Other code is missing
  <Hydrate state={__REACT_QUERY_DEHYDRATED_STATE}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </Hydrate>
```
Recall that `__REACT_QUERY_DEHYDRATED_STATE` was populated in `server.tsx`.

The `QueryClientProvider` react query's context provider, is added to both the client (`client.ts`) and server (`server.ts`) file. It is imported from `@tanstack/react-query`.


### Tailwind
The popular [`Tailwind`](https://tailwindcss.com/) CSS class collection are supported by the [twind](https://twind.dev) library which compiles Tailwind CSS classes into generic CSS on the fly so it is ideal for Ultra's streaming server.

Configuration of Tailwind involves adding the context provider `TwindProvider` to the app's entry point `App` component in `app.tsx`.

Tailwind classes are expressed using the `tw` function which works as a function or a [tagged template literal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#tagged_templates). Here is an example how it is used:
```ts
  <h2 className={tw`text-3xl font-bold`}>
    About this Site
  </h2>
```
The `tw` tagged template is imported from the `twind` alias defined in the import map.

Check the [Tailwind docs](https://v2.tailwindcss.com/docs) for details on the `Tailwind` helper classes. Note that **Ultra** currently supports `Twind` version 0.16.17 which is compatible with `Tailwind` version 2. `Twind` 1.0 support which is compatible with `Tailwind` 3 is in the process of being upgraded in the **Ultra** repo (see issues [211](https://github.com/exhibitionist-digital/ultra/issues/211) and [216](https://github.com/exhibitionist-digital/ultra/issues/216)).

### Using Suspense
Ultra version 2 works with React v18. A big feature of this new React version is the suspense feature. React suspense allows a component to be asynchronously rendered. This means that part of the UI can be displayed while suspended components are still being rendered.

Setting up suspense involves wrapping a component with the `Suspense` component. This is what that looks like:
```ts
// Home.tsx
import { Suspense } from "react";
// other code here...
  <Suspense fallback=
    {<div>Page is Loading...</div>}
  >
    <UserList />
  </Suspense>
```
In this case the `UserList` component is being suspended. Note the `fallback` prop that is used to define a component that will be displayed while the suspended component is being rendered. Once that is done, the suspended component will replace the fallback component.

A suspense component is used in an application page. When that is done, the page needs to be lazy loaded with a dynamic import:
```ts
// app.tsx
const HomePage = lazy(() => import("./pages/Home.tsx"));
```
### Hono
As noted above **Ultra** uses the [Hono](https://honojs.dev) Deno server under the covers. Hono's Deno server is based on the http server in the Deno standard library. But Hono adds value that can be used in an **Ultra app**. A big one is middleware.

The `createServer` call in `server.tsx` returns a Hono server object in a variable called `server`. Middleware is added with a call to `server.get`. The first argument is a string representing an http path. The second argument is a handler function with a [`Context`](https://honojs.dev/docs/api/context/) first argument and `next` function as the second argument.

The handler function can either return a `Response` object or invoke the `next` function using an `await` since `next` returns a `Promise`. The `next` function passes the request flow onto the next `server.get` located in `server.tsx`.

Hono provides a bunch of [built-in middleware functions](https://honojs.dev/docs/builtin-middleware/) including ones for authentication, CORS support and serving static files.

Hono can also be used for server-side routing. If authentication middleware is used, then server-side routing is required.

You can create an API route using Hono too. See the [with-api-routes Ultra example](https://github.com/exhibitionist-digital/ultra/tree/main/examples/with-api-routes) to learn how this is done in addition to the [Hono routing docs](https://honojs.dev/docs/api/routing/).

Note that the Hono API supports Node and Cloudfare Workers in addition to Deno. See the [Hono Deno docs](https://honojs.dev/docs/getting-started/deno/) for more details on the Hono Deno server.

### Other Libraries

There are 20+ examples in the Ultra repo in the [examples folder](https://github.com/exhibitionist-digital/ultra/tree/main/examples). Most of them show how to use React libraries with Ultra. They include (besides libs detailed above):
- [Material UI](https://mui.com/): A collection of React components.
- [tRCP](https://trpc.io/): a library for creating type-safe APIs.
- [mdx](https://mdxjs.com): a markdown flavor.
- [emotion](https://emotion.sh/): A CSS-in-JS library.
- [react-helmet](https://github.com/nfl/react-helmet#readme): a component to add an HTML Head element to a JSX page.
- [with-preact](https://preactjs.com/): Preact is a lightweight React port. Note that not all React libraries work with Preact.
- [static HTML creation](https://github.com/exhibitionist-digital/ultra/tree/main/examples/bogus-marketing-or-blog): Found in the `examples/bogus-marketing-or-blog folder`. Note the `generateStaticHTML` and `disableHydration` properties added to the `server.render` function call in `server.tsx`
- [island architecture](https://www.patterns.dev/posts/islands-architecture/) - this structures the app where islands of JavaScript-related reactivity are surrounded by static content (as HTML). It is how Deno Fresh works.

When adapting one of these examples to your application, pay particular attention to the changes in `server.tsx`, `client.tsx` and sometimes `build.ts` that allows the example to work with **Ultra**.

## Deployment

There are two main options for deployment an **Ultra** app, using Docker to deploy to cloud hosts that support it like [fly.io](https://fly.io) and [Deno Deploy](https://deno.dev). Instructions are found in the [Ultra deployment docs](https://ultrajs.dev/docs#deploying).

When using Deno Deploy, you need to set `inlineServerDynamicImports: true` as a `createBuilder` option in `build.ts` since Deploy does not support dynamic imports.

To build and dry-run the app before production deployment, invoke the `build` task locally and then run the `start` task inside the `.ultra` folder.

## Conclusion
**Ultra** is the third most popular web framework Next to Fresh and Aleph which are both supported by the Deno team. It is the only one of the three that focusses on React.

**Ultra** evolved dramatically between version 1 and 2 and its development continues to accelerate. When this post was published **Ultra's** current version was v2.1.3, so be aware that there might be some changes if you look at this code at a future date.

---

# Outline

## Demo App

- create script
- Using
  - React Router
  - React Query
  - Tailwind (Twind)



## ReactQuery use on server & client

## React Helmet

# Other Capabilities

- middleware from Hono

- examples
  - Note changes to basic server.ts, client.ts and build.ts in each
- api routes
- island architecture
- static rendering
  - flag Omar added (see discord)

## Build and Deployment

- build options (lib/build/types.ts)
- deployment
  - Deno Deploy
    - inlineServerDynamicImports build option
  - fly.io
