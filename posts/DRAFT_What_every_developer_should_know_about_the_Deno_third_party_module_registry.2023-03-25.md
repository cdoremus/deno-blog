## 2023-03-25

# What every developer should know about the Deno third party module registry

The Deno third-party registry is a place for Deno developers to publish their Deno-compatible ESM modules. It is in essence the Deno equivalent of the npm package manager.

The data in the third-party registry is used as content for the [Deno Third Party Modules page](https://deno.land/x). Each module on that page's list links to a page providing module details including documentation, version information and source code.

Both developers who create a Deno libraries and users of those libraries should know how the third-party registry works and this post will fill in that gap.

## How the third-party registry is populated and organized

Registered modules can be accessed under the `https://deno.land/x/` URL for ESM imports, so, for instance, the Fresh web framework would be accessed using the `https://deno.land/x/fresh` URL. Module authors are urged to published new versions of their module to a sequentially numbered tagged branch (most authors use [semantic version or semver](https://semver.org/spec/v2.0.0.html) numbering). In that case, the version number would be added to the end of the URL (e.g. `https://deno.land/x/fresh@1.1.4`).

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

When a module is published the source code in the module's repository is scanned. Each source code file is checked for TSDoc/JSDoc comments for public functions, classes and TypeScript interfaces. If found, the content of the comment is used to create module documentation.  If not found, only the the signatures of public variables, classes, functions, TS interfaces and type aliases will be displayed with no additional documentation, so it is a good idea to make sure your public module exports are well-documented and include example usage in the TSDoc/JSDoc comments.

- **Module authors must self-register a module**

Publishing a new third-party module is accomplished by clicking on the button on the third-party modules page labelled "Publish a module". when that is done, the "Adding a module" page will be displayed. It looks like this:

![Add third-party module](img/blog/third_party_modules/add-module-screen.png)

NNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN


## The Third Party Registry API


The module list for the third party modules page was pulled from a database via an API. Last October version 2 API was published. This coencided with the unvieling of the new ranking algorithm.

The third party API is hosted at [https://apiland.deno.dev](https://apiland.deno.dev). An [OpenAPI specification for the API](https://apiland.deno.dev/~/spec) exists in additon to [human-readable documentation for the new API spec](https://redocly.github.io/redoc/?url=https://apiland.deno.dev/~/spec).

The third-party API has endpoints for documentation (pages), module details and module metrics.


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
The following query parameters are available for this endpoint:
  1. **limit**: number that limits the result set size
  2. **page**: page number used for pagination


So if you wanted to get a list of 10 results on the third page of results, your URL would be [https://apiland.deno.dev/v2/modules?limit=10&page=3&order_by=star_count](https://apiland.deno.dev/v2/modules?limit=10&page=3&order_by=star_count).


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

- `/v2/metrics/modules` - All module's metrics ([Link](https://apiland.deno.dev/v2/metrics/modules))


The "metrics" returned by this endpoint is much more than just metrics. Then include basic data on the module including dependencies and versions and **uploaded_at** datetime when a new module version github tag was created.


This endpoint supports the query parameters **limit** and **page** that is used to determine result set size and page number like the modules endpoint.

If also supports an **order_by** query parameter which ranks the query results by a particular field value.

The results set for this endpoint puts data in an **items** arral like was done for the modules endpoint above.

- `/v2/metrics/modules/:module` - Metrics for a specific third-party module

Here's what metrics for the Deno web framework [Ultra](https://ultrajs.dev) looks like:

```javascript
{
  "metrics": {
    "popularity": {
      "prev_sessions_30_day": 256,
      "score": 241,
      "prev_score": 266,
      "sessions_30_day": 233,
      "prev_users_30_day": 283,
      "users_30_day": 254
    },
    "name": "ultra",
    "updated": "2023-04-02T00:24:44.476Z",
    "maintenance": {},
    "quality": {}
  },
  "info": {
    "kind": "modinfo",
    "module": "ultra",
    "description": "Zero-Legacy Deno/React Suspense SSR Framework",
    "readme": {
      "path": "/README.md",
      "size": 4086,
      "type": "file"
    },
    "version": "v2.2.1",
    "tags": [],
    "dependencies": [
      {
        "ver": "",
        "src": "deno.land/x",
        "pkg": "color"
      },
      {
        "ver": "3.3.2",
        "src": "deno.land/x",
        "pkg": "crayon"
      },
      {
        "ver": "v2.5.1",
        "src": "deno.land/x",
        "pkg": "hono"
      },
      {
        "ver": "v1.3.2",
        "src": "deno.land/x",
        "pkg": "mesozoic"
      },
      {
        "ver": "v0.8.0",
        "src": "deno.land/x",
        "pkg": "outdent"
      },
      {
        "ver": "0.1.12",
        "src": "deno.land/x",
        "pkg": "wait"
      },
      {
        "ver": "18.2.0",
        "org": "",
        "src": "esm.sh",
        "pkg": "react-dom"
      },
      {
        "ver": "18.2.0",
        "src": "esm.sh",
        "org": "",
        "pkg": "react"
      },
      {
        "ver": "0.176.0",
        "src": "std",
        "pkg": "std"
      }
    ],
    "upload_options": {
      "ref": "v2.2.1",
      "repository": "exhibitionist-digital/ultra",
      "type": "github"
    },
    "latest_version": "v2.2.1",
    "dependency_errors": [],
    "versions": [
      "v2.2.1",
      "v2.2.0",
      "v2.1.7",
      "v2.1.7",
      "v2.1.6",
      "v2.1.5",
      "v2.1.4",
      "v2.1.3",
      "v2.1.2",
      "v2.1.1",
      "v2.1.0",
      "v2.0.1",
      "v2.0.0",
      "v2.0.0-beta.19",
      "v2.0.0-beta.18",
      "v2.0.0-beta.17",
      "v2.0.0-beta.16",
      "v2.0.0-beta.15",
      "v2.0.0-beta.14",
      "v2.0.0-beta.13",
      "v2.0.0-beta.12",
      "v2.0.0-beta.11",
      "v2.0.0-beta.10",
      "v2.0.0-beta.9",
      "v2.0.0-beta.8",
      "v2.0.0-beta.7",
      "v2.0.0-beta.6",
      "v2.0.0-beta.5",
      "v2.0.0-beta.4",
      "v2.0.0-beta.3",
      "v2.0.0-beta.2",
      "v2.0.0-beta.1",
      "v2.0.0-alpha.19",
      "v2.0.0-alpha.18",
      "v2.0.0-alpha.17",
      "v2.0.0-alpha.16",
      "v2.0.0-alpha.15",
      "v2.0.0-alpha.14",
      "v2.0.0-alpha.13",
      "v2.0.0-alpha.12",
      "v2.0.0-alpha.11",
      "v2.0.0-alpha.10",
      "v2.0.0-alpha.9",
      "v2.0.0-alpha.8",
      "v2.0.0-alpha.7",
      "v2.0.0-alpha.6",
      "v2.0.0-alpha.5",
      "v2.0.0-alpha.5",
      "v2.0.0-alpha.4",
      "v2.0.0-alpha.3",
      "v2.0.0-alpha.2",
      "v2.0.0-alpha.1",
      "v2.0.0-alpha.0",
      "v1.0.1",
      "v1.0.0",
      "v0.8.2",
      "v0.8.1",
      "v0.8.0",
      "v0.7.6",
      "v0.7.5",
      "v0.7.4",
      "v0.7.3",
      "v0.7.2",
      "v0.7.1",
      "v0.7.0",
      "v0.7.0",
      "v0.6",
      "v0.5",
      "v0.4",
      "v0.3",
      "v0.2",
      "v0.1",
      "v0.0"
    ],
    "uploaded_at": "2023-02-06T08:34:08.756Z",
    "config": {
      "path": "/deno.json",
      "size": 867,
      "type": "file"
    }
  }
}
```
Under the **popularity** field, a "session" is defined by Google analytics as a visit to a page for 30 minutes or less.
The **users** fields is also GA data.
### Documentation Page Endpoints
The pages API focuses on data for the module documentation pages
Third party API routes that begin with `v2/pages` are used to display API documentation for a particular Deno module.

* `/v2/pages/mod/doc/:module/:version/:path*` - Provides data to render a documentation page for a module

For instance, to pull up the `types.ts` file documentation data, you would use the URL: https://apiland.deno.dev/v2/pages/mod/doc/std/0.182.0/testing/types.ts

This is the data that goes into this page:

![types.ts doc page](img/blog/third_party_modules/types.ts-documentation_page.png)

The pages are rendered via a webapp that is found in the [denoland/docland](https://github.com/denoland/docland) Github repository, so it is a good idea to check this repo out if you want to use this part of the API.

When this article was published it appears that the endpoint `/v2/pages/mod/info/:module/:version` is not working as it returns a 404.


### Example use of the third-party API

Obviously, the third-module registry API provides a lot of data to work with. You could essentially create your own version of `https://deno.land/x`. This version could be supercharged with information in the API but not found on the Deno Third Party Modules pages. Ranking the results be a different characteristic would be interesting or creating your own popularity score algorithm.

I have create a simple prototype that displays the Deno Third Party Modules page showing the top 500 modules and adding the Github star count to each module record. [You can see it in action here](https://3rd-party-api.deno.dev/).

This page includes a drop-down to sort the 500 results by popularity score, Github star count or a combination of popularity score (weighted 75%) and GH star count (weighted 25%).

This demo shows one of the many ways the API data could be displayed. Graphical renditions would be an interesting option, for instance.

The code for my API demo is found at [this github repository](https://github.com/cdoremus/3rd-party-api).

## Conclusions

This article focused on the Deno third party modules list and the API used to create that list. It should be emphasized that the current ranking algorithm is a work in progress based on the [original proposal from Kitson Kelly](https://github.com/denoland/dotland/issues/2133) who no longer works for Deno. If you are interested in improvements to the ranking system, you should post comments to that proposal.

---

## Acknowledgements

The author would like to thank former Deno team member Kitson Kelly for answering some questions on the API last fall, and current Deno team member Leo Kettmeir for recently filling in my third-party module API knowledge gaps.
## References
- Kitson Kelly's June, 2022 talk introducing the new third-party API version he was working on: https://youtu.be/G_2AgdgEbkI?t=1554
- Kitson Kelly's Github repo demonstrating the API shown in his June, 2022 talk: https://github.innominds.com/kitsonk/deno-on-the-edge
- Section of Leo Kettmeir's February, 2023 talk covering the third-party API: https://www.youtube.com/watch?v=q5wWK9blBKQ&t=912s


