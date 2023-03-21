## 2023-03-25

# What every developer should know about the Deno third party module registry

The Deno third-party registry is is a place for Deno developers to publish their Deno-compatible ESM modules. It is in essence the Deno equivalent of the npm package manager.

The data in the third-party registry is used as content for the [Deno Third Party Modules page](https://deno.land/x) and linked pages. Each module on that page's list links to a page providing module details including documentation, version information and source code.

Both developers who create a Deno libraries and users of those libraries should know how the third-party registry works and this post will fill in that gap. Note that modules published by the Deno Company as standard modules (https://deno.land/std) are not part of the third-party registry.

## How the third-party registry is populated and organized

The third-party registry is a database of modules published by their authors. A searchable list of registry modules is found at the URL [https:/deno.land/x/](https:/deno.land/x/).

Registered modules can be accessed under the `https://deno.land/x/` URL, so, for instance, the Fresh web framework would be accessed using the `https://deno.land/x/fresh` URL. Module authors are urged to published new versions of their module to a sequentially numbered tagged branch (most authors use semver numbering). In that case, the version number would be added to the end of the URL (e.g. `https://deno.land/x/fresh@1.1.4`).

The original module list was ranked by Github stars, but it was discovered that a lot of the highest ranked entries were npm modules that did not work in Deno using an `https://deno.land/x/` import URL. A change to that ranking was first [proposed by then Deno team member Kitson Kelly](https://github.com/denoland/dotland/issues/2133) in May 2022. He suggested a sorting algorithm based on metrics of popularity, quality and maintenance (see the proposal for details).

The first implementation of the new ranking algorithm -- deployed in early October 2022 -- uses popularity only. This metric was produced using Google Analytics to track the number of requests to different third-party library import URLs. There are currently no immediate plans to change the ranking algorithm.

## Important things to keep in mind before registering a third-party module

- **Modules are immutable**

Once a module is published in the third-party registry, it cannot be changed or deleted. This makes sure that anyone using a module as a dependency can be assured that the module will always be there.

- **Module name squatting is not allowed**

There is a warning on the third-party module page that name squatting will not be tolerated. It suggests that if a module has not been under active development, it can be taken over by another developer and invites a proposal to do so.

- **Module source code must be contained in a public Github repository**

The third-party registry does not support private Github repositories or another Git provider at this point.

- **The registry uses TSDoc/JSDoc comments to display module variables, classes, functions, TS interfaces and type aliases**

When a module is published the source code in the module's repository is scanned. Each source code file is checked for TSDoc/JSDoc comments for public functions, classes and TypeScript interfaces. If found, the content of the comment is used to create module documentation.  If not found, only the the signatures of public variables, classes, functions, TS interfaces and type aliases will be displayed with no additional documentation, so it is a good idea to make sure your public module exports are well-documented including example code.

- **Module authors must self-register a module**

Publishing a new third-party module is accomplished by clicking on the button on the third-party modules page labelled "Publish a module". when that is done, the "Adding a module" page will be displayed. It looks like this:

![Add third-party module](img/blog/third_party_modules/add-module-screen.png)

NNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN




## The Third-party Registry API

In early October of last year (2022), the Deno team quietly upgraded the [Deno Third Party Modules page](https://deno.land/x). Previously the page contained a searchable list of Deno modules [registered with the deno.land/x URL](https://deno.land/add_module). Ideally you could use `https://deno.land/x/<module name>` as an import url, but it often did (and still does) not work with some modules.

The module list was sorted by GitHub (GH) stars, but many of the modules in the registry were npm modules that was not compatible with Deno or were difficult to figure out how to make them compatible. And because these modules were in the npm registry, they had accumulated a lot of GH stars as opposed to Deno modules that were still very young. It meant that the compatible Deno modules were hard to find as they were lower on the module list.

The module list for the third party modules page was pulled from a database via an API. Last October version 2 of the API was introduced. This new API threw away the GH star ranking and introduced a new

The new ranking was based on a "popularity score" that consists of a combination of four criteria
XXXXXXX

## The Deno Third Party API

The third party API is hosted at [https://apiland.deno.dev](https://apiland.deno.dev). There is an [OpenAPI specification for the API]() and  [documentation rendering the API specification](https://redocly.github.io/redoc/?url=https://apiland.deno.dev/~/spec)


Version 2 of the Deno Third Party API XXXXXXXXXXX

### Pages
The pages API focuses on data for the module documentation pages
Third party API routes that begin with `v2/pages` are used to displayed on Deno module data on the `deno.land` web pages.

* `/v2/pages/mod/doc/:module/:version/:path*` - Provides data to render a documentation page for a module

- `/v2/pages/lib/doc/:module/:version/:path*` - Provides a structure to render a doc view page

- `/v2/pages/mod/info/:module/:version` - Provides a structure to render a module info page

The [denoland/docland](https://github.com/denoland/docland) Github repository is used to display pages, so it is a good idea to check this repo out if you want to use this part of the API.

### Modules
The modules API provides information on all and specific third-party Deno modules.

- `/v2/modules` - Provide a list of all modules in the registry ([Link](https://apiland.deno.dev/v2/modules)).
- `/v2/modules/:module` - Provide information about a specific module ([Link for Fresh](https://apiland.deno.dev/v2/modules/fresh)).
- `/v2/modules/:module/:version` - Provide information about a specific module version ([Link for Fresh version 1.1.4](https://apiland.deno.dev/v2/modules/fresh/1.1.4)).
- `/v2/modules/:module/:version/doc/:path*` - Provide documentation nodes for a specific path of a specific module version ([Link for Fresh version 1.1.4](https://apiland.deno.dev/v2/modules/fresh/1.1.4/doc)).

Here are some links to try out:


### Module metrics

- /v2/metrics/modules - All module's metrics
  - Query params:
    - limit: Result set size
    - page: Page number
    - order_by: Field to order the results by (score)
- /v2/metrics/modules



### Example use of the third-party API


### Page API


### Quality and Maintenance metrics


## Conclusions

--------------------------------------------------------------------------------
## References
- Kitson's talk - https://youtu.be/G_2AgdgEbkI?t=1554
- Kitson's repo demonstrating the API: https://github.innominds.com/kitsonk/deno-on-the-edge
- Leo's talk: https://www.youtube.com/watch?v=q5wWK9blBKQ&t=912s


