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
    - [Using `check()` to validate data](#using-check-to-validate-data)
    - [Persisting data in a KV transaction](#persisting-data-in-a-kv-transaction)
    - [Tracking a record's history](#tracking-a-records-history)
    - [Transaction failures](#transaction-failures)
  - [Secondary Indexes](#secondary-indexes)
    - [Creation](#creation)
    - [Updating and deletion](#updating-and-deletion)
    - [Sorting with indexes](#sorting-with-indexes)
  - [Math operations: sum, min \& max](#math-operations-sum-min--max)
  - [Deno KV Drawbacks](#deno-kv-drawbacks)
  - [KV on Deno Deploy](#kv-on-deno-deploy)
    - [Deno Deploy Data Centers](#deno-deploy-data-centers)
      - [Data Consistency](#data-consistency)
      - [Synchronization Between Data Centers](#synchronization-between-data-centers)
  - [Deno KV Frontiers](#deno-kv-frontiers)
    - [The Deno team](#the-deno-team)
    - [Tools under development](#tools-under-development)
  - [Conclusions](#conclusions)
- [Appendix](#appendix)
  - [References](#references)
    - [Deno Manual and API Docs](#deno-manual-and-api-docs)
    - [Apps that use Deno KV](#apps-that-use-deno-kv)
## Introduction
Deno KV, a key-value based database was built into the Deno runtime starting with Deno 1.32.0. Deno Deploy now incorporates Deno KV (currently on an invite-only basis), and distributes KV data around the world. This means that when a web application is put on Deploy, there will now be a database close to each server instance. In addition, Deno Deploy uses synchronization to maintain data consistency.

The Deno runtime has an implementation of Deno KV using sqlite for persistence. This implementation is compatible with the Deno Deploy KV database (based on [Foundation DB](https://www.foundationdb.org/)) so that code developed locally will seamlessly work when deployed to DD. This is a big win for Deno developers!

This article will cover all aspects of Deno KV with simple, easy-to-understand examples. Since info on Deno KV is in [multiple places in the Deno documentation](#deno-manual-and-api-docs), so consider this post as a one-stop guide to KV.

## Indexes

An index in Deno KV parlance are the units of data storage. In relational database (RDBMS) terms, they can be thought of as a table, but they are more like a SQL index because they are ordered by key value for fast lookup.

A **primary index** is the index that stores a record using a unique key for each record, usually a UUID. We'll talk more about them in the next section. A **secondary index** stores additional information or is used for sorting. We'll talk about them later.


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
In order for Deno KV values to be persisted, a value must be a serializable JavaScript type compatible with [JavaScript's structured clone algorithm](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm).  The things that don't work with a structured clone include ([more details](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm#things_that_dont_work_with_structured_clone)):
- function objects
- DOM nodes
- `RegExp.lastIndex` is not preserved if `RegEx` is used as a value.
- Property descriptors, setters, getters, and similar metadata-like features of objects are not preserved.

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

Lets connect to the KV data store and insert the `user` data:
```ts
await kv.set<User>(["user", userId], user);
```
In SQL database terms the data table would be called "user" and the user id would be the primary key.

The return value of a `set()` call is a `Promise<Deno.KvCommitResult>`, The `KvCommitResult` object contains a boolean `ok` field and a `versionstamp` field. If the `set()` call fails, `ok=false`. The `versionstamp` would be the versionstamp of the persisted record.


### Read (`get()`)**

The `get()` method is used to get a single record from the Deno KV store. That operation takes an argument that is the key of the record being searched:
```ts
const foundUser: Deno.KvEntryMaybe<User> = await kv.get<User>(["user", userId]);
```
A call to `get()` returns an object `Deno.KvEntryMaybe` object containing with `key`, `value` and `versionstamp` fields. The `key` will always be the key you used in the the `get()` call. The `value` and `timestamp` values are those found in the KV store associated with the `key`. In this example the found

 If you call `get()` with a `key` that is not in the KV store, you will get back an object with both `value` and `versionstamp` equal to `null`. That is why there return value is typed `KvEntryMaybe` and not `KvEntry`, which is a valid type.

#### Options

The `get()` method has an optional second argument called `options`. The `options` argument contains one field `consistency`. which has two values `"eventual"` or `"strong"`([see discussion below for details](#data-consistency)).

When running Deno KV locally, the `consistency` value is not relevant since the KV store is local. It is relevant when an application using Deno KV runs in the cloud on Deno Deploy since KV store instances are distributed in the cloud([see below](LINK NEEDED)).

### Update (`set()`)

Updating the data would also use the `set()` method

```ts
user.phone = "5182349876"
const result = await kv.set(["user", userId], user);
```
### Delete (`delete()`)

Deleting a record uses the `delete()` method which requires a key argument.

```ts
await kv.delete(["user", userId]);
```
The delete method returns a `Promise<void>`

If any of the

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

The `getMany()` method obtains an array of `Deno.KvEntryMaybe` records (the Maybe part of `KvEntryMaybe` means that the result's value and versionstamp may be null).

The `getMany()` method takes two arguments, `keys` and `options` which is optional.

**`keys`**

The `keys` argument is an array of keys (`Deno.KvKey`). The tricky part of `getMany()` is that the number of values in the result set are equal to the number of `keys` in the array.
```ts
// TODO: Example
```
NNNNNNNNNNNNNNNNNNNNNNNNNNNNNN


## Transactions with `atomic()`

The `atomic()` method on `Deno.Kv` is used to do a transaction with KV. Transactional operations are chained to `atomic()`. The chain must be terminated with a call to `commit()` in order for the transactional operations to be completed and the data persisted.

### Using `check()` to validate data

A transactional chain off of `atomic()` should first call the `check()` method for each persistent operation. The `check()` method ensures that the `versionstamp` of data already in the KV store matches the `versionstamp` of the data being persisted.

If `check()` fails, then the transaction will fail and the data will not be committed. That method gets chained to a  `set()` or `delete()` call, two methods that behave the same way they do when called outside an `atomic()` chain ([see CRUD section above](#crud-operations)).

An example will clarify how `check()` is used. Here we are trying to persist a user object with a changed phone number.

```ts
//
const user = kv.get(["user", 123])
const ok = kv.atomic().
  // make sure versionstamp has not changed after last get()
  .check(user)
  // update phone number
  .set(["user", user.id], {...user.value, phone: "2070987654"  })
  .commit();
```
If a `check()` fails, then and persistent operation in the chain will be bypassed and the `commit()` call returns a `Deno.KvCommitError` that contains an `ok` field that is equal to `false`.

Notice that I am using object spread to create the user here, which creates a new object with a new phone number. I could have used `delete()` to blow away the old object and replace it with a new object, but that would delete the old record and I would not be able to reconstruct the mutation history of this record. If you don't care about version history and want to save on storage space, then you should call `delete()` before `set()`.

### Persisting data in a KV transaction

The full power of KV transaction is revealed when you need to store related objects. For instance, if you have a user who has an address and phone numbers. You start with Typescript types defining the model:
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
Each one of the entities will be persisted into a separate KV index within an atomic transaction. Let's assume that user information has been collected from an HTML user-registration form and processed into `User`, `Address` and `Phone` model objects. Here's a function to insert that data into KV within a transaction:
```ts
function createUser(user: User, address: Address, phone: Phone) {
  const userId = crypto.randomUUID();
  address.userId = userId;
  phone.userId = userId;
  const userKey = ["user", userId];
  const addressKey = ["address", userId];
  const phoneKey = ["phone", userId];
  await kv.atomic()
    // checks may be superfluous
    .check({key: userKey, versionstamp: null})
    .check({key: addressKey, versionstamp: null})
    .check({key: phoneKey, versionstamp: null})
    .set(userKey, user)
    .set(addressKey, address)
    .set(phoneKey, phone)
    .commit();
}

```
At this point, KV allows up to 10 writes in an `atomic()` call chain.

The return value of a `kv.atomic()....commit()` call chain is a `Promise<Deno.KvCommitResult>` if the transaction succeeds. That object contains two fields: `ok` and `versionstamp`. The `ok` value will be true in a successful transaction.

### Tracking a record's history
The `versionstamp` of a successful `atomic()` transaction is the versionstamp given to all operations within the `atomic()` call chain. This can be used to construct a version history of a record. In order to do this, you need to persist the `versionstamp` in a separate index. Here's what that would look like

```ts
const userId = crypto.randomUUID();
const user = kv.get(["user", userId])
const result = await kv.atomic()
  .check(user)
  .set(["user", userId], {id: userId, name: "Joan Smith", email: "jsmith@example.com"})
  .commit();
if (result.ok) {
// add the result versionstamp to a separate index with a timestamp
  await kv.set(["user_versionstamp", userId, result.versionstamp ], {version: result.versionstamp, date: new Date().getTime()});
}
```
The versionstamp is part of the index so that records will be ordered by versionstamp for each user.

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
If a KV transaction fails within an `atomic()` call chain, a `Deno.KvCommitError` is returned. That object has one field `ok` that is set to `false` in this case.

If a call to `atomic().check()` fails (returns `false`), then any `set()` or `delete()` call in the `atomic()` chain is skipped and the data is not persisted (or deleted).

- transaction failures
    - failed check
    - failed commit



## Secondary Indexes

You usually begin a Deno KV implementation for an app by creating a primary index. The primary index will contain a model identifier part and a unique key part, like a user id for a "user" model. In that case, a particular "user" record will be found using the id.

### Creation
A secondary index is used to find a KV record or multiple records beyond the find-by-id search you can do on a primary index.

For instance, you want to search for a user by an email address you could have an index that uses the email address as the search criteria. These indexes usually have a name part that describes the index such as "user_by_email".

**TODO**: REWRITE NNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN

Here are example records comparing a primary and secondary index using a unique identifier:
```ts
// the primary index using the user id
kv.set(["user", 1], {id: 1, name: "John Doe", email: "jdoe@example.com"})
// a secondary index using the email address
kv.set(["user_by_email", "jdoe@example.com"], {id: 1, name: "John Doe", email: "jdoe@example.com"})
```
Secondary indexes can be created with multiple lookup criteria such name and id. In a case like this, you should include the id because multiple user could have the same name. Here's an example:
```ts
// A secondary index by name and id
kv.set(["user_by_name", "John Smith", 1], {id: 1, name: "John Smith", email: "jsmith@example.com"})
```
Often a secondary index includes values that are a duplicate of the values in a primary index, usually an object or array. But, instead the secondary key could just have a value that id the id that can be used to look up the full value in the primary index. For instance:
```ts
// A secondary index using the email address with the primary index id as the value
kv.set(["user_by_email", "jdoe@example.com"], 1)
// Use the id to lookup the full object
kv.set(["user", 1], {id: 1, name: "John Doe", email: "jdoe@example.com"})
```

**TODO**: More including use of transactions when creating secondary indexes


### Updating and deletion

### Sorting with indexes

In KV, key parts are ordered lexicographically (roughly dictionary order) by their type, and within a given type, they are ordered by their value. Type ordering follows that `Uint8Array` > `string` > `number` > `bigint` > `boolean`. Within each type, there is a [defined ordering](https://deno.com/manual@main/runtime/kv/key_space#key-part-ordering) too.

The significance of the key ordering is it can be used to sort values. You do that by creating an secondary index using the desired sorting criteria as key parts.

For instance, if you wanted to order user by their last name, your index would have a primary key with a record that looked was created like this:

```ts
ks.set(["user", "<userId>"], <user object record>)
```

An index for sorting by name would look like this:
```ts
ks.set(["user", "<lastName>", "<firstName>", "<userId>"], <user object record>)
```
You'll noticed that I added `userId` to the index. Otherwise duplicate records with the same first and last name will be ignored when the index is created. You could also use `email` (or another unique identifier) instead of `userId`.


## Math operations: sum, min & max

- `sum()`, `min()` and `max()` methods

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
The `Deno.KvU64()` constructor function is a wrapper around an unsigned `bigint` value. The value is set via the constructor argument and is retrieved using the `value` field on a `Deno.KvU64()` instance. This value is required to do certain mathematical calculations on values including `sum()`, `max()` and `min()`.

**TODO**: Elaborate-NNNNNNNNNNNNNNNNNNNNNNNN
```ts
// TODO: Better example
const num = new Deno.KvU64(5n);
console.log(num.value)
```

## Deno KV Drawbacks
- It restricts you to Deno Deploy deployment
- Its a no-SQL database, not a relational db
  - the mental model is very different from a RDBMS
  - you need to create your own indexes manually
- Deno Deploy is the only cloud provider that supports Deno KV
  - future pricing is unknown and may depend on use or storage

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

Deno Deploy docs state that the full asynchronous replication of data should occur withing 10 seconds.


## Deno KV Frontiers

The future is hard to predict especially the future of new technologies like Deno KV.
### The Deno team

The Deno teams says they are working on adding blog storage to Deno KV

### Tools under development
-[Pentagon](https://github.com/skoshx/pentagon) a [Prisma]()-like ORM built on top of Deno KV
- [deno-kv-plus](https://github.com/Kycermann/deno-kv-plus) - building safe atomic transactions (see https://mieszko.xyz/deno-kv-plus)

## Conclusions

---

# Appendix
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
