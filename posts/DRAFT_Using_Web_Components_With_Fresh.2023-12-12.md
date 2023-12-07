<!-- deno-fmt-ignore-file -->
#### 2023-12-12

# Using Web Components with Deno and Fresh

Deno prides itself with its support of standards. It has embraced ECMAScript imports as the way to express dependencies, supports most standard web APIs and has championed server-side JavaScript standards through it's leadership in [WinterCG](https://wintercg.org/).

Web Components are a web standard way of creating reusable custom HTML elements. In essence they extend native HTML element functionality. They can be used with or without a web framework like Fresh.

This blog post will focus on how to use web components in Deno with special emphasis on using them with Fresh.

## What is a Web Component
The Web Component standard is a means for creating custom HTML elements that encapsulates CSS. The encapsulation comes from the shadow DOM, a separate DOM tree under a web component. A web component is created using a JavaScript/TypeScript class that extends `HTMLElement`.


Web components also often use the built-in HTML `<template>` tag to hold content displayed by the component.

### Serving a web component
A web page containing web components can be served by any web server. I have created an [example showing how `Deno.serve` can be used to serve a static HTML file containing web components in a Code Sandbox dev container](https://codesandbox.io/p/devbox/deno-wc-server-47vfpc?file=%2Fstatic%2Fstyles.css%3A33%2C16) to illustrate this. You can also use `Deno.serve` to stream an HTML file containing web components [as is shown in this Deno Deploy Playground](https://dash.deno.com/login?redirect=/playground/shadowroot-streams)  (created by [Nathan Knowler](https://sunny.garden/@knowler/111466434753583873)).

However, I am going to concentrate on how to use Web Components in a [Deno Fresh](https://fresh.deno.dev) app to allow you to focus on building and using web components without having to deal with server or routing issues. When used with Fresh, they will function like a island component.

## Creating Native Web Components
You create a web component custom element by creating a JavaScript class that extends the `HTMLElement` interface. The simplest 'Hello World' example looks like this:
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
// export as a ESM module
export HelloWC;
```
As shown in the code, the component needs to be registered using the `define` function of the `customElements` window object.

The code needs to be added to a `<script>` tag so that it can be used in an HTML page.

```html
  <!-- Add this to the document's head -->
  <script src="/components/hello-wc.js" type="module"></script>
```

Finally the web component can be placed on the page with a value of its `message` attribute.
```html
<hello-wc message="From a Web Component"></hello-wc>
```
There are a number of

| Function |Behavior|
| ------- | ---------- |
| `constructor` |  |
| `connectedCallback` | Called when DOM is mounted |
| `disconnectedCallback` | Called when DOM is unmounted |
| `attributeChangedCallback` | Called when an observed attribute is changed |
|`adoptedCallback`| Caled when an element is moved to a new document |


## Creating Web Components with Lit


## Using Third-party Web Components
- [web accordion](https://www.webcomponents.org/element/web-accordion)
s
