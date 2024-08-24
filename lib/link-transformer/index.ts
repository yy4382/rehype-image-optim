import cloudflare from "./cloudflare";

export const transformers = {
  cloudflare,
};

function transformer<T extends keyof typeof transformers>(
  originalLink: string,
  provider: T,
  options: Parameters<(typeof transformers)[T]>[1],
): string {
  // #@ts-expect-error options should be correct because of the provider inference
  return transformers[provider](originalLink, options);
}

export default transformer;
