import { assertExists, assertFalse } from "std/assert/mod.ts";
import { cleanup, fireEvent, render, setup } from "$fresh-testing-library";
import { afterEach, beforeAll, describe, it } from "std/testing/bdd.ts";


describe("byRole tests", () => {
  beforeAll(setup);
  afterEach(cleanup);

  it("should error", () => {
    const screen = render(
      <div>
        <button>
          <span>
            Hello
          </span>
          <span>
            World
          </span>
        </button>
      </div>
    );
    screen.debug();
    const element= screen.getByRole("foobar");

  });
});
