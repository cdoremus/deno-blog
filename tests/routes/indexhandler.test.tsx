import { createHandlerContext } from "$fresh-testing-library";

import { assert, assertEquals } from "std/assert/mod.ts";
import { describe, it } from "std/testing/bdd.ts";
import { handler } from "../../routes/index.tsx";

import manifest from "../../fresh.gen.ts";


async function streamToText(readableStream: ReadableStream<Uint8Array> | null): Promise<string> {
  const textDecoder = new TextDecoder('utf-8');
  let result = '';
  if (readableStream) {
    const reader = readableStream.getReader();

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        // The stream has been fully read
        break;
      }

      // Decode the Uint8Array chunk and append it to the result
      const chunkText = textDecoder.decode(value, { stream: true });
      result += chunkText;
    }
    // Close the reader when done
    reader.releaseLock();
  }
  textDecoder.decode();
  return result;
}
describe("index.tsx (Home) handler...", () => {
  it("should...", async () => {
    // verify that the handler has a GET property
    assert(handler.GET);
    const req = new Request("https://localhost:8000/");
    // @ts-ignore ignores "type ... is not assignable to type Manifest" error
    const ctx = createHandlerContext(req, { manifest });
    const res = await handler.GET(req, ctx);
    // const markup = await streamToText(res.body);
    // console.log("MARKUP", markup);
    console.log("RESPONSE", await res.text());
    assert(res);
  });
});

