import rehypeImageOptimization, { defineOptions } from "../lib";
import { rehype } from "rehype";
import { it, expect, describe } from "vitest";
import cloudflare from "../lib/link-transformer/cloudflare";

const input = `<img src="https://example.com/image.jpg">`;
describe("Cloudflare", () => {
  it("should not change src if `optimizeSrcOptions` is undefined", async () => {
    const result = await process(input, { provider: "cloudflare" });
    expect(result).toMatchSnapshot();
  });
  it("should work with default options", async () => {
    const result = await process(input, {
      provider: "cloudflare",
      optimizeSrcOptions: {},
    });
    expect(result).toMatchSnapshot();
  });
  it("should work with srcset", async () => {
    const result = await process(input, {
      provider: "cloudflare",
      srcsetOptionsList: [
        [{}, "1x"],
        [{ options: "w=200" }, "2x"],
      ],
    });
    expect(result).toMatchSnapshot();
  });
  it("should work with sizes", async () => {
    const result = await process(input, {
      provider: "cloudflare",
      sizesOptionsList: ["(max-width: 600px) 100vw", "50vw"],
    });
    expect(result).toMatchSnapshot();
  });
  it("should work with style", async () => {
    const result = await process(input, {
      provider: "cloudflare",
      style: "width: 100%",
    });
    expect(result).toMatchSnapshot();
    const inputWithStyle = `<img src="https://example.com/image.jpg" style="width: 100%;">`;
    expect(
      await process(inputWithStyle, {
        provider: "cloudflare",
        style: "height: auto;",
      }),
    ).toMatchSnapshot();
  });
});

describe("Custom transformer", () => {
  it("should work with custom transformer", async () => {
    const result = await process(input, {
      provider: (
        originalLink,
        options: {
          a: string;
          /**
           * Test doc comment
           */
          b: boolean;
        },
      ) => {
        return originalLink.replace(options.a, "replaced");
      },
      optimizeSrcOptions: { a: "a" },
    });
    expect(result).toMatchSnapshot();
  });
  it("should work with srcset", async () => {
    const result = await process(
      input,
      defineOptions({
        provider: cloudflare,
        srcsetOptionsList: [
          [{}, "1x"],
          [{ options: "w=200" }, "2x"],
        ],
      }),
    );
    expect(result).toMatchSnapshot();
  });
});

async function process(
  input: string,
  options: Parameters<typeof rehypeImageOptimization>[0],
): Promise<string> {
  const result = await rehype()
    .use({ settings: { fragment: true } })
    .use(rehypeImageOptimization, options)
    .process(input);
  return result.toString();
}
