#### 2023-02-24

# Using the database SQLite with Deno

[SQLite](https://www.sqlite.org/index.html) is a lightweight database available on most platforms. It is designed to exist in memory or persist to a local file system. This post will discuss how to interact with a SQLite database in Deno.

At this point Deno-native[[1](#1-deno-native)] libraries are the only Deno SQLite client options since the [npm sqlite3 client does not work when run in Deno using the `npm:` prefix import URL](https://github.com/denoland/deno/issues/15611) because [postinstall scripts are not supported by Deno yet when importing with the `npm:` prefix](https://github.com/denoland/deno/issues/16164) (it is on the roadmap).

There are two Deno-native third-party libraries that are SQLite clients (aka drivers). Both of them work with SQLite version 3, the current version. They are [`deno-sqlite`](https://deno.land/x/sqlite) and [`sqlite3`](https://deno.land/x/sqlite3).

The `deno-sqlite` third-party library contains both a SQLite client and a SQLite implementation compiled as a Web Assembly Module (WASM). This allows SQLite to be used in a Deno program without need for an external SQLite engine. This library is named `sqlite` in the Deno third-party module registry while the Github repository is called `deno-sqlite` which is the name I will use in this post.

The `sqlite3` library is just a SQLite client. But it is designed with performance in mind as it uses the Deno Foreign Function Interface (FFI) to allow access to native file reading and writing functionality rather than going through a JavaScript wrapper around native I/O access built into Deno.

This post will explore how to do CRUD operations with each library using code snippets. There is a [corresponding repo folder](https://github.com/cdoremus/deno-blog-code/tree/main/sqlite) that contains full working examples.

## Creating a database and inserting data

#### Database creation and insertion with deno-sqlite
Persistence using `deno-sqlite` revolves around the `DB` class. The constructor can be used to point to a file-based database or one held in memory using the default constructor (or the `":memory:"` token as a constructor argument).
```javascript
import { DB } from "https://deno.land/x/sqlite@v3.7.0/mod.ts";

  // Open a database to be held in memory
  const db = new DB(":memory:"); // or new DB("file.db");
  db.execute(`
  CREATE TABLE IF NOT EXISTS people (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT
  )`);

  // Insert data within a transaction
  db.transaction(() => {
    for (const name of ["Peter Parker", "Clark Kent", "Bruce Wayne"]) {
      db.query("INSERT INTO people (name) VALUES (?)", [name]);
    }
  });

  // Todo: Other CRUD operations here...

  // Close database to clean up resources
  db.close()
```
The `DB.transaction` method is used for transactional control. If the function argument throws an error, the transaction is rolled back; otherwise it is committed. This `transaction` method can also be used for updates and deletes.

#### Database creation and insertion with sqlite3

The `sqlite3` library uses a `Database` class to initiate persistence. It's constructor takes a file path or `":memory:"` token for an in-memory database. The constructor also takes an options argument with a number of fields that are detailed in the [documentation](https://github.com/denodrivers/sqlite3/blob/main/doc.md).
```typescript
import { Database } from "https://deno.land/x/sqlite3@0.8.0/mod.ts";

  const db = new Database(":memory:"); // or a file name/path
  db.exec(`
  CREATE TABLE IF NOT EXISTS people (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT
  )`);
  // insert data in a transaction
  const inserts = db.transaction((data: string[]) => {
    for (const name of data) {
      db.exec("INSERT INTO people (name) VALUES (?)", [name]);
    }
  });
  inserts(["Peter Parker", "Clark Kent", "Bruce Wayne"]);

  // Todo: Other CRUD operations here...

  // Close database to clean up resources
  db.close();
```
The `Database.transaction` method is used to modify SQLite data in a transactional context. Unlike `deno-sqlite`, the `transaction` method returns a function that needs to be called with the SQL operation's data in order to run the transaction. But like `deno-sqlite`, the `sqlite3` transaction behavior depends on whether an error is thrown in the function (rollback) or it cleanly returns (commit).

## Running queries
#### Querying using deno-sqlite
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
  // Todo: create a table and fill with data as above.

  const query = db.prepareQuery<[number, string]>(
    "SELECT id, name FROM people",
  );

  for (const [id, name] of query.iter()) {
    console.log(`${id}: ${name}`);
  }

  query.finalize();
```
In this example, `preparedQuery` returned the `query` object as a `PreparedQuery` interface type. There are three ways to bind parameters and get results from a Prepared query:

- The `iter` method binds the parameters to the query and returns an iterator over rows. Use this if there are multiple rows in a result set because it avoids loading all returned rows into memory at once allowing a large number of rows to be processed sequentially.

- The `all` method binds the data and returns a full result set in an array.

- The `first` method returns the first item of a result set returned by the query.


You also need to run the `finalize` method on the `PreparedQuery` or you will get an error message:
```sh
Uncaught SqliteError: unable to close due to unfinalized statements or unfinished backups
      throw new SqliteError(this.#wasm);
```
While you can dynamically create a SQL string and run a query on the resulting string using the `DB.query` method, it can easily cause a [SQL Injection](https://owasp.org/www-community/attacks/SQL_Injection) attack on your database. Therefore, you should always use prepared statements with parameterized queries (i.e the `DB.prepareQuery` method).
#### Querying using sqlite3

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
- `run` - Run the query with it returning the number of rows in the result set. To get the resulting rows, you must then call `Statement.get()` with the row number (starting with 1) to get the individual data rows.

## Updating data
Updating the database with both SQLite libraries uses prepared statements (i.e. the same methods) like when running a query (`db.prepareQuery` or `Database.prepare`).
#### Updating using deno-sqlite
```typescript
  // Todo: create a table and fill with data as above.
  const id = 1;
    const newName = "Wade Winston Wilson";
    const query = db.prepareQuery<[number, string], { name: string; id: number }>(
      `UPDATE people set name=? where id=:id`,
    );
    query.all([newName, 1]);
    query.finalize();
  // Todo: Verify that data has been updated and close the database
```
As with querying, a `PreparedStatement` object needs to be finalized when the update has been completed or a `SqliteError` will be thrown.
#### Updating using sqlite3
```typescript
  // Todo: create a table and fill with data as above.
  const id = 1;
  const newName = "Wade Winston Wilson";
  const stmt = db.prepare(`UPDATE people set name=? where id=?`);
  stmt.run(newName, id);
  // Todo: Verify that data has been updated and close the database
```
## Deleting data
Like updating, data deletion using both SQLite libraries follows the same pattern as querying with the `db.prepareQuery` or `Database.prepare` methods.
#### Deleting using deno-sqlite
```typescript
  // Todo: create a table and fill with data as above.
  const id = 1;
  const query = db.prepareQuery<[number, string], { name: string; id: number }>(
    `DELETE from people where id=:id`,
  );
  query.all([1]);
  query.finalize();
  // Todo: Verify that data has been deleted and close the database
```
#### Deleting using sqlite3
```typescript
  // Todo: create a table and fill with data as above.
  const id = 1;
  const stmt = db.prepare(`DELETE from people where id=?`);
  stmt.run(id);
  console.log(`Deleted record for id ${id}`);
  stmt.finalize();
  // Todo: Verify that data has been deleted and close the database
```
When verifying that a record has been deleted you need to note that a query containing no results returns an empty array with `deno-sqlite` while the `sqlite3` lib returns undefined.

## SQLite Backends

SQLite was originally designed to be a lightweight database with data stored in a single file. As a consequence of that fact many web developers used it to do local development or to run integration and end-to-end tests.

But that does not work in modern web applications run in the cloud. However, all the major cloud platforms including [Amazon Web Services](https://aws.amazon.com/marketplace/pp/prodview-fci5iqpwrzxvo), [Azure](https://azuremarketplace.microsoft.com/en-us/marketplace/apps/cloud-infrastructure-services.sqlite-ubuntu) and [Google Cloud Platform](https://console.cloud.google.com/marketplace/product/cloud-infrastructure-services/sqlite-ubuntu) support SQLite on their platform. Besides the big three, other cloud providers with SQLite support include [fly.io](https://fly.io/docs/litefs/) and [Digital Ocean](https://www.digitalocean.com/community/tutorials/how-to-install-and-use-sqlite-on-ubuntu-20-04).

Distributed SQLite implementations are also available including [LiteFS](https://fly.io/docs/litefs/) from fly.io [RQLite](https://rqlite.io/), [DqLite by Canonical](https://dqlite.io/), [mvSQLite](https://github.com/losfair/mvsqlite) and [DBHub](https://dbhub.io/).

An interesting [article on migrating from PostgreSQL to SQLite using LiteFS](https://kentcdodds.com/blog/i-migrated-from-a-postgres-cluster-to-distributed-sqlite-with-litefs) shows what is involved with using a distributed SQLite implementation.

## Conclusion

I have tried to provide an objective comparison in this post between the Deno-native libraries `deno-sqlite (sqlite)` and `sqlite3` and not play favorites. It is up to you to try each of them out and decide which one works for your use case.

This post covers a subset of the `deno-sqlite` and `sqlite3` APIs, so it is a good idea to check the documentation for more details.

Documentation for the `deno-sqlite` lib is found in the [third-party registry pages for `sqlite`](https://deno.land/x/sqlite@v3.7.0/mod.ts) where you need to drill-down though the hyperlinks for function and TypeScript interface documentation. This documentation is generated from the jsdoc source-code comments for each TS interface and JavaScript public function and class.

Documentation for the `sqlite3` library is more centralized in the repo's [`doc.md`](https://github.com/denodrivers/sqlite3/blob/main/doc.md) file.

Finally, make sure you check out the [companion Github Repository](https://github.com/cdoremus/deno-blog-code/tree/main/sqlite) to this article to see working examples of all the CRUD operations for both libraries discussed here.

## Notes
##### 1. Deno-native
Deno-native is used here to indicate that the module is a Deno third-party library compatible with Deno and not an npm module requiring the use of the `npm:` prefix in the import URL.

