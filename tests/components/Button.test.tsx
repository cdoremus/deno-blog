import { cleanup, render, setup } from "$fresh-testing-library/components.ts";
import { expect } from "$fresh-testing-library/expect.ts";

import { afterEach, beforeAll, describe, it } from "std/testing/bdd.ts";
import { Button } from "../../components/Button.tsx";
import { assertEquals } from "std/assert/mod.ts";

describe("islands/Button.tsx", () => {
  beforeAll(setup);
  afterEach(cleanup);

  it("should display button with class attribute values", () => {
    const {getByRole} = render(<Button />)
    const button = getByRole("button");
    const classList = button.classList;
    expect(classList).toContain("border-2");
    expect(classList).toContain("rounded");
    expect(classList).toContain("bg-white");
  });

  it("should display button with width style attribute", () => {
    const {getByRole} = render(<Button style={{width: "200px"}}/>)
    const button = getByRole("button");
    assertEquals(button.style.width, "200px");
  });
});

