## 2023-01-09

# Exploring the Deno Third Party API

In early October of last year (2022), the Deno team quietly upgraded the [Deno Third Party Modules page](https://deno.land/x). Previously the page contained a searchable list of Deno modules [registered with the deno.land/x URL](https://deno.land/add_module). Ideally you could use `https://deno.land/x/<module name>` as an import url, but it often did (and still does) not work with some modules.

The module list was sorted by GitHub (GH) stars, but many of the modules in the registry were npm modules that was not compatible with Deno or were difficult to figure out how to make them compatible. And because these modules were in the npm registry, they had accumulated a lot of GH stars as opposed to Deno modules that were still very young. It meant that the compatible Deno modules were hard to find as they were lower on the module list.

The module list for the third party modules page was pulled from a database via an API. Last October version 2 of the API was introduced. This new API threw away the GH star ranking and introduced a new module ranking algorithm first [proposed by then Deno team member Kitson Kelly](https://github.com/denoland/dotland/issues/2133).

The new ranking was based on a "popularity score" that consists of a combination of four criteria
XXXXXXX

## The Deno Third Party API

The third party API is hosted at [https://apiland.deno.dev](https://apiland.deno.dev). There is an [OpenAPI specification for the API]() and  [documentation rendering the API specification](https://redocly.github.io/redoc/?url=https://apiland.deno.dev/~/spec)


Version 2 of the Deno Third Party API XXXXXXXXXXX

## Pages
The pages API focuses on data for the module documentation pages
Third party API routes that begin with `v2/pages` are used to displayed on Deno module data on the `deno.land` web pages.

* `/v2/pages/mod/doc/:module/:version/:path*` - Provides data to render a documentation page for a module

- `/v2/pages/lib/doc/:module/:version/:path*` - Provides a structure to render a doc view page

- `/v2/pages/mod/info/:module/:version` - Provides a structure to render a module info page



## Modules
The modules API provides information on third-party modules and

- `/v2/modules` - Provide a list of all modules in the registry.
- `/v2/modules/:module` - Provide information about a specific module.
- `/v2/modules/:module/:version` - Provide information about a specific module version.
- `/v2/modules/:module/:version/doc/:path*` - Provide documentation nodes for a specific path of a specific module version.


listing list of all of the third-party modules


## Module overview


## Module metrics

- /v2/metrics/modules - All module's metrics
  - Query params:
    - limit: Result set size
    - page: Page number
    - order_by: Field to order the results by (score)
- /v2/metrics/modules



## Example use of the third-party API


## Page API


## Quality and Maintenance metrics



