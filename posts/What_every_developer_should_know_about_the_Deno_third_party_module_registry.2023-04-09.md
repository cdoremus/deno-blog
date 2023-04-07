## 2023-04-09

# What every developer should know about the Deno third party module registry

The Deno third-party registry is a place for Deno developers to publish their Deno-compatible ESM modules. It is in essence the Deno equivalent of the npm package manager.

The data in the third-party registry is used as content for the [Deno Third Party Modules page](https://deno.land/x). Each module on that page's list links to a page providing module details including documentation, version information and source code.

Both developers who create Deno libraries and users of those libraries should know how the third-party registry works and this post will fill in that gap.

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

Publishing a new third-party module is accomplished by clicking on the button on the third-party modules page labelled "Publish a module". When that is done, the "Adding a module" page will be displayed. It looks like this:
![Add third party module](/img/blog/third_party_modules/add_new_module.png)


## The Third Party Registry API


The module list for the [Deno Third Party Modules](https://deno.land/x) page was pulled from a database via an API. Last October, version 2 of the API was published which coencided with the unvieling of a new ranking algorithm used on the page.

The third party API is hosted at [https://apiland.deno.dev](https://apiland.deno.dev). An [OpenAPI specification for the API](https://apiland.deno.dev/~/spec) exists in additon to [human-readable documentation for the new API spec](https://redocly.github.io/redoc/?url=https://apiland.deno.dev/~/spec).

The third-party API has endpoints for module details and module metrics and module documentation (pages).


### Module Endpoints
The modules API provides basic information on every third-party Deno module.

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
    // ... other versions here
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
      // ... other beta versions
      "v2.0.0-alpha.19",
      // ... other alpha versions
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
The **users** field value also comes from GA.

Note that there is are **quality** and **maintenance** metric fields which were part of the [original page ranking proposal](https://github.com/denoland/dotland/issues/2133), but they are unused right now.

### Documentation Page Endpoints
The pages API focuses on data for the module documentation pages
Third party API routes that begin with `v2/pages` are used to display API documentation for a particular Deno module.

* `/v2/pages/mod/doc/:module/:version/:path*` - Provides data to render a documentation page for a module

For instance, to pull up the `types.ts` file documentation data, you would use the URL: https://apiland.deno.dev/v2/pages/mod/doc/std/0.182.0/testing/types.ts

This is the data that goes into this page:
![types.ts doc page](/img/blog/third_party_modules/types.ts-documentation_page.png)

The pages are rendered via a webapp that is found in the [denoland/docland](https://github.com/denoland/docland) Github repository, so it is a good idea to check this repo out if you want to use this part of the API.

When this article was published it appears that the endpoint `/v2/pages/mod/info/:module/:version` is not working as it returns a 404.


### Example use of the third-party API

Obviously, the third-module registry API provides a lot of data to work with. You could essentially create your own version of `https://deno.land/x`. This version could be supercharged with information in the API but not found on the Deno Third Party Modules pages. Ranking the results by a different characteristic would be interesting or you could create your own popularity score algorithm.

I have create a simple prototype that displays the Deno Third Party Modules page data showing the top 500 modules and adding the Github star count to each module record. [You can see it in action here](https://3rd-party-api.deno.dev/).

This page includes a drop-down to sort the top 500 results by popularity score, Github star count or a combination of popularity score (weighted 75%) and GH star count (weighted 25%).

This demo shows one of the many ways the API data could be displayed. Graphical renditions would be an interesting option, for instance.

The code for my API demo is found at [this github repository](https://github.com/cdoremus/3rd-party-api).

## Conclusions

This article focused on the Deno third party modules list and the API used to create that list.

The API was used to revise the way modules are sorted on the [Deno Third Party Modules page](https://deno.land/x). Still, this new ranking is just an initial implementation of the [original algorithm  proposed by Kitson Kelly](https://github.com/denoland/dotland/issues/2133) who no longer works for Deno. If you are interested in improvements to the ranking system, you should post comments to that proposal.

Finally, take a look at [my demo app that used the third party API](https://3rd-party-api.deno.dev/) to show different module ranking views. There are numerous other ways to display and analyze data coming from the API and I urge you to use your imagination and technical skill to improve my humble prototype.

---

## Acknowledgements

The author would like to thank former Deno team member Kitson Kelly for answering some questions on the API last fall, and current Deno team member Leo Kettmeir for recently filling in my third-party module API knowledge gaps.

## References
- Kitson Kelly's June, 2022 talk introducing the new third-party API version he was working on: https://youtu.be/G_2AgdgEbkI?t=1554
- Kitson Kelly's Github repo demonstrating the API shown in his June, 2022 talk: https://github.innominds.com/kitsonk/deno-on-the-edge
- Section of Leo Kettmeir's February, 2023 talk covering the third-party API: https://www.youtube.com/watch?v=q5wWK9blBKQ&t=912s


