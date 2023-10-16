import { cleanup, expect, render, setup } from "$fresh-testing-library";
import { afterEach, beforeAll, describe, it } from "std/testing/bdd.ts";
import { fn } from "https://esm.sh/jest-mock@29.7.0?pin=v133"

describe("Experiments using the fresh-testing-library expect function...",  () => {
  beforeAll(setup);
  afterEach(cleanup);

  it("should be equal using toBe", () => expect(1).toBe(1));

  it("should be not equal using not.toBe", () => expect(1).not.toBe(3));

  it("should be truthy", () => {
    expect(1).toBeTruthy();
    expect(1).not.toBeFalsy();
  })

  it("should be falsy", () => {
    expect(0).toBeFalsy();
    expect(0).not.toBeTruthy();
  })

  it("should be empty element", () => {
    const { getByRole } = render(<button></button>)
    expect(getByRole("button")).toBeEmptyDOMElement();
  });

  it("should be required element", () => {
    const { getByDisplayValue } = render(<input value="foobar" required></input>)
    expect(getByDisplayValue("foobar")).toBeRequired();
  });

  it("should find text in document", () => {
    const { queryByText } = render(<div>Hello World</div>)
    expect(queryByText("Hello World")).toBeInTheDocument();
    // using getByText will error out before matchers are called
    expect(queryByText("foobar")).not.toBeInTheDocument();
  });

  it("should be able to use jest-mock lib", () => {
    const add = (num1: number, num2: number): number => num1 + num2;
    expect(add(2,6)).toBe(8);
    // mock add and return value
    const mockAdd = fn(add).mockReturnValue(5);
    const sum = mockAdd(2, 2);
    expect(sum).toBe(5);
    expect(mockAdd).toBeCalled();
    expect(mockAdd).not.toBeCalledTimes(2);
    expect(mockAdd(3,5)).toBe(5);
    expect(mockAdd).toBeCalledWith(3,5)
  });


});
