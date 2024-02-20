<!-- deno-fmt-ignore-file -->
#### 2024-02-26
##### _21 min read_

# Using Web Components with Deno and Fresh

Deno prides itself with its support of standards. It has embraced ECMAScript imports as the way to express dependencies, supports most standard web APIs and has championed server-side JavaScript standards through it's leadership in [WinterCG](https://wintercg.org/).

Web Components are a web standard way of creating reusable custom HTML elements. In essence they extend native HTML element functionality. They can be used with or without a web framework like Fresh or from a static HTML page served from a server like one that uses `Deno.serve`.

This blog post will focus on how to use web components in Deno with special emphasis on using them with Fresh.

## What is a Web Component
The Web Component standard is a means for creating custom HTML elements with structure, attributes and behavior like their native cousins. Technically, a Web Component encompasses two standards:
- [Custom Elements](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements): custom-made HTML tags
- [The Shadow DOM](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM): a means for isolating the custom element from the external document.

A web component is created using a JavaScript class that extends `HTMLElement`, the parent of all HTML elements. The custom element can be associated with the shadow DOM when it's created.

## Why Web Components

The first question that comes up in a Web Component discussion is why: why would I use Web Components when I've got Fresh, React, Preact, Vue, Svelte, Angular, etc. instead. Here's my take on that answer:

1. Web components are lightweight and do not need any extra JavaScript/TypeScript libraries to work since the APIs are built into the browser. Many  web frameworks are getting a lot of flack because of the amount of JS they send to the client.
2. They are supported by all modern web browsers including ones on mobile phones. This has only happened in the last few years.
3. They can be used with most web frameworks. So if your team or company uses different frameworks on different sites, you could use them on all of them.
4. They require a good understanding of DOM APIs, something that many JS/TS developers do not know well because they work with web frameworks that abstract them away. Still, knowledge of JavaScript fundamentals are important for every webdev in order to fully understand what's going on under the covers.

I also have to admit that there is something rather liberating about having full control of a component you have created rather than relying on sometimes clunky ways to do things when you use a component created in a web framework.

## Web Component creation
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
As shown in the code, the component needs to be registered using the `define` function of the `customElements` window object.

To use a custom element in an HTML page, its code needs to be referenced in a `<script>` tag.

```html
  <!-- Add this to the document's head -->
  <script src="/components/hello-wc.js" type="module"></script>
```

Finally the web component can be placed on the page with a value of its `message` attribute.
```html
<hello-wc message="From a Web Component"></hello-wc>
```
The custom element lifecycle methods include:

| Function |Behavior|
| ------- | ---------- |
| `constructor()` | Called when the component instance is created.|
| `connectedCallback()` | Called when DOM is mounted. This is the place to get the initial the value of component attributes. |
| `disconnectedCallback()` | Called when DOM is unmounted. Often used to cleanup a timer with `clearInterval`. |
| `attributeChangedCallback(attrName, oldVal, newVal)` | Called when an observed attribute is changed. The arguments are the attribute name (attrName), the old value (oldVal) of the attribute and the attribute's new value (newVal) |
|`adoptedCallback`| Called when an element is moved to a new document like a new window frame |

### Encapsulation with the Shadow DOM

The Web Component standard includes a concept called the Shadow DOM, an isolated DOM tree encapsulates styles and DOM nodes inside a custom element.

What this means is that styles outside of your component cannot influence elements inside your web component (outside of inherited CSS properties like `color` or `font-size` and CSS custom properties).

Similarly, a Web Component with Shadow DOM enabled isolates the DOM inside the component, so that, for instance, if you call `document.querySelectorAll('button')` buttons inside of your Web Component will not be part of the node collection result set.

The shadow DOM has two modes:
- open - where the Web Component's CSS and DOM is isolated. In open mode, external JavaScript can still access the component's internals.
- closed - where the Web Component's CSS, DOM and external JavaScript is completely isolated.

You use the `attacheShadow` built-in custom element method to enable shadow DOM. Calling that method with an "open" mode enables a custom element property `shadowRoot` to be used to add content to the shadow DOM with the `append` method:

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
The `append` method is used to add elements to the shadow root.

If you look at the Elements tab in the Developer Tools, you'll see the shadow DOM denoted:

| Shadow DOM visualized in the Chrome Developer Tools |
|------|
| ![Shadow DOM in Dev Tools](/img/blog/web-components/ShadowDom_DevelopersToolsView.png) |

The Shadow DOM is bounded by a `#shadow-root (open)` delimiter. The [Shadow Root ](https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot) is the root node of the Shadow DOM. It has it's own properties and an event. See [the MDN documentation](https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot) for more details.

To set the Shadow DOM mode to closed, just change the mode from "open" to "closed" in the `attacheShadow` call:
```javascript
    const shadowRoot = this.attachShadow({ mode: "closed" });
```
When this is done, the Developer Tools shadow root notation shows `closed`.

## Light DOM Web Components

