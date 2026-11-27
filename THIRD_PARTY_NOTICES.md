# Third-party notices

PH Tax Calculator's own source code is licensed under the [PolyForm Strict License 1.0.0](LICENSE). It is built on the open-source work below, which keeps its own licence and copyright. These notices are kept because those licences ask for it.

## Code and fonts that reach the browser

| Package | Version | Licence | Copyright |
| --- | --- | --- | --- |
| [react](https://github.com/facebook/react), react-dom | 19.3.1 | MIT | Meta Platforms, Inc. and affiliates |
| [react-router](https://github.com/remix-run/react-router) | 8.5.2 | MIT | React Training LLC 2015-2019, Remix Software Inc. 2020-2021, Shopify Inc. 2022-2023 |
| [radix-ui](https://github.com/radix-ui/primitives) | 1.8.1 | MIT | 2022 WorkOS |
| [lucide-react](https://github.com/lucide-icons/lucide) (icons) | 1.75.0 | ISC (parts MIT) | 2026 Lucide Icons and Contributors; 2013-present Cole Bemis |
| [class-variance-authority](https://github.com/joe-bell/cva) | 0.7.1 | Apache-2.0 | Joe Bell |
| [cn](https://www.npmjs.com/package/cn) | 0.5.2 | MIT | 2026 shadcn |
| [@fontsource-variable/geist](https://github.com/fontsource/font-files) and geist-mono (the Geist and Geist Mono fonts, served from this site) | 5.3.0 | SIL OFL 1.1 | 2024 The Geist Project Authors (https://github.com/vercel/geist-font) |
| [tailwindcss](https://github.com/tailwindlabs/tailwindcss) (base styles and utility CSS) | 4.3.5 | MIT | Tailwind Labs, Inc. |
| [tw-animate-css](https://github.com/Wombosvideo/tw-animate-css) (animation CSS) | 1.4.0 | MIT | 2025 Wombosvideo |
| [shadcn](https://github.com/shadcn-ui/ui) (`shadcn/tailwind.css`) | 4.23.0 | MIT | 2023 shadcn |

These come with the packages above and are also in the built site:

| Package | Version | Licence | Copyright |
| --- | --- | --- | --- |
| [scheduler](https://github.com/facebook/react) | 0.28.0 | MIT | Meta Platforms, Inc. and affiliates |
| @radix-ui/* | various | MIT | 2022 WorkOS |
| [@floating-ui](https://github.com/floating-ui/floating-ui) core, dom, react-dom, utils | 1.8.0, 1.8.0, 2.1.9, 0.2.12 | MIT | 2021-present Floating UI contributors |
| [aria-hidden](https://github.com/theKashey/aria-hidden) | 1.2.6 | MIT | 2017 Anton Korzunov |
| [react-remove-scroll](https://github.com/theKashey/react-remove-scroll), react-remove-scroll-bar | 2.7.2, 2.3.8 | MIT | Anton Korzunov |
| [react-style-singleton](https://github.com/theKashey/react-style-singleton), use-callback-ref, use-sidecar | 2.2.3, 1.3.3, 1.1.3 | MIT | 2017 Anton Korzunov |
| [get-nonce](https://github.com/theKashey/get-nonce) | 1.0.1 | MIT | 2020 Anton Korzunov |
| [clsx](https://github.com/lukeed/clsx) | 2.1.1 | MIT | Luke Edwards |
| [tslib](https://github.com/microsoft/tslib) | 2.9.1 | 0BSD | Microsoft Corporation |

The build also adds some of its own code to the JavaScript:

| Package | Version | Licence | Copyright |
| --- | --- | --- | --- |
| [vite](https://github.com/vitejs/vite) (module preload polyfill) | 8.3.8 | MIT | 2019-present VoidZero Inc. and Vite contributors |
| [rolldown](https://github.com/rolldown/rolldown), the bundler Vite uses (module helper functions) | 1.2.19 | MIT | 2024-present VoidZero Inc. & Contributors. For the code it is derived from, its licence files also credit [Rollup contributors](https://github.com/rollup/rollup/graphs/contributors) (2017) and Evan Wallace (2020) |

## shadcn/ui

The components in `src/components/ui` were generated with [shadcn/ui](https://ui.shadcn.com) and then edited. shadcn/ui is MIT licensed:

> Copyright (c) 2023 shadcn
>
> Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Build and development tools

These are used to build and test the site and are not shipped to the browser, apart from the Vite and Rolldown code listed above.

- Apache-2.0: TypeScript.
- MIT: Vite, Vitest, `@vitejs/plugin-react`, `@tailwindcss/vite`, Testing Library, jsdom, oxlint, Prettier, lint-staged, commitlint, husky, the shadcn CLI and the `@types/*` packages.

## Full licence texts

Most packages include their complete licence text in their own folder under `node_modules` after `pnpm install`. The standard texts are at <https://spdx.org/licenses/> (MIT, ISC, Apache-2.0, 0BSD, OFL-1.1). The Geist fonts are under the SIL Open Font License 1.1: <https://openfontlicense.org>.
