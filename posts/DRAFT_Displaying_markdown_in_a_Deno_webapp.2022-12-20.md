#### 2022-09-03

# Displaying markdown in a Deno webapp

Markdown is a markup language commonly used to generate technical documentation.
It is not has feature rich as PDF or HTML/CSS. For instance, markdown documents
are left-justified by default. But markdown's limited markup options make it
easy to use and remember.

Displaying a markdown document in an HTML page requires that the markdown syntax
be transformed to HTML and adding CSS styling. This article will demonstrate two
options that can be used in a Deno webapp, `deno-gfm` and `marked-js`.
Unfortunately there use seems to be framework specific at this time.

# Using markdown with Fresh.

This article will show you how to do that using [gfm](http://deno.land/x/gfm), a
library created by Deno core team member
[Luca Canosnato](https://twitter.com/lcasdev).

There are a number of Markdown varieties. The gfm library renders
[Github flavored markdown](https://github.github.com/gfm/).

## deno-gfm

The [deno-gfm](http://deno.land/x/gfm) library was created by Deno core team
member [Luca Canosnato](https://twitter.com/lcasdev). The gfm library renders
[Github flavored markdown](https://github.github.com/gfm/).

The deno-gfm library wraps the [marked-js](https://marked.js.org/) library
adding styling options to the marked-js library.

## Using deno-gfm with Fresh

## mdx-js

## Using mdx with Ultra
