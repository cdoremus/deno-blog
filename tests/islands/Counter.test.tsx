import { signal } from "@preact/signals";
import { assertExists, assertFalse } from "std/assert/mod.ts";
import { cleanup, fireEvent, render, setup } from "$fresh-testing-library";
import { afterEach, beforeAll, describe, it } from "std/testing/bdd.ts";
import Counter from "../../islands/Counter.tsx";

describe("islands/Counter.tsx", () => {
  beforeAll(setup);
  afterEach(cleanup);

  it("should display count and increment/decrement it correctly", async () => {
    const count = signal<number>(9);
    const {queryByRole, queryByText} = render(<Counter count={count} />);
    const plusOne = queryByRole("button", { name: "+1" });
    assertExists(plusOne);
    const minusOne = queryByRole("button", { name: "-1" });
    assertExists(minusOne);

    await fireEvent.click(plusOne);
    assertFalse(queryByText("9"));
    assertExists(queryByText("10"));

    await fireEvent.click(minusOne);
    assertExists(queryByText("9"));
    assertFalse(queryByText("10"));

  });
});
