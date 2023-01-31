# Using the database SQLite with Deno

[SQLite](https://www.sqlite.org/index.html) is a lightweight database available on most platforms. They are designed to exist in memory or persist to a local file system. The memory-resident database can also be persisted to a file. This post will discuss how to interact with a SQLite database with Deno.

At this point Deno-native[[1](#1-deno-native)] libraries are the only Deno SQLite client options since the [npm sqlite3 client does not work when run in Deno using the `npm:` prefix import URL](https://github.com/denoland/deno/issues/15611) because [postinstall scripts are not supported by Deno yet when importing with the `npm:` prefix](https://github.com/denoland/deno/issues/16164) (it is on the roadmap).

There are two Deno-native third-party libraries that are SQLite clients (aka drivers). Both of them work with SQLite version 3, the current version. They are [`deno-sqlite`](https://deno.land/x/sqlite) and [`sqlite3`](https://deno.land/x/sqlite3). While they both can be used to interact with SQLite, the two Deno-native client libraries have somewhat different APIs.

## deno-sqlite

The `deno-sqlite` third-party library contains both a SQLite client and a SQLite implementation compiled as a Web Assembly Module (WASM). This allows SQLite to be used in a Deno program without need for an external SQLite engine.

The `deno-sqlite` library is registered as `sqlite` in the Deno third-party modules registry. It's import URL is [http://deno.land/x/sqlite](http://deno.land/x/sqlite). While there is a small example in the `README.md` file, full documentation is found in the [third-party registry pages for `sqlite`](https://deno.land/x/sqlite@v3.7.0/mod.ts) where you need to drill-down though the hyperlinks for function documentation. This documentation is generated from the jsdoc source-code comments for each public function and class.

The `deno-sqlite` API revolves around the `DB` class. It provides the API methods to create tables, insert, update and delete data and run queries using `SELECT`. Here is an example:

```javascript
import { DB } from "https://deno.land/x/sqlite/mod.ts";

// Open a database
const db = new DB("test.db");
db.execute("
  CREATE TABLE IF NOT EXISTS people (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT
  )
");

// Insert data
for (const name of ["Peter Parker", "Clark Kent", "Bruce Wayne"]) {
  db.query("INSERT INTO people (name) VALUES (?)", [name]);
}

// Print out the inserted data
for (const [name] of db.query("SELECT name FROM people")) {
  console.log(name);
}

// Close connection
db.close();
```

The `query` function is designed for a single use query. Multiple use queries need to use the `prepareQuery` method. Like `query`, `prepareQuery` takes the SQL string as the first argument, but it also provides additional optional arguments that are the parameters of a dynamic query.

```typescript


```

There was a [PR to add deno-sqlite to the Deno std library](https://github.com/denoland/deno_std/pull/2230) opened in May, 2022, but that was closed in December of that year due to lack of consensus by the Deno team.

## denodrivers sqlite3


The [Denodrivers Github project](https://github.com/denodrivers) is a collection of Deno-native driver modules for common databases in various stages of development. One of them is the `sqlite3` module.

Unlike the `deno-sqlite` module, the `sqllite3` module requires an external database driver

```js
import { Database } from "https://deno.land/x/sqlite3@0.7.2/mod.ts";

const db = new Database("test.db");

const [version] = db.prepare("select sqlite_version()").value<[string]>()!;
console.log(version);

db.close();
```
## The SQLite back end

SQLite was originally designed to be a lightweight local or single-server database with data stored in a single file. As a consequence of that fact many web developers used it to do local development or to run integration and end-to-end tests.

But that does not work in modern web applications that run on a distributed system like Deno Deploy.

This article is not designed as a tutorial on setting up the SQLite database engine, but I will point out various options for use
### Litestream https://litestream.io/ (https://fly.io/blog/all-in-on-sqlite-litestream/)

???? Do these work with regular SQLite clients like those above ?????

#### LiteFS https://fly.io/blog/introducing-litefs/

- Getting started: https://fly.io/docs/litefs/getting-started/

- Migrate from Postgresql: https://kentcdodds.com/blog/i-migrated-from-a-postgres-cluster-to-distributed-sqlite-with-litefs?ck_subscriber_id=363851230


## mvSQLite https://su3.io/posts/mvsqlite
- see also https://su3.io/posts/mvsqlite

### RQLite https://github.com/rqlite/rqlite
- Needs its own proprietary client

### Canonical DqLite https://dqlite.io/

### LiteFS https://fly.io/blog/introducing-litefs/


## Conclusion
Check out the [SQLite Tutorial](https://www.sqlitetutorial.net/) to learn more about SQLite.
## Notes
##### 1. Deno-native
Deno-native is used here to indicate that the module is a Deno third-party library compatible with Deno and not an npm module requiring the use of the `npm:` prefix in the import URL.

