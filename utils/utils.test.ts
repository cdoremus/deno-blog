import { assert } from "std/testing/asserts.ts";
import { postDateSorter } from "./utils.ts";

Deno.test("test postDateSorter() after days", () => {
  // date1 after date2
  const date1 = "post1.2020-11-03.md";
  const date2 = "post2.2020-11-02.md";
  const results = postDateSorter(date1, date2);
  // assert(results < 0);
  assert(results > 0);
});

Deno.test("test postDateSorter() before days", () => {
  // date1 before date2
  const date1 = "post1.2020-11-01.md";
  const date2 = "post2.2020-11-03.md";
  const results = postDateSorter(date1, date2);
  // assert(results > 0);
  assert(results < 0);
});

Deno.test("test postDateSorter() equal dates", () => {
  // date1 equals date2
  const date1 = "post1.2020-11-01.md";
  const date2 = "post2.2020-11-01.md";
  const results = postDateSorter(date1, date2);
  assert(results === 0);
});

Deno.test("test postDateSorter() before months", () => {
  // date1 before date2
  const date1 = "post1.2020-10-01.md";
  const date2 = "post2.2020-11-03.md";
  const results = postDateSorter(date1, date2);
  assert(results < 0);
});

Deno.test("test postDateSorter() after years", () => {
  // date1 after date2
  const date1 = "post1.2021-11-01.md";
  const date2 = "post2.2020-11-01.md";
  const results = postDateSorter(date1, date2);
  assert(results > 0);
});

// Deno.test('test postDateSorter()', () => {
// });
