## 2023-03-25

# What every developer should know about the Deno third party module registry

The Deno third-party registry is is a place for Deno developers to publish their Deno-compatible ESM modules. It is in essence the Deno equivalent of npm.

The data in the third-party registry is used as content for the [Deno Third Party Modules page](https://deno.land/x) and linked pages. Each module on that page's list links to a page providing module details including documentation, version information and source code.

Both developers who create a Deno libraries and users of those libraries should know how the third-party registry works and this post will fill in that gap. Note that modules published by the Deno Company as standard modules (https://deno.land/std) are not part of the third-party registry.

## How the third-party registry is populated and organized

The third-party registry is a database that module creators use to publish their work. It's center is the URL [https:/deno.land/x/](https:/deno.land/x/).

### Important things to keep in mind before registering a module

- Modules are immutable

Once a module is published in the third-party registry, it cannot be changed or deleted. This makes sure that anyone using a module as a dependency can be assured that the module will always be there.

- Module name squatting is not allowed

There is a warning on the third-party module page that name squatting will not be tolerated. It suggests that if a module has not been under active development, it can be taken over by another developer and invites a proposal to do so.

- Module source code must be contained in a public Github repository

The third-party registry does not support private Github repositories or another Git provider at this point.

- The registry uses TSDoc/JSDoc comments to display module classes, functions and TS interfaces

When a module is published the source code in the module's repository is scanned. Each source code file is checked for TSDoc/JSDoc comments for public functions, classes and TypeScript interfaces. If found, the content of the comment is used to create module documentation.  If not found, only the public functions, classes, and interfaces will be displayed, so it is a good idea to make sure your public module exports are well-documented and includes example code.

- The third-party module list is ordered by a popularity score

The registry uses Google Analytics to generate the popularity score.

- The popularity score plans are to include measures of code quality and developer engagement

### Registering a module

Publishing a new third-party module is accomplished by clicking on the button on the third-party modules page labelled "Publish a module". when that is done, the "Adding a module" page will be displayed. It looks like this:

![Add third-party module](img/blog/third_party_modules/add-module-screen.png)

NNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN



## The Third-party Registry API

In early October of last year (2022), the Deno team quietly upgraded the [Deno Third Party Modules page](https://deno.land/x). Previously the page contained a searchable list of Deno modules [registered with the deno.land/x URL](https://deno.land/add_module). Ideally you could use `https://deno.land/x/<module name>` as an import url, but it often did (and still does) not work with some modules.

The module list was sorted by GitHub (GH) stars, but many of the modules in the registry were npm modules that was not compatible with Deno or were difficult to figure out how to make them compatible. And because these modules were in the npm registry, they had accumulated a lot of GH stars as opposed to Deno modules that were still very young. It meant that the compatible Deno modules were hard to find as they were lower on the module list.

The module list for the third party modules page was pulled from a database via an API. Last October version 2 of the API was introduced. This new API threw away the GH star ranking and introduced a new module ranking algorithm first [proposed by then Deno team member Kitson Kelly](https://github.com/denoland/dotland/issues/2133).

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



### Modules
The modules API provides information on third-party modules and

- `/v2/modules` - Provide a list of all modules in the registry.
- `/v2/modules/:module` - Provide information about a specific module.
- `/v2/modules/:module/:version` - Provide information about a specific module version.
- `/v2/modules/:module/:version/doc/:path*` - Provide documentation nodes for a specific path of a specific module version.


listing list of all of the third-party modules


### Module overview


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

---------------------------------------------------------------------------------------
## Questions for Leo
- Can npm modules be added to the registry?
- In Redwood JS talk you said you want to "Implement a 'local' symbol search". What do you mean by 'local'?
- What happens to the documentation if there are no TSDoc/JSDoc comments in the code of a published third-party module?
## Reference
- Leo's talk: https://www.youtube.com/watch?v=q5wWK9blBKQ&t=912s


