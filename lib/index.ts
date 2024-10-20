/* eslint-disable @typescript-eslint/no-explicit-any */
import { visit } from "unist-util-visit";
import type { Root } from "hast";
import transformers from "./link-transformer/index.js";
type TransformerTypes = keyof typeof transformers;
type TransformerFunction<T = any> = (original: string, options: T) => string;

type OptimizeOptions<
  Provider extends TransformerTypes | TransformerFunction<any>,
> = Provider extends TransformerTypes
  ? (typeof transformers)[Provider] extends (
      originalLink: string,
      options: infer Options,
    ) => string
    ? Options
    : never
  : Provider extends TransformerFunction<infer T>
    ? T
    : never;

function transformer<
  Provider extends TransformerTypes | TransformerFunction<any>,
  Options extends OptimizeOptions<Provider>,
>(originalLink: string, provider: Provider, options: Options) {
  if (typeof provider === "function") {
    return provider(originalLink, options);
  }
  return transformers[provider as TransformerTypes](
    originalLink,
    options as any,
  );
}

type Options<
  Provider extends TransformerTypes | TransformerFunction<any>,
  OptOptions extends OptimizeOptions<Provider>,
> = {
  provider: Provider;
  originValidation?: string | RegExp | ((arg0: string) => boolean);
  /**
   * Options for the image optimization. Used to replace the image `src` property.
   *
   * If set to undefined, will not replace the `src` property.
   *
   * Else, this value is passed to the transformer function.
   */
  optimizeSrcOptions?: OptOptions;
  /**
   * Options for the image optimization. Used to replace the image `srcset` property.
   * The `descriptor` is a string that describes the size of the image or density.
   *
   * @see https://developers.cloudflare.com/images/transform-images/make-responsive-images/
   */
  srcsetOptionsList?: [OptOptions, string][];
  sizesOptionsList?: string[] | string;
  style?: string;
};

export default function rehypeImageOptimization<
  Provider extends TransformerTypes | TransformerFunction<any>,
  OptOptions extends OptimizeOptions<Provider>,
>(options: Options<Provider, OptOptions>) {
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

export function defineOptions<
  Provider extends TransformerTypes | TransformerFunction<any>,
  OptOptions extends OptimizeOptions<Provider>,
>(options: Options<Provider, OptOptions>) {
  return options;
}
