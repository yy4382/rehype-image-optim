import { it, expect, describe } from "vitest";
import linkTransformers from "../lib/link-transformer";

describe('"Cloudflare" provider', () => {
  it("should return auto format link when default option", () => {
    const originalLink = "https://example.com/image.jpg";
    expect(linkTransformers.cloudflare(originalLink, {})).toBe(
      "https://example.com/cdn-cgi/image/f=auto/image.jpg",
    );
  });
  it("should build correct option string", () => {
    const originalLink = "https://example.com/image.jpg";
    const targetLink =
      "https://example.com/cdn-cgi/image/f=auto,w=320,q=80/image.jpg";
    const options = [
      ["f=auto", "w=320", "q=80"],
      "f=auto,w=320,q=80",
      ["f=auto,w=320", "q=80"],
    ];
    options.forEach((option) => {
      expect(
        linkTransformers.cloudflare(originalLink, {
          options: option,
        }),
      ).toBe(targetLink);
    });
  });
  it("should use original origin when optimized origin is same", () => {
    const originalLink = "https://example.com/image.jpg";
    expect(
      linkTransformers.cloudflare(originalLink, {
        resultOrigin: "https://example.com",
      }),
    ).toBe("https://example.com/cdn-cgi/image/f=auto/image.jpg");
  });
  it("should use full link when optimized origin is different", () => {
    const originalLink = "https://example.com/image.jpg";
    expect(
      linkTransformers.cloudflare(originalLink, {
        resultOrigin: "https://example2.com",
      }),
    ).toBe(
      "https://example2.com/cdn-cgi/image/f=auto/https://example.com/image.jpg",
    );
  });
  it("should work with relative link", () => {
    const originalLink = "/image.jpg";
    expect(linkTransformers.cloudflare(originalLink, {})).toBe(
      "/cdn-cgi/image/f=auto/image.jpg",
    );
  });
  it("should return original link when invalid URL", () => {
    const originalLink = "invalid-url";
    expect(linkTransformers.cloudflare(originalLink, {})).toBe(originalLink);
  });
});
