import { useState, useEffect } from "preact/hooks";
import { assertExists, assertFalse } from "std/assert/mod.ts";
import { cleanup, fireEvent, render, setup } from "$fresh-testing-library";
import { afterEach, beforeAll, describe, it } from "std/testing/bdd.ts";

function AsyncComponent() {
  const [foo, setFoo] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => {
      return "FOO";
    }, 50);
    return () => {
      clearTimeout(timeout);
    }
  }, []);

  return (
    <div>
      {foo}
    </div>
  )
}


describe("Async tests", () => {
  beforeAll(setup);
  afterEach(cleanup);

  it("should display 'FOO'", async () => {
    const screen = render(<AsyncComponent/>)
    const element = await screen.findByText("FOO");
    assertExists(element);
  });
});