Using the Shadow DOM brings advantages and disadvantages.

The advantage is that Shadow DOM allows customization NNNNNNNNNNNNNNNNNNNNNN.

Web components created that do not include the Shadow DOM are called Light DOM Web Components


### Templates and Slots

Web components can also use the built-in HTML `<template>` and `<slot>` tags to hold content displayed by the component. The `<template>` tag is a container for DOM nodes. If it is used on a web page, the content is not visible, but it can be used as a container for markup to be used elsewhere including a custom element.

A `<slot>` is an HTML element used inside a template container as a content placeholder. The content will be filled by JavaScript at runtime. A slot can be identified using the `name` attribute. In that case, the content needs to have a `slot` attribute corresponding to the name. Here's what that would look like:
```tsx
    <templated-wc>
      <template id="template-wc">
        <slot></slot>
        <slot name="slot2"></slot>
        <slot name="slot3"></slot>
      </template>
      <div slot="slot3">Slotted content3</div>
      <div slot="slot2">Slotted content2</div>
      <div>Slotted content1</div>
    </templated-wc>
```
Here's what that would look like in the browser:

![Rendered custom element with a template and slots](/img/blog/web-components/RenderedTemplateWC_Screenshot.png)

The component that uses the template will look like this:
```ts
  connectedCallback() {
    const shadow = this.attachShadow({ mode: "open" });
    const template = document.querySelector("#template-wc");
    shadow.innerHTML = `<style>${this.css}</style>`;
    shadow.appendChild(template!.content.cloneNode(true));
  }
}
```
The component locates the template using its id. Styles are then added (`this.css` is defined as a static property) to the shadow DOM's HTML content and then the template's content is added after its `Node` is cloned.


### Styling Web Components

Styling a Web Component can be done in two ways
- external - This is not allowed when using the Shadow DOM, but if you are not building the component with Shadow DOM, you can style with external stylesheet file.
- internal - Used to add styles to the shadow DOM (see below).

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
#### Adding internal styles using string interpolation

  The simplest way to add CSS to a component is to add it to the `innerHTML` using string interpolation. Here's an example:

  ```js
  class CSSStyleTagWC extends HTMLElement {
  connectedCallback() {
    const shadow = this.attachShadow({ mode: "open" });
    let html = `<style>h4 {color:red}</style>`;
    html += `<h4>Hello World in Red!!!</h4>`;
    shadow.innerHTML = html;
  }
}

```

#### Using Constructable style sheets

