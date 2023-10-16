import { assert, assertEquals } from "std/assert/mod.ts";
import { cleanup, render, setup } from "$fresh-testing-library/components.ts";
import { afterEach, beforeAll, describe, it } from "std/testing/bdd.ts";
import PostList from "../../components/PostList.tsx"

describe("components/PostList.tsx", () => {
  beforeAll(setup);
  afterEach(cleanup);

  it("should show links and text display correctly", () => {
    const files = [
      "foo_bar.2023-01-01.md",
      "baz_bar.2023-01-02.md"
    ]
    // first link
    const {queryByText} = render(<PostList files={files}/>)
    const anchor1 = queryByText(/foo bar/);
    assert(anchor1?.textContent?.includes("2023-01-01"));
    const href1 = (anchor1 as HTMLAnchorElement).href;
    assertEquals(href1, "/foo_bar.2023-01-01");
    // second link
    const anchor2 = queryByText(/baz bar/);
    assert(anchor2?.textContent?.includes("2023-01-02"));
    const href2 = (anchor2 as HTMLAnchorElement).href;
    assertEquals(href2, "/baz_bar.2023-01-02");
  });
});
