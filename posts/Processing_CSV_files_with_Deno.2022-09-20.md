<!-- deno-fmt-ignore-file -->
#### 2022-09-20

##### _7 min read_

# Processing CSV files with Deno

The CSV (Comma-Separated-Values) format is one of the most common ways to do
data interchange between systems. The Deno standard library contains a
`encoding/csv.ts` module to facilitate reading and writing CSV files. The
`stringify` function in that module converts a JavaScript (or JSON) object into
a CSV line while the `parse` function converts a CSV-formatted line back into an
object. This post explores transforming API data into CSV and back to JS
objects. Source code for this blog post can be found at
[https://github.com/cdoremus/deno-blog-code/tree/main/processing_csv](https://github.com/cdoremus/deno-blog-code/tree/main/processing_csv).

## Writing and reading CSV text

A small amount of data is easily processed in a single write and read to and
from a text file. In this case we use the `Deno.writeTextFile` and
`Deno.readTextFile` functions to put or get CSV data in a single call.

### Fetching the data

We will be processing JSON data from an API called
[JSONPlaceholder](https://jsonplaceholder.typicode.com/) which provides fake
data for many common resources like users, blog posts and todos. The JavaScript
built-in `fetch` function will be used to call the API. Here's what a call to
get a list of users looks like:

```ts
async function fetchData(): Promise<User[]> {
  const resp = await fetch("https://jsonplaceholder.typicode.com/users");
  return await resp.json();
}
```

The TypeScript-defined `User` type returned in a JS promise contains id, name
and email keys.

### Writing CSV data to a file

Once the API data has been fetched, the `stringify` function from the
`encoding/cvs.ts` module is used to format the data into CSV before it is
written to a text file:

```ts
async function writeToFile(users: User[]): Promise<void> {
  const stringified = await stringify(users, USER_COLS);
  await Deno.writeTextFile(USER_FILE, stringified);
}
```

The `stringify` function takes an array of data to be persisted as CSV as the
first argument and a string array of columns. Make sure that data and the column
array are in the same order. The `users` array is filled with user objects
having id, name and email keys corresponding to the JSON returned from the API
call. The `USER_COLS` object is a string array containing the names of the
object keys.

The `encoding/csv.ts` module's `stringify` function has an optional third
argument that is an object with `headers` and `separator` keys. The `headers`
key (true by default) indicates whether a header containing the data's keys (id,
name, email in this case) should be written to the file as the first line. The
`separator` key indicates the delimiter used to separate items (a comma by
default, but any character can be used as a separator).

Finally, the delimited items are written to a file using the
`Deno.writeTextFile` function.

See
[populate_data.ts](https://github.com/cdoremus/deno-blog-code/blob/main/processing_csv/populate_data.ts)
in the blog source code repo for more details.

### Reading CSV from a file

Reading CSV from a small file is done using `Deno.readTextFile`. In addition,
the `encoding/csv.ts` module contains a `parse` function that facilitates the
transformation of CSV data into an array of objects.

```ts
async function readCsvFile(): Promise<User[]> {
  const file = await Deno.readTextFile(USERS_FILE);
  return parse(file, { skipFirstRow: true, columns: USER_COLS }) as User[];
}
```

The second argument of `parse` contains an options argument which is an object
with `skipFirstRow` and `columns` keys. The `skipFirstRow` key indicates if you
should skip the first row which contains the column names (`false` by default).
This (`skipfirstRow`) needs to be set to `true` if you set `headers` to `true`
in the `stringify` call. The `columns` key is an ordered array of column
headers. You need to make sure that the `columns` order corresponds to the order
of data in each CSV row.

The `columns` values will be used as the keys for the objects being created from
the CSV data. Otherwise, you will just get an array of string arrays containing
the CSV data, so if you want the original object recreated, then `columns` needs
to be used in your `parse` call.

See
[read_data.ts](https://github.com/cdoremus/deno-blog-code/blob/main/processing_csv/read_data.ts)
in the blog source code repo for more details.

## Working with large data sets

### Writing the data set

When a large amount of data is needed to be processed, it cannot be done in a
single operation due to memory constraints. In that case, the `Deno.open`
function can be used. That function takes two arguments. The first is the
absolute or relative file path while the second is an object with `read`,
`write`, `append`, `create` and `createNew` keys. The other `Deno.open` keys,
`truncate` and `mode`, are not relevant here.

We will be using the JSONPlaceholder post API here:

```ts
async function fetchData(page_number: number): Promise<Post[]> {
  const resp = await fetch(
    `https://jsonplaceholder.typicode.com/posts?_limit=10&_page=${page_number}`,
  );
  return await resp.json();
}
```

The JSONPlaceholder posts API only contains 100 records. We will be writing 10
pages (chunks) of 10 records each. I created a TypeScript type `Post` that
contains the keys from the post API (userId, id, title and body).

Each of the post data chunks are written to the CSV file using the `stringify`
function after a `Deno.open` call. Files opened in this manner need to be
written as a byte array (`Uint8Array`).

```ts
async function writeToFileChunk(posts: Post[]) {
  const file = await Deno.open(POSTS_FILE, {
    append: true,
  });
  try {
    const stringified = await stringify(posts, POST_COLS, { headers: false });
    const byteArray = new Uint8Array(stringified.length);
    const encoder = new TextEncoder();
    encoder.encodeInto(stringified, byteArray);
    file.write(byteArray);
  } finally {
    file.close();
  }
}
```

A file reference obtained from calling `Deno.open` needs to be manually closed
when finished. The best way to do this is in a `finally` block as I have done
here.

Since the file is written multiple times in append calls, we turned off the
`headers` option. Instead the headers will be written before the post API data
is written.

```ts
export async function writeCsvHeader() {
  // change this if using a different CSV separator
  const header = POST_COLS.join(",");
  await Deno.writeTextFile(POSTS_FILE, `${header}\n`);
}
```

There's one more thing that needs to be done to the post data. The `body` field
has a number of newline characters in it. These will interfere with the `parse`
function in the `encoding/csv.ts` module that uses newlines to separate object
records. In this case, I assume that the newlines have some significance, so I
replace each newline in the post `body` field with a pipe character (|). When
the data is used, then the pipe can be converted back to a newline or into
something else (an HTML break tag, for instance).

```ts
async function main() {
  // Delete previously written file, if exists
  try {
    await Deno.remove(POSTS_FILE);
  } catch (_e) {
    // ignore, since file probably does not exist
  }
  // write header with object keys first
  await writeCsvHeader();
  // write data
  for (let i = 1; i <= TOTAL_API_PAGES; i++) {
    const users = await fetchData(i);
    // get rid of newlines from body field
    //  so that parse function in cvs module works
    for (const post of users) {
      post.body = post.body.replaceAll("\n", "|");
    }
    await writeToFileChunk(users);
  }
}
```

See
[populate_large_data.ts](https://github.com/cdoremus/deno-blog-code/blob/main/processing_csv/populate_large_data.ts)
in the blog source code repo for more details.

### Reading data from a large CSV file

Reading data from a large CSV file involves in using the `Deno.open` function
with the `read:true` option.

I used the `TextProtoReader` in the `textproto` module to process the CSV data
in chunks, a line at a time. That class' constructor takes a `BufReader` object
(`io/buffer` module) with a file object passed in.

`TextProtoReader.readline()` is used to read a line of the CSV file and then
`parse` in the `encoding/csv` module is used to transform each CSV line into a
post object.

```ts
async function readLargeCsv() {
  const file = await Deno.open(POSTS_FILE, { read: true });

  const reader = new TextProtoReader(BufReader.create(file));
  let lines = "";
  while (true) {
    const line = await reader.readLine();
    if (line === null) break;
    lines = lines + line + "\n";
  }
  // Convert CSV lines into Post objects
  const record = await parse(lines, { skipFirstRow: true, columns: POST_COLS });
  // Display Post records
  console.log(record);
}
```

I am just printing the objects to the console here for illustration, but there
are a lot of other things that can be done with it such as displaying the
objects in a UI.

See
[read_large_data.ts](https://github.com/cdoremus/deno-blog-code/blob/main/processing_csv/read_large_data.ts)
in the blog source code repo for more details.

## Conclusion

This article demonstrates how to use the Deno `encoding/csv` module to convert
data from an object representation (like JSON) to CSV and back again. I have
used snippets here from the
[source code for this article](https://github.com/cdoremus/deno-blog-code/tree/main/processing_csv),
so check out the source to see how everything fits together. A comment at the
top of each source code file will tell you how to run each example.
