## 2023-03-25

# What every developer should know about the Deno third party module registry

The Deno third-party registry is is a place for Deno developers to publish their Deno-compatible ESM modules. It is in essence the Deno equivalent of the npm package manager.

The data in the third-party registry is used as content for the [Deno Third Party Modules page](https://deno.land/x). Each module on that page's list links to a page providing module details including documentation, version information and source code.

Both developers who create a Deno libraries and users of those libraries should know how the third-party registry works and this post will fill in that gap.

## How the third-party registry is populated and organized

Registered modules can be accessed under the `https://deno.land/x/` URL for ESM imports, so, for instance, the Fresh web framework would be accessed using the `https://deno.land/x/fresh` URL. Module authors are urged to published new versions of their module to a sequentially numbered tagged branch (most authors use semver numbering). In that case, the version number would be added to the end of the URL (e.g. `https://deno.land/x/fresh@1.1.4`).

The original module list was ranked by Github stars, but it was discovered that a lot of the highest ranked entries were npm modules that did not work in Deno using an `https://deno.land/x/` import URL. A change to that ranking was first [proposed by then Deno team member Kitson Kelly](https://github.com/denoland/dotland/issues/2133) in May 2022. He suggested a sorting algorithm based on metrics of popularity, quality and maintenance (see the proposal for details).

The first implementation of the new ranking algorithm -- deployed in early October 2022 -- uses popularity only. The current metric was produced using Google Analytics to track the number of requests to different third-party library import URLs. There are no immediate plans to update the ranking algorithm to include quality and maintenance metrics.

## Important things to keep in mind before registering a third-party module

- **Modules are immutable**

Once a module is published in the third-party registry, it cannot be changed or deleted. This makes sure that anyone using a `https://deno.land/x/*` import URL can be assured that the module will always be there.

- **Module name squatting is not allowed**

There is a warning on the third-party module page that name squatting will not be tolerated. It suggests that if a module has not been under active development, it can be taken over by another developer and invites a proposal to do so.

- **Module source code must be contained in a public Github repository**

The third-party registry does not support private Github repositories or another Git provider at this point.

- **The registry uses TSDoc/JSDoc comments to display module symbols (variables, classes, functions, TS interfaces and type aliases)**

When a module is published the source code in the module's repository is scanned. Each source code file is checked for TSDoc/JSDoc comments for public functions, classes and TypeScript interfaces. If found, the content of the comment is used to create module documentation.  If not found, only the the signatures of public variables, classes, functions, TS interfaces and type aliases will be displayed with no additional documentation, so it is a good idea to make sure your public module exports are well-documented including example code.

- **Module authors must self-register a module**

Publishing a new third-party module is accomplished by clicking on the button on the third-party modules page labelled "Publish a module". when that is done, the "Adding a module" page will be displayed. It looks like this:

![Add third-party module](img/blog/third_party_modules/add-module-screen.png)

NNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN


## The Third Party Registry API


The module list for the third party modules page was pulled from a database via an API. Last October version 2 API was published. This coencided with the unvieling of the new ranking algorithm.

The third party API is hosted at [https://apiland.deno.dev](https://apiland.deno.dev). An [OpenAPI specification for the API](https://apiland.deno.dev/~/spec) exists in additon to [human-readable documentation for the new API spec](https://redocly.github.io/redoc/?url=https://apiland.deno.dev/~/spec).

The third-party API has endpoints for documentation (pages), module details and module metrics.


### Documentation Page Endpoints
The pages API focuses on data for the module documentation pages
Third party API routes that begin with `v2/pages` are used to display API documentation for a particular Deno module.

* `/v2/pages/mod/doc/:module/:version/:path*` - Provides data to render a documentation page for a module

For instance, to pull up the `types.ts` file documentation data, you would use the URL: https://apiland.deno.dev/v2/pages/mod/doc/std/0.182.0/testing/types.ts

This is the data that goes into this page:

![types.ts doc page](img/blog/third_party_modules/types.ts-documentation_page.png)


The pages are rendered within the  [denoland/docland](https://github.com/denoland/docland) Github repository is used to display pages, so it is a good idea to check this repo out if you want to use this part of the API.

### Module Endpoints
The modules API provides information on all and specific third-party Deno modules.

- `/v2/modules` - Provide a list of all modules in the registry ([Link](https://apiland.deno.dev/v2/modules)).


Here's what the results look like with data from one of the 5,800+ (at the time of this writing) modules shown:
```json
{
  "items":[ // items module array
    {
      "latest_version": "v0.1.8",
      "versions": [
        "v0.1.8",
        "v0.1.7",
        "v0.1.6",
        "v0.1.5",
        "v0.1.4",
        "v0.1.3",
        "v0.1.2",
        "v0.1.1"
      ],
      "name": "install",
      "description": "Deno Binary Installer",
      "star_count": 898,
      "popularity_score": 47981,
      "tags": [
        {
          "kind": "popularity",
          "value": "top_1_percent"
        }
      ]
    }
  // other module data here ...
  ]
}
```

- `/v2/modules/:module` - Provide information about a specific module

This data is the same as an individual record in the `v2/modules` endpoint. For instance, the [data for the Fresh module](https://apiland.deno.dev/v2/modules/fresh) looks like this:
```json
{
  "latest_version": "1.1.4",
  "versions": [
    "1.1.4",
    "1.1.3",
    "1.1.2",
    "1.1.1",
    "1.1.0",
    "1.0.2",
    "1.0.1",
    "1.0.0",
    "1.0.0-rc.6",
    "1.0.0-rc.5",
    "1.0.0-rc.4",
    "1.0.0-rc.3",
    "1.0.0-rc.2",
    "v1.0.0"
  ],
  "name": "fresh",
  "description": "The next-gen web framework.",
  "star_count": 10133,
  "tags": [{ "kind": "popularity", "value": "top_1_percent" }],
  "popularity_score": 8499
}
```

- `/v2/modules/:module/:version` - Provide information about a specific module version ([Link for Fresh version 1.1.4](https://apiland.deno.dev/v2/modules/fresh/1.1.4)).

Here's what the data looks like for Fresh:
```json
{
  "upload_options": {
    "ref": "1.1.4",
    "type": "github",
    "repository": "denoland/fresh"
  },
  "uploaded_at": "2023-03-08T09:48:46.820Z",
  "analysis_version": "1",
  "name": "fresh",
  "description": "The next-gen web framework.",
  "version": "1.1.4"
}
```


### Module Metric Endpoints

- `/v2/metrics/modules` - All module's metrics
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