[Constructable style sheets](https://github.com/WICG/construct-stylesheets/blob/main/explainer.md) is a way to create a style sheet programmatically. It uses the [`CSSStyleSheet`](https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleSheet/CSSStyleSheet) class supported by all browsers.

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
- `replaceSync` which takes a stylesheet rule and applies it to the constructed stylesheet
- `insertRule` which adds a new stylesheet rule to the constructed stylesheet.

Also note that the shadow DOM has an `adoptedStyleSheet` function to associate one or more stylesheets to it.


#### HTML Web Components
Many Web Components encapsulate all the markup inside the component with customization confined to component attributes. This means that if the web component fails for some reason (like when HTML is turned off) the user does not see anything.

Lately, there has been an advocacy for what is being called [HTML Web Components](https://adactio.com/journal/20618) that includes native child elements inside the web component markup.


An HTML Web Component has a custom element wrap HTML content. This is most often done with a 'Light DOM' custom element.

Here's an example of doing that with Fresh.
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

Note that Tailwind is used here. Using Tailwind inside of a Fresh custom element is very difficult since the Fresh Tailwind build will not transform class attributes in a `.ts` or `.js` file.

Another alternative on this theme is to have the custom element's HTML content encapsulated in a Preact component. Here's what that would look like:
```ts
    <counter-wc>
      <WCWrappedCounter
        initialCount={3}
        attributes={{ title: "Preact-WC Counter button" }}
      />
    </counter-wc>
```

In order for an HTML component to work with Fresh, the component must not use the shadow DOM.

#### Tailwind

The build-in Tailwind processing supported by Fresh can be used with a web component by having the custom element wrap tailwind annotated Fresh markup. Here's an example:


Styling using tailwind requires that you annotate your markup with the tailwind helper classes and [use the tailwind CLI](https://tailwindcss.com/docs/installation) to build the tailwind classes into a CSS file.

If you are displaying your web components in Deno Fresh, you will need to isolate those components from Fresh components, islands and routes since Fresh has a build-in Tailwind processing mechanism for those files. To avoid that complication, my examples use good old-fashioned native CSS.

#### Style Inheritance

As stated previously, web components created with a shadow DOM have an isolated CSS scope. One exception to this rule are CSS properties that are inherited. They include the `color` property, most `font` properties, and `list-style` related properties (see [the full list](https://web.dev/learn/css/inheritance#which_properties_are_inherited_by_default)). You can still override these properties inside your component.

You can use a CSS custom property to update an inherited property. For instance you might have a CSS rule in your component:
```css
  .myclass {
    color: var(--myclass-color)
  }
```
If the `--myclass-color` custom property is not set in a CSS file within a parent scope, then the color will fallback to the inherited color by default.

This allows the use of custom properties to customization CSS in a web component.




## Declarative Shadow DOM


### Events
Web components allow for you to listen to and create events.

The **`addEventListener()`** function can be attached to any web component. It takes an event name (click, change, submit, etc) and a a callback that gets called when the event is triggered.

The **`dispatchEvent()`** method can be used to broadcast custom events to be picked up by event listeners listening to that specific event. Custom events can also have data attached to it in the `details` option.
```js
const event
```

By dispatching a custom event in a web component you can send information to any component in the DOM tree that subscribes to that event using an event listener.


## Creating Web Components with Lit


## Using Third-party Web Components
Using third-party web components requires that you either copy the element's source code into your server or use a full URL to import the component in a `script` tag.

Here's an example how to do that:
```html
  <script
    type="module"
    src="https://cdn.jsdelivr.net/npm/emoji-picker-element@^1/index.js"
  >
  </script>
```
Many third-party web components are deployed to a specific CDN while others can be accessed using [unpkg](https://unpkg.com/) which serves components deployed to npm.




## Working with Form Elements using Element Internals

A custom element that uses the shadow DOM to encapsulate a `<text>`, `<textarea>` and `<select>` are not automatically associated with a containing form. Hacks around this limitation included adding hidden elements to the form to push the data into the form or using a `formdata` event listener to update the form's data before the form is submitted.

Shadow DOM form components do not also have access to the standard [Constraint Validation API](https://developer.mozilla.org/en-US/docs/Web/HTML/Constraint_validation) for validating form values.

However, a new Web Component standard interface called `ElementInternals` seamlessly integrates a shadow DOM created form elements into the enclosing form.

This interface requires the custom element to have a static `formAssociated` property with a value of `true`. An additional lifecycle method is then available `formAssociatedCallback(form)` which allows you to get form state at that time.



For instance, a HTML snippet using a form-associated custom element might look like this:

```html
<form id="name-form">
  <label for="name">
    Name:
  </label>
  <my-name-input></my-name-input>
  <input type="submit">Enter</input>
</form>
```
The `my-name-input` component would look like this:
```typescript
class MyNameInput extends HTMLElement {
  // Required static property indicating
  // this component is associated with a form
  static formAssociated = true;
  // Additional lifecycle method called when component is associated with a form
  formAssociatedCallback(form) {
    console.log('form associated:', form.id);
  }

  constructor() {
    super();
    // Get reference to ElementInternals
    this.internals = this.attachInternals();
    this.setValue('');
  }

  // connect component
  connectedCallback() {
    const shadow = this.attachShadow({ mode: 'closed' });
    shadow.innerHTML = `
    <style>input { width: 4em; }</style>
    <input type="number" placeholder="Enter name"/>`;

    // monitor input values
    shadow.querySelector('input').addEventListener('change', e => {
      this.setValue(e.target.value);
    });

  }

  // set form value
  setValue(v) {
    this.value = v;
    this.internals.setFormValue(v);
  }

}

// register component
customElements.define( 'my-name-input', MyNameInput );

}
```
Note the use of `attachInternals()` to get a handle on some of the external form properties, but?




## Web Components and Accessibility

## Serving a web component

### Using `Deno.serve`

A web page containing web components can be served by any web server including one built with `Deno.serve`. I have created an [example showing how `Deno.serve` can be used to serve a static HTML file containing web components in a Code Sandbox dev container](https://codesandbox.io/p/devbox/deno-wc-server-47vfpc?file=%2Fstatic%2Fstyles.css%3A33%2C16) to illustrate this. You can also use `Deno.serve` to stream an HTML file containing web components [as is shown in this Deno Deploy Playground](https://dash.deno.com/login?redirect=/playground/shadowroot-streams)  (created by [Nathan Knowler](https://sunny.garden/@knowler/111466434753583873)).

However, I am going to concentrate on how to use Web Components in a [Deno Fresh](https://fresh.deno.dev) app to allow you to focus on building and using web components without having to deal with server or routing issues. When used with Fresh, they will function like a island component.

### Using a web component with Deno Fresh

The Deno Fresh web framework uses Preact under the covers to serve web sites, a scaled-down version of React. While React requires a bit of juggling to use web components, Preact was built to [fully support web components](https://preactjs.com/guide/v10/web-components/).

Besides supporting rendering Web Components, Preact allows its functional components to be exposed as a Web Component. We will not cover that behavior, but you can discover it in the [Preact Web Component Documentation](https://preactjs.com/guide/v10/web-components/#creating-a-web-component). Instead, we will focus on how to use Web Components with Preact in Deno Fresh.

- Using the Preact `ref`....


### Using TypeScript with a Custom Element in Fresh

- Build required
- Extending `JSX.IntrinsicElements` for custom element tags
