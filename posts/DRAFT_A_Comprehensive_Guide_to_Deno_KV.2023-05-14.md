### 2023-05-14

# A Comprehensive Guide to Deno KV

Deno KV, a key-value based database is was built into the Deno runtime starting with Deno 1.32.0. Deno Deploy now incorporates Deno KV, and distributes KV data around the world (US, Europe and Asia). This means that when a web application is put on Deploy, there will now be a database close to each server instance. In addition, Deno Deploy uses synchronization to maintain data consistency.

The Deno runtime has an implementation of Deno KV using sqlite for persistence. This implementation is compatible with the Deno Deploy KV database so that code developed locally will seamlessly work when deployed to DD. This is a big win for Deno developers!

Documentation of the Deno KV library is extensive, but sometimes redundant. Here's how it is organized:
- **Deno KV Concepts and Patterns** covered in the [Deno Manual](https://deno.com/manual@v1.33.1/runtime/kv) gives and overview of Deno KV and its various concepts and patterns:
  - [Key Space](https://deno.com/manual@main/runtime/kv/key_space) is a gives an overview of the keys, values and the versioning of key-value pairs.
  - [KV Operations](https://deno.com/manual@main/runtime/kv/operations) covers KV functions and atomic mutation operations.
  - [Deno KV Transactions](https://deno.com/manual@main/runtime/kv/transactions) shows how atomic transactions work in Deno KV.
  - [Deno KV Secondary Indexes](https://deno.com/manual@main/runtime/kv/secondary_indexes) Demonstrates how to create a secondary key to be used to query data in the key-value store outside of using the unique, primary-key-like id.
- **The Deno KV API** is covered in the [API documentation](https://deno.land/api@v1.33.1?unstable=&s=Deno.Kv) covers the various public classes, interfaces, methods and variables in the Deno KV API.
- **Deno Deploy** implementation of Deno KV explained on the [Deno Deploy KV page](https://deno.com/deploy/docs/kv) showing how to work with Deno KV on Deno Deploy and how the Deno KV data store is distributed and synchronized in various regions.

This article will comprehensively summarize this documentation.


## Keys, values and versions
### Keys
As stated above, Deno KV is a key-value database. In it's simplest form, a database record's data is persisted and found using the key. In Deno KV, the key is an array. Each of the members of the array is called a part. All parts are linked together by what is called 'invisible delimeters' to form the key. Key parts can be of types `string`, `number`, `boolean`, `Uint8Array`, or `bigint`.

Key parts are ordered lexicographically by their type, and within a given type, they are ordered by their value. Type ordering follows that `Uint8Array` > `string` > `number` > `bigint` > `boolean`. Within each type, there is a [defined ordering](https://deno.com/manual@main/runtime/kv/key_space#key-part-ordering) too.

The significance of the key ordering is it can be used to sort values.NNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN
- Use Secondary indexes

### Values
In order for Deno KV values to be persisted, a value must be a serializable JavaScript type compatible with the [structured clone algorithm](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm).  Exceptions under the algorithm that prevents persistence includes:
- function objects
- DOM nodes
- `RegExp.lastIndex` is not preserved if `RegEx` is used as a value.
- Property descriptors, setters, getters, and similar metadata-like features of objects are not preserved.

The `Deno.KvU64()` constructor function is a wrapper around an unsigned `bigint` value. The value is set via the constructor argument and is retrieved using the `value` field on a `Deno.KvU64()` instance. This value is required to do certain mathematical calculations on values including `sum`, `max` and `min`.
```ts
const num = new Deno.KvU64(5n);
console.log(num.value)
```


### Versioning
Each time a new value is persisted to Deno KV, it is automatically given a version based on the timestamp when the value was persisted. KV calls this version a `versionstamp`. When a value is updated, a new versionstamp is created.


## CRUD operations
The main CRUD (create, read, update & delete) operations in KV are defined as methods on the `Deno.Kv` class: `set()`(create & update), `get()` (read) and `delete()` (delete).

In it's basic form, the key has a string part representing the data table and an ID part representing a record id. The value would be the record being persisted.


**CRUD data**

Most apps contain a users entity encapsulating user data. In that case a TypeScript interface might look like this:
```ts
interface User {
  id: string;
  name: string;
  email: string;
  age: number;
  phone: string;
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


**Read (`get`)**

Reading or querying a record would use the record's key:
```ts
const kv = await Deno.openKv();
const foundUser: User = await kv.get(["users", userId]);
```

The `get()` method has an second argument that is optional called `options`. The `options` argument contains one field `consistency`. which has two values `"eventual"` or `"strong"`, which is the default.

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

## Secondary Indexes




## Transactions: atomic


## Math operators: sum, min & max



## KV on Deno Deploy

### Deno Deploy Data Centers
Deno KV databases are replicated across at least 6 data centers, spanning 3 regions (US, Europe, and Asia).

#### Data Consistency
Data consistency refers to the assurance that all data centers maintain the same data even after new data is persisted.

There are two kinds of data consistency in Deno Deploy. They can be configured using the `consistency` option when data is read from Deno KV. There are two options:
- `consistency: "strong"` _(default)_ data reads from KV will come from the nearest region
- `consistency: "eventual"`

Data access is quicker with eventual consistency, but the data will

For more details see https://deno.com/blog/kv#consistency-and-performance

#### Synchronization Between Data Centers

When data is written to a Deno KV store, the following things happen:
1. The data is replicated synchronously to two data centers within the same Deno Deploy region.
2. The data is replicated to the other data centers asynchronously.
Data replication

Deno Deploy docs state that the full asynchronous replication of data should occur withing 10 seconds.


## Deno KV Frontiers

### The Deno team

The Deno teams says they are working on adding blog storage to Deno KV

### For more information see
- https://deno.com/deploy/docs/kv
## References
- https://github.com/hashrock/kv-sketchbook/tree/main
- https://github.com/denoland/tic-tac-toe
