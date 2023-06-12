### 2023-06-11

# A Comprehensive Guide to Deno KV

## Table of contents
- [A Comprehensive Guide to Deno KV](#a-comprehensive-guide-to-deno-kv)
  - [Table of contents](#table-of-contents)
  - [Introduction](#introduction)
  - [Indexes](#indexes)
  - [Keys, values and versionstamp](#keys-values-and-versionstamp)
    - [Keys](#kv-keys)
    - [Values](#kv-values)
    - [Versionstamp](#kv-versionstamp)
  - [CRUD operations](#crud-operations)
    - [Create (`set()`)](#create-set)
    - [Read (`get()`)](#read-get)
    - [Update (`set()`)](#update-set)
    - [Delete (`delete()`)](#delete-delete)
  - [Reading multiple records (`list()` & `getMany()`)](#reading-multiple-records-list--getmany)
    - [Reading a list with `list()`](#reading-a-list-with-list)
      - [Pagination with `list()`](#pagination-with-list)
    - [Combining index records with `getMany()`](#combining-index-records-with-getmany)
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
  - [KV on Deno Deploy](#kv-on-deno-deploy)
    - [Deno Deploy Data Centers](#deno-deploy-data-centers)
      - [Data Consistency](#data-consistency)
      - [Synchronization Between Data Centers](#synchronization-between-data-centers)
  - [Conclusions](#conclusions)
- [Appendix](#appendix)
  - [References](#references)
    - [Deno Manual and API Docs](#deno-manual-and-api-docs)
    - [Apps that use Deno KV](#apps-that-use-deno-kv)
    - [KV Tools under development](#kv-tools-under-development)
---
## Introduction

Deno KV, a key-value based database, was built into the Deno runtime starting with Deno 1.32.0 as an unstable API. Deno Deploy now incorporates Deno KV (currently on an invite-only basis), and distributes KV data around the world. This means that when a web application is put on Deploy, there will now be a database close to each server instance. In addition, Deno Deploy uses synchronization to maintain data consistency.

The Deno runtime has an implementation of Deno KV using sqlite for persistence. This implementation is compatible with the Deno Deploy KV database (based on [Foundation DB](https://www.foundationdb.org/)) so that code developed locally will seamlessly work when deployed to DD. This is a big win for Deno developers!

This article will cover all aspects of Deno KV with simple, easy-to-understand examples. Since info on Deno KV is in [multiple places in the Deno documentation](#deno-manual-and-api-docs), consider this post as a one-stop guide to KV.

## Indexes

An index in Deno KV parlance are the units of data storage. In relational database (RDBMS) terms, they can be loosely thought of as a table, but they are more like a SQL index because they are ordered by key value for fast lookup.

A KV **primary index** is the index that stores a record using a unique key for each record, usually a UUID. We'll talk more about them in the next few sections. A **secondary index** stores additional information or is used for sorting. [We'll talk about them later](#secondary-indexes).

## Keys, values and versionstamp

Deno KV have well-defined keys, values and a versionstamp that represents a value's version.
### [KV Keys](https://deno.com/manual@v1.34.0/runtime/kv/key_space#keys)
As stated above, Deno KV is a key-value database. In it's simplest form, a database record's data is persisted and found using the key. In Deno KV, the key is a tuple, an array with a fixed length. Each of the members of the tuple is called a **part**. All parts are linked together into a compound key. Key parts can be of types `string`, `number`, `boolean`, `Uint8Array`, or `bigint`.


Here are a couple of examples of a Deno KV key used to identify unique records:
```ts
// User key
const userKey = ["user", <userid>]; // Used for storing user objects
// Address key for a particular User
const addressKey ["address", <userId>]; // Used for storing a user's address
```
As stated above, when a unique key is used to persist values, the resulting index is know as a primary index. The Web platform provides `crypto.getRandomUUID()` to obtain a unique id.

Key parts are an ordered sequence so that `[1, "user"]` is not the same as `["user", 1]`.

When used in a primary index the first key part (aka key prefix) is usually a string constant identifying the model collection being persisted, `"user"` or `"address"` in the example. When used to add records to an index, the key parts are combined into a compound key.


The first key part could be expanded into multiple parts. For instance, if we have a user with roles, we might have the second part representing a role such as:
```ts
const userAdminKey = ["user", "admin", <userId>];
const userCustomerKey = ["user", "customer", <userId>];
const userGuestKey = ["user", "guest", <userId>];
```
If there is a role field on the model, the previous keys could be reduced to (assuming each user has one role):
```ts
const userRoleKey = ["user_by_role", <userRole>, <userId>];
```
Indexes created with these keys are called secondary indexes. They need to be persisted in an atomic transaction with the primary index in order that the data is consistent between indexes ([see the secondary index discussion below](#secondary-indexes)). Secondary indexes should have a first part name describing their function. In this case, the key is used to lookup a user and the first part is `"user_by_role"`.

### [KV Values](https://deno.com/manual@v1.34.0/runtime/kv/key_space#values)
In order for Deno KV values to be persisted, a value must be a structured, serializable JavaScript type compatible with [JavaScript's structured clone algorithm](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm).

Basically, it is anything that can be passed as the first argument of [`structuredClone()`](https://developer.mozilla.org/en-US/docs/Web/API/structuredClone) except `SharedArrayBuffer`. The `SharedArrayBuffer` is an exception because is is a shared memory data structure that cannot be passed across KV isolates.

See  [this discussion on MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm#things_that_dont_work_with_structured_clone) for more details on what does not conform to the structured clone algorithm.

Despite these limitations most common JavaScript entities including `undefined`, `null`, `boolean`, `number`, `string`, `Array`, `Map`, `Uint8Array` and `Object` work as KV values ([a full list](https://deno.com/manual@v1.34.0/runtime/kv/key_space#values)).

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
Each time a new value is persisted to Deno KV, it is automatically given a 12-byte version value based on the time when the record was persisted. KV calls this version a `versionstamp`. When a value is updated, a new `versionstamp` is created.

A new `versionstamp` will always be 'larger' than the previous one such that the second modification of a record will always be greater than the first in a boolean comparison (versionstamp2 > versionstamp1).

The `versionstamp` assures that transactions are done atomically thus making sure that affiliated relational records in different indexes are consistent. Atomic operations in Deno KV can be checked to make sure that the data is consistent between the last fetch (`get()`) and when the new data will be persisted. This check is done with the record's `versionstamp` ([for details see below](#transactions-with-atomic)).

One good use of the `versionstamp` is to [reconstruct the mutation history of a particular KV record](#track-a-records-history).


## CRUD operations
The main CRUD (create, read, update & delete) operations in KV are defined as methods on the `Deno.Kv` class: `set()`(create & update), `get()` (read) and `delete()` (delete).

All CRUD operations on Deno KV start with a connection to the KV database which is done with a simple call to `Deno.openKv()`:
```ts
// Open a KV connection returning a Deno.Kv instance
const kv: Deno.Kv = await Deno.openKv();
```

We'll be using the `kv` KV connection object (`Deno.Kv` instance) throughout our examples below.

**CRUD data**

It's best to create a TypeScript type or interface to represent data models. For instance, a user model will look something like this:
```ts
interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
}
```
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

The user id can be hard coded, but it's best that it is generated  as a unique value. The `crypto` object built into the Web platform is an easy way to create a unique id:
```ts
const userId = crypto.randomUUID();
```

### Create (`set()`)**

Lets connect to the KV data store and insert the `user` data which requires two arguments, a `Deno.KvKey` and a value whose type is the method's TypeScript generic parameter (`User` in this example):
```ts
const result = await kv.set<User>(["user", userId], user);
if (result.ok === false) {
  throw new Error(`There was a problem persisting user ${user.name}`)
}
```
In SQL database terms the data table would be called "user" and the user id would be the primary key.

The return value of a `set()` call is a `Promise<Deno.KvCommitResult>`, The `KvCommitResult` object contains a boolean `ok` field and a `versionstamp` field. If the `set()` call fails, `ok` is set to `false`. The `versionstamp` would be the versionstamp of the persisted record.


### Read (`get()`)**

The `get()` method is used to obtain a single record from Deno KV. For example:

```ts
const foundRecord: Deno.KvEntryMaybe<User> = await kv.get<User>(["user", userId]);
// Get user value
const user = foundRecord.value;
```
A call to `get()` returns a `Deno.KvEntryMaybe` object containing `key`, `value` and `versionstamp` properties (the Maybe part of `KvEntryMaybe` means that the result's value and versionstamp may be null). The `key` will always be the key you used in the the `get()` call. The `value` and `timestamp` values are those found in the KV store associated with the `key`.

Be aware that the value of a `get()` call is found in the `value` property of the call's result. This can trip you up since you might expect that the `get()` call returns only the value. Also be aware that the return value is wrapped in a `Promise` so make sure you prefix the call with `await`.

If you call `get()` with a `key` that is not in the KV store, you will get back an object with both `value` and `versionstamp` equal to `null`. That is why there return value is typed `KvEntryMaybe` and not `KvEntry`, which is a valid type.

#### `set()` Options

The `get()` method has an optional second argument called `options`. The `options` argument contains one field `consistency`. which has two values `"eventual"` or `"strong"`([see discussion below for details](#data-consistency)).

When running Deno KV locally, the `consistency` value is not relevant since the KV store is local. It is relevant when an application using Deno KV runs in the cloud on Deno Deploy since KV store instances are distributed in the cloud([see below](LINK NEEDED)).

### Update (`set()`)

Updating KV data would also use the `set()` method as does inserts:

```ts
user.phone = "5182349876"
const result = await kv.set<User>(["user", userId], user);
if (result.ok === false) {
  throw new Error(`There was a problem persisting user ${user.name}`)
}
```
The arguments and return value form an update is the same as a create/insert.
### Delete (`delete()`)

Deleting a record uses the `delete()` method which requires a key (`Deno.KvKey`) argument.

```ts
await kv.delete(["user", userId]);
```
The delete method returns a `Promise<void>` which resolves to an `undefined` value.

It is recommended that the mutation methods `set()` and `delete()` are done in a transaction which will return a result with an `ok` property to indicate if the transaction succeeded (`ok: true`) or failed (`ok: false`). See the [transaction section below for more details](#transactions-with-atomic).


## Reading multiple records (`list()` & `getMany()`)

Reading multiple records involves the use of `list()` and `getMany()`, two methods on `Deno.Kv`.

### Reading a list with `list()`

The `list()` method obtains multiple records and produces an async iterator (`Deno.KvListIterator`) which has a `cursor` field, the current position of the iteration, and a `next()` method to move the iteration to the `cursor` position.

Since the iterator is asynchronous, iteration is usually done with a [`for-of` loop using `await`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of).

The `list()` method takes two arguments `selector` and `options`:

1. **The first `list` argument: `selector`**

The `selector` is an object with tree optional arguments: `prefix`, `start` and `end`. All the arguments have a standard KV key as discussed above.

**`prefix` option of `list()`**

Unlike the `set()`, `get` and `delete()` CRUD methods, the `prefix` key can be a key part subset.

Let's say you just wanted a list of user or user admins, your `list()` call would be one of the following:
```ts
// get list of users; to avoid TypeScript errors, call list() with a generic parameter
const iteruser = kv.list<User>({prefix: ["user"]});
// list of admins
const iterAdmin = kv.list<User>({prefix: ["user", "admin"]});
```
Besides `prefix`, `start` and `end` are `selector` argument options. The `list()` method takes one or two arguments. The first one can be either `prefix` or `start`. The second one can be either `start` or `end`.

**`start` and `end` options**

The `start` or `end` options of `list()` define a range of KV records you want to select. But to be able to use `start` or `end`, you need to understand how key ordering is done (see the [sorting with indexes section below](#sorting-with-indexes)).

While key ordering is instrumental for sorting, with `start` and `end` the order is used to define the beginning and ending of a range of ordered keys returned in the result set.

The `start` option starts with the first matching record while the `end` method includes all previous records, but not the record it points to.
```ts
// TODO: Example of start & end
```
If you want to make sure that the end record is included in the range, you can use a key like `["zzzzzzzzzzz"] to insure that there are no keys with lower order.
```ts
// TODO: Example
```

Either one of them can be used with `prefix`
```ts
// TODO: Example of all options with prefix

```

2. **The second `list()` argument: `options`**

The `options` argument has a collection of fields:
  - `limit: number` - A `number` limits the size of a `list()` result set
  - `cursor: string` - the `cursor` to resume iteration. Recall the `list()` method returns a `Deno.KvListIterator` that contains a `cursor` field.
  - `reverse: boolean` - returns the list in reverse order
    - `prefix`, `start` or `end` can be used with `reverse`.
  - `batchSize: number` - the size of the batches in which the list operation is performed. The default is equal to the 'limit' value or 100
  - `consistency: Deno.KvConsistencyLevel` - the transactional consistency, either `"strong"` or `"eventual"`

```ts
// TODO: Example of all options with prefix

```
#### Pagination with `list()`

You use the `cursor` filed of the iterator returned by a `list()` call to paginate NNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN
```ts

```
### Combining index records with `getMany()`

The `getMany()` method provides the opportunity to do a number of `get()` calls to separate indexes in one operation. The method accepts an array of keys and returns an array of `Deno.KvEntryMaybe` records, objects that include a `key`, `value` and `timestamp` fields.

It is important to know that each one of the keys should return single `KvEntryMaybe` objects like they would in a `get()` call. So it follows that the number of keys in the `getMany()` argument will always equal the number of of results in the call return array.

For example, suppose we have three environmental variables stored in three separate indexes. Here's what that would look like:

```ts
// keys for storing env variables in KV
const githubSecretKey = ["env_var", "GITHUB_ACCESS_KEY"];
const googleSecretKey = ["env_var", "GOOGLE_ACCESS_KEY"];
const discordSecretKey: Deno.KvKey = ["env_var", "DISCORD_ACCESS_KEY"];

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
// enVars[0] = {key: ["env_var", "GITHUB_ACCESS_KEY"], value: "password2", versionstamp: "001234" }
// enVars[1] = {key: ["env_var", "GOOGLE_ACCESS_KEY"], value: "password3", versionstamp: "001235" }
// enVars[2] = {key: ["env_var", "DISCORD_ACCESS_KEY"], value: "password1", versionstamp: "001236" }

```

The `getMany()` method takes a second argument, `options` which is optional. The `option` argument has one property `consistency` which can be "strong" or "eventual". See the [data consistency section](#data-consistency) for more details on this topic.

## Transactions with `atomic()`

The `atomic()` method on `Deno.Kv` is used to do a transaction with KV. It returns a `Deno.AtomicOperation` class instance. Transactional operations are chained to `atomic()`. The chain must be terminated with a call to `commit()` in order for the transactional operations to be completed and the data persisted.

### Using `check()` to validate transactions

A transactional chain off of `atomic()` should first call the `check()` method for each persistent operation. The `check()` method ensures that the `versionstamp` of data already in the KV store matches the `versionstamp` of the data being persisted.

If `check()` fails, then the transaction will fail and the data will not be committed. That method gets chained to a  `set()` or `delete()` call, two methods that behave the same way they do when called outside an `atomic()` chain ([see CRUD section above](#crud-operations)).

An example will clarify how `check()` is used. Here we are trying to persist a user object with a changed phone number.

```ts
//
const user = kv.get(["user", 123])
const result = kv.atomic().
  // make sure versionstamp has not changed after last get()
  .check(user)
  // update phone number
  .set(["user", user.id], {...user.value, phone: "2070987654"  })
  .commit();
```
If a `check()` fails, then any persistent operation in the chain will be bypassed and the `commit()` call returns a `Deno.KvCommitError`.

### Using `set()` and `delete()` for transactional persistance

In the previous example, `set()` is used to create or update data in a transactional chain. It is a method of `Deno.AtomicOperation` and works the same way as `Deno.Kv.set()` taking a key and value as arguments. It is used to persist the value in a KV store with the key as the primary key.

Likewise, `delete()`, also an `Deno.AtomicOperation` method, works the same way as it's `Deno.Kv` counterpart. It takes a key argument and is used to remove records from a Deno KV store.

Both `set()` and `delete()` can be chained to `atomic()` multiple times, but there cannot be more than 10 writes in a single persistent chain.

The full power of KV transactional persistence is revealed when you need to store related objects. For instance, if you have a user who has an address and phone numbers. You should start with Typescript types defining the model:
```ts
interface User {
  id?: string; // id added just prior to persistence
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
Each one of the entities will be persisted into a separate KV index within an atomic transaction. Let's assume that user this information has been collected from an HTML user-registration form and processed into `User`, `Address` and `Phone` model objects. Here's a function to insert or update that data within a KV transaction:
```ts
function persistUser(user: User, address: Address, phone: Phone) {
  if (!user.id) {
    const userId = crypto.randomUUID();
    address.userId = userId;
    phone.userId = userId;
  }
  // get current records
  const userRecord = kv.get(["user", userId]);
  const addressRecord = kv.get(["address", userId]);
  const phoneRecord = kv.get(["phone", userId]);
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
The return value of a `kv.atomic()....commit()` call chain is a `Promise<Deno.KvCommitResult>` if the transaction succeeds. That object contains two fields: `ok` and `versionstamp`. The `ok` value will be true in a successful transaction.

### Tracking a record's history
The `versionstamp` of a successful `atomic()` transaction is the versionstamp given to all operations within the `atomic()` call chain. This can be used to construct a version history of a record. In order to do this, you need to persist the `versionstamp` to a separate index. Here's what that would look like:

```ts
const userId = crypto.randomUUID();
const user = kv.get(["user", userId])
const result = await kv.atomic()
  .check(user)
  .set(["user", userId], {id: userId, name: "Joan Smith", email: "jsmith@example.com"})
  .commit();
if (result.ok) {
// add the result versionstamp to a separate "user_versionstamp" index with a timestamp
  await kv.set(["user_versionstamp", userId, result.versionstamp ], {version: result.versionstamp, date: new Date().getTime()});
}
```
The `versionstamp` is part of the index so that records will be ordered by `versionstamp` for each user.

You can then use `list()` to display the history of a particular user's record.
```ts
// display in version in reverse chronological order
const iter = kv.list({ prefix: ["user_versionstamp", userId] },
    {reverse:  true});
for await (const version of iter) {
  // display to stdout here; I'm sure you can do better
  console.log(`Version: ${version.value.version} Date: ${version.value.date}`);
}
```

### Transaction failures

**TODO:** needs work; ??combine with commit discusion??

If a KV transaction fails within an `atomic()` call chain either by a failed `check()` or another error, a `Deno.KvCommitError` is returned.

When the `Deno.KvCommitError`is returned, the transaction is not persisted. That object has one field `ok` that is set to `false`.


## Secondary Indexes

You usually begin a Deno KV implementation for an app by creating a primary index. The primary index will contain a model identifier part and a unique key part, like a user id for a "user" model. In that case, a particular "user" record will be found using the id.

### Creation and mutation
A secondary index is used to find a KV record or multiple records beyond the find-by-id search you can do on a primary index.

For instance, if you want to search for a user by an email address you could have an index that uses the email address as the search criteria. These indexes usually have a name part that describes the index such as "user_by_email".

When you have secondary indexes, you need to create them in a transactional context with the primary index to maintain data consistency.
```ts
const userId = crypto.randomUUID();
const user = {id: userId, name:"Joan Smith", email: "joan.smith@example.com"};
const userKey = ["user", userId];
const userEmailLookupKey = ["user_by_email", user.email, userId];
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
const userByEmailRecord = await kv.get<User>(["user_by_email", <userEmail>]);
const userByIdRecord = await kv.get<User>(["user", userByEmailRecord.value]);
const user: User = userByIdRecord.value;
```
When the data is updated or deleted, you need to do that for both primary and secondary indexes
```ts

```
Secondary indexes can be created with multiple lookup criteria such name and id. In a case like this, you should include the id because multiple users could have the same name. Here's an example:
```ts
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

The significance of the key ordering is it can be used to sort values. You do that by creating an secondary index using the desired sorting criteria as key parts.

For instance, if you wanted to order user by their last name, you would have primary index and a secondary sorting index created like this:

```ts
// create indexes within a transaction
await kv.atomic()
  // check() calls omitted for brevity
  .set(["user", <userId>], <user object>) // primary index
  // sorting by name
  .set(["user_by_name", <lastName>, <firstName>, <userId>], <user object>)
  .commit();
```
You'll noticed that I added `userId` to the secondary index. Otherwise duplicate records with the same first and last name will be ignored when the index is created. You could also use `email` (or another unique identifier) instead of `userId`.

To display the sorted values you use the `list()` method. If you want to sort the list in reverse order (largest value to smallest) set `reverse: true`. A good example of that is sorting by date with most recent dates ordered at the top:
```ts
// create user and user_create_date indexes
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

## Math operations: `sum`, `min` & `max`

There are three aggregate operations that can be used to keep track of a sum, a minimum and a maximum of a series of values that are stored in another index. They there is a method for each one of the operations and a `mutate()` method that can alternatively used to collate those stats.

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


## KV on Deno Deploy

### Deno Deploy Data Centers
Deno KV databases are replicated across at least 6 data centers, spanning 3 regions (US, Europe, and Asia).

#### Data Consistency
Data consistency refers to the assurance that all data centers maintain the same data even after new data is persisted.

There are two kinds of data consistency in Deno Deploy. They can be configured using the `consistency` option when data is read from Deno KV. There are two options:
- `consistency: "strong"` _(default)_ - data reads from KV will come from the nearest region.
- `consistency: "eventual"` NNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN

Data access is quicker with eventual consistency, but the data possibly will not be consistent between different replicated KV instances if a query is done shortly after one or more KV writes.

For more details see https://deno.com/blog/kv#consistency-and-performance

#### Synchronization Between Data Centers

When data is written to a Deno KV store, the following things happen:
1. The data is replicated synchronously to two data centers within the same Deno Deploy region.
2. The data is replicated to the other data centers asynchronously.

Deno Deploy docs state that the full asynchronous replication of data should occur withing 10 seconds.

## Conclusions
Deno KV is not finished, so you should expect it to evolve. Here are some expectations:
- Stabilization of the KV API
- More KV features and abstractions built on it.
- Mature tools to aid its use as a database and to view and edit KV data stores.

It remains to be seen whether these items will come from the Deno team or outside contributors.

Since the technology is young, there is still some hesitancy to use KV. Another issue holding people back from using it is that the only deployment option is Deno Deploy at this time. KV pricing has not been set and whether the price will be based on Deno Deploy storage and/or throughput. Currently it is free to use locally and on Deploy.

The fact that the mental model of KV is different from a relational database is also a drawback for some. KV has no tools like SQL available for easy persistence and querying.

Still, KV has generated a lot of interest within the Deno community and there are a number of [app examples](#apps-that-use-deno-kv) and [tools under development](#kv-tools-under-development).

If you this article piques your interest in Deno KV, make sure you check out the [Deno Manual and API docs as outlined below](#deno-manual-and-api-docs). The best place to stay on top of recent news on Deno KV development and application is the **kv** channel on the [Deno Discord instance](https://discord.gg/deno).

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
- **The Deno KV API** is covered in the [API documentation](https://deno.land/api@v1.33.1?unstable=&s=Deno.Kv) covers the various public classes, interfaces, methods and variables in the Deno KV API.
- **Deno Deploy** the KV implementation on DD is explained on the [Deno Deploy KV page](https://deno.com/deploy/docs/kv). It shows how to work with Deno KV on Deno Deploy and how the Deno KV data store is distributed and synchronized in various regions.

### Apps that use Deno KV

- [kv-sketchbook](https://github.com/hashrock/kv-sketchbook) - a 'dead simple' sketchbook app using Deno Fresh and KV.
- [tic-tac-toe](https://github.com/denoland/tic-tac-toe) - the classic game built with Deno Fresh and KV.
(https://discord.com/channels/684898665143206084/1108074003018551327/1110625440948830238)
- [kv-notepad](https://github.com/hashrock/kv-notepad) - multiversion of a classic notepad app built with Deno Fresh and KV.
- [PixelPage](https://github.com/denoland/pixelpage) - a shared pixel art canvas build with Deno Fresh and KV.
- [Todo List](https://github.com/denoland/showcase_todo) - collaborative todo list build with Deno Fresh and KV.
### KV Tools under development

Deno KV is in its infancy, so there are no mature tools for working with it. The following is a list of some promising utilities to use with KV:

- [Pentagon](https://github.com/skoshx/pentagon) - a [Prisma](https://www.prisma.io/)-like ORM built on top of Deno KV
- [deno-kv-plus](https://github.com/Kycermann/deno-kv-plus) - for building safe atomic transactions (see https://mieszko.xyz/deno-kv-plus)
- [kvdex](https://github.com/oliver-oloughlin/kvdex) - a database wrapper for the Deno KV spore.
- [Otama](https://github.com/lino-levan/otama) - exposes a simple KV API, but with a lot of syntactic sugar.
- [kv_entity](https://github.com/hugojosefson/deno-kv-entity) - a typed library for specifying and storing entities in a Deno.Kv database.

