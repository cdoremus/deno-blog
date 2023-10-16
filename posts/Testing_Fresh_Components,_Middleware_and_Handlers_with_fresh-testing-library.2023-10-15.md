<!-- deno-fmt-ignore-file -->
#### 2023-10-15

# Testing Fresh Components, Middleware and Handlers with fresh-testing-library

## Table of contents

- [Introduction](#introduction)
- [Example Code](#example-code)
- [Component Testing](#component-testing)
  - [Setting up a fresh-testing-library component test](#setting-up-a-fresh-testing-library-component-test)
    - [Using assertions for test verification](#using-assertions-for-test-verification)
    - [Running tests](#running-tests)
  - [Rendering components under test](#rendering-components-under-test)
  - [Finding DOM Elements](#finding-dom-elements)
    - [Text Argument Options](#text-argument-options)
    - [Uses of get*, query* and find* Functions](#uses-of-get-query-and-find-functions)
    - [Using ByRole finder functions](#using-byrole-finder-functions)
    - [Accessibility testing](#accessibility-testing)
  - [Testing User Interactions](#testing-user-interactions)
    - [Using `fireEvent`](#using-fireevent)
    - [Using `userEvent`](#using-userevent)
  - [Testing component state management](#testing-component-state-management)
  - [Component testing troubleshooting tips](#component-testing-troubleshooting-tips)
- [Middleware and Route Handler testing](#middleware-and-route-handler-testing)
  - [Testing middleware](#testing-middleware)
  - [Testing route handlers](#testing-route-handlers)
  - [Testing async route components](#testing-async-route-components)
- [Conclusion](#conclusion)
- [Acknowledgements](#acknowledgements)

# Introduction

The [`fresh-testing-library`](https://deno.land/x/fresh_testing_library) is a
new unit testing utility for Deno Fresh. Until now testing a Fresh application
used the built-in Deno test runner with `Deno.test` and `std/testing` utilities
for verifying low-level logic and the
[Deno-Puppeteer](https://deno.land/x/puppeteer) or
[Astral](https://astral.deno.dev/) libs for end-to-end testing. The
`fresh-testing-library` fills the niche between the other options to allow
isolated testing of fresh components, middleware and route handlers.

`fresh-testing-library` creates a thin wrapper around the
[Preact Testing Library](https://preactjs.com/guide/v10/preact-testing-library/)
which is built upon the
[DOM Testing Library](https://testing-library.com/docs/dom-testing-library/intro).
All of them including `fresh-testing-library` share an API under the
[Testing Library](https://testing-library.com/) moniker.

The `fresh-testing-library` also adds utilities for testing Fresh route
handler's, route components and middleware. Those are under the `server.ts`
module while the component testing library code is in the `component.ts` module.
Both can also be accessed via the `mod.ts` module.

The Testing Library philosophy is to create tests that interact with the
application the same way an app user would do. To do so, Testing Library tests
hone in on verifying DOM elements.

Testing library also focusses on accessibility, offering a number of functions
to find elements by accessible attributes.

The `fresh-testing-library` is registered as a Deno third-party library under
the "https://deno.land/x/fresh_testing_library" URL.

## Example Code

This blog post will focus on how to use the `fresh-testing-library`. With that
in mind, I have created example code in several repos. They are:

* The repo for this blog: https://github.com/cdoremus/deno-blog/tree/main/tests
  (8 test files)
* The repo for the blog post I did on using signals with Fresh:
  https://github.com/cdoremus/fresh-todo-signals/tree/main/tests (6 test files)
* The component gallery in the Fresh repo:
  https://github.com/cdoremus/fresh/tree/fresh-testing-lib/tests/www/components/gallery
  (12 test files)

# Component testing

## Setting up a fresh-testing-library component test

Using `fresh-testing-library` for a component test requires the Deno test runner
and the `testing/bdd.ts` module of the Deno standard library. The `bdd` module
adds functions that are familiar to testing in Node.js using libraries like
[Jest](https://jestjs.io/) or [Mocha](https://mochajs.org/). They include
`describe`, `it`, `beforeAll`, `afterAll`, `beforeEach` and `afterEach`.

Here is a simple annotated example of a `fresh-testing-library` component test
that illustrates test setup and code:

```ts
// Adapted from Todo.test.tsx in Fresh
//   signals blog post repo
import {
  cleanup,
  fireEvent,
  render,
  setup,
} from "https://deno.land/x/fresh_testing_library/component.ts";
import {
  afterEach,
  beforeAll,
  describe,
  it,
} from "https://deno.land/std/testing/bdd.ts";
import { assertEquals } from "https://deno.land/std/assert/mod.ts";
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
    const { getByText } = render(<Todo text={text} index={1} />);
    // find an HTML element using the rendered component's text content
    const textElement = getByText(text);
    // verify element's text content
    assertEquals(textElement.textContent, text);
  });
});
```
### Using assertions for test verification

Functions in the [`assert`](https://deno.land/std/assert) module of the Deno standard library works for `fresh-testing-library` verifications. Anyone who has done any Deno testing will be familiar with them.  However, in version 0.10.0 of the `fresh-testing-library` the `expect` function was added to `components.ts`. Like others, this function comes from Preact Testing Library.

The `expect` function has a number of matcher functions attached to it that do the verification. They have a [Jasmine-like API](https://jasmine.github.io/api/edge/matchers.html). Some of them behave similarly to the Deno-native assert functions.

Here are some `expect` function matchers and their Deno-native equivalent (if there is one):

| expect function matcher | Deno-native assert |
| :--------: | :-----------: |
| toBeInTheDocument() | assertExists()/assertEquals() |
| toBe() | assertEquals() |
| not.toBe() | assertNotEquals() |
| toBeTruthy() | assert() |
| toBeFalsy() | assertFalse() |
| toBeEmptyDOMNode | [none] |
| toBeRequired | [none] |

Here's a simple example how to use `expect` with `fresh-testing-library`:
```ts
  import { expect } from "https://deno.land/x/fresh_testing_library/expect.ts";
  it("should find 'Hello World' text in document", () => {
    const { queryByText } = render(<div>Hello World</div>);
    expect(queryByText("Hello World")).toBeInTheDocument();
    // using getByText will error out before matchers are called
    expect(queryByText("foobar")).not.toBeInTheDocument();
  });
```
Note that you can use the `not` matcher to negate a matcher that it calls.

The `expect` function contains a number of matcher functions that check on function calls (like `expect(foo).toBeCalled()`). To get them to work, you need to mock the functions. The `jest-mock` library was incorporated into the `fresh-testing-library` `expect.ts` module in v0.11.0 as the `fn` function. You can also use `fn` to mock return values. Here's a simple example how that works:

```ts
  import { expect, fn } from "https://deno.land/x/fresh_testing_library/expect.ts";
  it("should be able to use mock functions", () => {
    const add = (num1: number, num2: number): number => num1 + num2;
    expect(add(2,6)).toBe(8);
    // mock add function and return value
    const mockAdd = fn(add).mockReturnValue(5);
    const sum = mockAdd(2, 2);
    expect(sum).toBe(5);
    expect(mockAdd).toBeCalled();
    expect(mockAdd).not.toBeCalledTimes(2);
    expect(mockAdd(3,5)).toBe(5);
    expect(mockAdd).toBeCalledWith(3,5)
  });
```
There are also other functions from the `jest-mock` library incorporated into the `expect.ts` module. They include `mocked`, `replaceProperty`, and `spyOn`.

### Running tests
Run `fresh-testing-library` tests with this command line:

```bash
deno test --allow-read --allow-env
```

Both permission flags are required because the `jsdom` library is used
internally in component tests. You might also need to add other permission flags
depending on the code you are testing.

## Rendering components under test

The first thing you need in a `fresh-testing-library` test is a call to the
library's `render` function. It is used to instantiate the component-under-test.
Its first argument is required and is the JSX representation of a component
including its props.

```ts
import { render } from "https:/deno.land/x/fresh_testing_library/component.ts";
// renders component DOM wrapped inside a document.body
const screen = render(<Counter count={1} />);
```

The `render` function returns an object that contains functions for verifying a
component's content. Instead of returning that object ( `screen` in this case),
you can destructure the functions required to find the content. Here's an
example of a text search with `getByText` destructured from `render`:

```ts
import { render } from "https:/deno.land/x/fresh_testing_library/component.ts";
// renders component DOM wrapped inside a document.body
const { getByText } = render(<Counter cont={1} />);
const text = getByText("Hello World!");
```

The `render` function has an optional second argument that is rarely used. For
more information, see the
[`RenderOptions` interface in the `preact-testing-library` type documentation](https://github.com/testing-library/preact-testing-library/blob/0e5bf3790d3e7d45bdfbd8a0ccc0a0ab4495798d/types/index.d.ts#L16).

## Finding DOM Elements

As stated previously, Testing Library libs including `fresh-testing-library`
focus on verifying DOM elements generated by the component-under-test. These
elements create the UI including interaction components.

Finder functions are found on the [`RenderResult`](https://github.com/testing-library/preact-testing-library/blob/main/types/index.d.ts#L7) object that is returned from a
call to `render`.

```ts
const screen: RenderResult = render(<Features />);
const text = screen.getByText("Hello World!");
```

Discovering DOM elements in a `fresh-testing-library` test requires use of a
finder. Finder function names have three parts:

* The finder mechanism: 'get', 'query' or 'find'
* Is the search for single or multiple nodes: 'By' or 'AllBy'
* How to find an element: 'AltText', 'DisplayValue', 'LabelText',
   'PlaceholderText', 'Role', 'TestId' or 'Title'

Combined, the first two parts of a finder function name indicates what the
function returns. Here's how that works:

| Finder function | Match Found returns | Match Not Found returns |
| :-------------: | :-----------------: | :---------------------: |
|     getBy*      |    matching element    |     throws an error     |
|    getAllBy*    |    matching element array    |     throws an error     |
|    queryBy*     |    matching element    |          null           |
|   queryAllBy*   |    matching element array    |       empty array       |
|     findBy*     |  resolved Promise  (element) |    rejected Promise     |
|   findAllBy*    |  resolved Promise (element array)   |    rejected Promise     |

Also note that if you are using the singular 'getBy', 'queryBy' or 'findBy'
functions and more than one element is returned, then an error is thrown.
Conversely, a getAllBy, queryAllBy and findAllBy function returns an array with
a single element if only one matching item exists.

I need to interject here that while the table above -- and other documentation -- points out that an element (HTMLElement) gets returned, if the element has child elements (like an HTML form), then the whole node gets returned. However, most of the time you'll want to fashion the finder function to find a single element.

The full name of a finder function specifies how an element is located. Here's
what they are with a 'getBy' prefix (the same functions exist using 'queryBy' or
'findBy'):

* `getByAltText` - finds the element using the `alt` attribute
* `getByDisplayValue` - finds an `input`, `textarea` or `select` element using
  the `value` attribute.
* `getByLabelText` - finds the element using the `label` attribute. Obviously, this is mostly used to locate form elements wrapped in a `label`.
* `getByPlaceholderText` - finds the element using the `placeholder` attribute
  found in a `text` or `textarea` form element.
* `getByRole` - finds the element by its `role` attribute or implicit role
  ([see below](#using-byrole-finder-functions)).
* `getByTestId` - finds an element using the `data-testid` attribute
* `getByTitle` - finds an element using the enclosed `title`element. This is
  best used with an svg graphic that contains a `title` child element.

All of the finder functions have the same first two arguments. The first one is
an HTML element which would be obtained from a previous call to a finder
function. Most of the time you will not need this argument.

The second argument is used to match the the HTML element being searched for. It
is either a number, string, regular expression or a function
([see next section](#matching-text)). The 'ByRole' method only takes specific
string values ([see below](#using-byrole-finder-functions)).

Finder functions have an optional third argument which is an options object. The
properties of that argument is specific to the finder.

### Text Argument Options

Most finder functions take a
[`TextMatch`](https://testing-library.com/docs/queries/about/#textmatch) which
can be:

* a string
* a regex
* a function

The `TextMatch` function has optional string and `HTMLElement` arguments and
returns a boolean (`true` for a match; `false` for no match). Here's an example
of a test with functional matching:

```ts
it("should show source code", () => {
  const code = "console.log('Hello World')";
  const { getByRole, getByText } = render(<CodeBox code={code} />);
  // find code
  const codeElement = getByRole("code");
  // get the text content
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

A finder function that takes a `TextMatch` can contain an options object with an
`exact` or `normalization` property that affects the precision of the match.
There is a
[section in the Testing Library docs that explores these options in detail](https://testing-library.com/docs/queries/about/#precision),
but here they are in a nutshell:

* `exact` - (`true` by default) determines whether the match is case-sensitive or
  not.
* `normalization` - By default whitespace is collapsed when doing a text match. This property
  can be set to override that behavior.

## Uses of get*, query* and find* Functions

As shown above, the first part of a finder function name indicates what gets
returned when you call the function. For that reasons, each one of them has a
favored use

- **get*** - use to find elements to be able to verify their attributes or
  content or invoke an event. You will probably use this most of the time in a
  component test.

- **query*** - should only be used to verify the existence or non-existence of
  an element. Otherwise, a 'get*' finder should be used.

For example, I have a test where I want to make sure that no `Todo` components
will be shown. Each `Todo` contains a `button` element. I use `queryAllByRole` to test for an empty array returned by that function. If I used `getAllByRole`, an error would be thrown
if nothing was returned.

```ts
// TodoList.test.tsx in Fresh signals post code repo
it("should not display list of todos...", () => {
  const todos = [] as string[];
  state.todos.value = todos;
  const { queryAllByRole } = render(
    <AppState.Provider value={state}>
      <TodoList />
    </AppState.Provider>,
  );
  // queryAllBy returns an empty array; getAllBy just throws an error
  const buttons = queryAllByRole("button");
  assertEquals(buttons.length, 0);
});
```

* **find*** - use when an async operation or rendering delay would prevent an element or elements from appearing in the UI. Fetching remote data is an example. Another example is when an action causes a rerender. Here's how `findBy` is used:

```ts
// MenuLink.test.tsx in this blog's repo
it("Show About link", async () => {
  // change the location, triggering a menu rerender
  globalThis.window.location = { href: "/about" };
  const { findByText } = render(<MenuLink />);
  // findByText returns a Promise
  const page = await findByText("Home");
  const text = page.textContent;
  assertExists(text);
  assertNotEquals(text, "About");
});
```

- **waitFor** While not strictly a finder function, `waitFor` is used under the
  covers by the **findBy*** finder. However, it can be used standalone.

The
[`waitFor` function](https://testing-library.com/docs/dom-testing-library/api-async/#waitfor)
is used for verifying DOM elements that take a while to render due to an async
operation. Here's how `waitFor` is used:

```ts
await waitFor(() => {
  assertEquals(counter.textContent, count.value.toString());
});
```

As shown, `waitFor` is an async function that takes a function argument and
optionally an options argument. This function runs until the waited-for
operation succeeds or times out. The timeout is 1000ms by default, but that can
be changed in the options argument's `timeout` property.

## Using ByRole finder functions

Kent C. Dodds, the creator of Testing Library, recommends to
[prefer the use of the 'ByRole' finder function to discover DOM nodes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library#not-using-byrole-most-of-the-time). This is a tough thing to do since `role` options are not well documented in Testing Library docs. Instead, a role used by Testing Library is documented in the [WAI ARIA accessibility standard](https://www.w3.org/TR/wai-aria/).

The 'ByRole' finder requires a string that is a valid WAI ARIA role name (see
this
[list of WAI ARIA roles](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles)).

Certain HTML elements have
[an implicit role](https://www.w3.org/TR/html-aria/#docconformance). Some of
these elements have the same role name as the element name. They include
`button`, `article`, `code` and `img`.

Nearly all of the HTML form elements also have implicit roles. This includes
`input` elements with `type="text"` (`textbox` role), `type="radio"` (`radio`
role), `type="range"` (`slider` role), `type="number"` (`spinbutton` role) and
`type="submit"` (`button` role). The `textarea` element's implicit role is
`textbox` while the `select` element's implicit role is `listbox` or `combobox`.

Another handy implicit role to use is `link` for an HTML anchor (`a` tag), but the anchor must have a `href` attribute. Here's an example of a component test to verify 3 links:

```ts
// Header.test.tsx in Fresh repo
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

When you want to use an implicit role, do not set an element's `role` attribute.

Sometimes you might have multiple elements with the same implicit role; multiple buttons, for instance. In that case use the options argument.

Each role has a different set of options. All of them have a `name` property,
but the property's value depends on the role. For the `button` role, the `name`
property is the button's value. For the `img` role, the `name` property is the
value of the element's `alt` attribute. Roles for HTML elements without an
implicit role must be specified using the `role` attribute.

Many IDEs like Visual Studio Code support discovery of valid roles using
autocompletion. Just type `getByRole("")` putting your cursor within the quotes. Then press ctrl/cmd-spacebar
and a list of valid roles should appear.

If you use an argument to a 'ByRole' finder that is illegal, when the test is
run the error message will point out the available implicit roles. Alternately,
you can use the `fresh-testing-library` function `logRole` to find the implicit
roles within your component-under-test.

## Accessibility testing

Testing Library emphasizes accessibility by having a number of finder functions
that use accessibility attributes. The 'ByRole' finder is a big one, but
'ByPlaceholderText', 'ByAltText', 'ByLabel' and 'ByTitle' are others.

Here is an example of using the `title` attribute with the 'ByTitle' finder:

```ts
// Background.test.tsx in Fresh repo
it("should display background image", () => {
  // Background takes any number of native attributes or Preact props
  const { getByTitle } = render(<Background title="background" />);
  const bg = getByTitle("background");
  const style = bg.getAttribute("style");
  assertEquals(style, "background-image: url(/gallery/grid.svg);");
});
```

## Testing User Interactions

The `fresh-testing-library` contains two ways for simulating user interactions:
`fireEvent` and `userEvent`.

The `fireEvent` function is used for simple interactions with the UI, while
`userEvent` simulated the subtile nature of the interactions. For instance when a
button is pressed, `fireEvent.click` would cover the DOM click event, but
`userEvent.click` encompasses the hover, keydown and keyup events in addition to
the click event. In other words, `userEvent` more closely behaves the way users
would
([see this article for more details](https://blog.mimacom.com/react-testing-library-fireevent-vs-userevent/)).

### Using `fireEvent`

The [`fireEvent`](https://testing-library.com/docs/dom-testing-library/api-events#fireevent) object includes function properties for almost 90 DOM events
They include:

- `fireEvent.click` - to invoke an `onClick` handler
- `fireEvent.change` - to invoke an `onChange` handler
- `fireEvent.submit` - to invoke an `onSubmit` handler
- `fireEvent.keyDown` - to invoke an `onKeyDown` handler

See the [`EventType` union type in the TypeScript docs](https://github.com/testing-library/dom-testing-library/blob/main/types/events.d.ts) for an enumeration of
all events.

Each of the `fireEvent` function properties takes an argument that is the
`HTMLElement` event target.

Here's an example of using a 'click' event to invoke a button click:

```ts
// Counter.test.tsx in Fresh signals blog post
it("should display count and increment/decrement it correctly", async () => {
  const count = signal<number>(9);
  const { queryByRole, queryByText } = render(<Counter count={count} />);
  const plusOne = queryByRole("button", { name: "+1" });
  assertExists(plusOne);
  const minusOne = queryByRole("button", { name: "-1" });
  assertExists(minusOne);

  await fireEvent.click(plusOne);
  assertFalse(queryByText("9"));
  assertExists(queryByText("10"));

  await fireEvent.click(minusOne);
  assertExists(queryByText("9"));
  assertFalse(queryByText("10"));
});
```

In this case, the event target are two button elements, one for incrementing the
count, the other for decrementing it.

### Using `userEvent`

The [`userEvent`](https://testing-library.com/docs/user-event/intro) object has 16 function properties. They include `clear`, `click`,
`copy`, `cut`, `dblClick`, `deselectOptions`, `hover`, `keyboard`, `paste`,
`pointer`, `selectOptions`, `tab`, `tripleClick`, `type`, `unhover` and
`upload`. As you can surmise from the function names, these correspond to actual
ways that the user interacts with the UI rather than strict DOM events.

The arguments for these functions can be very different. Many take a DOM element like, `click`, `dblClick` and `hover`, while others have very different arguments. See the [`userEvent` docs](https://testing-library.com/docs/user-event/intro) or use your IDE (hover over the function or right click and select "Go to Definition") to discover these args.

The `userEvent` object has a `setup` function that should be used to instantiate
the object before it is used. Here's what that looks like:

```ts
const user = userEvent.setup();
```

The previous `fireEvent` example can be adapted to use `userEvent`. Here is what
it looks like:

```ts
// Be sure to import fireEvent from FTL component.ts
it("should display count and increment/decrement it correctly", async () => {
  const user = userEvent.setup();
  const count = signal<number>(9);
  const { queryByRole, queryByText } = render(<Counter count={count} />);
  const plusOne = queryByRole("button", { name: "+1" });
  assertExists(plusOne);
  const minusOne = queryByRole("button", { name: "-1" });
  assertExists(minusOne);

  await user.click(plusOne);
  assertFalse(queryByText("9"));
  assertExists(queryByText("10"));

  await user.click(minusOne);
  assertExists(queryByText("9"));
  assertFalse(queryByText("10"));
});
```

While `userEvent` seems like a more logical choice since it focuses on user
interactions, `fireEvent` covers more event types so it needs to be used in
certain circumstances. For instance, `fireEvent` has a `change` function for
simulating an `onChange` event, while `userEvent` does not have a similar
function.

## Testing component state management

Preact signals provide a means to do local and global state management with
signals. A previous
[Craig's Deno Diary post](https://deno-blog-stage.deno.dev/Using_Preact_Signals_with_Fresh.2022-11-01)
demonstrated how to use signals with Fresh.

### Testing local state

Compared to `useState`, the `signal` function only returns a single value and
not an array with a setter function. Updating the signal involves assigning the
value property of the signal a new value.

```ts
const count = signal<number>(0);
const newValue = count.value + 1;
count.value = newValue;
```

The local state often changes when an event gets invoked which in turn updates
the UI. In a `fresh-testing-library` test, the `fireEvent` function would
trigger his kind of change.

```ts
const [getByRole, queryByText] = render(<Counter />);
const button = getByRole("button");
fireEvent.click(button);
assertExists(queryByText("Count: 1"));
```

### Testing global state

Global state management with Preact signals requires a module that holds that
state and using the Preact context to pass the state to child components. I will
not go over how this is coded in detail as you can refer the the
[Craig's Deno Diary post](https://deno-blog.com/Using_Preact_Signals_with_Fresh.2022-11-01)
on how it's done.

The code used to illustrate the state management testing shown here is taken
from the
[signals blog post's repo](https://github.com/cdoremus/fresh-todo-signals).

Testing a component that uses global state requires that you wrap the component
in a Preact context provider that passes the state into the component. The context is created in the parent component using the `createContext` function:

```ts
// App.tsx
export const AppState = createContext<AppStateType>({} as AppStateType);
```

The `AppState` context has a provider field used to pass the state to child components.

The child components discover the state using the `useContext` hook. Here's a
component that displays a list obtained from the context:

```ts
// TodoList.tsx in Fresh signals blog post repo
import { useContext } from "preact/hooks";
import { AppState } from "./App.tsx";
import Todo from "./Todo.tsx";

export default function TodoList() {
  const { todos } = useContext(AppState);
  return (
    <div className="todos">
      {/* todos are a signal that contain the todos value */}
      {todos.value?.map((item: string, i: number) => {
        return <Todo text={item} index={i} />;
      })}
    </div>
  );
}
```

To test a component in isolation, you need to wrap it in a context provider so
that state can be passed to the child component. Here's what that kind of test
looks like:

```ts
// TodoList.test.tsx in Fresh signals blog post repo
it("should display list of todos...", () => {
  const todos = ["Foo", "Bar", "Baz"];
  // state is imported from the module that holds it (state.ts)
  state.todos.value = todos;
  const { getAllByRole, queryByText } = render(
    <AppState.Provider value={state}>
      <TodoList />
    </AppState.Provider>,
  );
  // verify that all todos are displayed
  for (let i = 0; i < todos.length; i++) {
    assertExists(queryByText(todos[i]));
  }
  // Each todo has a delete button
  const buttons = getAllByRole("button");
  assertEquals(buttons.length, 3);
});
```

Notice in the test that we assign the state's `todos` value before we attached it to the `AppState.Provider` context provider.

The
[original blog post on Fresh signals](https://deno-blog-stage.deno.dev/Using_Preact_Signals_with_Fresh.2022-11-01)
has been updated with `fresh-testing-library` component tests including the test
used in this section.

## Component testing troubleshooting tips

* Manipulating `IS_BROWSER` - This constant is used a lot in Fresh app code, but
  testing it can be problematic. In order to set `IS_BROWSER` to false, you need
  to set the `document` object to `undefined`. Doing that will cause a
  `fresh-testing-library` test to fail because the `jsdom` library cannot
  function without a valid `document` object. Therefore, testing code that uses
  `IS_BROWSER` cannot be done with `fresh-testing library`.
* `debug` functions - used for printing out the DOM returned from calling
  `render` or any of the finder functions. The former prints out the complete
  DOM that was rendered and the latter prints out the returned DOM from a finder
  function call. Here's how to use them:

```ts
const { debug, queryByRole } = render(<MyComponent />);
// print out all the component's DOM elements wrapped in a body element
debug();
const element = queryByRole("button");
// prints out the button element's DOM
element.debug();
```

## Middleware and Route Handler testing

### Testing middleware

Testing middleware employs the `createMiddlewareHandlerContext` function to mock
out the `MiddlewareHandlerContext` used in a middleware handler. Here's what the
code and a test would look like for the
[middleware in this repo](https://github.com/cdoremus/deno-blog/blob/main/routes/_middleware.ts);

```ts
// _middleware.ts in this blog's repo
import { MiddlewareHandlerContext } from "$fresh/server.ts";

export const handler = setCacheControlHeaders();

export function setCacheControlHeaders() {
  return async (_req: Request, ctx: MiddlewareHandlerContext) => {
    const resp = await ctx.next();
    resp.headers.set("Cache-Control", "public, max-age=21600, immutable");
    return resp;
  };
}

// middleware.test.ts
import { assertEquals } from "std/assert/assert_equals.ts";
import { createMiddlewareHandlerContext } from "$fresh-testing-library";
import { setCacheControlHeaders } from "../../routes/_middleware.ts";
import manifest from "../../fresh.gen.ts";

Deno.test("should set Cache-Control header", async () => {
  const req = new Request(`http://localhost:3000/`);
  // @ts-ignore ignores "type ... is not assignable to type Manifest" error
  const ctx = createMiddlewareHandlerContext(req, { manifest });
  let resp = new Response();
  const middleware = await setCacheControlHeaders();
  await middleware(req, ctx);
  resp = await ctx.next();
  assertEquals(
    resp.headers.get("Cache-control"),
    "public, max-age=21600, immutable",
  );
});
```

You can use `Deno.test` in this case since a middleware test does not require
setup or cleanup.

The `Request` object can be used to find out the current URL or request method
(GET, POST, etc) for middleware with logic that is more sophisticated than my
simple example.

### Testing route handlers

At this point, route testing using `fresh-testing-library` is confined to
testing handler logic and not the handler's `Response` including verifying
response markup.

You use the `createHandlerContext` function in `fresh-testing-library` to test
the handler function of a route component.

```ts
// about.test.ts in this blog's repo
Deno.test("routes/About.tsx handler tests...", async (t) => {
  await t.step("should respond to GET request in DEV...", async () => {
    assert(handler.GET);
    const req = new Request("http://localhost:8000/about");
    // @ts-ignore manifest typing
    const ctx = createHandlerContext(req, { manifest });

    const res = await handler.GET(req, ctx);
    assertEquals(res.status, 200);
  });
  // ... other tests here
});
```

You do not need `startup` and `cleanup` functions for handler tests, so we use
the `Deno.test` runner function here instead of the `bdd` module functions.

Alternatively, the Fresh codebase includes the `createHandler` function for
testing a route handler. The `createHandler` function creates a mock handler
function.
[See the Fresh docs](https://fresh.deno.dev/docs/examples/writing-tests) for more details on using this function.

[Grouping routes](https://fresh.deno.dev/docs/concepts/routing#route-groups) was
added in Fresh v1.4. Version 0.8.0, of the `fresh-testing-library` added support
for testing route groups. `fresh-testing-library` route handler tests
transparently works if routes are grouped.

## Testing async route components

[Fresh async route components](https://fresh.deno.dev/docs/concepts/routes#async-route-components)
are components where an async route handler function is inlined into the route
page component. In that case, the route page component is declared as
asynchronous (using the `async` keyword). Here's what that look likes (taken
from the Fresh routes documentation):

```ts
export default async function MyPage(req: Request, ctx: RouteContext) {
  const value = await loadFooValue();
  return <p>foo is: {value}</p>;
}
```

Fresh also ships with a
[`defineRoute`](https://fresh.deno.dev/docs/concepts/routes#define-helper)
function to simplify the creation of async route components.

A `fresh-testing-library` test of an async route component uses the
`createRouteContext` function in the `server` module. Here's how it is used in a
[`fresh-testing-library`](https://github.com/uki00a/fresh-testing-library#testing-async-route-components)
example:

```ts
import {
  cleanup,
  getByText,
  render,
  setup,
} from "$fresh-testing-library/components.ts";
import { createRouteContext } from "$fresh-testing-library/server.ts";
import { assertExists } from "$std/assert/assert_exists.ts";
import { afterEach, beforeAll, describe, it } from "$std/testing/bdd.ts";
import { default as UserDetail } from "./demo/routes/users/[id].tsx";
import { default as manifest } from "./demo/fresh.gen.ts";

describe("routes/users/[id].tsx", () => {
  beforeAll(setup);
  afterEach(cleanup);

  it("should work", async () => {
    const req = new Request("http://localhost:8000/users/2");
    const ctx = createRouteContext<void>(req, { manifest });
    const screen = render(await UserDetail(req, ctx));
    const group = screen.getByRole("group");
    assertExists(queryByText(group, "bar"));
  });
});
```

In this case, `UserDetails` is the async route component.

## Conclusion

Use the [example code given at the beginning of this blog post](#example-code)
to guide you through the the core `fresh-testing-library` concepts introduced
above. There are over two dozen test files for you to peruse in those three
repos.

There are also examples in the
[`fresh-testing-library` repo](https://github.com/uki00a/fresh-testing-library).
Check out the `components.test.tsx`, `server.test.tsx` and `routes.test.tsx`
files used to test code in the `demo` folder.

Also be aware that `fresh-testing-library` has not yet released version 1.0, so
it will continue to evolve to include more features and bug fixes. In addition,
I know by first-hand experience that the `fresh-testing-library` author is very
responsive to issues submitted to the library's repo.

Finally, since the component testing feature of `fresh-testing-library` wraps
the Preact Testing Library, you need to be familiar with that
[library's documentation](https://testing-library.com/docs/preact-testing-library/intro).
It provides a guide to the full component testing API.

### Acknowledgements

Special thanks goes to `fresh-testing-library` author Yuki Tanaka (@uki00a) for
answering my many questions, promptly fixing bug reports that I submitted and
reviewing a draft of this article. I would also like to thank Kyle June (@kylejune) for his help with understanding the limitations of mocking with `expect`.
