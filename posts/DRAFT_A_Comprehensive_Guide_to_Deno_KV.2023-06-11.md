### 2023-06-11

# A Comprehensive Guide to Deno KV

## Table of contents
- [Introduction](#introduction)
- [Keys, Values and Versions](#keys-values-and-versions)
- [CRUD operations](#crud-operations)
- [Transactions with `atomic()`](#transactions-with-atomic)
- [Secondary Indexes](#secondary-indexes)
  - [Sorting with indexes](#sorting-with-indexes)
- [Math operations: sum, min & max](#math-operations-sum-min--max)
- [KV on Deno Deploy](#kv-on-deno-deploy)
  - [KV data centers](#deno-deploy-data-centers)
- [Deno KV Frontiers](#deno-kv-frontiers)
  - [Deno team plans](#the-deno-team)
- [References](#references)
  - [Deno manual and API docs](#deno-manual-and-api-docs)
  - [Apps that use Deno KV](#apps-that-use-deno-kv)
## Introduction
Deno KV, a key-value based database is was built into the Deno runtime starting with Deno 1.32.0. Deno Deploy now incorporates Deno KV (currently on an invite-only basis), and distributes KV data around the world. This means that when a web application is put on Deploy, there will now be a database close to each server instance. In addition, Deno Deploy uses synchronization to maintain data consistency.

The Deno runtime has an implementation of Deno KV using sqlite for persistence. This implementation is compatible with the Deno Deploy KV database (based on [Foundation DB](https://www.foundationdb.org/)) so that code developed locally will seamlessly work when deployed to DD. This is a big win for Deno developers!

This article will comprehensively summarize this documentation.


## Keys, values and versions
### Keys
As stated above, Deno KV is a key-value database. In it's simplest form, a database record's data is persisted and found using the key. In Deno KV, the key is an tuple. Each of the members of the tuple is called a part. All parts are linked together by what is called 'invisible delimiters' to form the key. Key parts can be of types `string`, `number`, `boolean`, `Uint8Array`, or `bigint`.

Here's what a Deno KV key would look like:
```ts
// User key
const userKey = ["users", <userid>];
// Address key
const addressKey ["addresses", <addressid>, <userid>];
```
Usually the first key part identifies the entity being persisted, `"users"` or `"addresses"` in this example. The key parts when combined into a compound key should point to a single record. You can ues `crypto.randomUUID()` built into the web framework to create a unique ID.

### Values
In order for Deno KV values to be persisted, a value must be a serializable JavaScript type compatible with the [structured clone algorithm](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm).  Exceptions under the algorithm that prevents persistence includes:
- function objects
- DOM nodes
- `RegExp.lastIndex` is not preserved if `RegEx` is used as a value.
- Property descriptors, setters, getters, and similar metadata-like features of objects are not preserved.

The `Deno.KvU64()` constructor function is a wrapper around an unsigned `bigint` value. The value is set via the constructor argument and is retrieved using the `value` field on a `Deno.KvU64()` instance. This value is required to do certain mathematical calculations on values including `sum()`, `max()` and `min()`.

**TODO**: Elaborate-NNNNNNNNNNNNNNNNNNNNNNNN
```ts
const num = new Deno.KvU64(5n);
console.log(num.value)
```


### Versioning
Each time a new value is persisted to Deno KV, it is automatically given a version based on the timestamp when the value was persisted. KV calls this version a `versionstamp`. When a value is updated, a new `versionstamp` is created.


## CRUD operations
The main CRUD (create, read, update & delete) operations in KV are defined as methods on the `Deno.Kv` class: `set()`(create & update), `get()` (read) and `delete()` (delete).

In it's basic form, the key has a string part representing the data table and an ID part representing a record id. The value would be the record being persisted.


**CRUD data**

Most apps contain a users model encapsulating user data. A TypeScript interface representing a user might look like this:
```ts
interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
}
```
Deno KV CRUD operations for a `User` starts with data that probably comes from a form filled out by a user. In our case, we'll manually create a user with a unique id:

```ts
const userId = crypto.randomUUID();
const user = {
  id: userId,
  name: "John Doe",
  email: "john@doe.com",
  phone: "2071231234"
}
```

**Create (`set`)**

Lets connect to the KV data store and insert the data:
```ts
const kv = await Deno.openKv();
await kv.set(["users", userId], user);
```
The data table is called "users" and the user id would be the primary key in a SQL database.

The return value of a `set()` call is a `Promise<Deno.KvCommitResult>`, The `KvCommitResult` object contains a boolean `ok` field and a `versionstamp` field.


**Read (`get`, `getMany` & `list`)**

Deno KV has multiple methods for reading or querying the data store.

##### Reading single records (`get`)

Reading or querying a record would use the record's key:
```ts
const kv = await Deno.openKv();
const foundUser: User = await kv.get(["users", userId]);
```

The `get()` method has an second argument that is optional called `options`. The `options` argument contains one field `consistency`. which has two values `"eventual"` or `"strong"`, which is the default.


##### Reading multiple records (`getMany` & `list`)

Reading multiple records involves the use of `list()` and `getMany()`, two methods on `Deno.Kv`.
- `list()`

The `list()` obtains multiple records and produces an async iterator which produces a cursor for moving through lists of primitives and objects, one item at a time.

Since the iterator is asynchronous, iteration is usually done with a [`for-of` loop using `await`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of).

The `list()` method takes two arguments:
1. `selector`: an object with tree optional arguments: `prefix`, `start` and `end`. All the arguments have a key value like `set()`, `get()` or `delete()`. But unlike the other methods, the `prefix` key can be a subset of key parts.

Besides `prefix`, `start` and `end` are argument options. The `list()` method takes one or two arguments. The first one can be either
`prefix` or `start`. The second one can be either `start` or `end`.

To be able to use `start` or `end`, you need to understand how key ordering is done. The fancy term is lexicographical ordering which has been compared to dictionary order.


Either one of them can be used with

2. `options`:



- `getMany()`

The `getMany()` method is used to combine two or more indexes. For instance NNNNNNNNNNNNNNNNNNNNNNNNNNNNNN

**Update (`set`)**

Updating the data would also use the `set()` method

```ts
const kv = await Deno.openKv();
user.phone = "5182349876"
const result = await kv.set(["users", userId], user);
```
**Delete (`delete`)**

Deleting a record uses the `delete` method which requires a key argument.

```ts
const kv = await Deno.openKv();
await kv.delete(["users", userId]);
```
The delete method returns a `Promise<void>`

If any of the
## Transactions with `atomic()`
- limit to 10 writes in an `atomic()` call

## Secondary Indexes
### Sorting with indexes

In KV, key parts are ordered lexicographically (roughly dictionary order) by their type, and within a given type, they are ordered by their value. Type ordering follows that `Uint8Array` > `string` > `number` > `bigint` > `boolean`. Within each type, there is a [defined ordering](https://deno.com/manual@main/runtime/kv/key_space#key-part-ordering) too.

The significance of the key ordering is it can be used to sort values. You do that by creating an secondary index using the desired sorting criteria as key parts.

For instance, if you wanted to order users by their last name, your index would have a primary key with a record that looked was created like this:

```ts
ks.set(["users", "<userId>"], <user object record>)
```

An index for sorting by name would look like this:
```ts
ks.set(["users", "<lastName>", "<firstName>", "<userId>"], <user object record>)
```
You'll noticed that I added `userId` to the index. Otherwise duplicate records with the same first and last name will be ignored when the index is created. You could also use `email` (or another unique identifier) instead of `userId`.


## Math operations: sum, min & max

- `mutate()` method
```ts
await kv.atomic()
  .mutate({
    type: "sum",
    key: ["example_view_counter"],
    value: new Deno.KvU64(1n),
  })
  .commit();
```


## KV on Deno Deploy

### Deno Deploy Data Centers
Deno KV databases are replicated across at least 6 data centers, spanning 3 regions (US, Europe, and Asia).

#### Data Consistency
Data consistency refers to the assurance that all data centers maintain the same data even after new data is persisted.

There are two kinds of data consistency in Deno Deploy. They can be configured using the `consistency` option when data is read from Deno KV. There are two options:
- `consistency: "strong"` _(default)_ data reads from KV will come from the nearest region
- `consistency: "eventual"`

Data access is quicker with eventual consistency, but the data possibly will not be consistent between different replicated KV instances if a query is done shortly after one or more KV writes.

For more details see https://deno.com/blog/kv#consistency-and-performance

#### Synchronization Between Data Centers

When data is written to a Deno KV store, the following things happen:
1. The data is replicated synchronously to two data centers within the same Deno Deploy region.
2. The data is replicated to the other data centers asynchronously.
Data replication

Deno Deploy docs state that the full asynchronous replication of data should occur withing 10 seconds.


## Deno KV Frontiers

The future is hard to predict especially the future of new technologies like Deno KV.
### The Deno team

The Deno teams says they are working on adding blog storage to Deno KV

### Tools under development
-[Pentagon](https://github.com/skoshx/pentagon) a [Prisma]()-like ORM built on top of Deno KV
- [deno-kv-plus](https://github.com/Kycermann/deno-kv-plus) - building safe atomic transactions (see https://mieszko.xyz/deno-kv-plus)


## References
### Deno Manual and API Docs
- **Deno KV Concepts and Patterns** covered in the [Deno Manual](https://deno.com/manual@v1.33.1/runtime/kv) covers Deno KV's various concepts and patterns:
  - [Key Space](https://deno.com/manual@main/runtime/kv/key_space) is an overview of the keys, values and the versioning of the key-value records.
  - [KV Operations](https://deno.com/manual@main/runtime/kv/operations) covers KV methods.
  - [Deno KV Transactions](https://deno.com/manual@main/runtime/kv/transactions) shows how atomic transactions work in Deno KV.
  - [Deno KV Secondary Indexes](https://deno.com/manual@main/runtime/kv/secondary_indexes) demonstrates how to create a secondary key to be used to query data in the key-value store outside of using the unique, primary-key-like id.
- **The Deno KV API** is covered in the [API documentation](https://deno.land/api@v1.33.1?unstable=&s=Deno.Kv) covers the various public classes, interfaces, methods and variables in the Deno KV API.
- **Deno Deploy** the KV implementation on DD is explained on the [Deno Deploy KV page](https://deno.com/deploy/docs/kv). It shows how to work with Deno KV on Deno Deploy and how the Deno KV data store is distributed and synchronized in various regions.

### Apps that use Deno KV

- kv-sketchbook: https://github.com/hashrock/kv-sketchbook/tree/main
- tic-tac-toe: https://github.com/denoland/tic-tac-toe
