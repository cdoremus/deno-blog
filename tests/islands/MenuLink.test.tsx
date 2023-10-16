import { assert, assertEquals,assertNotEquals, assertExists } from "std/assert/mod.ts";
import { cleanup, render, setup } from "$fresh-testing-library/components.ts";
import { afterEach, beforeAll, describe, it } from "std/testing/bdd.ts";
import MenuLink from "../../islands/MenuLink.tsx"

describe("islands/MenuLink.tsx", () => {
  beforeAll(setup);
  afterEach(cleanup);

  it("Show About link", async () => {
    // @ts-ignore Only mocking window.location.href here
    globalThis.window.location = {href: "/about"};
    const { findByText } = render(<MenuLink/>);
    const page = await findByText("Home")
    const text = page.textContent;
    assertExists(text);
    assertNotEquals(text, "About");
  });

  it("Show Home link", async () => {
    // @ts-ignore Only mocking window.location.href here
    globalThis.window.location = {href: "/"};
    const {findByText} = render(<MenuLink/>);
    const page = await findByText(/about/i)
    const text = page.textContent;
    assertEquals(text, "About");
    assertNotEquals(text, "Home");
  });

  it("Show bogus link", () => {
    // @ts-ignore Mocking window.location.href
    globalThis.window.location = {href: "/bogus"};
    const {queryByText} = render(<MenuLink/>);
    const element =  queryByText("bogus");
    assert(element === null);
  });

});