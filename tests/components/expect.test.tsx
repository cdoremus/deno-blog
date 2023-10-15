import { cleanup, expect, render, setup } from "$fresh-testing-library";
import { afterEach, beforeAll, describe, it } from "std/testing/bdd.ts";

describe("Experiments using the fresh-testing-library expect function...",  () => {
  beforeAll(setup);
  afterEach(cleanup);

  it("should be equal using toBe", () => expect(1).toBe(1));

  it("should be not equal using not.toBe", () => expect(1).not.toBe(3));

  it("should be empty element", () => {
    const { getByRole } = render(<button></button>)
    expect(getByRole("button")).toBeEmptyDOMElement();
  });

  it("should be required element", () => {
    const { getByDisplayValue } = render(<input value="foobar" required></input>)
    expect(getByDisplayValue("foobar")).toBeRequired();
  });

  it("should find text in document", () => {
    const { getByText } = render(<div>Hello World</div>)
    expect(getByText("Hello World")).toBeInTheDocument();
  });

});
