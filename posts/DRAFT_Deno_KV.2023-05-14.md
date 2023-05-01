### 2023-05-14

# Deno KV

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
As stated above, Deno KV is a key-value database. In it's simplest form, a database record's data is persisted and found using the key. In Deno KV, the key is an array. Array members can be of NNNNNNNNNNNNN type.

### Values
Deno KV values must be serializable. ???????

### Versioning
Each time a new value is persisted to Deno KV, it is automatically given an alphanumeric version token which is based on the timestamp when the value was persisted. KV calls this version token a `versionstamp`. When that value is updated, a new versionstamp is created.


## CRUD operations: set, get, delete


## Querying using secondary keys


## Transactions: atomic


## Math operators: sum, min & max


## KV on Deno Deploy
