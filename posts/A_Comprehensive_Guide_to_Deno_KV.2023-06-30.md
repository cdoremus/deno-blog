<!-- deno-fmt-ignore-file -->
### 2023-06-30

##### _36 min read_

# A Comprehensive Guide to Deno KV

## Table of contents
  - [Introduction](#introduction)
  - [Indexes](#indexes)
  - [Keys, values and versionstamp](#keys-values-and-versionstamp)
    - [Keys](#kv-keys)
    - [Values](#kv-values)
    - [Versionstamp](#kv-versionstamp)
  - [CRUD operations](#crud-operations)
    - [CRUD data](#crud-data)
    - [Create (`set()`)](#create-set)
    - [Read (`get()`)](#read-get)
    - [Update (`set()`)](#update-set)
    - [Delete (`delete()`)](#delete-delete)
  - [Reading multiple records (`list()` & `getMany()`)](#reading-multiple-records-list--getmany)
    - [Reading a list from KV with `list()`](#reading-a-list-from-kv-with-list)
      - [The first `list()` argument: `selector`](#1-the-first-list-argument-selector)
      - [The second `list()` argument: `options`](#2-the-second-list-argument-options)
      - [Pagination with `list()`](#pagination-with-list)
      - [Paginate KV results in a webapp](#paginate-kv-results-in-a-webapp)
    - [Combining records from multiple indexes with `getMany()`](#combining-records-from-multiple-indexes-with-getmany)
  - [Transactions with `atomic()`](#transactions-with-atomic)
    - [Using `check()` to validate transactions](#using-check-to-validate-transactions)
    - [Using `set()` and `delete()` for transactional persistance](#using-set-and-delete-for-transactional-persistance)
    - [Persisting data in a KV transaction](#persisting-data-in-a-kv-transaction)
    - [Tracking a record's history](#tracking-a-records-history)
    - [Transaction failures](#transaction-failures)
  - [Secondary Indexes](#secondary-indexes)
    - [Creation](#creation)
    - [Updating and deletion](#updating-and-deletion)
    - [Sorting with indexes](#sorting-with-indexes)
  - [Math operations: sum, min \& max](#math-operations-sum-min--max)
    - [`sum()`, `min()` and `max()` methods](#sum-min-and-max-methods)
    - [`mutate()` method](#mutate-method)
  - [Using KV Queue](#using-kv-queue)
  - [KV on Deno Deploy](#kv-on-deno-deploy)
    - [Deno Deploy Data Centers](#deno-deploy-data-centers)
      - [Data Consistency](#data-consistency)
      - [Synchronization Between Data Centers](#synchronization-between-data-centers)
    - [Loading KV data into Deno Deploy](#loading-kv-data-into-deno-deploy)
  - [Conclusions](#conclusions)
- [Appendix](#appendix)
  - [References](#references)
    - [Deno Manual and API Docs](#deno-manual-and-api-docs)
    - [Apps that use Deno KV](#apps-that-use-deno-kv)
    - [KV Tools under development](#kv-tools-under-development)
---
## Introduction

Deno KV, a key-value based database, was built into the Deno runtime starting with Deno 1.32.0 as an unstable API. Deno Deploy now incorporates Deno KV (currently as an invite-only beta), and distributes KV data around the world. This means that when a web application is put on Deploy, there will now be a database close to each server instance. Deno KV also provides [ACID](https://en.wikipedia.org/wiki/ACID) transactions to maintain data consistency.

This article will cover all aspects of Deno KV with simple, easy-to-understand examples. Since info on Deno KV is in [multiple places in the Deno documentation](#deno-manual-and-api-docs), consider this post as a one-stop guide to KV.

Note that a dozen working code examples have been created to support this blog post. They can be found in [this repository folder](https://github.com/cdoremus/deno-blog-code/tree/main/deno-kv). You'll also find each example linked in the relevant section of this article.

## Indexes

An index in Deno KV parlance are the units of data storage. In relational database (RDBMS) terms, they can be loosely thought of as a table, but they are more like a SQL index because they are ordered by key value for fast lookup.

A KV **primary index** is the index that stores a record using a unique key for each record, usually a UUID. We'll talk more about them in the next few sections. A **secondary index** stores additional information or is used for sorting. [We'll talk about them later](#secondary-indexes).

## Keys, values and versionstamp

Deno KV have well-defined keys, values and a versionstamp that represents a value's version.
### [KV Keys](https://deno.com/manual@v1.34.0/runtime/kv/key_space#keys)

As stated above, Deno KV is a key-value database. In it's simplest form, a database record's data is persisted and found using the key. In Deno KV, the key is a tuple, an array with a fixed length. Each of the members of the tuple is called a **part**. All parts are linked together into a kind of compound key. Key parts can be of types `string`, `number`, `boolean`, `Uint8Array`, or `bigint`.


Here are a couple of examples of a Deno KV key used to identify unique records:
```ts
// User key
const userKey = ["user", <userid>]; // Used for storing user objects
// Address key for a particular User
const addressKey ["address", <userId>]; // Used for storing a user's address
```
As stated above, when a unique key is used to persist values, the resulting index is know as a primary index. The Web platform provides `crypto.getRandomUUID()` to obtain a unique id.

An index is an ordered sequence of key parts so that `[1, "user"]` is not the same as `["user", 1]`.

When used in a primary index the first key part is usually a string constant identifying the model collection being persisted, `"user"` or `"address"` in the example. When used to add records to an index, the key parts are combined into a compound key.

The initial key part of an index can be expanded into multiple parts. For instance, if we have a user with roles, we might have the second part representing a role such as:
```ts
const userAdminKey = ["user", "admin", <userId>];
const userCustomerKey = ["user", "customer", <userId>];
const userGuestKey = ["user", "guest", <userId>];
```
If there is a role field on the model, the previous keys could be reduced to something like this (assuming each user has one role):
```ts
const userRoleKey = ["user_by_role", <userRole>, <userId>];
```
Indexes created with these keys are called secondary indexes. They need to be persisted in an atomic transaction with the primary index in order for the data to be is consistent between indexes ([see the secondary index discussion below](#secondary-indexes)). Secondary indexes should have a first part name describing their function. In this case, the key is used to lookup a user and the first part is `"user_by_role"`.

### [KV Values](https://deno.com/manual@v1.34.0/runtime/kv/key_space#values)

In order for Deno KV values to be persisted, a value must be a structured, serializable JavaScript type compatible with [JavaScript's structured clone algorithm](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm).

Basically, it is anything that can be passed as the first argument of [`structuredClone()`](https://developer.mozilla.org/en-US/docs/Web/API/structuredClone) except `SharedArrayBuffer`. The `SharedArrayBuffer` is an exception because is a shared memory data structure that cannot be passed across KV remote isolates.

See  [this discussion on MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm#things_that_dont_work_with_structured_clone) for more details on what does not conform to the structured clone algorithm.

Despite these limitations most common JavaScript types including `undefined`, `null`, `boolean`, `number`, `string`, `Array`, `Map`, `Uint8Array` and `Object` work as KV values ([a full list](https://deno.com/manual@v1.34.0/runtime/kv/key_space#values)).

The Deno Manual notes that objects with a non-primitive prototype such as class instances or Web API objects are not supported as KV values.

Here are examples of how the keys and values are used to persist to Deno KV (the `set()` method will be discussed later):
```ts
// persist an object with id, name and role fields
kv.set(["user", "a12345"], {id: "a12345", name: "Craig", role: "admin"});
// persist an environmental variable value
kv.set(["env", "IS_PROD"], true);
// persist a hit count by page and userId
kv.set(["hits", "account.tsx", "a12345"], 254);
```
### [KV versionstamp](https://deno.com/manual@v1.34.0/runtime/kv/key_space#versionstamp)

Each time a new value is persisted to Deno KV, it is automatically given a 12-byte version value based on the timestamp when the record was saved. KV calls this a `versionstamp`. When a value is updated, a new `versionstamp` is created.

A new `versionstamp` will always be 'larger' than the previous one such that the second modification of a record will always be greater than the first in a boolean comparison (versionstamp2 > versionstamp1). This is important if you want to [track and display a record's version history](#tracking-a-records-history).

The `versionstamp` assures that transactions are done atomically thus making sure that affiliated relational records in different indexes are consistent. Atomic operations in Deno KV can be checked to make sure that the data is consistent between the last fetch (`get()`) and when the new data will be persisted. This check is done with the record's `versionstamp` ([for details see below](#transactions-with-atomic)).


## CRUD operations
The main CRUD (create, read, update & delete) operations in KV are defined as methods on the `Deno.Kv` class: `set()`(create & update), `get()` (read) and `delete()` (delete). All these operations are asynchronous so a call needs to be preceded with the `await` keyword.

> 💡 Working code that demonstrates CRUD operations can be found in the [repo affiliated with this blog](https://github.com/cdoremus/deno-blog-code/blob/main/deno-kv/crud.ts).

All CRUD operations on Deno KV start with a connection to the KV database which is done with a simple call to `Deno.openKv()`:
```ts
// Open a KV connection returning a Deno.Kv instance
const kv: Deno.Kv = await Deno.openKv();
```

We'll be using the `kv` KV connection object (`Deno.Kv` instance) throughout our examples below.

### CRUD data

It's best to create a TypeScript type or interface to represent data models. For instance, a user model will look something like this:
```ts
interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
}
```
Adding relations to the model, such as address and phone numbers would use `Address` and `Phone` interfaces. Both of them would have a `userId` field that would allow the lookup of an address and phone number for a particular user. For simplicity, we will focus on the `User` model here.

Deno KV CRUD operations for a `User` will persist data that often comes from an HTML registration form filled out by a user. In our case, we'll manually create a user with a unique id:

```ts
const userId = "1";
const user = {
  id: userId,
  name: "John Doe",
  email: "john@doe.com",
  phone: "2071231234"
}
```

The user id can be hard coded like I did here, but it's best that it is generated  as a unique value. The `crypto` object built into the Web platform is an easy way to create a unique id:
```ts
const userId = crypto.randomUUID();
```

### Create (`set()`)

Lets connect to the KV data store and insert the `user` data which requires two arguments, a `Deno.KvKey` and a value whose type is the method's TypeScript generic parameter (`User` in this example):
```ts
const result = await kv.set<User>(["user", userId], user);
if (result.ok === false) {
  throw new Error(`There was a problem persisting user ${user.name}`)
}
```
In SQL database terms the data table would be called "user" and the user id would be the primary key.

The return value of a `set()` call is a `Promise<Deno.KvCommitResult>`, The `KvCommitResult` object contains a boolean `ok` field and a `versionstamp` field. If the `set()` call fails, `ok` is set to `false`. The `versionstamp` would be the versionstamp of the persisted record.


### Read (`get()`)

The `get()` method is used to obtain a single record from Deno KV. For example:

```ts
// Assumes kv is a Deno.Kv object
const foundRecord: Deno.KvEntryMaybe<User> = await kv.get<User>(["user", userId]);
// Get user value
const user = foundRecord.value;
```
A call to `get()` returns a `Deno.KvEntryMaybe` object containing `key`, `value` and `versionstamp` properties (the Maybe part of `KvEntryMaybe` means that the result's value and versionstamp may be null). The `key` will always be the key you used in the the `get()` call. The `value` and `timestamp` values are those found in the KV store associated with the `key`.

Here's an example of an object returned from `get()`:
```ts
// ids obtained from a call to crypto.getRandomUUID()
{"key":["users","4f18bbe6-1e0a-483f-9b89-556be297191c"],
"value":{"id":"4f18bbe6-1e0a-483f-9b89-556be297191c","name":"John Doe","email":"john@doe.com","phone":"2071239876","age":35},
"versionstamp":"0000000000001d960000"}
```

> 💡 Notice that value of a `get()` call is found in the `value` property of the call's result. This can trip you up since you might expect that the `get()` call returns only the value. Also be aware that the return value is wrapped in a `Promise` so make sure you prefix the call with `await`.

If you call `get()` with a `key` that is not in the KV store, you will get back an object with both `value` and `versionstamp` equal to `null`.

#### `set()` Options

The `get()` method has an optional second argument called `options`. The `options` argument contains one field `consistency`. which has two values `"eventual"` or `"strong"`([see discussion below for details](#data-consistency)).

When running Deno KV locally, the `consistency` value is not relevant since the KV store is local. It is relevant when an application using Deno KV runs in the cloud on Deno Deploy since KV store instances are remotely distributed ([see below](#deno-deploy-data-centers)).

### Update (`set()`)

Updating KV data would also use the `set()` method as is done for inserts:

```ts
user.phone = "5182349876"
// Assumes kv is a Deno.Kv object
const result = await kv.set<User>(["user", userId], user);
if (result.ok === false) {
  throw new Error(`There was a problem persisting user ${user.name}`)
}
```
The arguments and return value from an update is the same as a create/insert call to `set()`.

### Delete (`delete()`)

Deleting a record with the `delete()` method which requires a key (`Deno.KvKey`) argument.

```ts
// Assumes kv is a Deno.Kv object
await kv.delete(["user", userId]);
```
The delete method returns a `Promise<void>` which resolves to an `undefined` value.

It is recommended that the mutation methods `set()` and `delete()` are done in a transaction which will return a result with an `ok` property to indicate if the transaction succeeded (`ok: true`) or failed (`ok: false`). See the [transaction section below for more details](#transactions-with-atomic).


## Reading multiple records (`list()` & `getMany()`)

Reading multiple records involves the use of `list()` and `getMany()`, two methods on `Deno.Kv`.

### Reading a list from KV with `list()`

The `list()` method obtains multiple records and produces an async iterator (`Deno.KvListIterator`). The easiest way to loop through this kind of iterator is to use a [`for-of` loop with `await`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of) loop. Here is a simple example:
```ts
// The iterator is returned from a call to list().
// 'await' used with 'for' because the iterator is async
for await (const row of iterator) {
  const user = row.value;
  console.log(user.name); // do something with the user object
}
```

> 💡 Working code that dives deeply into the `list()` method can be found in the [repo affiliated with this blog](https://github.com/cdoremus/deno-blog-code/blob/main/deno-kv/lists.ts). Nearly all the code files in the repo use `list()` in various ways.

The `list()` method takes two arguments `selector` and `options`:

#### 1. The first `list()` argument: `selector`

The `selector` argument is an object with three optional fields: `prefix`, `start` and `end`.

**The `prefix` `selector` field**

Unlike the key arguments for `set()`, `get` and `delete()`, CRUD methods, the `prefix` key is a key part subset. All the key parts are usually string literals.

Let's say you just wanted a list of users or user admins, your `list()` call would look like this:
```ts
// Assumes kv is a Deno.Kv object
// Get and iterator with a list of users
const iterUser = kv.list<User>({prefix: ["user"]});
// An iterator with a list of admins
const iterAdmin = kv.list<User>({prefix: ["user", "admin"]});
```
> 💡 To avoid TypeScript errors, call `list()` with a generic parameter (`User` in the previous example).

Besides its use in querying, index prefixes are important when data is stored in remote KV instances (like Deno Deploy) because indexes with the same prefix are persisted near each other which facilitates rapid retrieval.


**`Selector` fields `start` and `end`**

Besides `prefix`, `start` and `end` are `selector` field options. The `list()` method takes one or two of these fields. The first one can be either `prefix` or `start` and the second one can be either `start` or `end`.

The `start` or `end` options of `list()` define a range of KV records you want to select. But to be able to use `start` or `end`, you need to understand how key ordering is done (see the [sorting with indexes section below](#sorting-with-indexes)).

While key ordering is instrumental for sorting, with `start` and `end` the order is used to define the beginning and ending of a range of ordered keys returned in the result set.

The `start` option starts with the first matching record while the `end` method includes all previous records, but not the record it points to.
```ts
// Assumes kv is a Deno.Kv object
const rows = kv.list({
  start: ["user_by_name", "Dow"],
  end: ["user_by_name", "Zozos"],
});
for await (const row of rows) {
  const user = row.value as User;
  console.log(user.name);
}
```

> 💡 In order for the `start` option to work correctly, you need to make sure that the index you are sorting with is unique. For instance if the "user_by_name" index shown in the example was created using only the last name and if there are records with the same last name, only one will be included in the results. To explore how this happens see [this example code in the blog's repo](https://github.com/cdoremus/deno-blog-code/blob/main/deno-kv/sort-dup.ts).

You can pair either `start` or `end` with the `prefix` field. When `prefix` is paired with `start`, the end point is the last record in the index. Alternately, when `prefix` is paired with `end`, the start point is the first index record. Here is an example:
```ts
// Assumes kv is a Deno.Kv object
const rows = kv.list({
  prefix: ["user_by_name"], // points to first record
  end: ["user_by_name", "Zozos"],
});
// Loop through results
for await (const row of rows) {
  const user = row.value as User;
  console.log(user.name);
}
```

#### 2. The second `list()` argument: `options`

The `options` `list()` argument is an object with a collection of fields:
  - `limit: number` - limits the size of a `list()` result set.
  - `cursor: string` - the `cursor` to resume iteration. Recall the `list()` method returns a `Deno.KvListIterator` that contains a `cursor` field. This is important in the [pagination use case](#pagination-with-list).
  - `reverse: boolean` - returns the list in reverse order
    - `prefix`, `start` or `end` can be used with `reverse`.
  - `batchSize: number` - the size of the batches in which the list operation is performed. The default is equal to the 'limit' value or 100
  - `consistency: Deno.KvConsistencyLevel` - the transactional consistency, either `"strong"` or `"eventual"`(see the [consistency section below](#data-consistency)).

#### Pagination with `list()`

The key to iterating a list in paged groups is the fact that `list()` returns a [`Deno.KvListIterator`](https://deno.land/api@v1.34.2?s=Deno.KvListIterator&unstable=). That iterator has a `cursor` field and a `next()` method, a consequence of that fact that it implements the [async iterator protocol](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#the_async_iterator_and_async_iterable_protocols).

To paginate, you pass the cursor from one `list()` call to the next via the iterator result. That result's `iterator.cursor` value becomes the value of the `cursor` option in the next `list()` call. Here's how it looks:
```ts
// Assumes kv is a Deno.Kv object
// First call to list() returns iterator
let iterator = kv.list<User>({ prefix: ["user_by_age"] }, {limit: 25})
// Second call sets the cursor using the iterator from the first call to set the second call's cursor
iterator = kv.list<User>({ prefix: ["user_by_age"] }, {limit: 25, cursor: iterator.cursor});
```
When you don't know the number of items in an index you are querying with `list()` ("user_by_age" in this case), you can't just call until you get a null iterator, because `list()` always returns a `KvListIterator` object even if there are no results that can be obtained from the iterator.

Instead, you use the `KvListIterator.next()` method's `done` property. This is best shown with an example.

First, start with a list of users:
```ts
// start with a User interface
interface User {
  id: number;
  name: string;
  age: number;
}
const users: User = [/* Multiple User objects here */];
```
Next, we'll create a function to get an iterator. It will be called each time we want to display another group of users on a page. The first call to this method will set the `cursor` argument to an empty string which is used to determine whether `cursor` will be part of the second `list()` argument.

```ts
// Obtain a new User iterator
function getIterator<T>(cursor: string, limit: number): Deno.KvListIterator<T> {
  const optionsArg = cursor !== "" ? { limit, cursor } : { limit };
  // Assumes kv is a Deno.Kv object
  const iterator = kv.list<User>({ prefix: ["user_by_age"] }, optionsArg);
  return iterator;
}
```
The `processIterator<User>()` function pulls out the iterated data (users in this case) and returns them with the cursor to be used in the next call to `getIterator()`:

```ts
// Called with `User` generic param below (item=User; items=User{})
async function processIterator<T>(
  iterator: Deno.KvListIterator<T>,
): Promise<{cursor: string, items: T[]}> {
  let cursor = "";
  let result = await iter.next();
  const items = [];
  while (!result.done) {
    cursor = iterator.cursor;
    // result.value returns full KvEntry object
    const item = result.value.value as T;
    items.push(item);
    result = await iter.next();
  }
  return {cursor, users};
}
```
While the previous functions are generic, `printUsers` is used to print out an array of `User` objects with the page number:
```ts
function printUsers(users: User[], pageNum: number) {
  console.log(`Page ${pageNum}`);
  for (const u of users) {
    console.log(`${u.name} ${u.age}`);
  }
}
```
Finally, initiate the pagination, printing out user data to the console:
```ts
// print out users in batches of USERS_PER_PAGE
const USERS_PER_PAGE = 3; // aka page size
let pageNumber = 1;
let cursor = "";
let iter = getIterator<User>(cursor, USERS_PER_PAGE);
await processIterator(iter, pageNumber);
printUsers(processedItems.items as User[], pageNum);
pageNumber++;
// point the cursor to the next batch of data
cursor = iter.cursor;
// stop iteration when cursor is empty
while (cursor !== "") {
  iter = getIterator<User>(cursor, USERS_PER_PAGE, keyPart);
  const iterRet = await processIterator<User>(iter);
  cursor = iterRet.cursor;
  // cast items to User[]
  const items: User[] = iterRet.items as User[];
  if (items.length > 0) {
    printUsers(items, pageNum);
  }
  pageNum++;
}
```
> 💡 The example snippets taken from code that demonstrates `list()` pagination can be found in the [repo affiliated with this blog](https://github.com/cdoremus/deno-blog-code/blob/main/deno-kv/pagination.ts).


#### Paginate KV results in a webapp

Paginating webapp results uses a lot of the previous code including `getIterator` and `processIterator`. You will also need to keep track of the `cursor` and `pageNumber` between requests for new pages, passing them into the next URL invocation via params in 'Next Page' and 'Previous Page' links in the footer.

This is a tough thing to explain in black and white without example code (and in the process prolonging this already-too-long post), so I'll leave this as an exercise for the reader. However, please stay tuned. I hope to cover this in detail in a future article.

> 💡 At this point, I'm prototyping a [Deno Deploy playground that demonstrates KV pagination](https://dash.deno.com/playground/kvpagination-playground), but it's quite not ready for prime time yet.


### Combining records from multiple indexes with `getMany()`

The `getMany()` method provides the opportunity to do a number of `get()` calls to separate indexes in one operation. The method accepts an array of keys and returns an array of `Deno.KvEntryMaybe` records, objects that include a `key`, `value` and `timestamp` fields.

> 💡 Working code that demonstrates the `getMany()` method can be found in the [repo affiliated with this blog](https://github.com/cdoremus/deno-blog-code/blob/main/deno-kv/get-many.ts).

It is important to know that each one of the keys should return single `KvEntryMaybe` objects like they would in a `get()` call. So it follows that the number of keys in the `getMany()` argument will always equal the number of of results in the call return array.

For example, suppose we have three environmental variables stored in three separate indexes. Here's what that would look like:

```ts
// keys for storing env variables in KV
const githubSecretKey = ["env_var", "GITHUB_ACCESS_KEY"];
const googleSecretKey = ["env_var", "GOOGLE_ACCESS_KEY"];
const discordSecretKey: Deno.KvKey = ["env_var", "DISCORD_ACCESS_KEY"];

// Assumes kv is a Deno.Kv object
// store env vars in separate indexes
await kv.set(discordSecretKey, "password1");
await kv.set(githubSecretKey, "password2");
await kv.set(googleSecretKey, "password3");

// get all env var entries in one call to separate indexes
const envVars = await kv.getMany([
  githubSecretKey,
  googleSecretKey,
  discordSecretKey,
]);
// the 'enVars' result array would contain these values:
//
// enVars[0] = {key: ["env_var", "GITHUB_ACCESS_KEY"], value: "password2", versionstamp: "001234" }
// enVars[1] = {key: ["env_var", "GOOGLE_ACCESS_KEY"], value: "password3", versionstamp: "001235" }
// enVars[2] = {key: ["env_var", "DISCORD_ACCESS_KEY"], value: "password1", versionstamp: "001236" }

```

The `getMany()` method takes a second argument, `options` which is optional. The `option` argument has one property `consistency` which can be "strong" or "eventual". See the [data consistency section](#data-consistency) for more details on this topic.

## Transactions with `atomic()`

The `atomic()` method on `Deno.Kv` is used to do a transaction with KV. It returns a `Deno.AtomicOperation` class instance. Transactional operations are chained to `atomic()`. The chain must be terminated with a call to `commit()` in order for the transactional operations to be completed and the data persisted.

> 💡 Working code that demonstrates atomic transactions can be found in the [repo affiliated with this blog](https://github.com/cdoremus/deno-blog-code/blob/main/deno-kv/atomic.ts)
### Using `check()` to validate transactions


A transactional chain off of `atomic()` should first call the `check()` method for each persistent operation. The `check()` method ensures that the `versionstamp` of data already in the KV store matches the `versionstamp` of the data being persisted. This feature is called optimistic concurrency control and assures data consistency and integrity within the KV store.

A `get()` call must be done prior to `check()` to provide the `key` and `versionstamp` arguments of `check()`. For a new data insert the `get()` call will return null for the `versionstamp` (and `value`). If `check()` fails, then the transaction will fail and the data will not be committed.

After `check()`, a series of `set()` and/or `delete()` calls are done to persist or delete KV data based on the provided key. These two methods behave the same way they do when called outside an `atomic()` chain ([see CRUD section above](#crud-operations)).

An example will clarify how `check()` is used. Here we are trying to persist a user object with a changed phone number.

```ts
// Assumes kv is a Deno.Kv object
const user = await kv.get(["user", 123])
const result = await kv.atomic()
  // Make sure versionstamp has not changed after last get()..
  // This method requires both a key and versionstamp
  .check({key: user.key, versionstamp: user.versionstamp})
  // update phone number
  .set(["user", user.id], {...user.value, phone: "2070987654"  })
  .commit();
```

If `check()` fails, then any persistent operation in the chain will be bypassed and the `commit()` call returns a `Deno.KvCommitError`.

### Using `set()` and `delete()` for transactional persistance

In the previous example, `set()` is used to create or update data in a transactional chain. It is a method of `Deno.AtomicOperation` and works the same way as `Deno.Kv.set()` taking a key and value as arguments. It persists the value in a KV store with the key as the primary key (the record also contains a `versionstamp`).

Likewise, `delete()`, also an `Deno.AtomicOperation` method, works the same way as its `Deno.Kv` counterpart. It takes a key argument and is used to remove records from a Deno KV store.

Both `set()` and `delete()` can be chained to `atomic()` multiple times, but there cannot be more than 10 writes in a single persistent chain.

The full power of KV transactional persistence is revealed when you need to store related objects. For instance, if you have a user who has an address and phone numbers. You should start with Typescript types defining the model:
```ts
// userId added prior to persistence
interface User {
  id?: string;
  name: string;
  email: string;
}
interface Address {
  userId?: string;
  street: string;
  city: string
  state: string;
  country: string;
  postalCode: string;
}
interface Phone {
  userId?: string;
  cell: string;
  work?: string;
  home?: string;
}
```
Each one of the entities will be persisted into a separate KV index within an atomic transaction. Let's assume that this information has been collected from an HTML user-registration form and processed into `User`, `Address` and `Phone` model objects. Here's a function to insert or update that data within a KV transaction:
```ts
function persistUser(user: User, address: Address, phone: Phone) {
  if (!user.id) {
    const userId = crypto.randomUUID();
    address.userId = userId;
    phone.userId = userId;
  }
  // Assumes kv is a Deno.Kv object
  // get current records
  const userRecord = await kv.get(["user", userId]);
  const addressRecord = await kv.get(["address", userId]);
  const phoneRecord = await kv.get(["phone", userId]);
  await kv.atomic()
    // check that data has not changed
    .check({key: userRecord.key, versionstamp: userRecord.versionstamp})
    .check({key: addressRecord.key, versionstamp: addressRecord.versionstamp})
    .check({key: phoneRecord.key, versionstamp: phoneRecord.versionstamp})
    .set(userKey, user)
    .set(addressKey, address)
    .set(phoneKey, phone)
    .commit();
}
```

The return value of a `kv.atomic()....commit()` call chain is a `Promise<Deno.KvCommitResult>` if the transaction succeeds. That object contains two fields: `ok` and `versionstamp`. The `ok` value will be `true` in a successful transaction.

### Transaction failures

If a KV transaction fails within an `atomic()` call chain either by a failed `check()` or another transactional error, a `Deno.KvCommitError` is returned. In that case, the transaction is not persisted. The `KvCommitError` object has one field `ok` that is set to `false` when a failure happens.

Here's what happens if you try to insert data that has already been inserted causing `check()` to fail:
```ts
// Assumes that User 1 has already been added to the KV index
const id = 1; // user id
// Assumes kv is a Deno.Kv object
const result = kv.atomic()
  // Initial insert has null versionstamp
  .check({key: [
    "user", id], versionstamp: null})
  .set(["user", id], `User ${id}`)
  .commit();

if (result.ok === false) {
  throw new Error(`Data insert failed for User ${id} because it already exists`);
}
```
### Tracking a record's history

The `versionstamp` returned in a successful `atomic()` transaction is the versionstamp given to all operations within the `atomic()` call chain. This can be used to construct a version history of a record. In order to do this, you need to persist the `versionstamp` to a separate index. Here's what that would look like:

> 💡 Working code that demonstrates how to track a record's history can be found in the [repo affiliated with this blog](https://github.com/cdoremus/deno-blog-code/blob/main/deno-kv/record-history.ts).

```ts
const userId = crypto.randomUUID();
// Assumes kv is a Deno.Kv object
const user = await kv.get(["user", userId])
const result = await kv.atomic()
  .check(user)
  .set(["user", userId], {id: userId, name: "Joan Smith", email: "jsmith@example.com"})
  .commit();
if (result.ok) {
// add the result versionstamp to a separate "user_versionstamp" index with a timestamp
  await kv.set(["user_versionstamp", userId, result.versionstamp ], {version: result.versionstamp, date: new Date().getTime()});
}
```
Since the `versionstamp` is part of the key, records will be ordered by `versionstamp` for each user.

You can then use `list()` to display the history of a particular user's record.
```ts
// display version in reverse chronological order
const iter = kv.list({ prefix: ["user_versionstamp", userId] },
    {reverse:  true});
for await (const version of iter) {
  // display to stdout here; I'm sure you can do better
  console.log(`Version: ${version.value.version} Date: ${version.value.date}`);
}
```

## Secondary Indexes

You usually begin a Deno KV implementation by creating a primary index. The primary index will contain a model identifier part and a part unique to the value being persisted, like a user id for a "user" model. In that case, a particular "user" record will be found using the id.

> 💡 Working code that demonstrates how to create and use secondary indexes  can be found in the [repo affiliated with this blog](https://github.com/cdoremus/deno-blog-code/blob/main/deno-kv/secondary-index.ts).

### Creation and mutation
A secondary index is used to find a KV record or multiple records beyond the find-by-id search you can do with a primary index.

For instance, if you want to search for a user by an email address you could have an index that uses the email address as the search criteria. These indexes usually have a name part that describes the index such as "user_by_email".

When you have secondary indexes, you need to create them in a transactional context with the primary index to maintain data consistency.
```ts
const userId = crypto.randomUUID();
const user = {id: userId, name:"Joan Smith", email: "joan.smith@example.com"};
const userKey = ["user", userId];
const userEmailLookupKey = ["user_by_email", user.email];
// Assumes kv is a Deno.Kv object
const result = kv.atomic()
  .check({key: userKey, versionstamp: null})
  .check({key: userEmailLookupKey, versionstamp: null})
  .set(userKey, user) // primary index
  .set(userEmailLookup, user.id) // secondary index
  .commit();
if (!result.ok) {
  throw new Error("Problem persisting user & user_by_email");
}
```
A `get()` call to "user_by_email" index returns the user's id. This will be used to find the record in the "user" primary index.
```ts
// The "user_by_email" record's value is the userId (see previous code)
const userByEmailRecord = await kv.get<User>(["user_by_email", userEmail]);
// The value is the user Id
const userByIdRecord = await kv.get<User>(["user", userByEmailRecord.value]);
const user: User = userByIdRecord.value;
```
When the data is updated or deleted, you need to do that for both primary and secondary indexes

Secondary indexes can be created with multiple lookup criteria such name and id. In a case like this, you should include the id because multiple users could have the same name. Here's an example:
```ts
// Assumes kv is a Deno.Kv object
// A secondary index by name and id
kv.set(["user_by_name", "John Smith", 1], {id: 1, name: "John Smith", email: "jsmith@example.com"})
```
A secondary index can also be structured to store records by a group or category. For instance you might want to group football/soccer players by their position on the pitch. That might look like this:
```ts
type Position = "Goalkeeper" | "Defender" | "Midfielder" | "Forward";
interface Player {
  id?: string; // id added later
  name: string;
  position: Position;
}
const players: Player[] = [/* player data goes here */]
// persist players to KV
for (const player of players) {
  player.id = crypto.RandomUUID();
  // Assumes kv is a Deno.Kv object
  await kv.atomic()
    // skip check() calls here;
    .set(["players", player.id], player);
    .set(["players_by_position", player.position, player.id], player);
    .commit();
}
// lookup players by a position
const findPlayersByPosition = async (position: Position) => {
  const iter =  kv.list({prefix: ["players_by_position", position]});
  console.log(`Players in ${position} position:`);
  for await (const player of iter) {
    const playerPosition = await kv.get<Player>([
      "players_by_position",
      player.value.position,
      player.value.id ?? "",
    ]);
    console.log(playerPosition.value?.name);
  }
}
// Lookup midfielders
await findPlayersByPosition("Midfielder");
```

### Sorting with indexes

In KV, key parts are ordered lexicographically (roughly dictionary order) by their type, and within a given type, they are ordered by their value. Type ordering follows that `Uint8Array` > `string` > `number` > `bigint` > `boolean`. Within each type, there is a [defined ordering](https://deno.com/manual@main/runtime/kv/key_space#key-part-ordering) too.

> 💡 Code that shows an example of index ordering can be found in the [repo affiliated with this blog](https://github.com/cdoremus/deno-blog-code/blob/main/deno-kv/key-order.ts).

The significance of the key ordering is it can be used to sort values. You do that by creating an secondary index using the desired sorting criteria as key parts.

For instance, if you wanted to order user by their last name, you would have primary index and a secondary sorting index created like this:

```ts
// Assumes kv is a Deno.Kv object
// create indexes within a transaction
await kv.atomic()
  // check() calls omitted for brevity
  .set(["user", <userId>], <user object>) // primary index
  // sorting by name
  .set(["user_by_name", <lastName>, <firstName>, <userId>], <user object>)
  .commit();
```
You'll noticed that I added `userId` to the secondary index. Otherwise duplicate records with the same first and last name will be ignored when the index is created. You could also use `email` (or another unique identifier) instead of `userId`.

> 💡 A further exploration of duplicate record sorting behavior can be found in the [repo affiliated with this blog](https://github.com/cdoremus/deno-blog-code/blob/main/deno-kv/sort-dup.ts).

To display the sorted values you use the `list()` method. If you want to sort the list in reverse order (largest value to smallest) set `reverse: true`. A good example of that is sorting by date with most recent dates ordered at the top:
```ts
// create user and user_create_date indexes
// Assumes kv is a Deno.Kv object
await kv.atomic()
  // check() calls omitted
  .set(["user", <userId>], <user object>) // primary index
  .set(["user_by_create_date", <createDate>, <userId>], <user object>)
  .commit();
// print out the index previously created in reverse chronological order
const iter = kv.list({prefix: ["user_by_create_date"]}, {reverse: true});
for await (const user of iter) {
  console.log(user.value);
}
```
> 💡 Working code that demonstrates KV sorting can be found in the [repo affiliated with this blog](https://github.com/cdoremus/deno-blog-code/blob/main/deno-kv/sort.ts).

## Math operations: `sum`, `min` & `max`

There are three aggregate operations that can be used to keep track of a sum, a minimum and a maximum of a series of values that are stored in another index. A method exists for each one of the operations and a `mutate()` method that can alternatively used to collate those stats.

> 💡 Working code that demonstrates the `min()`, `max()` and `sum()` methods can be found in the [repo affiliated with this blog](https://github.com/cdoremus/deno-blog-code/blob/main/deno-kv/min-max-sum.ts).

All of these operations are `Deno.AtomicOperations` methods so they must be chained to `atomic()` with `commit()` as the chain terminator.
### `sum()`, `min()` and `max()` methods

To keep track of aggregate sum, minimal and maximum values, you can use the `sum()`, `min()` and `max()` methods. All of these methods take a key and a value that is a `bigint` type. Here is an example
```ts
//shopping cart item
interface CartItem {
  userId: string;
  itemDesc: string;
  price: number;
}
// cart data
const cart: CartItem[] = [
  { userId: "100", itemDesc: "Arduino Uno kit", price: 60 },
  { userId: "100", itemDesc: "Temp sensor", price: 10 },
  { userId: "100", itemDesc: "Humidity sensor", price: 15 },
  { userId: "100", itemDesc: "Power cord with 5V regulator", price: 18 },
  { userId: "100", itemDesc: "Servo", price: 8 },
];

// add data to indexes
for (const item of cart) {
// Assumes kv is a Deno.Kv object
  kv.atomic()
    .set(["cart", item.userId], item) // primary index
    .min(["cart_min"], BigInt(item.price))
    .max(["cart_max"], BigInt(item.price))
    .sum(["cart_sum"], BigInt(item.price))
    .commit();
}
// get stats
const cartMin = await kv.get(["cart_min"]);
const cartMax = await kv.get(["cart_max"]);
const cartSum = await kv.get(["cart_sum"]);
// print out cart stats
console.log("Shopping cart data");
console.log(`Min price: ${(cartMin as Deno.KvEntry<bigint>).value}`);
console.log(`Max price: ${(cartMax as Deno.KvEntry<bigint>).value}`);
console.log(`Total price: ${(cartSum as Deno.KvEntry<bigint>).value}`);
```

### `mutate()` method

The `mutate()` method is an alternate way to get aggregate stats. It takes an object with `type`, `key` and `value` properties. The type value can be either "sum", "min", or "kax.

```ts
// Assumes kv is a Deno.Kv object
// keep track of website visits
await kv.atomic()
  .mutate({
    type: "sum", // valid types are 'sum', 'min' & 'max'
    key: ["hit_counter"],
    value: new Deno.KvU64(1n),
  })
  .commit();
```
The `Deno.KvU64()` constructor function is a wrapper around an unsigned `bigint` value. The value is set via the constructor argument and is retrieved using the `value` field on a `Deno.KvU64()` instance. The `mutate()` value argument is always a `Deno.KvU64`.

## Using KV Queue

A queue was been added to Deno KV in Deno v1.34.3. If you recall from your data structures class (if you took one or picked it up on-th-fly like me), a queue is a linear sequence where operations are performed in first-in, first-out (FIFO) order. Enqueueing is the operation that adds items to a queue and dequeueing removes items from the queue.

> 💡 Working code that demonstrates queueing can be found in the [repo affiliated with this blog](https://github.com/cdoremus/deno-blog-code/blob/main/deno-kv/queue.ts).

The KV queue implementation is done using the `Deno.Kv.enqueue()` and the `Deno.Kv.queueListen()` methods. The `enqueue()` method adds items to the database queue while the `queueListen()` method's callback function argument gets called when the item is dequeued.

Besides being called as a standalone method, `enqueue()` can also  be chained to `Deno.Kv.atomic()` and be part of an atomic transaction.

There are two arguments to `Deno.Kv.enqueue()`. The first one is the value to be queued, which is a [valid KV value](https://deno.com/manual@v1.34.0/runtime/kv/key_space#values). It returns a `Promise<Deno.KvCommitResult>` which resolves with a boolean `ok` value.

The second `enqueue()` argument is optional. It is an object that contains two properties (both of them optional):
- `delay` - the time in milliseconds to delay the delivery of an enqueued object. The default is zero.
- `keysIfUndelivered` - an array of `Deno.Kv.Key[]` keys used to store a value if the value delivery to a queue listener is not successful after it has been retried several times.

The `Deno.Kv.queueListen()` method has one argument which is a callback handler function. It takes an argument which is the queue value.

```ts
// Assumes kv is a Deno.Kv object
// Listen to enqueued objects
kv.listenQueue(async (msg: unknown) => {
  // Do a operation on the queued object
  await kv.set(msg.key, msg.value);
  console.log("Value delivered: ", msg);
});

const res = await kv.enqueue(
  { key: ["test1"], value: "testing 1,2,3" },
  {
    delay: 1000, // delay delivery for 1 second
    keysIfUndelivered: [["queue_failed", "test1`"]],
  },
);
console.log("Queue result: ", res);

// Output:
// Queue result:  { ok: true, versionstamp: "0000000000001d100000" }
// Value delivered:  { key: [ "test1" ], value: "testing 1,2,3" }
```
Like the `atomic()` method, the `enqueue()` method returns a result that contains `ok` and `versionstamp` fields. If the enqueueing fails, `ok` will be `false`; otherwise `true`.
## KV on Deno Deploy

The Deno runtime has an implementation of Deno KV using sqlite for persistence. This implementation is compatible with the Deno Deploy KV database (based on [Foundation DB](https://www.foundationdb.org/)) so that code developed locally will seamlessly work when deployed to DD.

If you do not have access to KV on Deno Deploy during its beta period, you can request it [here](https://dash.deno.com/kv).

### Deno Deploy Data Centers
At this time Deno KV databases are replicated across at least 6 data centers, spanning 3 regions (US, Europe, and Asia).

#### Data Consistency
Data consistency refers to the assurance that all data centers maintain the same data even after new data is persisted.

There are two kinds of data consistency in Deno Deploy. They can be configured using the `consistency` option when data is read from Deno KV. There are two options:
- `consistency: "strong"` _(default)_ - data reads from KV will come from the nearest region. Strong consistency implies:
  - _Serializability_: meaning that transactions are isolated at the highest level. It ensures that concurrent execution of multiple transactions results in a system state that would be the same as if the transactions were executed sequentially.
  - _Linearizability_: guarantees that read and write operations appear to be instantaneous and occur in real-time. Linearizability ensures a strong real-time ordering of operations.

- `consistency: "eventual"` - uses global replica's and caches for data reads and writes to maximize performance. In most cases the difference between strong and eventual consistency speed ranges from zero to about 100 milliseconds, which depends on how close the deployed app region is to North Virginia, USA which holds the primary write database for KV (at this point).

See the [Deno KV consistency section of the Deno Deploy docs](https://deno.com/deploy/docs/kv#consistency) for more information.


Data access is quicker with eventual consistency, but the data possibly will not be consistent between different replicated KV instances if a query is done shortly after one or more KV writes.

For more details see https://deno.com/blog/kv#consistency-and-performance

#### Synchronization Between Data Centers

When data is written to a Deno KV store, the following things happen:
1. The data is replicated synchronously to two data centers within the same Deno Deploy region.
2. The data is replicated to the other data centers asynchronously.

Deno Deploy docs state that the full asynchronous replication of data should occur withing 10 seconds.

#### Loading KV data into Deno Deploy

One issue with working with KV on Deno Deploy is how to seed the database before an app is started. The team recommends that you create an API route to handle the data loading and call the API route from a local command-line application sending the data with the command line calls.

Loading of large data sets should be done using batch calls to the API to avoid overloading the system and minimize server CPU usage. In any case, you should make sure the API returns an OK (202) response if persistence succeeded or a failure response (500) enumerating which records were not persisted into KV.

An alternative for a small amount of is to have the data loaded once when the application starts. This could be done in a `useEffect` hook with an empty array argument that would set an "is_loaded" index with a `true` value when the initial load is completed and have that value checked before loading to make sure that they are not loaded multiple times.
## Conclusions

Deno KV is not finished, so you should expect it to evolve. Here are some expectations:
- Stabilization of the KV API
- More KV features and abstractions built on it.
- Mature tools to aid its use as a database and to view and edit KV data stores.

It remains to be seen whether these items will come from the Deno team or outside contributors.

Since the technology is young, there is still some hesitancy to use KV. Another issue holding people back from using it is that the only deployment option is Deno Deploy at this time. KV pricing has not been set and whether the price will be based on Deno Deploy storage and/or throughput. Currently it is free to use locally and on Deploy.

The fact that the mental model of KV is different from a relational database is also a drawback for some. KV has no tools like SQL available for easy persistence and querying.

Still, KV has generated a lot of interest within the Deno community and there are a number of [app examples](#apps-that-use-deno-kv) and [tools under development](#kv-tools-under-development).

Application content data is not the only thing you could store in KV. Other examples are configuration data, logical flags and system-wide properties. Its use is only a matter of a developer's imagination.

If this article piques your interest in Deno KV,  make sure you check out the [Deno Manual and API docs as outlined below](#deno-manual-and-api-docs). The best place to stay on top of recent news on Deno KV development and application is the **kv** channel on the [Deno Discord instance](https://discord.gg/deno).

Finally, check out [the code affiliated with this post](https://github.com/cdoremus/deno-blog-code/tree/main/deno-kv) for simple command-line examples of the things detailed in this article.

---
# Acknowledgements

_The author would like to thank members on the kv channel of the Deno Discord server for their direct and indirect help. In particular, I would like to point out the aid from N.D. Hrones, Andreu Botella, Lino Le Van and Heyang Zhou. Thank you._
# Appendix
## References
### Deno Manual and API Docs
- **Deno KV Concepts and Patterns** covered in the [Deno Manual](https://deno.com/manual@v1.33.1/runtime/kv) details Deno KV's various concepts and patterns:
  - [Key Space](https://deno.com/manual@main/runtime/kv/key_space) is an overview of the keys, values and the versioning of the key-value records.
  - [KV Operations](https://deno.com/manual@main/runtime/kv/operations) covers KV methods.
  - [Deno KV Transactions](https://deno.com/manual@main/runtime/kv/transactions) shows how atomic transactions work in Deno KV.
  - [Deno KV Secondary Indexes](https://deno.com/manual@main/runtime/kv/secondary_indexes) demonstrates how to create a secondary key to be used to query data in the key-value store outside of using the unique, primary-key-like id.
- **The Deno KV API** is covered in the [API documentation](https://deno.land/api@v1.33.1?unstable=&s=Deno.Kv) highlighting the various public classes, interfaces, methods and variables in the API.
- **Deno Deploy** the KV implementation on DD is explained on the [Deno Deploy KV page](https://deno.com/deploy/docs/kv). It shows how to work with Deno KV on Deno Deploy and how the Deno KV data store is distributed and synchronized in various regions.

### Apps that use Deno KV

- [SaasKit](https://github.com/denoland/saaskit) - A boilerplate for creating SAAS applications using Fresh, OAuth, Stripe and Deno KV.
- [kv-sketchbook](https://github.com/hashrock/kv-sketchbook) - a 'dead simple' sketchbook app using Deno Fresh and KV.
- [tic-tac-toe](https://github.com/denoland/tic-tac-toe) - the classic game built with Deno Fresh and KV.
(https://discord.com/channels/684898665143206084/1108074003018551327/1110625440948830238)
- [kv-notepad](https://github.com/hashrock/kv-notepad) - multiversion of a classic notepad app built with Deno Fresh and KV.
- [PixelPage](https://github.com/denoland/pixelpage) - a shared pixel art canvas build with Deno Fresh and KV.
- [Todo List](https://github.com/denoland/showcase_todo) - collaborative todo list build with Deno Fresh and KV.
- [fresh-kv-demo](https://github.com/denoland/fresh-kv-demo) - a boilerplate that uses Fresh and Deno KV for persistence.
- [Multiplayer KV Beats](https://github.com/KevinBatdorf/beats-kv-demo) - a multi-player beat box machine using Deno KV.
- [Reddino](https://github.com/Wave-Studio/Reddino) - A Reddit clone using Deno KV
- [Stone, Bone, Cone](https://github.com/the-abe-train/stone-bone-cone) - a Deno KV powered take on the Rock, Paper, Scissors game
- [Deno KV Hackathon submissions](https://github.com/denoland/deno-kv-hackathon/issues) - final entries for a recent hackathon to create apps and libraries that use Deno KV.
### KV Tools under development

Deno KV is in its infancy, so there are no mature tools for working with it. The following is a list of some promising utilities to use with KV:

- [Pentagon](https://github.com/skoshx/pentagon) - a [Prisma](https://www.prisma.io/)-like ORM built on top of Deno KV
- [kv_api](https://github.com/denoland/kv_api) - a WIP demonstration of a REST-like API for invoking Deno KV operations.
- [deno-kv-plus](https://github.com/Kycermann/deno-kv-plus) - for building safe atomic transactions (see https://mieszko.xyz/deno-kv-plus)
- [kvdex](https://github.com/oliver-oloughlin/kvdex) - a database wrapper for the Deno KV store.
- [Otama](https://github.com/lino-levan/otama) - exposes a simplified KV API.
- [kv_entity](https://github.com/hugojosefson/deno-kv-entity) - a typed library for specifying and storing entities in a Deno.Kv database.
- [graphql-denokv](https://github.com/vwkd/graphql-denokv) - GraphQL bindings for Deno KV.
