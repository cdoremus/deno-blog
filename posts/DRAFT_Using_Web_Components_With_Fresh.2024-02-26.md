<!-- deno-fmt-ignore-file -->
#### 2024-02-26
##### _21 min read_

# Using Web Components with Deno and Fresh

## Table of Contents
  - [Introduction](#introduction)
  - [Developing a Web Component](#developing-a-web-component)
    - [Why Web Components](#why-web-components)
    - [Creating a Web Component](#creating-a-web-component)
      - [Web Component Lifecycle](#web-component-lifecycle)
      - [Encapsulation with the Shadow DOM](#encapsulation-with-the-shadow-dom)
      - [Templates and Slots](#templates-and-slots)
      - [Declarative Shadow DOM](#declarative-shadow-dom)
      - [Light DOM and HTML Web Components](#light-dom-and-html-web-components)
    - [Styling Web Components](#styling-web-components)
      - [Using CSS Pseudo-selectors](#using-css-pseudo-selectors)
      - [Using Constructable Stylesheets](#using-constructable-stylesheets)
      - [Style Inheritance and Custom Properties](#style-inheritance-and-custom-properties)
    - [Using the JavaScript Custom Event API](#using-the-javascript-custom-event-api)
    - [Working with Forms and ElementInternals](#working-with-forms-and-elementinternals)
    - [Web Components and Accessibility](#web-components-and-accessibility)
  - [Using Web Components with Deno](#using-web-components-with-deno)
    - [Using `Deno.serve`](#using-denoserve)
    - [Using Web Components with Deno Fresh](#using-a-web-component-with-deno-fresh)
      - [HTML Web Components in Fresh](#html-web-components-in-fresh)
      - [Using TypeScript with Fresh-deployed Custom Elements](#using-typescript-with-fresh-deployed-custom-elements)
      - [Using Tailwind with Fresh](#using-tailwind-with-fresh)

  - [Creating Web Components with Lit](#creating-web-components-with-lit)
    - [Lit and TypeScript](#lit-and-typescript)
  - [Using Third-party Web Components](#using-third-party-web-components)

## Introduction
Deno prides itself with its support of standards. It has embraced ECMAScript imports as the way to express dependencies, supports most standard web APIs and has championed server-side JavaScript standards through it's leadership in [WinterCG](https://wintercg.org/).

Deno allows you to write simple JavaScript without the need for compilers, bundlers and code transformers. It is code that can run on the command line, on a server or in modern browsers. The term "batteries included" encapsulates this thinking.

Web Components is a "batteries included" web framework that allows you to write reusable custom elements. In essence, custom elements extend native HTML element functionality. Those elements can be easily associated with an HTML page served by any web server (including a [Deno](https://deno.com) web server).

They can also be used with a web framework like [Deno Fresh](https://fresh.deno.dev).

Before we talk about Deno and Fresh, you need to be familiar with how Web Components work and how to create and use them.

If you already have an understanding of Web Components, you can skip to the [Using Web Components with Deno](#using-web-components-with-deno) section. Still, there are a few recent additions to the Web Component standard like Declarative Shadow DOM, Element Internals and specialized CSS selectors that you might want to take a look at if you haven't worked with Web Components in a while.

The Web Components that we are going to start with use a basic Deno web server implemented with [`Deno.serve()`](https://deno.land/api@v1.43.5?s=Deno.serve). The [example repo can be found here](https://github.com/cdoremus/web-component-demos). Use these simple examples to guide your learning and modify the code to reinforce it.

# Developing a Web Component

The Web Component standard is a means for creating custom HTML elements with structure, attributes and behavior like their native cousins. Technically, a Web Component encompasses two standards:
- [Custom Elements](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements): custom-made HTML tags.
- [The Shadow DOM](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM): a means for isolating the custom element from the external document.

A web component is created using a JavaScript class that extends `HTMLElement`, the parent of all HTML elements. The custom element can be associated with the Shadow DOM when it's created.

## Why Web Components

The first question that comes up in a Web Component discussion is why. Why would I use Web Components when I've got Fresh, React, Preact, Vue, Svelte, Angular (et al.)? Here's my take on that answer:

- Web components are lightweight and do not need any extra JavaScript/TypeScript libraries to work since the APIs are built into the browser. Many web frameworks are getting a lot of flack these days because of the amount of JS they send to the client.
- They are supported by all modern web browsers including ones on mobile phones. This has only happened in the last few years.
- They can be used with most web frameworks. Web Components are often used as the basis for a [design system](https://www.invisionapp.com/inside-design/guide-to-design-systems/) since they are framework agnostic. This allows then to be used throughout the enterprise.
- Since Web Components are build into the browser, they will always be supported and are backwardly compatible as opposed to components created with a web framework that will probably introduce periodic breaking changes as the framework evolves.
- They require a good understanding of DOM APIs, something that many JS/TS developers do not know well because they work with web frameworks that abstract them away. Still, knowledge of JavaScript fundamentals are important for every webdev in order to fully understand what's going on under the covers and to have additional ways to work with the UI.

I also have to admit that there is something rather liberating about having full control of a component you have created rather than relying on sometimes awkward ways to do things when you use a component created in a web framework.

## Creating a Web Component
You create a Web Component custom element using a JavaScript class that extends the `HTMLElement` interface. The simplest 'Hello World' example looks like this:
```js
class HelloWC extends HTMLElement {
  // lifecycle method called  when the component is loaded into the DOM
  connectedCallback() {
    // Get the value of the message attribute
    this.message = this.getAttribute("message") ?? "World";
    // Display the content with the 'message' attribute value
    this.innerHTML =
      `<h4>Hello ${this.message}!!</h4>`;
  };
};
// register the class as a custom element
customElements.define("hello-wc", HelloWC);
```
As shown in the code, the component needs to be registered using the `define` function of the `customElements` window object. The first argument is the name of the tag. The second is the component's class.

To use a custom element in an HTML page, its code needs to be referenced in a `<script>` tag.

```html
  <!-- Add this to the document's head -->
  <script src="/components/hello-wc.js" type="module"></script>
```

Finally the web component can be placed on the page using the tag name with the `message` attribute containing a value that is the message to be displayed on the page.

```html
<hello-wc message="From a Web Component"></hello-wc>
```
According to the spec, the name of a custom element tag must be hyphenated to distinguish it from a built-in HTML element.

### Web Component Lifecycle

The custom element lifecycle methods include:

| Function |Behavior|
| ------- | ---------- |
| `constructor()` | Called when the component instance is created.|
| `connectedCallback()` | Called when the component's DOM is mounted. This is the place to get the initial the value of component attributes. |
| `disconnectedCallback()` | Called when the component's DOM is unmounted. Often used to cleanup a resource like a timer with `clearInterval`. |
| `attributeChangedCallback(attrName, oldVal, newVal)` | Called when an observed attribute is changed. The arguments are the attribute name (attrName), the old value (oldVal) of the attribute and the attribute's new value (newVal) |
|`adoptedCallback`| Called when an element is moved to a new document like a new window frame |

Most of the time a Web Component only needs the `constructor` and/or the `connectedCallback` method. Either can be used to setup the web component, but the latter method should be used when retrieving something from the DOM like an attribute's value.

The `attributeChangedCallback` method will be called when a component attribute's value is updated by the client from direct or indirect user interaction. It also requires a `observedAttributes` static property in the custom element class that returns an array of the names of attributes that might change ([example code](https://github.com/cdoremus/web-component-demos/blob/main/lifecycle-wc.js)).

```js
class AttributeChangedWC extends HTMLElement {
  // required for attributeChangedCallback
  static get observedAttributes() {
    return ["add"];
  }

  connectedCallback() {
    this.add = this.getAttribute("add");
    // define component markup
    this.innerHTML = `
      <style>#sum-title{ color: blue;} .sum { color: black; font-weight: bold; }</style>
      <div>
      <p id="old-value">Old Attr Value: <span class="old">0</span></p>
      <p id="new-value">New Attr Value: <span class="new">0</span></p>
      </div>
      <p id="sum-title">Sum: <span class="sum">0</span></p>
    `;
  }
  attributeChangedCallback(attrName, oldValue, newValue) {
    if (attrName === "add") {
      console.log(`Old add Value: ${oldValue}, New add Value: ${newValue}`);
      let sum = 1;
      const sumDisplay = this.querySelector(".sum");
      const oldVal = this.querySelector(".old");
      const newVal = this.querySelector(".new");
      console.log("sumDisplay: ", sumDisplay);
      if (oldValue) {
        oldVal.innerHTML = oldValue;
        newVal.innerHTML = newValue;
        sum = parseInt(oldValue) + parseInt(newValue);
      } else {
        sum = parseInt(newValue);
      }
      console.log("sum: ", sum);
      if (sum !== null && sumDisplay !== null) {
        sumDisplay.innerHTML = sum;
      }
    }
  }
}
customElements.define("attribute-changed-wc", AttributeChangedWC);
```
The client app that displayed this Web Component has code to update the component's `add` attribute value. When it changes, the `attributeChangedCallback` method is invoked. Here's what that code looks like:
```js
  /* Embedded script in lifecycle.html */
  // get reference to the web component
  const component = document.querySelect("attribute-changed-wc");
  // get reference to the button used to change the attribute
  const button = document.querySelector("#update-add-button");
  // update the attribute when the button is clicked
  button.addEventListener("click", (e) => {
    const addValue = component.getAttribute("add");
    // Increment attribute to invoke attributeChangedCallback
    const newAdd = parseInt(addValue) + 1;
    component.setAttribute("add", newAdd.toString());
  });
```
See the [source code](https://github.com/cdoremus/web-component-demos/blob/main/lifecycle.html) for more details on this example.

### Encapsulation with the Shadow DOM

The Web Component standard includes a concept called the Shadow DOM, an isolated DOM tree that encapsulates CSS styles and DOM nodes inside a custom element. Shadow DOM is an optional feature of a Web Component.

When the Shadow DOM is enabled in a Web Component, it means is that CSS styles outside of the component cannot influence elements inside the component (outside of inherited CSS properties like `color` or `font-size` and CSS custom properties - [see below](#style-inheritance-and-custom-properties)).

Similarly, a Web Component with Shadow DOM enabled isolates the DOM inside the component, so that, for instance, if you call `document.querySelectorAll('button')` outside the custom element, buttons inside will not be part of the `button` collection result set. But if you call `this.querySelector("button")` inside the custom element with only one button, then you get a reference to the component's single button element.

The shadow DOM has two modes:
- **open** - where the Web Component's CSS and DOM is isolated. In open mode, external JavaScript can still access the component's internals.
- **closed** - where the Web Component's CSS, DOM and external JavaScript is completely isolated.

You use the `attachShadow` built-in custom element method to enable shadow DOM. That method's argument is an options object with a required `mode` field whose value is either `open` or `closed`.

Calling `attachShadow` assigns the `shadowRoot` component property that can be used to add content to the shadow DOM with its `append` or `appendChild` method. Here's what that looks like ([source code](https://github.com/cdoremus/web-component-demos/blob/main/shadow-dom.js)):

```js
class MyShadowDomWC extends HTMLElement {
  constructor() {
    // Assigns a reference to this.shadowRoot in the Shadow DOM
    this.attachShadow({ mode: "open" });
  }
  connectedCallback() {
    const h3 = document.createElement("h3");
    h3.innerHTML = "Hello World from the Shadow DOM";
    this.shadowRoot.append(h3);
  }
}
customElements.define("my-shadow-dom", MyShadowDomWC);
```
The `attachShadow` method can be also called inside `connectedCallback` to set a local `shadow root` variable reference. When the call is made in the constructor, the `this.shadowRoot` property is set.

The `append` method is used to add elements to the shadow root.

If you look at the Elements tab in the browser Developer Tools, you'll see the shadow root with its DOM tree.

| Shadow DOM visualized in the Chrome Developer Tools |
|------|
| ![Shadow DOM in Dev Tools](/img/blog/web-components/ShadowDom_DevelopersToolsView.png) |

Inside the Developer Tools, the Shadow DOM is bounded by a `#shadow-root (open)` delimiter. The [Shadow Root](https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot) interface is the root node of the Shadow DOM. It has it's own properties and methods. See [the MDN documentation](https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot) for more details.

To set the Shadow DOM mode to closed, just change the mode from "open" to "closed" in the `attacheShadow` call:
```javascript
    const shadowRoot = this.attachShadow({ mode: "closed" });
```
When this is done, the Developer Tools shadow root notation shows `closed` in the Elements tab.

Shadow DOM Web Components are often used as reusable components in a [Design System](https://www.designsystems.com/), a way to formalize a company's brand presence on the web. Besides allowing a company-standard UI, Web Components provide a way to make sure accessibility standards are met by the Design System development group rather than relying on individual development groups that may be working with different web frameworks.

The example repo accompanying this post contains [source code](https://github.com/cdoremus/web-component-demos/blob/main/shadow-dom.html) of a Web Component using the open and closed ShadowDOM.

### Templates and Slots

Web components can also use the built-in HTML `<template>` and `<slot>` tags to hold content displayed by the component. The `<template>` tag is a container for DOM nodes. If it is used on a web page, the content is not visible, but it can be used as a container for markup to be used elsewhere including a custom element.

A `<slot>` is an HTML element used inside a template tag as a content placeholder. It is only available in a web component that uses the Shadow DOM.

JavaScript is used to replace the `<slot>` tag with other content at runtime. A slot can be identified using the `name` attribute. In that case, the content needs to have a `slot` attribute corresponding to the name. Taken from the [source code](https://github.com/cdoremus/web-component-demos/blob/main/pseudo-selectors-tabs.html) in the demo app, here's what that would look like:
```html
  <template id="tabbed-custom-element">
    <style>
      <!-- see source code for CSS styles -->
    </style>
    <div class="container">
      <div class="tab-group">
        <div id="tab1" part="tab active" role="button" tabindex="1">Tab 1</div>
        <div id="tab2" part="tab" role="button" tabindex="2">Tab 2</div>
        <div id="tab3" part="tab" role="button" tabindex="3">Tab 3</div>
      </div>
      <div>
        <slot id="slot-content" name="tab1"></slot>
      </div>
    </div>
  </template>

  <tabbed-custom-element>
    <!--  Content for each tab  -->
    <div slot="tab1">Slot 1 CONTENT</div>
    <div slot="tab2">Slot 2 CONTENT</div>
    <div slot="tab3">Slot 3 CONTENT</div>
  </tabbed-custom-element>
```
The web component needed to declare that the component uses Shadow DOM with a `this.attachShadow` call. The `connectedCallback` method holds all the logic:
```js
const template = document.querySelector("#tabbed-custom-element");

class PseudoSelectorWC extends HTMLElement {
    constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    //  Add template to the Shadow DOM
    this.shadowRoot.appendChild(template.content);
    // Find all tabs as a NodeList and convert to array
    const tabGroup = this.shadowRoot.querySelector(".tab-group");
    const tabs = tabGroup.querySelectorAll("div");
    const tabArray = Array.from(tabs);
    // Get the slot that will receive events
    const contentElement = this.shadowRoot.querySelector("#slot-content");
    // Add click listener
    this.shadowRoot.addEventListener("click", (e) => {
      const tabName = e.target.id;
      this.eventHandler(tabName, contentElement, tabArray);
    });
    // Add keydown listener to listen for the Enter key
    this.shadowRoot.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const tabName = e.target.id;
        this.eventHandler(tabName, contentElement, tabArray);
      }
    });
  }

  eventHandler(tabName, contentElement, tabArray) {
    // Change the slot name to the active tab, so
    //  that the content will be switched
    contentElement.name = tabName;
    // Make clicked tab the active one
    for (const tab of tabArray) {
      if (tab.id === tabName) {
        tab.part = "tab active";
      } else {
        tab.part = "tab";
      }
    }
  }
}
```
A reference to the `<template>` tag is obtained and its content is added to the Shadow DOM. Note that the tab's content is added using the `slot` attribute in the proper template place according to the `slot` element's name, so that, for instance in this example, the Slot 1 content is defined in the `div` whose `slot` attribute value is `tab1`.

The `eventHandler` method is used to dynamically update the tab's content and add event listeners to each tab. When the tab is clicked (or when the Enter key is pressed for a tab in focus), that tab is set as the current tab via the `active` class. This allows the tab's content to be displayed.

You could also define the `template` in JavaScript code using a string literal like this which is a drop-in replacement for the template defined within the component's markup in this example adapted from [this source code](https://github.com/cdoremus/fresh-webcomponents/blob/main/components/wc/TemplatedWC.ts):

```js
  connectedCallback() {
    const template = document.createElement("template");
    template.innerHTML = `
      <style>
        .container {
          width: 50%;
          border: 2px solid black;
        }
        .title {
          font-size:1.75rem;
          font-weight:600;
        }
        slot {
          font-size:1.25rem;
          font-style:italic;
        }
      </style>
      <div class="container">
        <span class="title">This is inside the template JS code</span>
        <slot></slot>
        <slot name="slot2"></slot>
        <slot name="slot3"></slot>
      </div>
    `;
    // append the template's content to the ShadowRoot
    this.shadowRoot.appendChild(template.content);
`;
```
Note that when a slot's `name` attribute is not defined, it would get the default content which is the content created without a `slot` attribute. That would be be the "Default slot content" in this example ([source code](https://github.com/cdoremus/web-component-demos/blob/main/template.html)):

```html
  <!-- template.html markup fragment -->
  <template-wc>
    <div>Default slot content</div>
    <div slot="slot2">Slot 2 content</div>
    <div slot="slot3">Slot 3 content</div>
  </template-wc>
```

Also not that when a `template` is used with slots, the `ShadowRoot` can dispatch a `slotchange` event that can be picked up by an event listener.

### Declarative Shadow DOM

Declarative Shadow DOM (DSD) is a new Web Component option that has recently been supported by all evergreen browsers. While you can use DSD to create a Web Component without JavaScript, a better way to use it is with Server-Side Routing (SSR).

The Declarative Shadow DOM uses a `template` element with a `shadowrootmode` attribute set to "open" or "closed" (the same mode options in the `attachShadow` call). The markup to be rendered server-side would be put in the template. The Declarative Shadow DOM has the same level of encapsulation and rules as the regular Shadow DOM created inside the custom element.

 Here's an example what the markup would look like ([source code](https://github.com/cdoremus/web-component-demos/blob/main/dsd-js.html)):

```html
<html>
  <head>
    <script src="dsd-js.js"/>
  </head>
  <body>
    <header style="font-size:2rem;font-weight:900">Doing SSR with Declarative Shadow DOM</header>
    <dsd-wc>
    <template id="dsd-js" shadowrootmode="open">
        <style>
          div {
            font-size: 1.0rem;
            font-style: italic;
          }
        </style>
        <span>Enter Something: </span>
        <input />
        <button>Enter</button>
      </template>
    </dsd-wc>
    <hr/>
    <footer style="font-style: italic;">This is the footer</footer>
  </body>
</html>
```
To accomplish server rendering for SSR, this markup would be placed inside a server-rendered template like what is used by [EJS](https://ejs.co/) (or Deno-native [djs](https://github.com/syumai/dejs)).

A custom element would be created in a JavaScript file that is referenced in the markup. In the example, the `dsd-wc` element looks like this:
```js
// dsd-js.js
class DeclarativeShadowDOMWC extends HTMLElement {
  #internals;
  constructor() {
    super();
    this.#internals = this.attachInternals();
  }

  connectedCallback() {
    const shadowRoot = this.#internals.shadowRoot;
    const input = shadowRoot.querySelector("input");
    const button = shadowRoot.querySelector("button");
    button.addEventListener("click", () => {
      const text = input.value;
      if (text.length > 200) {
        alert("Too much text entered!!");
      } else {
        alert(`Text entered: ${text}`);
      }
    });
  }
}

customElements.define(  "dsd-wc",  DeclarativeShadowDOMWC);
```
As you can see in the example, the custom element is used to wire up events to make the component interactive.

By using the DSD on the server side, you avoid the unsightly FOUC (Flash Of Unstyled Content) that occurs when a custom element is displayed on a web page because it takes some time before the JavaScript (and possibly CSS) is downloaded before the custom element can be rendered.


### Light DOM and HTML Web Components

Web Components that do not use the Shadow DOM are called "Light DOM" Web Components. The use of this type of custom elements has increased recently because using the Shadow DOM brings some [disadvantages](https://www.matuzo.at/blog/2023/pros-and-cons-of-shadow-dom/).

The most obvious disadvantage is that with the Shadow DOM you do not have access to most global CSS styles ([for details see below](#style-inheritance)).

One implementation of the "Light DOM" is what has been called [HTML Web Components](https://adactio.com/journal/20618). HTML Web Components are a new term for a Web Component whose markup and content is wrapped inside the Web Component on the web page where it is used. Here's an example how you do that with Deno Fresh [from the demo app that goes with this blog post](https://github.com/cdoremus/fresh-webcomponents/blob/9acfe492365453abe3cf2bb53e0256679d204e58/routes/index.tsx#L32):

```tsx
  <counter-wc> // a custom element
    <div class="flex gap-8 py-6">
      <button class="px-2 py-1 border-gray-500 border-2 rounded bg-white hover:bg-gray-200 transition-colors">
        -1
      </button>
      <p id="counter-count" class="text-3xl">3</p>
      <button class="px-2 py-1 border-gray-500 border-2 rounded bg-white hover:bg-gray-200 transition-colors">
        +1
      </button>
    </div>
  </counter-wc>
```

Another alternative on this theme in a
Fresh app is to have the custom element's HTML content encapsulated in a Preact component. [The demo app accompanying this blog post](https://github.com/cdoremus/fresh-webcomponents/blob/main/islands/WCWrappedCounter.tsx) has an example:

```tsx
  <counter-wc>
    <WCWrappedCounter
      initialCount={3}
      attributes={{ title: "Preact-WC Counter button" }}
    />
  </counter-wc>
```

"Light DOM" and HTML Web Components can be used with any web server, not just Deno Fresh.

## Styling Web Components

Styling a Web Component can be done with CSS in two ways
- external - Uses a stylesheet external to the Web Component. This is not allowed when using the Shadow DOM, but if you are not using the Shadow DOM, you can use an external stylesheet file.
- internal - CSS styles are encapsulated within a Shadow DOM configured Web Component.

When using the Shadow DOM, class names only need to be unique within the component. So you can use common class names like "container" and not have to worry about external style interference.

In the case of "Light DOM" Web Components, the custom element's styles can be contained within the global stylesheet file, or you can create a custom-element specific stylesheet and link to it inside the custom element like this:

```js
class LinkedExternalStyleSheetWC extends HTMLElement {
  connectedCallback() {
    // link to an external CSS file
    this.innerHTML =
      `<link rel="stylesheet" href="custom-element-styles.css">`;
  };
    this.innerHTML +=
      `<h4>Hello World!!</h4>`; // styled by external CSS file
  };
};
```
The most common way to add CSS to a Web Component is to add it to the `innerHTML` using a string literal. This can be done in a component build with or without the Shadow DOM. Here's an example with a Shadow DOM component:

  ```js
  class CSSStyleTagWC extends HTMLElement {
    css = `
      .title: {
        font-size: 3rem;
        font-weight: bolder;
      }
    `;
    connectedCallback() {
      // attach the Shadow DOM to this component
      const shadow = this.attachShadow({ mode: "open" });
      let html = `<style>${this.css}</style>`;
      html += `<div class="title">Hello World in Red!!!</h4>`;
      // Add the HTML to the shadow DOM
      shadow.innerHTML = html;
      shadow.append(html);
    }
  }
```
A non-Shadow DOM component will add the component's markup to the component's `innerHTML`, so the last line in the `connectedCallback` method would be:
```js
  this.innerHTML = html;
```
In this case, the `shadow` variable will not be created.

### Using CSS Pseudo-selectors

Standard CSS pseudo-selectors (pseudo-elements and pseudo-classes) can be used with Web Components. However, there are a few that are designed specifically for Web Components.
- `:host` a pseudo-class that refers to the web component's custom element. This allows you to create styles that will effect the complete internal markup and content of the custom element.
You can also use the `:host()` function to focus your CSS styles to a specific custom element content area using a CSS selector as the argument.
- `::slotted()` is a pseudo-element function used to style the content of  `<slot>` elements. Its argument can be the wildcard (*) or a CSS selector.
- `::part()` a pseudo-element function that allows the styling of content inside a Shadow DOM from the outside. The part is signified with a `part` attribute on an element inside the Web Component. The argument of `::part()` can be the wildcard(*), meaning any markup with a `part` attribute. The value of a part attribute can be a string or multiple strings that are space separated. The `::part()` argument can have a value that is one of the possible `part` attribute's string values. Note that a CSS selector is not used here as an argument.

Let's look at an example that shows how each pseudo-selector is used. This example is of a page that represents a single question in a quiz. Its [source code can be found in this repo](https://github.com/cdoremus/web-component-demos/tree/main).

```html
<!-- From pseudo-selectors-quiz.html -->
  <div class="container">
    <div class="title">Web Component Demonstrating Pseudo-Selectors</div>
    <div>
      <quiz-page>
        <div slot="topic">Dev Question</div>
        <div slot="question">Are you a developer? </div>
      </quiz-page>
    </div>
  </div>
```
This HTML code shows the <quiz-page> custom element containing two slots (`topic` and `question`) that is configured in the component.

The component's JavaScript code -- `quiz-page.js` -- is setup with an open Shadow DOM. It also defines the internal CSS that includes the Web Component specific pseudo-class `:host` and the pseudo-element `::slotted`:

```js
// quiz-page.js
const css = `
  <style>
    :host {
      display:flex;
      background-color: aquamarine;
      border:3px solid black;
      width:60%;
      margin:0 auto;
    }
    ::slotted(*) {
      display:flex;
    }
    ::slotted(.topic) {
      font-size:2.5rem;
      font-weight:900;
      color: brown;
    }
    ::slotted(.question) {
      font-size:2rem;
      font-weight:900;
      color:blue;
    }
    .quiz-container {
      margin:1rem auto;
    }
    .button-group {
      display:flex;
      gap:2rem;
      margin:1rem 0;
    }
  </style>`;
// Define the template
const template = document.createElement("template");
template.innerHTML = `
    ${css}
    <div class="quiz-container">
      <slot name="topic"></slot>
      <slot name="question"></slot>
      <div class="button-group">
        <div part="answer default" role="button" tabindex="1">Yes</div>
        <div part="answer" role="button" tabindex="2">No</div>
        <div part="answer" role="button" tabindex="3">Maybe</div>
      </div>
    </div>`;
class QuizPage extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    // ...See the source code for the rest of the JS details
  }
}
customElements.define("quiz-page", QuizPage);
```
In this case the `:host` selector defines the style for the whole custom element including the layout, margins and background color.

The CSS rules containing various `slotted` selectors defines styling for generic and specific template slots. The `::slotted(*)` rule uses the wildcard to include all slots in the custom element. The `::slotted(.topic)` and `::slotted(.question)` selector define rules for slots with `topic` or `question` CSS classes. Note here that the argument needs to be a CSS selector.

The `::part` pseudo-element needs an external stylesheet to define the CSS rules for a `part` defined in the Web Component. Here's what the code looks like for the quiz page example:
```css
/* pseudo-selectors-quiz.css */
  div.title {
    margin:1rem auto;
    font-size:2.5rem;
    font-weight:900;
  }
  .container {
    display:flex;
    flex-direction:column;
    width:90%;
    margin:0 auto;
  }
  quiz-page::part(answer) {
    color: red;
    background-color:darkseagreen;
    font-weight:900;
    width: 5rem;
    height:2rem;
    text-align:center;
    line-height:2rem;
    border:2px solid black;
    border-radius:25%;
    cursor:pointer;
  }
  quiz-page::part(answer):focus {
    color:white;
    border: 4px solid red;
  }
  quiz-page::part(default) {
    font-style:italic;
  }
```
The `::part` pseudo-element selectors refer to Web Component elements that contain a `part` attribute. Note that the argument to the `::part` pseudo-elements are the values of the name attribute, not selectors like is used for the `slotted` selector.

Make sure you check out the quiz-page example [in the repo](https://github.com/cdoremus/web-component-demos/tree/main). The same repo contains a [page that displays a Web Component with multiple tabs](https://github.com/cdoremus/web-component-demos/blob/main/pseudo-selectors-tabs.html) that also uses custom element specific pseudo-selectors.

### Using Constructable Stylesheets

[Constructable Stylesheets](https://github.com/WICG/construct-stylesheets/blob/main/explainer.md) is a way to create a style sheet programmatically. It uses the standard [`CSSStyleSheet`](https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleSheet/CSSStyleSheet) class supported by all browsers.

To be used with a custom element, the `CSSStyleSheet` class needs to be instantiated outside of the component.

```js
const styleSheet = new CSSStyleSheet();
// Apply a rule to the sheet
styleSheet.replaceSync("h4 { color: green }");
class ConstructableStyleSheetWC extends HTMLElement {
  connectedCallback() {
    const shadowRoot = this.attachShadow({ mode: "open" });
    // Associate a constructed stylesheet to the shadow DOM
    shadowRoot.adoptedStyleSheets = [styleSheet];
    // Add another stylesheet rule
    styleSheet.insertRule(".green-text {font-style: italic}");
    shadowRoot.innerHTML =
      `<h4>Styled using CSSStyleSheet that styles <span class="green-text">green text and italics</span></h4>`;
  }
}
```
As seen in the example above, there are two `CSSStyleSheet` methods that are commonly used with a custom element:
- [`replaceSync`](https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleSheet/replaceSync) replaces stylesheet rules defined on a constructed stylesheet with the one's defined in the method's argument. There is an async version of this method ([`replace`](https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleSheet/replace)) that you might want to use for large replacements.
- [`insertRule`](https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleSheet/insertRule) which adds a new stylesheet rule to the constructed stylesheet.


There is also a [`deleteRule`](https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleSheet/deleteRule) method that uses a numeric index, requiring that you need to know the order of rules in the stylesheet. For instance, calling `deleteRule(0)` deletes the first rule in the constructed stylesheet.

Also note in the example code that the shadow DOM has an [`adoptedStyleSheet`](https://developer.mozilla.org/en-US/docs/Web/API/Document/adoptedStyleSheets) property to associate one or more constructed stylesheets to it.

### Style Inheritance and Custom Properties

As noted previously, web components created with a Shadow DOM have an isolated CSS scope. There are two exceptions to that rule, Style Inheritance and CSS Custom Properties.

Inherited Styles are CSS properties that are inherited down the DOM tree including the Shadow DOM. It means that a style property value when it is set on a DOM element, child elements automatically express the same style.

Inherited style properties include the `color` property, most `font` properties, and `list-style` related properties (see [the full list](https://web.dev/learn/css/inheritance#which_properties_are_inherited_by_default)). You can still override these properties inside your component.

CSS Custom Properties set globally can also be used to override CSS properties set inside the Shadow DOM. This can also be used to update an inherited CSS property. For instance you might have a CSS rule set in a global stylesheet outside the Web Component:
```css
:root {
  ----my-background-color: red;
}
```
The Web Component sets the custom property value using the CSS function `var()`, whose first argument is the custom property name and optional second argument is the property value if the custom property has not been defined. Here's what that looks like:
```js
const css = `<style>
  .myclass {
    /* bg-color is green if custom prop is not set */
    background-color: var(--my-background-color, green);
  }
</style>`;
class HelloWorldWC extends HTMLElement {
  connectedCallback() {
      const shadow = this.attachShadow({ mode: "open" });
      shadow.innerHTML = `${css}<div class="myclass">Hello World</div>`;
  }
}
```
CSS Properties give the Web Component author the ability to allow component users to customize the Web Component CSS.

## Using the JavaScript Custom Event API

JavaScript events can be used in custom elements. This allows you to for you to create and listen to custom events (the `CustomEvent` class).

Thee are two functions that can be used with JavaScript events:

- **`addEventListener()`** can be attached to any web component. It takes an event name (click, change, submit, etc) and a a callback that gets called when the event is triggered/dispatched.

- **`dispatchEvent()`** can be used to broadcast custom events to be picked up by event listeners listening to that specific event.

```js
  // create event with a detail(data payload)
  const customEvent = new CustomEvent("custom-event", {userId: 1, name: "John Doe"});
  // broadcast the event
  customElement.dispatchEvent(customEvent);
  // capture the custom event by another element
  anotherCustomElement.addEventListener("custom-event", (event) => {
    // get the event detail containing the event's data
    const user = event.detail;
    const userId = user.userId;
    // TODO: use the userId in application logic
  })
```

By dispatching a custom event in a Web Component you can send information to any element in the DOM tree that subscribes to that event using an event listener. The `CustomEvent` class used to do that has a constructor that takes a `String` -- the event name -- and an object that contains data to be passed onto event listeners in its `detail` property.

## Working with Forms and ElementInternals

Custom elements can contain HTML forms and they will function normally. The [FormWC.ts](https://github.com/cdoremus/fresh-webcomponents/blob/main/components/wc/FormWC.ts) Web Component that is part of the application that accompanies this blog post is an example.

But when one or more form elements are contained in a component to be used with an external form, interactions can be complicated.

If the Web Component is in the Light DOM, then form elements in the component will have no problem as an element in an externally-defined form.

But a custom element that uses the Shadow DOM to encapsulate a `<text>`, `<textarea>` and `<select>`, they are not automatically associated with a containing form. Hacks around this limitation included adding hidden elements to the form to push the data into the form or using a `formdata` event listener to update the form's data before the form is submitted.

Shadow DOM form components also do not have access to the standard [Constraint Validation API](https://developer.mozilla.org/en-US/docs/Web/HTML/Constraint_validation) for validating form values.

A new Web Component standard DOM interface called [`ElementInternals`](https://developer.mozilla.org/en-US/docs/Web/API/ElementInternals) seamlessly integrates shadow DOM created form elements into the enclosing external form. All modern browsers support this standard.

This interface requires the custom element to have a static `formAssociated` property with a value of `true`. An additional lifecycle method is then available, `formAssociatedCallback(form)`, which is called when the form elements inside the component are associated with the external form.

For instance, HTML containing an external form and a form-associated custom element might look like this ([full source code](https://github.com/cdoremus/web-component-demos/blob/main/form.html)):

```html
  <form id="name-form">
    <label for="input-name" id="label-name">
      Enter Name:
    </label>
    <div>
      <!-- Defined in MyNameInput class shown below -->
      <my-name-input id="input-name"></my-name-input>
    </div>
    <div>
      <input type="submit" value="Enter"></input>
    </div>
  </form>
  <div id="output"></div>
  <script>
    // Listen to submit event and display the input's value
    const form = document.querySelector("#name-form");
    form.addEventListener("submit", (e) => {
      // display the input value
      const output = document.getElementById("output");
      output.innerHTML = `Input value: ${e.target[0].value}`;
      // do not refresh the page (suppress the default form action)
      e.preventDefault();
    });
  </script>
```
Here we are listening to the form's submit value to get the value of the `<input>`that is created inside the a Web Component. Normally, this value would be retrieved on the server.

The `my-name-input` component's code would look like this ([full source code](https://github.com/cdoremus/web-component-demos/blob/main/form-wc.js)):

```js
class MyNameInput extends HTMLElement {
  // Required static property indicating
  // this component is associated with a form
  static formAssociated = true;
  id = "";
  constructor() {
    super();
    // Use the component's id as the id (and name) of the input
    this.id = this.getAttribute("id");
    // Get reference to ElementInternals
    this.internals = this.attachInternals();
  }
  connectedCallback() {
    const shadow = this.attachShadow({ mode: "open" });
    shadow.innerHTML = `
    <style>input { width: 20%; }</style>
    <input type="text" id="${this.id}" name="${this.id}" placeholder="Enter name here"/>`;
    // monitor input values on change
    shadow.querySelector("input").addEventListener("change", (e) => {
      console.log("onchange value: ", e.target.value);
      // the label's text
      console.log("Label: ", this.internals.labels[0].textContent);
      this.setValue(e.target.value);
    });
  }
  // Additional lifecycle method called when component is
  // form associated
  formAssociatedCallback(form) {
    console.log("formAssociatedCallback called on form: ", form);
  }
  // set form value
  setValue(v) {
    this.value = v;
    this.internals.setFormValue(v);
  }
}
// register component
customElements.define( 'my-name-input', MyNameInput);
}
```
Note the use of `attachInternals()` to get a handle on some of the external form's properties. In addition, the value of the component's `id` attribute is used to set the `id` of the component's `input` element. This makes the label's text available to the component, something that is not available without the `ElementInternals` reference. This relation between the label and it's associated input value is important for accessibility. `ElementInternals` also includes [many other ARIA properties](https://developer.mozilla.org/en-US/docs/Web/API/ElementInternals#instance_properties_included_from_aria) that can be set on form elements.

The `ElementInternals` interface can also used to get a handle to the Declarative Shadow DOM declared on a `template` element. See [the DSD example for an example of how to do this](https://github.com/cdoremus/web-component-demos/blob/main/dsd-js.js).

## Web Components and Accessibility

Creating accessible web applications is not an easy task. There is a lof of stuff to know. Rather than turning this section into a treatise on accessibility, I'm just going to give some links on where to get more information on the subject.

But before I unveil the links, I'd like to talk a bit about accessibility roles. They are probably the simplest accessibility feature to implement. It involves the use of a `role` attribute associated with each HTML element that expresses some functionality.

Still, a lot of elements have intrinsic roles, which should be checked before you decide to add a `role` attribute to an element. You can ([do that here](https://www.w3.org/TR/html-aria/#document-conformance-requirements-for-use-of-aria-attributes-in-html)).


But if you are going to use an element for a function that is normally not used you need to explicitly designate that role. For instance, on a `div` that is used as a button, you should give that element a button role. Check [this list of possible ARIA roles](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles) for role options and select the one that is appropriate for each element.

OK, back to the list of links. Since, I am not an accessibility expert, I offer these links from people who actually know what they are talking about:
- [Accessibility for Web Components](https://developer.salesforce.com/blogs/2020/01/accessibility-for-web-components)
- [A Guide to Accessible Web Components](https://www.erikkroes.nl/blog/accessibility/the-guide-to-accessible-web-components-draft/)
- [Web Components Accessibility FAQ](https://www.matuzo.at/blog/2023/web-components-accessibility-faq)
- [Accessibility Object Model](https://github.com/WICG/aom?tab=readme-ov-file)

Before I close out this section, I should mention that a company that has a reusable suite of Web Components with accessibility baked into each custom element, will make their web developer's job a lot easier.

# Using Web Components with Deno

Any web server can serve a Web Component used in a static HTML page including one that's built with Deno or one that works with the Deno runtime (like [Hono](https://hono.dev/)).

Still, server-side routing is popular these days for it's performance boost and [Fresh](https://fresh.deno.dev) is the Deno-native SSR choice of most Deno devs as it is supported by the Deno team. I have put together a Fresh app that serves a collections of web components. The [source code](https://github.com/cdoremus/fresh-webcomponents) is available as is the [deployed application](https://fresh-webcomponents.deno.dev).

But before we get into that, let's look at how the built-in Deno server `Deno.serve` can be used to serve web components.

## Using `Deno.serve`

If you want to serve static content containing a Web Component using a Deno-native server, then `Deno.serve` is a good option.

I have created an [example showing how `Deno.serve` can be used to serve a static HTML file containing web components in a Code Sandbox dev container](https://codesandbox.io/p/devbox/deno-wc-server-47vfpc?file=%2Fstatic%2Fstyles.css%3A33%2C16) to illustrate this. It displays two instances of a simple "Hello World" custom element on the app's home page.

You can also use `Deno.serve` to stream an HTML file containing web components [as is shown in this Deno Deploy Playground](https://dash.deno.com/login?redirect=/playground/shadowroot-streams)  (created by [Nathan Knowler](https://sunny.garden/@knowler/111466434753583873)).

However, I am going to concentrate on how to use Web Components in a [Deno Fresh](https://fresh.deno.dev) app to allow you to focus on building and using web components without having to deal with server or routing issues. When used with Fresh, they will function like a island component.

## Using a Web Component with Deno Fresh

The [Deno Fresh](https://fresh.deno.dev) full-stack web framework uses [Preact](https://preactjs.com/) -- a scaled-down version of [React](https://react.dev/) -- under the covers to serve web sites and applications. While React requires a bit of juggling to use web components (although that is [changing in React 19](https://react.dev/blog/2024/04/25/react-19#support-for-custom-elements)), Preact was built to [fully support web components](https://preactjs.com/guide/v10/web-components/).

Besides supporting rendering Web Components, Preact allows its functional components to be exposed as a Web Component. We will not cover that behavior, but you can discover it in the [Preact Web Component Documentation](https://preactjs.com/guide/v10/web-components/#creating-a-web-component). Instead, we will focus on how to use Web Components with Preact in Deno Fresh.


The best way to integrate Web Components with Fresh is to use Fresh for server-side rendering and routing. Here's a simple web component that displays a message:
```ts
class HelloWC extends HTMLElement {
  message;
  constructor() {
    super();
    this.message = this.getAttribute("message") ?? "World";
  }
  connectedCallback() {
    this.innerHTML =
      `<div style="border: 2px solid black; border-radius: 10px; margin: 10px 5px; padding: 5px 10px;">
        <h4>Hello ${this.message}!!</h4>
      </div>`;
  }
}
customElements.define("hello-wc", HelloWC);
```
Using that component on a page would look like this:
```jsx
export default function CustomElementsPage(props) {
  return (
    <div class="px-4 py-8 mx-auto bg-[#86efac]">
      <div class="text-3xl font-bold">Web Component Custom Elements</div>
      <hr />
      <div>
        <h3>Greeting Web Component</h3>
        <hello-wc></hello-wc>
      </div>
      <hr />
      {/* ... other web components here */}
    </div>
}
```
As you know if you programmed in Fresh before, a page like this located inside the `routes` folder will define a route.

If you need to access the instance of a web component that is part of the markup rendered by a Fresh/Preact component, you need to use a `ref`. Here's an example of how to do that [taken from the Preact documentation](https://preactjs.com/guide/v10/web-components/#accessing-instance-methods):
```js
function Foo() {
  const myRef = useRef(null);

  useEffect(() => {
    if (myRef.current) {
      myRef.current.doSomething();
    }
  }, []);

  return <x-foo ref={myRef} />;
}
```

### HTML Web Components in Fresh

As stated [previously](#html-web-components), HTML Web Components are components where all the content comes from child elements.

```ts
// CounterWC.ts
class CounterWC extends HTMLElement {
  buttons: NodeListOf<HTMLButtonElement>;
  counterCount: HTMLElement;
  constructor() {
    super();
    this.buttons = this.querySelectorAll("button");
    this.counterCount = this.querySelector("#counter-count") as HTMLElement;
  }
  connectedCallback() {
    for (const button of this.buttons) {
      button.addEventListener("click", () => {
        const countHTML = parseInt(this.counterCount.innerHTML);
        this.counterCount.innerHTML = (countHTML as number +
          parseInt(button.innerHTML)).toString();
      });
    }
  }
}
customElements.define("counter-wc", CounterWC);
```

```jsx
  <counter-wc>
    <div class="flex gap-8 py-6">
      <button class="px-2 py-1 border-gray-500 border-2 rounded bg-white hover:bg-gray-200 transition-colors">
        -1
      </button>
      <p id="counter-count" class="text-3xl">3</p>
      <button class="px-2 py-1 border-gray-500 border-2 rounded bg-white hover:bg-gray-200 transition-colors">
        +1
      </button>
    </div>
  </counter-wc>
```
All the functional logic -- button clicks -- are contained in the Web Component, while the child elements were responsible for layout in conjunction with external stylesheets.

Note that the `class` values are Tailwind helper selectors (see [Tailwind section below](#using-tailwind-with-fresh)).

NNNNNNNNNNNNNNNNNNNNNNNNNN

### Using TypeScript with Fresh-deployed Custom Elements

Custom Elements can be authored using TypeScript, but it requires that you have a way to transform TypeScript into JavaScript and put the JS file in Fresh's `static` folder or subfolder.

When I did this for the [example app](https://fresh-webcomponents.deno.dev/), I decided to have them compiled into a single file, so that I would only need one script tag in the page head to cover all web components. I used `esbuild` to do this. A `build-wc.ts` file was created with this content:
```ts
  import * as esbuild from "https://deno.land/x/esbuild@v0.19.2/mod.js";
  import { denoPlugins } from "https://deno.land/x/esbuild_deno_loader@0.8.2/mod.ts";

  await esbuild.build({
    plugins: [...denoPlugins()],
    entryPoints: ["./components/wc/mod.ts"],
    outfile: "./static/wc/wc.esm.js",
    bundle: true,
    minify: false,
    banner: { js: "// deno-lint-ignore-file" },
    format: "esm",
  });
  esbuild.stop()
```
This build can handle both TypeScript and JavaScript files. The TS files would be transformed into JS files during the build.

The `mod.ts` file exports all the web component files, both those written in TypeScript and JavaScript. In this case, that's all the files in the `components/wc` folder. The `esbuild` tool cannot handle transforming multiple files into a single bundle file without an entrypoint, so the `mod.ts` file is used as the entry point for all of them.

The `mod.ts` file could be created programmatically from a list of `components/wc` files, but I decided not to do that to simplify the build process.

The final bundle is contained in the `wc.esm.js` file.

When you use a custom element in a Fresh application, you'll notice that they will throw an error in the vscode (and probably other LSPs too). In order to remove this error you have to register the TypeScript type of the custom element with the Fresh application.

In order to do that you need to create records in a `types.ts` file that extends `JSX.IntrinsicElements` for custom element tags. In the [Fresh web component demo app](https://github.com/cdoremus/fresh-webcomponents/blob/main/types/types.ts) that I created for this blog post.

Here's what a simple custom element type definition would look like ([from this source code](https://github.com/cdoremus/fresh-webcomponents/blob/main/types/types.ts)):
```ts
interface HelloWCProps extends JSX.HTMLAttributes<HTMLElement> {
  message?: string;
}
declare module "preact" {
  namespace JSX {
    interface IntrinsicElements {
      // Web components registered below
      "hello-wc": HelloWCProps;
    }
  }
}
```
Note how the component's element/tag is added to the `JSX` namespace referencing the interface defining the component and it's attributes and that the interface extends `JSX.HTMLAttributes` with an `HTMLElement` generic type parameter. This allows the use of the custom element's tag inside the Fresh JSX without any IDE errors. Otherwise, you need to add a `@ts-ignore` comment above the tag. This suppresses the LSP error and the custom element will still work in Fresh.

If your custom element does not have any attributes, you can define it within the JSX namespace without the need for an interface:
```ts
declare module "preact" {
  namespace JSX {
    interface IntrinsicElements {
      //  A custom elements without attributes
      "two-up": JSX.HTMLAttributes<HTMLElement>;
    }
  }
}
```

If you are using a `template` tag in your JSX like when you are using one or more `<slot>` tags in your custom element, you need to define the template in the `JSX` namespace like this:
```ts
declare module "preact" {
  namespace JSX {
    interface IntrinsicElements {
      // This fixes TypeScript error: "Property 'template' does not exist on JSX.IntrinsicElements"
      "template": JSX.HTMLAttributes<HTMLTemplateElement>;
    }
  }
}
```
As [show in the example code](https://github.com/cdoremus/fresh-webcomponents/blob/main/types/types.ts), the type definitions can be created for components created with JavaScript or Typescript for use in Fresh TS markup. [As seen below](#lit-and-typescript) this type definition can be used for components created with the [Lit](https://lit.dev/) web component framework.

### Using Tailwind with Fresh

The [Tailwind](https://tailwindcss.com/) helper CSS class transformation is built into the Fresh framework. As such, it can be used in web components that run in a Fresh app. The `tailwind` support added in Fresh v1.6.0 replaces `twind`, a separate tailwind transformation that uses Tailwind helper selectors, but runs behind Tailwind in Tailwind's helper class support.

To get native-Tailwind working with web components you need to add a line pointing to the web components in the `static` folder to `tailwind.config.ts`:
```ts
  content: [
    "{routes,islands,components}/**/*.{ts,tsx}",
    "static/wc/*.js",
  ],
```
The first line refer to Fresh components, while the second one refers to the web components. It's probably a good idea to put those files in a separate folder within `static`.

Another option for using `tailwind` with web components in Fresh is to use JSX as the custom element's content. In this case, the content is annotated with the tailwind selectors. Here's an example:

```ts
    <counter-wc>
      <div class="flex gap-8 py-6">
        <button class="px-2 py-1 border-gray-500 border-2 rounded bg-white hover:bg-gray-200 transition-colors">
          -1
        </button>
        <p id="counter-count" class="text-3xl">3</p>
        <button class="px-2 py-1 border-gray-500 border-2 rounded bg-white hover:bg-gray-200 transition-colors">
          +1
        </button>
      </div>
    </counter-wc>
```

The element's `class` attribute in the example above is annotated with the names of Tailwind helper selectors. The Tailwind transformation involves including Tailwind's helper selectors (like `text-3xl` or `px-2`) in the app's deployed CSS.

## Creating Web Components with Lit

There are a number of third party libraries that extend Web Components. They include [Stencil](https://github.com/ionic-team/stencil), [Lightning Web Components](https://github.com/salesforce/lwc), [WebC](https://github.com/salesforce/lwc) and [Enhance](https://enhance.dev/). But [Lit](https://lit.dev/) (formerly Polymer) is the granddaddy of them all and probably the most used lib, so that's the library I'm going to cover.

Modern Lit uses decorators to define and register a Web Component. By doing this, they remove a lot of the boilerplate required to create a web component. The `customElement`, `property` and `properties` decorators are the most common [Lit decorators](https://lit.dev/docs/components/decorators/) used.

Unfortunately, browsers do not support decorators at this point even though they are at [Stage 3 in the TC-39 standardization process](https://github.com/tc39/proposal-decorators). In order for Lit decorators to work, you need to [transpile the Lit code](https://lit.dev/docs/tools/publishing/#publishing-modern-javascript).

One way to do the transpilation is to [use Vite as is shown in this repo](https://github.com/bluwy/create-vite-extra/tree/master/template-deno-lit-ts). I really didn't want to get into another build process besides that one used by Fresh, so I decided to create a couple of Lit components without decorators.

You create a Lit web component by creating a JavaScript or TypeScript that extends `LitElement`. Here's an example of a Lit counter component that has the same functionality as the counter component of a newly created Deno Fresh application using the :
```js
export class LitCounter extends LitElement {
  static #INITIAL_COUNT = 3;
  static properties = { count: 0 };

  constructor() {
    super();
    this.count = LitCounter.#INITIAL_COUNT;
  }

  // Turn off shadow DOM
  createRenderRoot() {
    return this;
  }

  increment = () => {
    this.count = this.count + 1;
  };

  decrement = () => {
    this.count = this.count - 1;
  };

  render() {
    return html`
      <div class="flex gap-8 py-6">
        <button class="px-2 py-1 border-gray-500 border-2 rounded bg-white hover:bg-gray-200 transition-colors"
          @click=${this.decrement}>
          -1
        </button>
        <p class="text-3xl">${this.count}</p>
        <button class="px-2 py-1 border-gray-500 border-2 rounded bg-white hover:bg-gray-200 transition-colors"
          @click=${this.increment}>
          +1
        </button>
      </div>
    `;
  }
}

customElements.define("lit-counter",  LitCounter);
```

The static `properties` class variable holds an object with members that are class properties that are bound to component attributes. This are termed _reactive properties_ because any update of their value triggers a component re-render.

The `properties` object can contain members that are not linked to a component attribute. These are part of what is called [internal reactive state](https://lit.dev/docs/components/properties/#internal-reactive-state). They are also reactive properties. You can use the `{state: true}` property option to declare an internal reactive state property.

TODO: Flesh out the diff between reactive, bound and unbound properties: NNNNNNNNNNNNNNNNN

The `render()` method is where the component's content is rendered. It returns a `TemplateResult` type. with Lit-specific attributes corresponding to standard DOM event handlers (`@click` in the example corresponding to the `onclick` attribute).

The standard Web Component lifecycle methods like the `constructor`, `connectedCallback`, `disconnectedCallback` and `attributeChangedCallback` is available with Lit. But Lit adds other methods. The `render` method is one of those previously described. See the [Lit lifecycle documentation](https://lit.dev/docs/components/lifecycle/) for more details.

Lit has two useful [tagged template literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#tagged_templates) `html` and `css` which is used to create HTML and CSS markup.

### Lit and TypeScript

When working with Deno and Lit using TypeScript in the vscode IDE you will get errors because the Deno LSP does not recognize Lit properties as class-level variables. In order to avoid this error, you need to declare the variable and initialize it like `message` is done in this example ([source code here](https://github.com/cdoremus/fresh-webcomponents/blob/main/components/wc/MyLitMessage.ts)):
```ts
export class MyLitMessage extends LitElement {
  // Needed for TypeScript since it does not recognize
  //  TS properties as class-level variables
  message = "";
  static get properties() {
    return {
      message: { type: String },
    };
  }
// ... more stuff here including constructor & render() impl
}
```

As stated above, Lit decorators do not work in Deno because Deno does not transpile decorators to JS that run in a browser and browsers do not implement decorators as they recently entered [Stage 3 of the TC-39 standardization process](https://github.com/tc39/proposal-decorators).

If you want to make the component usable in a Fresh app's `JSX` and not throw errors in VSCode or another IDE, you'll need to add an interface and reference to the `JSX` namespace in a `types.ts` file. Here's what that looks like for a Lit component ([from this source code](https://github.com/cdoremus/fresh-webcomponents/blob/main/types/types.ts)):

```ts
interface MyLitMessage extends JSX.HTMLAttributes<LitElement> {
  message: string;
}
declare module "preact" {
  namespace JSX {
    interface IntrinsicElements {
      "my-lit-message": MyLitMessage;
      // ... other components here
    }
  }
}
```
Note that the interface extends `JSX.HTMLAttributes` with a `LitElement` generic type parameter. This allows the use of the custom Lit element's tag inside the Fresh `JSX` without any IDE errors.


You can use the [esbuild bundling code shown above](#using-typescript-with-fresh-deployed-custom-elements) to build a a Lit component created without decorators in TypeScript or JavaScript. In order to do that make sure the `esbuild` entry point ([`mod.ts` in the example app](https://github.com/cdoremus/fresh-webcomponents/blob/main/components/wc/mod.ts)) contains an export for each Lit component.

## Using Third-party Web Components

I should note up front that most third-party web components are setup to be used exclusively with Node.js. That does not mean you can't use all of those components, you just have to figure out how to do it.

One way is to download the web component's source code and put it in a folder accessible by your web server. Still if there are a lot of CommonJS imports, you have a bit of work to convert them to ESM imports. This can be a big hassle, but using an `npm:` prefix in the import helps.

Some of them do offer a URL that can be used in a `<script>` tag to make them available on the page. That would look like this:
```html
  <script
    type="module"
    src="https://cdn.jsdelivr.net/npm/emoji-picker-element@^1/index.js"
  >
  </script>
```
To use a component like that you need to know the tag name used in the `customElements` registry definition. When you do that, the component above would look like this on the page:
```html
  <emoji-picker-element></emoji-picker-element>
```
Hopefully, the custom element's attributes would be well documented and any content child content that the element would allow. Also, if the element has any custom properties, that should also be documented as it is a good way for a developer to allow customization of the component, especially its look and feel.

Many third-party web components are deployed to a specific CDN while others can be accessed using [unpkg](https://unpkg.com/) which serves components deployed to npm. Also, web components published on GitHub can be accessed from a URL (use the Raw view to obtain the URL).

