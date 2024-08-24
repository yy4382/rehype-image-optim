type OptimizeOptions = string[] | string;
export default function linkTransformer(
  originalLink: string,
  options: {
    /**
     * Options for the image optimization. Used to replace the image `src` property.
     *
     * Can be `string` or `string[]`. If an array is provided, it is joined with a comma.
     *
     * The following examples are equivalent:
     * @example "f=auto,w=320,q=80"
     * @example ["f=auto", "w=320", "q=80"]
     * @example ["f=auto,w=320", "q=80"]
     *
     * @see https://developers.cloudflare.com/images/transform-images/transform-via-url/#options
     */
    options?: OptimizeOptions;
    resultOrigin?: string;
  },
): string {
  const { options: optimizeOptions = "f=auto", resultOrigin: optimizedOrigin } =
    options;
  let imgOrigin, imgPath;
  try {
    const url = new URL(originalLink);
    imgOrigin = url.origin;
    imgPath = url.pathname;
  } catch {
    console.error("Invalid URL", originalLink);
    return originalLink;
  }

  const optionString = joinOptions(optimizeOptions);
  if (!optimizedOrigin) {
    return `${imgOrigin}/cdn-cgi/image/${optionString}${imgPath}`;
  } else if (optimizedOrigin === imgOrigin) {
    return `${imgOrigin}/cdn-cgi/image/${optionString}${imgPath}`;
  } else {
    return `${optimizedOrigin}/cdn-cgi/image/${optionString}/${originalLink}`;
  }
}

const joinOptions = (options: OptimizeOptions) => {
  if (typeof options === "string") {
    return options;
  }
  return options.join(",");
};
