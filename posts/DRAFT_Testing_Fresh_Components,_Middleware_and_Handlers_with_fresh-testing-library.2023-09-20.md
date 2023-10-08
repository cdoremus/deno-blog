#### 2023-09-20

# Testing Fresh Components, Middleware and Handlers with fresh-testing-library

The [`fresh-testing-library`](https://deno.land/x/fresh_testing_library) is a new unit testing utility for Deno Fresh. Until now testing a Fresh application used the built-in Deno test runner with `Deno.test` and `std/testing` utilities for verifying low-level logic and the [Deno-Puppeteer](https://deno.land/x/puppeteer) or [Astral](https://astral.deno.dev/) libs for end-to-end testing. The `fresh-testing-library` fills the niche between the other options to allow isolated testing of fresh components, middleware and route handlers.

`fresh-testing-library` creates a thin wrapper around the [Preact Testing Library](https://preactjs.com/guide/v10/preact-testing-library/) which is built upon the [DOM Testing Library](https://testing-library.com/docs/dom-testing-library/intro). All of them including `fresh-testing-library` share an API under the [Testing Library](https://testing-library.com/) moniker.

The `fresh-testing-library` also adds utilities for testing Fresh route handler's, route components and middleware. Those are under the `server.ts` module while the component testing library is under the `component.ts` module. Both can also be accessed via the library's `mod.ts` module.

The Testing Library philosophy is to create tests that interact with the application the same way an app user would do. To do so, Testing Library tests hone in on verifying DOM elements.

Testing library also focusses on accessibility, offering a number of functions to find elements by accessible attributes.

The `fresh-testing-library` is registered as a Deno third party library under the URL "https://deno.land/x/fresh_testing_library". It's component testing feature is a thin wrapper around the Preact Testing Library.

#### Example Code

This blog post will focus on how to use the `fresh-testing-library`. With that in mind, I have created example code in several places in addition to the code snippets shown below:
- THe repo for this blog: https://github.com/cdoremus/deno-blog/tree/fresh-testing-lib/tests
- The repo for the blog post I did on using signals with Fresh: https://github.com/cdoremus/fresh-todo-signals/tree/main/tests
- The component gallery in the Fresh repo: https://github.com/cdoremus/fresh/tree/fresh-testing-lib/tests/www/components/gallery

# Component testing
## Setting up a fresh-testing-library component test

Using `fresh-testing-library` for a component test requires the Deno test runner and the `testing/bdd.ts` module of the Deno standard library. The `bdd` module adds functions that are familiar to testing in Node.js using libraries like [Jest](https://jestjs.io/) or [Mocha](https://mochajs.org/). They include `describe`, `it`, `beforeAll`, `afterAll`, `beforeEach` and `afterEach`.

Here is a simple annotated example of a `fresh-testing-library` component test that illustrates test setup and code:
```ts
import { cleanup, fireEvent, render, setup } from "https://deno.land/x/fresh_testing_library";
import { afterEach, beforeAll, describe, it } from "https://deno.land/std/testing/bdd.ts";
import { assertEquals, assertExists } from "https://deno.land/std/assert/mod.ts";
import Todo from "../islands/Todo.tsx";

describe("Todo.tsx test", () => {
  // setup the jsdom environment
  beforeAll(setup);
  // unmount rendered component after each test
  afterEach(cleanup);

  it("should display todo...", () => {
    // assign the component's text content via a prop
    const text = "Foo";
    // render a component's DOM markup
    const { getByText } = render(<Todo text={text} index={1}/>);
    // find an HTML element using the rendered component's text content
    const textElement = getByText(text);
    // verify element is found
    assertExists(textElement);
    // verify element's text content
    assertEquals(textElement.textContent, text);
  });
});
```
Run `fresh-testing-library` tests with this command line:
```bash
deno test --allow-env
```
You might need to add other permission flags depending on the code you are testing.
## Rendering components

The first thing you need in a `fresh-testing-library` test is a call to the `render` function. It is used to instantiate the component-under-test. Its first argument is required and is the JSX representation of a component including its props.

```ts
import { render } from "https:/deno.land/x/fresh_testing_library";
// renders component DOM wrapped inside a document.body
const screen = render(<Counter />);
```

The `render` function return returns an object that contains functions for verifying a component's content. Instead of returning that object ( `screen` in this case), you can destructure the functions required to find the content. Here's an example of a text search with `getByText` destructured from `render`:

```ts
import { render } from "https:/deno.land/x/fresh_testing_library";
// renders component DOM wrapped inside a document.body
const { getByText } = render(<Counter />);
const text = getByText("Hello World!");
```

The `render` function has an optional second argument that is rarely used. For more information, see the [`RenderOptions` interface in the `preact-testing-library` type documentation](https://github.com/testing-library/preact-testing-library/blob/main/types/index.d.ts).

## Finding DOM Elements

As stated previously, Testing Library libs including `fresh-testing-library` focusses on verifying DOM elements generated by the component-under-test. These element are ones a user sees or interacts with.

Finder functions are found on the `RenderResult` object that is returned from a call to `render`.
```ts
    const screen: RenderResult = render(<Features />);
    const text = screen.getByText("Hello World!");
```

Discovering DOM elements in a `fresh-testing-library` test requires use of a finder. Finder function names have three parts:
1. The finder mechanism: 'get', 'query' or 'find'
2. Is the search for single or multiple nodes: 'By' or 'AllBy'
3. How to find an element: 'AltText', 'DisplayValue', 'LabelText', 'PlaceholderText', 'Role', 'TestId' or 'Title'

Combined, the first two parts of a finder function name indicates what the function returns. Here's how that works:

| Finder function | Match Found returns    | Match Not Found returns |
| :-------------: | :--------------------: | :--------------------:  |
| getBy*          | matching node          | throws an error         |
| getAllBy*       | matching node          | throws an error         |
| queryBy*        | matching node          | null                    |
| queryAllBy*     | matching node          | empty array             |
| findBy*         | resolved Promise       | rejected Promise        |
| findAllBy*      | resolved Promise       | rejected Promise        |

Also note that if you are using the singular 'getBy', 'queryBy' or 'findBy' functions and more than one element is returned, then an error is thrown. Conversely, a getAllBy, queryAllBy and findAllBy function returns an array with a single element if only one matching element exists.

The full name of a finder function specifies how an element is located. Here's what they are with a 'getBy' prefix (the same functions exist using 'queryBy' or 'findBy'):
- `getByAltText` - finds the element using the `alt` attribute
- `getByDisplayValue` - finds an `input`, `textarea` or `select` element using the `value` attribute.
- `getByLabelText` - finds the element using the `label` attribute. Obviously, this is mostly used to locate form elements
- `getByPlaceholderText` - finds the element using the `placeholder` attribute found in a `text` or `textarea` element.
- `getByRole` - finds the element by it's `role` attribute.
- `getByTestId` - finds an element using the `data-testid` attribute
- `getByTitle` - finds an element using the enclosed `title`element. This is best used with an svg graphic that contains a `title` child element.

All of the finder functions have the same first two arguments. The first one is an HTML element which would be obtained from a previous call to a finder function. Most of the time you will not need this argument.

The second argument is used to match the the HTML element being searched for. It is either a number, string, regular expression or a function ([see next section](#matching-text)). The 'ByRole' method only takes specific string values ([see below](#using-byrole-finder-functions)).

Finder functions have an optional third argument which is an options object. The properties of that argument is specific to the finder.

### Matching text

Most finder functions take a [`TextMatch`](https://testing-library.com/docs/queries/about/#textmatch) which can be:
- a string
- a regex
- a function

The `TextMatch` function has optional string and `HTMLElement` arguments and returns a boolean (`true` for a match; `false` for no match). Here's an example of a test with functional matching:
```ts
  it("should show source code", () => {
    const code = "console.log('Hello World')";
    const { getByRole, getByText } = render(<CodeBox code={code} />);
    // find code
    const codeElement = getByRole("code");
    const content = codeElement.textContent;
    // Prism library breaks up code for styling purposes
    assert(
      getByText((content) => content.includes("console")),
    );
    assert(
      getByText((content) => content.includes("log")),
    );
    assert(
      getByText((content) => content.includes("Hello World")),
    );
  });
```
A finder function that takes a `TextMatch` can contain an options object with an `exact` or `normalization` property that affects the precision of the match. There is a [section in the Testing Library docs that explores these options in detail](https://testing-library.com/docs/queries/about/#precision), but here they are in a nutshell:
- `exact` (`true` by default) determines whether the match is case-sensitive or not.
- `normalization` This property can be set to override the behavior of collapsing whitespace using a function.

## Uses of get*, query* and find*

As shown above, the first part of a finder function name indicates what gets returned when you call the function. For that reasons, each one of them has a favored use

- __get*__ - use to find elements to be able to verify their attributes or content or invoke an event. You will probably use this most of the time in a component test.

- __query*__ - should only be used to verify the existence or non-existence of an element. Otherwise, a 'get*' finder should be used.

For example, I want to make sure that no `Todo` components will be shown. Each contains a `button` element. I use `queryAllByRole` to test for an empty array. If I used `getAllByRole`, an error would be thrown if nothing was returned.
```ts
  it("should not display list of todos...",  () => {
    const todos = [] as string[];
    state.todos.value = todos;
    const { queryAllByRole } = render(
      <AppState.Provider value={state}>
        <TodoList/>
      </AppState.Provider>
    );
    // queryAllBy returns an empty array; getAllBy just throws error
    const buttons = queryAllByRole("button");
    assertEquals(buttons.length, 0)
  });

```
- __find*__ - use when an async operation or rendering delay would prevent an element or elements from appearing in the UI. Fetching remote data is an example. Another example is when an action causes a rerender. Here's how `findBy` is used:

```ts
  it("Show About link", async () => {
    globalThis.window.location = {href: "/about"};
    const { findByText } = render(<MenuLink/>);
    const page = await findByText("Home")
    const text = page.textContent;
    assertExists(text);
    assertNotEquals(text, "About");
  });
```

- __waitFor__ While not strictly a finder nethod, `waitFor` is related especially to the __findBy*__ finder that uses `waitFor` under the covers.

The `waitFor` function is used for verifying DOM elements that take a while to render. Therefore, it is an async operation. Here's how `waitFor` is used:
```ts
  await waitFor(() => {
    assertEquals(counter.textContent, count.value.toString());
  });
```

## Using ByRole finder functions

Kent C. Dodds, the creator of Testing Library, recommends that you should [prefer the use of the 'ByRole' finder function to discover DOM nodes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library#not-using-byrole-most-of-the-time).

A role used by Testing Library comes from the WAI ARIA accessibility standard. This is not well-documented in the library and takes a bit of a learning curve to figure out, so I'm going to delve into it for a bit.

The 'ByRole' finder requires a string that is a valid WAI ARIA role name (see this [list of WAI ARIA roles](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles)).

Certain HTML elements have [an implicit role](https://www.w3.org/TR/html-aria/#docconformance). Some of these elements have the same role name as the element name. They include `button`, `article`, `code` and `img`.

Nearly all of the HTML form elements also have implicit roles. This includes `input` elements with `type="text"` (`textbox` role), `type="radio"` (`radio` role), `type="range"` (`slider` role), `type="number"` (`spinbutton` role) and `type="submit"` (`button` role). The `textarea` element's implicit role is `textbox` while the `select` element's implicit role is `listbox` or `combobox`.

Another handy implicit role to use is `link` for an HTML anchor (`a`), but the anchor must have a `href` attribute. Here's an example of a component test to verify 3 links:

```ts
describe("components/gallery/Header.tsx", () => {
  beforeAll(setup);
  afterEach(cleanup);

  it("should show 3 links", () => {
    const { getAllByRole } = render(<Header active="" />);
    const links = getAllByRole("link");
    assertEquals(links.length, 3);
  });
});
```
Do not set an element's `role` attribute when you want to use an implicit role. Sometimes you might have multiple elements with the same role; multiple buttons, for instance. In that case use the options argument.

Each role has a different set of options properties. All of them have a `name` property, but the property's value depends on the role. For the `button` role, the `name` property is the button's value. For the `img` role, the `name` property is the value of the element's `alt` attribute. Roles for HTML elements without an implicit role must be specified using the `role` attribute.

Many IDEs like Visual Studio Code support discovery of valid roles using autocompletion. Just type `getByRole("")` with your cursor within the quotes and a list of valid roles will appear. It will look something like this:

![vscode role autocompletion](/img/blog/fresh-testing-library/getByRole_autocomplete.png)

If you use an argument to a 'ByRole' finder that is illegal, the error message will point out the available implicit roles. Alternately, you can use the `fresh-testing-library` function `logRole` to find the implicit roles within your component-under-test.

## Accessibility testing

Testing Library emphasizes accessibility by having a number of finder functions that use accessibility attributes. The 'ByRole' finder is a big one, but 'ByPlaceholderText', 'ByAltText', 'ByLabel' and 'ByTitle' are others.

Here is an example of using the `title` attribute with the 'ByTitle' finder (REFERENCE????????????):
```ts
  it("should display background image", () => {
    // Background takes any number of native attributes or Preact props
    const { getByTitle } = render(<Background title="background" />);
    const bg = getByTitle("background");
    const style = bg.getAttribute("style");
    assertEquals(style, "background-image: url(/gallery/grid.svg);");
  });

```

## Firing user-generated events

You can simulate user interactions in a Testing Library test using the `fireEvent` function. In the `fresh-testing-library`. `fireEvent` has functional properties for triggering  common events. They include:
- `fireEvent.click` - to invoke an `onClick` handler
- `fireEvent.change` - to invoke an `onChange` handler
- `fireEvent.submit` - to invoke an `onSubmit` handler
- `fireEvent.keyDown` - to invoke an `onKeyDown` handler
There are almost 90 different event types that are available. See the `EventType` TypeScript union type in the TS docs for the details.

Each of the event type function properties takes an argument that is the `HTMLElement` event target.

Here's an example of using a 'click' event to invoke a button click:
```ts
  it("should display count and increment/decrement it correctly", async () => {
    const count = signal<number>(9);
    const { getByRole, queryByText } = render(<Counter count={count} />);
    const plusOne = getByRole("button", { name: "+1" });
    assertExists(plusOne);
    const minusOne = getByRole("button", { name: "-1" });
    assertExists(minusOne);

    await fireEvent.click(plusOne);
    assertFalse(queryByText("9"));
    assertExists(queryByText("10"));

    await fireEvent.click(minusOne);
    assertExists(queryByText("9"));
    assertFalse(queryByText("10"));
  });

```
In this case, the event target is the button element.


# Testing component global state management

Preact signals provide a means to do local and global state management with signals. A previous [Craig's Deno Diary post](https://deno-blog-stage.deno.dev/Using_Preact_Signals_with_Fresh.2022-11-01) demonstrated how to use signals with Fresh.

#### Testing local state management

Compared to `useState`, the `signal` function only returns a single value, the signal. Instead of a setter function, updating the signal involves assigning the value property of the signal a new value.
```ts
  const count = signal<number>(0);
  const newValue = count.value + 1;
  count.value = newValue;
```

??????TODO: REWRITE
The local state often changes when an event gets fired which in turn updates the UI. In a `fresh-testing-library` test, the  `fireEvent` function would be used to trigger his kind of change.
```ts
  const [ getByRole, queryByText ] = render(<Counter/>);
  const button = getByRole("button")
  fireEvent.click(button);
  assertExists(queryByText("Count: 1"));
```

#### Testing component state

Global state management with Preact signals requires a module that holds that state and using the Preact context to pass the state to components. I will not go over how this is coded in detail as you can refer the the [Craig's Deno Diary post](https://deno-blog.com/Using_Preact_Signals_with_Fresh.2022-11-01) on how its done.

Testing a component that uses global state requires that you wrap the component in a Preact context provider that passes the state into the component as a signal. The context is created in the parent component using the `createContext` function:

```ts
export const AppState = createContext<AppStateType>({} as AppStateType);
```
The `AppState` context has a provider field is used to pass the signal-created state to child components.

The child components discover the state using the `useContext` hook. Here's a component that displays a list obtained from the context:
```ts
import { useContext } from "preact/hooks";
import { AppState } from "./App.tsx";
import Todo from "./Todo.tsx"

export default function TodoList() {
  const { todos } = useContext(AppState);
  return (
    <div className="todos">
      {todos.value?.map((item: string, i: number) => {
        return (
          <Todo text={item} index={i}/>
        );
      })}
    </div>
  );
}
```
To test a component in isolation, you need to wrap it in a context provider so that the state can be passed to the child component. Here's what that kind of test looks like:
```ts
  it("should display list of todos...", () => {
    const todos = ["Foo", "Bar", "Baz"];
    state.todos.value = todos;
    const { getAllByRole, queryByText } = render(
      <AppState.Provider value={state}>
        <TodoList/>
      </AppState.Provider>
    );
    // verify that all todos are displayed
    for(let i = 0; i < todos.length; i++) {
      assertExists(queryByText(todos[i]));
    }
    // Each todo has a delete button
    const buttons = getAllByRole("button");
    assertEquals(buttons.length, 3)
  });
```
Notice in the test that we assign the state's `todos` value before we attached it to the `AppState.Provider` context provider.

The [original blog post on Fresh signals](https://deno-blog-stage.deno.dev/Using_Preact_Signals_with_Fresh.2022-11-01) has been updated with `fresh-testing-library` component tests.

## Testing async route components

It's usually best practice to focus component testing on the child or leaf nodes toward the end of the component tree. Otherwise you end up re-testing the child components tht are used by the parent. Route or page components use child components to render page sections .They are best tested using an end-to-end test.

The `fresh-testing-library` does include functionality for testing async route components using the `createRouteContext` function with `render`.

```ts

```

## Component testing troubleshooting tips
- Testing `IS_BROWSER` - This constant is used a lot in Fresh app code, but testing it can be problematic. In order to set `IS_BROWSER` to false, you need to set the `document` object to `undefined`. Doing that will cause a `fresh-testing-library` test to fail because the `jsdom` library cannot function with a valid `document` object. Therefore, testing `IS_BROWSER` cannot be done with `fresh-testing library.`
- There are `debug` functions for printing out the DOM returned from calling `render` or any of the finder functions. The former prints out the DOM that was rendered and the latter prints out the returned DOM from a finder function call. Here's how to use them:
```ts
const {debug, queryByRole} = render(<MyComponent />);
// print out the component's DOM element wrapped in a body element
debug();
const element = queryByRole("button");
// prints out the element's DOM
element.debug();
```
## Fresh Middleware and Route Handler testing with fresh-testing library


### Testing middleware

Testing middleware uses the `createMiddlewareHandlerContext` to mock out the `MiddlewareHandlerContext` used in a middleware handler. Here's what a test would look like for the [middleware in this repo](https://github.com/cdoremus/deno-blog/blob/main/routes/_middleware.ts);
```ts
// _middleware.ts
import { MiddlewareHandlerContext } from "$fresh/server.ts";

export function handler(
  _req: Request,
  _ctx: MiddlewareHandlerContext,
) {
  return setCacheControlHeaders();
}

export function setCacheControlHeaders() {
  return async (_req: Request, ctx: MiddlewareHandlerContext) => {
    const resp = await ctx.next();
    resp.headers.set("Cache-Control", "public, max-age=21600, immutable");
  }
}

// middleware.test.ts
import { assertEquals } from "std/assert/assert_equals.ts";
import { createMiddlewareHandlerContext } from "$fresh-testing-library";
import { setCacheControlHeaders } from "../../routes/_middleware.ts";
import manifest from "../../fresh.gen.ts";

Deno.test("should set Cache-Control header", async () => {
  const middleware = setCacheControlHeaders();
  const req = new Request(`http://localhost:3000/`);
  // Ignore error due to a mis-typed Manifest interface
  // @ts-ignore ignores "type ... is not assignable to type Manifest" error
  const ctx = createMiddlewareHandlerContext(req, { manifest });
  await middleware(req, ctx);
  const resp = await ctx.next();
  assertEquals(resp.headers.get('Cache-control'), "public, max-age=21600, immutable");
});
```
You can use `Deno.test` in this case since a middleware test does not require setup or cleanup.


The `Request` object can be used to find out the current URL or request method (GET, POST, etc) for middleware with logic that is more sophisticated than my simple example.

### Testing route handlers

At this point, route testing using `fresh-testing-library` is confined to testing handler logic and not the handler's `Response` including verifying response markup.

You use the `createHandlerContext` function in `fresh-testing-library` to test the handler function of a route component.

```ts
Deno.test("routes/About.tsx handler tests...", async (t) => {

  await t.step("should respond to GET request in DEV...", async () => {
    assert(handler.GET);
    const req = new Request("http://localhost:8000/about");
    // @ts-ignore manifest typing
    const ctx = createHandlerContext(req, { manifest });

    const res = await handler.GET(req, ctx);
    assertEquals(res.status, 200);
  });
});
```
You do not need `startup` and `cleanup` functions for handler tests, so we use the `Deno.test` runner function here instead of the `bdd` module functions.


Fresh includes the `createHandler` function for testing a route handler. Like that name, the `createHandler` function creates the handler function.


####TODO###

[Grouping routes](https://fresh.deno.dev/docs/concepts/routing#route-groups) was added in Fresh v1.4, Version 0.8.0, of the `fresh-testing-library` added support for testing route groups.

### Testing async routes
Docs: https://fresh.deno.dev/docs/concepts/routes#async-route-components

Test: https://github.com/uki00a/fresh-testing-library/blob/main/async-route-components.test.tsx

####TODO###

### Testing route groups



## Conclusion

Use the [example code given at the beginning of this blog post](#example-code) to guide you through the the core `fresh-testing-library` concepts introduced above.

Also be aware that `fresh-testing-library` has not yet released version 1.0, so it evolving to include more features and bug fixes. In addition, I know by first-hand experience that the `fresh-testing-library` author is very responsive to questions and bug reports.
