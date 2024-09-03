# rehype image optim (WIP)

[rehype](https://github.com/rehypejs/rehype) plugin to change the `src` (and `srcset`/`sizes`) of images to optimized versions from your image CDN/optimization provider.

> [!NOTE]
> This package is still in development. APIs may change without notice.

## What is this?

This package is a [unified][] ([rehype][]) plugin to replace the `<img>` tags in your HTML with optimized versions from your image CDN/optimization provider. It has the ability to replace the `src` and `srcset`/`sizes` attributes of the `<img>` tag (as a bonus, it can also append the `style` attribute).

One of the key features of this package is how it replaces the URLs to optimized ones. Currently, it only supports Cloudflare Image Optimization's "Transform via URL", but feel free to open an issue if you want to add support for other providers. Also, you can pass in a custom transformer function when using this package.

## Install

The package will be available on npm soon.

## Usage

Say we have the following HTML fragment:

```html
<img src="https://example.com/image.jpg" />
```

…and our module example.ts looks as follows (you can use the `defineOptions` helper function to get type-safe options):

> [!NOTE]
> For more information, read the [API](#api) section.

```typescript
import { rehype } from "rehype";
import rehypeImageOptimization, { defineOptions } from "rehype-image-optim";

const input = `<img src="https://example.com/image.jpg" />`;

const result = await rehype()
  .use({ settings: { fragment: true } })
  .use(
    rehypeImageOptimization,
    defineOptions({
      // use the built-in cloudflare provider
      provider: "cloudflare",
      // this is configured to replace the `src` attribute
      optimizeSrcOptions: {
        // the options in this object is unique to the provider
        options: "f=auto",
      },
      // this is configured to replace the `srcset` attribute
      srcsetOptionsList: [
        [{}, "1x"],
        [{ options: "w=200" }, "2x"],
      ],
      // this is configured to replace the `sizes` attribute
      sizesOptionsList: ["(max-width: 600px) 100vw", "50vw"],
      // this will append the `style` attribute
      style: "width: 100%",
    }),
  )
  .process(input);

console.log(result.toString());
```

…now running node example.ts yields (formatted for readability):

```html
<img
  src="https://example.com/cdn-cgi/image/f=auto/image.jpg"
  srcset="
    https://example.com/cdn-cgi/image/f=auto/image.jpg 1x,
    https://example.com/cdn-cgi/image/w=200/image.jpg  2x
  "
  sizes="(max-width: 600px) 100vw, 50vw"
  style="width: 100%"
/>
```

Or, you can pass a function to the `provider` option to use a custom transformer:

```typescript
import { rehype } from "rehype";
import rehypeImageOptimization, { defineOptions } from "rehype-image-optim";

const input = `<img src="https://example.com/image.jpg" />`;

const result = await rehype()
  .use({ settings: { fragment: true } })
  .use(
    rehypeImageOptimization,
    defineOptions({
      provider: (originalLink, options: { a: string; b: boolean }) => {
        return originalLink.replace(options.a, "replaced");
      },
      // As mentioned above, the type of these options is defined by the second argument of the `provider` function.
      optimizeSrcOptions: { a: "a" },
    }),
  )
  .process(input);

console.log(result.toString());
// <img src="https://exreplacedmple.com/image.jpg">
```

The custom `provider` need to satisfy the following type:

```typescript
type TransformerFunction<OptOptions = any> = (
  originalUrl: string,
  options: OptOptions,
) => string;
```

## API

The default export is the rehype plugin. Also, you can import the `defineOptions` helper function to get type-safe options (and editor hint! since this plugin has a relatively complex options structure).

### `Options`

The first parameter of the rehype plugin is an `Options` object.

<details>
<summary>Options type interface</summary>

```typescript
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
```

</details>

#### `provider`

Can be a string or a function.

If a string, it indicates a built-in provider. Currently, the only built-in provider is `"cloudflare"`.

If a function, it is a custom transformer function. The function should satisfy the following type:

```typescript
type TransformerFunction<OptOptions = any> = (
  originalUrl: string,
  options: OptOptions,
) => string;
```

> [!NOTE]
> Notice the generic type `OptOptions`, which will be used to type the `optimizeSrcOptions` and `srcsetOptionsList` options below.

#### `originValidation`

Can be a string, a regular expression, or a function.

Usually, you don't want to optimize images from other domains. This option allows you to specify which domains are allowed to be optimized.

If a function, it should return a boolean.

#### `optimizeSrcOptions`

Options for replacing the `src` attribute. Type is `OptOptions` from the `provider` option.

#### `srcsetOptionsList`

Options for replacing the `srcset` attribute. Type is `[OptOptions, string][]`.

The first element of the tuple is the `OptOptions` from the `provider` option, which builds the URL, and the second element is a string used as the `descriptor` for the URL.

You can easily find how this build the `srcset` attribute by the example above in [Usage](#usage) section.

> [!NOTE]
> If you don't know what srcset is, you can read [Cloudflare's documentation](https://developers.cloudflare.com/images/transform-images/make-responsive-images/) or [MDN's documentation](https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/srcset).

#### `sizesOptionsList`

Options for replacing the `sizes` attribute. Type is `string[]` or `string`.

If it is a string, it will be used as the value of the `sizes` attribute.

If it is an array, it will be joined with a comma.

#### `style`

Type is `string`.

Appends the `style` attribute to the `<img>` tag.

## Built-in providers

### Cloudflare

[Transform via URL | Cloudflare Image Optimization docs](https://developers.cloudflare.com/images/transform-images/transform-via-url/)

<details>
<summary>`OptOptions` type interface</summary>

```typescript
{
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
}
```

</details>

More documentation is coming soon. For now, you can read the tests for examples. [link-transformer.test.ts](/test/plugin.test.ts)

## Contributing

If you find a bug or want to add a new provider, please open an issue or a pull request.

As to add a new provider, you can create a new file in the `lib/link-transformer` directory, and edit the `/lib/link-transformer/index.ts` file to export the new provider. Please add tests for the new provider in the `test/link-transformer.test.ts` file if possible.

[unified]: https://github.com/unifiedjs/unified
[rehype]: https://github.com/rehypejs/rehype
