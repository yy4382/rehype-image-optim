import { visit } from "unist-util-visit";
import type { Root } from "hast";
import transformer, { transformers } from "./link-transformer";

export default function rehypeImageOptimization<
  Provider extends keyof typeof transformers,
>(options: {
  provider: Provider;
  originValidation?: string | RegExp | ((arg0: string) => boolean);
  /**
   * Options for the image optimization. Used to replace the image `src` property.
   *
   * If set to undefined, will not replace the `src` property.
   *
   * Else, this value is passed to the transformer function.
   */
  optimizeSrcOptions?: Parameters<(typeof transformers)[Provider]>[1];
  /**
   * Options for the image optimization. Used to replace the image `srcset` property.
   * The `descriptor` is a string that describes the size of the image or density.
   *
   * @see https://developers.cloudflare.com/images/transform-images/make-responsive-images/
   */
  srcsetOptionsList?: [
    Parameters<(typeof transformers)[Provider]>[1],
    string,
  ][];
  sizesOptionsList?: string[] | string;
  style?: string;
}) {
  const {
    provider,
    originValidation,
    optimizeSrcOptions: optimizeOptions,
    srcsetOptionsList,
    sizesOptionsList,
    style,
  } = options;
  const validateOrigin = (origin: string) => {
    if (originValidation === undefined) {
      return true;
    }
    if (typeof originValidation === "string") {
      return originValidation === origin;
    }
    if (originValidation instanceof RegExp) {
      return originValidation.test(origin);
    }
    if (typeof originValidation === "function") {
      return originValidation(origin);
    }
    throw new Error("Invalid originValidation option");
  };

  return function (tree: Root) {
    visit(tree, "element", (node) => {
      if (node.tagName !== "img" || !node.properties.src) {
        return;
      }
      const originalLink = node.properties.src.toString();
      let origin: string;

      try {
        const url = new URL(originalLink);
        origin = url.origin;
      } catch {
        console.error("Invalid URL:", originalLink);
        return;
      }

      if (!validateOrigin(origin)) {
        return;
      }

      if (optimizeOptions !== undefined)
        node.properties.src = transformer(
          originalLink,
          provider,
          optimizeOptions,
        );

      if (srcsetOptionsList !== undefined)
        node.properties.srcset = srcsetOptionsList
          .map(
            ([optimOptions, descriptor]) =>
              `${transformer(originalLink, provider, optimOptions)} ${descriptor}`,
          )
          .join(", ");

      if (sizesOptionsList !== undefined)
        node.properties.sizes =
          typeof sizesOptionsList === "string"
            ? sizesOptionsList
            : sizesOptionsList.join(", ");

      if (style) {
        if (node.properties.style === undefined) node.properties.style = style;
        else node.properties.style += " " + style;
      }
    });
  };
}
