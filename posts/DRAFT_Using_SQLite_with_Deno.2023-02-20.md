# Using the database SQLite with Deno

[SQLite](https://www.sqlite.org/index.html) is a lightweight database available on most platforms. They are designed to exist in memory or persist to a local file system. The memory-resident database can also be persisted to a file. This post will discuss how to interact with a SQLite database with Deno.

At this point Deno-native[[1](#1-deno-native)] libraries are the only Deno SQLite client options since the [npm sqlite3 client does not work when run in Deno using the `npm:` prefix import URL](https://github.com/denoland/deno/issues/15611) because [postinstall scripts are not supported by Deno yet when importing with the `npm:` prefix](https://github.com/denoland/deno/issues/16164) (it is on the roadmap).

There are two Deno-native third-party libraries that are SQLite clients (aka drivers). Both of them work with SQLite version 3, the current version. They are [`deno-sqlite`](https://deno.land/x/sqlite) and [`sqlite3`](https://deno.land/x/sqlite3).

The `deno-sqlite` third-party library contains both a SQLite client and a SQLite implementation compiled as a Web Assembly Module (WASM). This allows SQLite to be used in a Deno program without need for an external SQLite engine. This library is named `sqlite` in the Deno third-party module registry while the Github repository is called `deno-sqlite`

There was a [PR to add deno-sqlite to the Deno std library](https://github.com/denoland/deno_std/pull/2230) opened in May, 2022, but that was closed in December of that year due to lack of consensus by the Deno team.


The `sqlite3` library is just a SQLite client. But it is designed with performance in mind as it uses the Deno Foreign Function Interface (FFI) to allow access to native file reading and writing functionality rather than going through a JavaScript wrapper around native access used by `deno-sqlite`.

While they can both be used to interact with SQLite, the two Deno-native client libraries have similar APIs that differ in many ways. This post will explore how to do CRUD operations with each library using code snippets. There is a [corresponding repo folder](https://github.com/cdoremus/deno-blog-code/tree/main/sqlite) that contains full working examples.

## Creating a database insert data into a table

#### deno-sqlite
Persistence using `deno-sqlite` revolves around the `DB` class. The constructor can be used to point to a file-based database or one held in memory using the default constructor (or the ":memory:" token as a constructor argument).
```javascript
import { DB } from "https://deno.land/x/sqlite@v3.7.0/mod.ts";

  // Open a database to be held in memory
  const db = new DB(); // or new DB(:memory:);
  // Open a database to be persisted in the test.db file
  // const db = new DB("test.db");

  // Insert data into the table
  for (const name of ["Peter Parker", "Clark Kent", "Bruce Wayne"]) {
    db.query("INSERT INTO people (name) VALUES (?)", [name]);
  }

  // Todo: CRUD operations here...

  // Close database to clean up resources
  db.close()
```


#### sqlite3

The `sqlite3` library uses a `Database` class to initiate persistence. It's constructor takes a file path or `":memory:"` token for an in-memory database.
```typescript
import { Database } from "https://deno.land/x/sqlite3@0.8.0/mod.ts";

  const db = new Database(":memory:"); // or a file name/path
  db.exec(
    `
  CREATE TABLE IF NOT EXISTS people (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT
  )
`,
  );
  // insert data
  for (const name of ["Peter Parker", "Clark Kent", "Bruce Wayne"]) {
    db.exec("INSERT INTO people (name) VALUES (?)", [name]);
  }

  // Todo: CRUD operations...

  db.close();
```
## Running queries
#### deno-sqlite
The `deno-sqlite` lib has two ways of running a query. The first uses the `DB.query` method.
```typescript
// Todo: create a table and fill with data as above.
  const results = db.query<[number, string]>(
    "SELECT id, name FROM people",
  );

  for (const [id, name] of results) {
    console.log(`${id}: ${name}`);
  }
```
The second way of running a query in `deno-sqlite` is with a prepared statement which uses the `DB.prepareQuery` method which returns an object that conforms to the `PreparedStatement` interface.
```typescript
  const query = db.prepareQuery<[number, string]>(
    "SELECT id, name FROM people",
  );

  for (const [id, name] of query.iter()) {
    console.log(`${id}: ${name}`);
  }

  query.finalize();
```
In this example, `preparedQuery` returned the `query` object as a `PreparedQuery` interface type. There are three ways to bind parameters and get results from a Prepared query:

- The `all` method binds the data and returns a result set in an array.

- The `iter` method binds the parameters to the query and returns an iterator over rows. Use this if there multiple rows in a result set because it avoids loading all returned rows into memory at once which allows a large number of rows to be processed.

- The `first` method returns the first item of a result set returned by the query.


You also need to run the `finalize` method on the `PreparedQuery` or you will get an error message:
```sh
Uncaught SqliteError: unable to close due to unfinalized statements or unfinished backups
      throw new SqliteError(this.#wasm);
```
While you can dynamically create a SQL string and run a query on the resulting string, that is very dangerous as it can lead to a [SQL Injection](https://owasp.org/www-community/attacks/SQL_Injection) attack on your database. Therefore, you should always use prepared statements with parameterized queries.
#### sqlite3

The `sqlite3` library only uses prepared statement to do queries. A `Statement` object is returned from the call to `Database.prepare`.
```typescript
// Todo: create a table and fill with data as above.

  // Create a prepared statement
  const stmt = db.prepare("SELECT id, name FROM people where id=:id");
  // Bind the parameter to the statement
  const row = stmt.bind({ id: 1 });
  console.log(`Row for id 1: `, row.get(1));
  stmt.finalize(); // not required, otherwise finalization is automatic
```
The `Statement.bind` method is one of may ways to bind parameters to prepared statements. Other `Statement` methods used to bind data are
- `all` - Run the query and return the resulting rows in objects with column name mapped to their corresponding values.
- `values` - Run the query and return the resulting rows where rows are array of columns.
- `run` - Run the query with it returning the number of rows in the result set. To get the resulting rows, you must then call `Statement.get()` with the row number (starting with 1) to get the rows of data.

<!-- These binding functions are [documented here](https://github.com/denodrivers/sqlite3/blob/main/doc.md#binding-parameters). -->
## Updating data
Updating data with both SQLite libraries uses prepared statements as used in querying.
#### deno-sqlite
```typescript
  const id = 1;
    const newName = "Wade Winston Wilson";
    const query = db.prepareQuery<[number, string], { name: string; id: number }>(
      `UPDATE people set name=? where id=:id`,
    );
    query.all([newName, 1]);
    query.finalize();
```
A `PreparedStatement` object needs to be finalized when the update has been completed or a `SqliteError` will be thrown as is done with querying.
#### sqlite3
```typescript
  const id = 1;
  const newName = "Wade Winston Wilson";
  const stmt = db.prepare(`UPDATE people set name=? where id=?`);
  stmt.run(newName, id);
```
## Deleting data
Like updating, data deletion using both SQLite libraries follows the same pattern as querying.
#### deno-sqlite
```typescript
  const id = 1;
  const query = db.prepareQuery<[number, string], { name: string; id: number }>(
    `DELETE from people where id=:id`,
  );
  query.all([1]);
  query.finalize();
```
#### sqlite3
```typescript
  const id = 1;
  const stmt = db.prepare(`DELETE from people where id=?`);
  stmt.run(id);
  console.log(`Deleted record for id ${id}`);
  stmt.finalize();
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

Documentation for `deno-sqlite` is found in the [third-party registry pages for `sqlite`](https://deno.land/x/sqlite@v3.7.0/mod.ts) where you need to drill-down though the hyperlinks for function and TypeScript interface documentation. This documentation is generated from the jsdoc source-code comments for each TS interface and JavaScript public function and class.

Documentation for the `sqlite3` library is more centralized in the repo's [`doc.md`](https://github.com/denodrivers/sqlite3/blob/main/doc.md) file.

Finally, make sure you check out the [companion Github Repository](https://github.com/cdoremus/deno-blog-code/tree/main/sqlite) to this article to see working examples of all the CRUD operations for both libraries shown in this post.

## Notes
##### 1. Deno-native
Deno-native is used here to indicate that the module is a Deno third-party library compatible with Deno and not an npm module requiring the use of the `npm:` prefix in the import URL.

