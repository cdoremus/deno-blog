<!-- deno-fmt-ignore-file -->
#### 2024-02-26
##### _21 min read_

# Using Web Components with Deno and Fresh

## Table of Contents
  - [Introduction](#introduction)
  - [Developing a Web Component](#developing-a-web-component)
    - [Why Web Components](why-web-components)
    - [Using Web Components with Deno](#using-web-components-with-deno)
    - [Creating a Web Component](#creating-a-web-component)
      - [Web Component Lifecycle](#web-component-lifecycle)
      - [Encapsulation with the Shadow DOM](#encapsulation-with-the-shadow-dom)
      - [Declarative Shadow DOM](#declarative-shadow-dom)
      - [Templates and Slots](#templates-and-slots)
      - [HTML Web Components](#html-web-components)
    - [Styling Web Components](#styling-web-components)
      - [Using CSS Pseudoclasses with Web Components](#using-css-pseudoclasses-with-web-components)
      - [Using Constructable Stylesheets](#using-constructable-stylesheets)
      - [Style Inheritance](#style-inheritance)
    - [Using the JavaScript Custom Event API](#using-the-javascript-custom-event-api)
    - [Working with Forms](#working-with-forms)
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

Web Components are a web standard way of creating reusable custom HTML elements. In essence they extend native HTML element functionality. They can be used with or without a web framework like [Deno Fresh](https://fresh.deno.dev) or from a static HTML page served from a server like one that uses `Deno.serve`.

This blog post will focus on how to use web components in Deno with special emphasis on using them with Fresh. There is also a Fresh application that accompany's this blog post.

But before we talk about Deno and Fresh, you need to know about how Web Components work and how to use them. If you already have an understanding of Web Components, you can skip to the [Using Web Components with Deno](#using-web-components-with-deno) section.


# Developing a Web Component

The Web Component standard is a means for creating custom HTML elements with structure, attributes and behavior like their native cousins. Technically, a Web Component encompasses two standards:
- [Custom Elements](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements): custom-made HTML tags.
- [The Shadow DOM](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM): a means for isolating the custom element from the external document.

A web component is created using a JavaScript class that extends `HTMLElement`, the parent of all HTML elements. The custom element can be associated with the Shadow DOM when it's created.

## Why Web Components

The first question that comes up in a Web Component discussion is why: why would I use Web Components when I've got Fresh, React, Preact, Vue, Svelte, Angular, etc. instead. Here's my take on that answer:

1. Web components are lightweight and do not need any extra JavaScript/TypeScript libraries to work since the APIs are built into the browser. Many  web frameworks are getting a lot of flack because of the amount of JS they send to the client.
2. They are supported by all modern web browsers including ones on mobile phones. This has only happened in the last few years.
3. They can be used with most web frameworks. So if your team or company uses different frameworks on different sites, you could use them on all of them.
4. Since Web Components are build into the browser, they will always be supported and backwardly compatible as opposed creating components with a framework that can introduce periodic breaking changes.
5. They require a good understanding of DOM APIs, something that many JS/TS developers do not know well because they work with web frameworks that abstract them away. Still, knowledge of JavaScript fundamentals are important for every webdev in order to fully understand what's going on under the covers.

I also have to admit that there is something rather liberating about having full control of a component you have created rather than relying on sometimes clunky ways to do things when you use a component created in a web framework.

## Creating a Web Component
You create a web component custom element using a JavaScript class that extends the `HTMLElement` interface. The simplest 'Hello World' example looks like this:
```js
class HelloWC extends HTMLElement {
  // lifecycle method called  when the component is loaded into the DOMs
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

### Web Component Lifecycle

The custom element lifecycle methods include:

| Function |Behavior|
| ------- | ---------- |
| `constructor()` | Called when the component instance is created.|
| `connectedCallback()` | Called when DOM is mounted. This is the place to get the initial the value of component attributes. |
| `disconnectedCallback()` | Called when DOM is unmounted. Often used to cleanup something a resource like a timer with `clearInterval`. |
| `attributeChangedCallback(attrName, oldVal, newVal)` | Called when an observed attribute is changed. The arguments are the attribute name (attrName), the old value (oldVal) of the attribute and the attribute's new value (newVal) |
|`adoptedCallback`| Called when an element is moved to a new document like a new window frame |

Most of the time a web component only needs the `constructor` and/or the `disconnectedCallback` method. Either can be used to setup the web component.

The `attributeChangedCallback` method will be called when an attribute's value is configured as dynamic in the client and the value changes from direct or indirect user interaction. It also requires a `observedAttributes` static property that returns an
array of attribute values.

```js
class AttributeChangedWC extends HTMLElement {
  // required for attributeChangedCallback to function
  static get observedAttributes() {
    return ["add"];
  }
  connectedCallback() {
    this.add = this.getAttribute("add");
    this.innerHTML = `
      <style>.sum { font-weight: bold; }</style>
      <p>Sum: <span class="sum">0</span></p>
    `;
  }
  attributeChangedCallback(attrName, oldValue, newValue) {
    if (attrName === "add") {
      let sum = 1;
      // get reference to the element to hold the sum
      const sumDisplay = this.querySelector(".sum");
      if (oldValue !== null) {
        sum = parseInt(oldValue) + parseInt(newValue);
      } else {
        sum = parseInt(newValue);
      }
      // update the sum
      sumDisplay.innerHTML = sum;
    }
  }
```
The client app that displayed this Web Component would have a form that would update the component's `add` attribute that would invoke the `attributeChangedCallback` method.

### Encapsulation with the Shadow DOM

The Web Component standard includes a concept called the Shadow DOM, an isolated DOM tree that encapsulates styles and DOM nodes inside a custom element.

What this means is that styles outside of your component cannot influence elements inside your web component (outside of inherited CSS properties like `color` or `font-size` and CSS custom properties).

Similarly, a Web Component with Shadow DOM enabled isolates the DOM inside the component, so that, for instance, if you call `document.querySelectorAll('button')` outside the web component, buttons inside will not be part of the `button` collection result set.

The shadow DOM has two modes:
- open - where the Web Component's CSS and DOM is isolated. In open mode, external JavaScript can still access the component's internals.
- closed - where the Web Component's CSS, DOM and external JavaScript is completely isolated.

You use the `attacheShadow` built-in custom element method to enable shadow DOM. Calling that method in the `constructor` with an "open" mode assigns the `shadowRoot` property that can be used to add content to the shadow DOM with the `append` method:

```javascript
class MyShadowDomWC extends HTMLElement {
  constructor() {
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
The `attachShadow` method can be also called inside `connectedCallback` to set a local shadow root reference.

The `append` method is used to add elements to the shadow root.

If you look at the Elements tab in the Developer Tools, you'll see the shadow root with its DOM tree.

| Shadow DOM visualized in the Chrome Developer Tools |
|------|
| ![Shadow DOM in Dev Tools](/img/blog/web-components/ShadowDom_DevelopersToolsView.png) |

Inside the Developer Tools, the Shadow DOM is bounded by a `#shadow-root (open)` delimiter. The [Shadow Root ](https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot) is the root node of the Shadow DOM. It has it's own properties and an event. See [the MDN documentation](https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot) for more details.

To set the Shadow DOM mode to closed, just change the mode from "open" to "closed" in the `attacheShadow` call:
```javascript
    const shadowRoot = this.attachShadow({ mode: "closed" });
```
When this is done, the Developer Tools shadow root notation shows `closed` in the Elements tab.

### Templates and Slots

Web components can also use the built-in HTML `<template>` and `<slot>` tags to hold content displayed by the component. The `<template>` tag is a container for DOM nodes. If it is used on a web page, the content is not visible, but it can be used as a container for markup to be used elsewhere including a custom element.

A `<slot>` is an HTML element used inside a template tag as a content placeholder. It is only available in a web component that uses the Shadow DOM.

JavaScript is used to replace the `<slot>` tag with other content at runtime. A slot can be identified using the `name` attribute. In that case, the content needs to have a `slot` attribute corresponding to the name. Taken from the [demo app accompanying this blog post](https://github.com/cdoremus/fresh-webcomponents/tree/main), here's what that would look like:
```tsx
  <templated-wc>
    <template id="template-wc">
      <div class="container">
        <span id="title">This is inside the template</span>
        <slot></slot>
        <slot name="slot2"></slot>
        <slot name="slot3"></slot>
      </div>
    </template>
    <div slot="slot3">Slotted content3</div>
    <div slot="slot2">Slotted content2</div>
    <div>Slotted content1</div>
  </templated-wc>
```
The web component needed to declare that the component uses Shadow DOM with a `this.attachShadow` call. The `connectedCallback` method holds all the logic:
```ts
  connectedCallback() {
    const shadow = this.attachShadow({ mode: "open" });
    const template = document.querySelector("#template-wc");
    // 'this.css' was defined earlier
    shadow.innerHTML = `<style>${this.css}</style>`;
    // @ts-ignore bad error: "content does not exist on type element"
    shadow.appendChild(template!.content.cloneNode(true));
  }
```
A reference to the `<template>` tag is obtained and its content is cloned to add its content to the Shadow DOM.

Here's what the component looks like when rendered in the browser:

![Rendered custom element with a template and slots](/img/blog/web-components/RenderedTemplateWC_Screenshot.png)

Note that the first slot does not have a name attribute. That slot was replaced with content that does not have a `slot` attribute. When only one slot is used in a template its `name` attribute is not needed.

You could also define the template in JavaScript code using a string literal like this which is a drop-in replacement for the template defined within the component's markup:
```ts
const template = document.createElement("template");
template.setAttribute("id", "template-wc");
template!.innerHTML = `
  <div class="container">
    <span id="title">This is inside the template</span>
    <slot></slot>
    <slot name="slot2"></slot>
    <slot name="slot3"></slot>
  </div>
`;
```

### Declarative Shadow DOM

Declarative Shadow DOM (DSD) is a new Web Component option that has recently been supported by all evergreen browsers. DSD is a way to create a Shadow DOM without JavaScript using template and slot tags. You defined a DSD component using the `shadowrootmode` attribute on the `<template>` tag. Like the `attachShadow` mode options, there are two possible values for the `shadowrootmode` attribute: "open" and "closed".

The Declarative Shadow DOM has the same level of encapsulation and rules as the regular Shadow DOM created inside the custom element. Here's an example:

```html
<body>
  <template shadowrootmode="open">
    <style>
      :host {
        margin: 0;
        padding: 1rem;
        display: grid;
        gap: 1rem;
        grid-template:
          "header" max-content
          "content" auto
          "footer" max-content / 100%;
      }

      slot * {
        background-color: hsl(0 0% 90%);
      }

      ::slotted(*) {
        background-color: hsl(160 50% 90%);
      }

      slot *,
      ::slotted(*) {
        padding: 1rem;
      }
    </style>
    <slot name="header" style="grid-area: header;">
      <header>Header is loading</header>
    </slot>
    <slot name="content" style="grid-area: content;">
      <main>
        <div>Content is loading</div>
      </main>
    </slot>
    <slot name="footer" style="grid-area: footer;">
      <footer>Footer is loading</footer>
    </slot>
  </template>

  <header slot="header">
    <h2>Declarative Shadow DOM Example</h2>
  </header>
  <main slot="content">
    <h4>Page content goes here</h4>
  </main>
  <footer slot="footer" style="font-style: italic;">This is the footer</footer>
</body>
```
 This is what the component looks like when rendered in a browser:

 ![Rendered Declarative Shadow DOM web component](/img/blog/web-components/DSD_Screenshot.png)

### HTML Web Components

Web components that do not use the Shadow DOM are called "Light DOM" Web Components. The use of this type of custom elements has increased recently because using the Shadow DOM brings some [disadvantages](https://www.matuzo.at/blog/2023/pros-and-cons-of-shadow-dom/).

The most obvious disadvantage is that with the Shadow DOM you do not have access to most global CSS styles ([for details see below](#style-inheritance)).

One use of the "Light DOM" are in what has been called [HTML Web Components](https://adactio.com/journal/20618). HTML Web Components are a new term for a Web Component whose markup and content is wrapped inside the web component. Here's an example how you do that with Fresh [from the demo app that goes with this blog post](https://github.com/cdoremus/fresh-webcomponents/blob/9acfe492365453abe3cf2bb53e0256679d204e58/routes/index.tsx#L32):

```ts
  <counter-wc> // a custom-element
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

Another alternative on this theme in a Fresh app is to have the custom element's HTML content encapsulated in a Preact component. [The demo app accompanying this blog post](https://github.com/cdoremus/fresh-webcomponents/blob/main/islands/WCWrappedCounter.tsx) has an example:

```ts
  <counter-wc>
    <WCWrappedCounter
      initialCount={3}
      attributes={{ title: "Preact-WC Counter button" }}
    />
  </counter-wc>
```

In order for an HTML Web Component to work with Fresh, the component must not use the Shadow DOM.

## Styling Web Components

Styling a Web Component can be done with CSS in two ways
- external - This is not allowed when using the Shadow DOM, but if you are not using the Shadow DOM, you can style with an external stylesheet file.
- internal - CSS styles encapsulated within a Shadow DOM configured Web Component.

When using the shadow DOM class names only need to be unique within the component. So you can use common class names like "container" and not have to worry about external style interference.

The custom element's styles can be contained within the global stylesheet file or you can create a custom-element specific stylesheet and link to it inside the custom element like this:

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
    }
  }
```
A non-Shadow DOM component will add the component's markup to the component's `innerHTML`, so the last line in the connectedCallback` method will be:
```js
  this.innerHTML = html;
```
In this case, the `shadow` variable will not be created.

### Using CSS Pseudoclasses with Web Components
Standard CSS pseudoclasses can be used with Web Components. However, there are a few that are designed specifically for Web Components.
- `:host` refers to the HTML element that hosts the web component.
- `:slotted` is used to style `<slot>` elements.
- `:parts` uses a `part` attribute on a custom element to target CSS styles.
NNNNNNNNNNNNNNNNNNNNNNNNNNNN

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
- `replaceSync` which takes a stylesheet rule and applies it to the constructed stylesheet.
- `insertRule` which adds a new stylesheet rule to the constructed stylesheet.

Also note that the shadow DOM has an `adoptedStyleSheet` function to associate one or more constructed stylesheets to it.

### Style Inheritance

As noted previously, web components created with a Shadow DOM have an isolated CSS scope. One exception to this rule are CSS properties that are inherited. They include the `color` property, most `font` properties, and `list-style` related properties (see [the full list](https://web.dev/learn/css/inheritance#which_properties_are_inherited_by_default)). You can still override these properties inside your component.

You can use a CSS custom property to update an inherited property. For instance you might have a CSS rule in your component:
```css
  .myclass {
    color: var(--myclass-color)
  }
```
The `--myclass-color` would be set outside the component using an external stylesheet. If the custom property is not set in an external CSS file, then the color will fallback to the inherited color by default.

This allows the use of custom properties to customization CSS in a web component.


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

## Working with Forms

Custom elements can contain HTML forms and they will function normally. The [FormWC.ts](https://github.com/cdoremus/fresh-webcomponents/blob/main/components/wc/FormWC.ts) Web Component that is part of the application that accompanies this blog post is an example.

But when one or more form elements are contained in a component with a form defined outside the Web Component, interactions can be complicated.

If the Web Component is in the Light DOM, then form elements in the component will have no problem as an element in an externally-defined form.

But a custom element that uses the shadow DOM to encapsulate a `<text>`, `<textarea>` and `<select>` are not automatically associated with a containing form. Hacks around this limitation included adding hidden elements to the form to push the data into the form or using a `formdata` event listener to update the form's data before the form is submitted.

Shadow DOM form components also do not have access to the standard [Constraint Validation API](https://developer.mozilla.org/en-US/docs/Web/HTML/Constraint_validation) for validating form values.

However, a new Web Component standard interface called `ElementInternals` seamlessly integrates a shadow DOM created form elements into the enclosing external form. All modern browsers support this standard.

This interface requires the custom element to have a static `formAssociated` property with a value of `true`. An additional lifecycle method is then available `formAssociatedCallback(form)` which allows you to get form state at that time.

For instance, a HTML snippet using a form-associated custom element might look like this:

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
      console.log("Form submitted: ", e);
      // display the input value
      const output = document.getElementById("output");
      output.innerHTML = `Input value: ${e.target[0].value}`;
      // do not refresh the page (the default form action)
      e.preventDefault();
    });
  </script>
```
Here we are listening to the form's submit value to get the value of the `<input>`that is created inside the Web Component. Normally, this value would be retrieved on the server.

The `my-name-input` component's code would look like this:

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
    // monitor input values
    shadow.querySelector("input").addEventListener("change", (e) => {
      console.log("onchange value: ", e.target.value);
      // the label's text
      console.log("Label: ", this.internals.labels[0].textContent);
      this.setValue(e.target.value);
    });
  }
  // Additional lifecycle method called when component is associated with a form
  formAssociatedCallback(form) {
    console.log("form associated:", form["input"]); // "name-form" printed out
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
Note the use of `attachInternals()` to get a handle on some of the external form's properties. In addition, the value of the component's `id` is used to set the `id` of the component's `input` element. This makes the label's text available to the component, something that is not accessible without the `ElementInternals` reference. This relation between the label and it's associated input value is important for accessibility. `ElementInternals` also includes [many ARIA properties](https://developer.mozilla.org/en-US/docs/Web/API/ElementInternals#instance_properties_included_from_aria) that can be set on form elements.

## Web Components and Accessibility

The accessibility picture with web components is complicated. Some accessibility features work, but others do not, and others require a coding work-around.

Accessibility issues are many and varied, but I am not an accessibility expert by any means, so instead of a long-winded exploration, I'm offering these links from people who actually know what they are talking about:
- [Accessibility for Web Components](https://developer.salesforce.com/blogs/2020/01/accessibility-for-web-components)
- [A Guide to Accessible Web Components](https://www.erikkroes.nl/blog/accessibility/the-guide-to-accessible-web-components-draft/)
- [Web Components Accessibility FAQ](https://www.matuzo.at/blog/2023/web-components-accessibility-faq)
- [Accessibility Object Model](https://github.com/WICG/aom?tab=readme-ov-file)

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

The [Deno Fresh](https://fresh.deno.dev) full-stack web framework uses [Preact](https://preactjs.com/) -- a scaled-down version of [React](https://react.dev/) -- under the covers to serve web sites and applications. While React requires a bit of juggling to use web components, Preact was built to [fully support web components](https://preactjs.com/guide/v10/web-components/).

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

Note that the `class` values are Tailwind helper classes (see [Tailwind section below](#using-tailwind-with-fresh)).

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

The [Tailwind](https://tailwindcss.com/) helper CSS class transformation is built into the Fresh framework. As such, it can be used in web components that run in a Fresh app. The `tailwind` support added in Fresh v1.6.0 replaces `twind`, a separate tailwind transformation that uses Tailwind helper classes, but runs behind Tailwind in Tailwind's helper class support.

To get native-Tailwind working with web components you need to add a line pointing to the web components in the `static` folder to `tailwind.config.ts`:
```ts
  content: [
    "{routes,islands,components}/**/*.{ts,tsx}",
    "static/wc/*.js",
  ],
```
The first line refer to Fresh components, while the second one refers to the web components. It's probably a good idea to put those files in a separate folder within `static`.

Another option for using `tailwind` with web components in Fresh is to use JSX as the custom element's content. In this case, the content is annotated with the tailwind classes. Here's an example:

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

The element's `class` attribute in the example above is annotated with the names of Tailwind helper classes. The Tailwind transformation involves including Tailwind's helper classes (like `text-3xl` or `px-2`) in the app's deployed CSS.

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

