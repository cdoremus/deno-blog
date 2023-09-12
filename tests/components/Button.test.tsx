import { cleanup, render, setup } from "$fresh-testing-library";
import { afterEach, beforeAll, describe, it } from "std/testing/bdd.ts";
import {Button} from "../../components/Button.tsx";
import { assert, assertEquals, assertExists, assertStringIncludes } from "std/assert/mod.ts";

describe("islands/Button.tsx", () => {
  beforeAll(setup);
  afterEach(cleanup);

  it("should display button with class attribute values", () => {
    const screen = render(<Button />)
    const button = screen.getByRole("button");
    assert(button.classList.contains("border-2"));
    assert(button.classList.contains("rounded"));
    assert(button.classList.contains("bg-white"));
  });

  it("should display button with width style attribute", () => {
    const screen = render(<Button style={{width: "200px"}}/>)
    const button = screen.getByRole("button");
    assertEquals(button.style.width, "200px");
  });

});