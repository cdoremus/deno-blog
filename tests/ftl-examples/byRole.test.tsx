import { cleanup, render, setup } from "$fresh-testing-library";
import { afterEach, beforeAll, describe, it } from "std/testing/bdd.ts";
import { assertStringIncludes, fail } from "std/assert/mod.ts";


describe("byRole tests", () => {
  beforeAll(setup);
  afterEach(cleanup);

  it("should error due to bad role", () => {
    const {getByRole} = render(
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
    try {
      // bogus role
      const element= getByRole("buttonasdf");
      assertStringIncludes(element.textContent as string, "Hello");
      assertStringIncludes(element.textContent as string, "World");
      // should fail if gets here
      fail();
    } catch(e) {
      // ignore
    }
  });
});
