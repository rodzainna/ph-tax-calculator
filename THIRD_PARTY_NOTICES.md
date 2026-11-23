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

Used to build and test the site, not shipped to the browser: Vite, Vitest, TypeScript (Apache-2.0), Tailwind CSS (MIT), tw-animate-css (MIT), oxlint (MIT), commitlint and husky (MIT), the shadcn CLI (MIT) and the `@types/*` packages (MIT).

## Full licence texts

Each package's complete licence text is in its own folder under `node_modules` after `pnpm install`, and at <https://spdx.org/licenses/> (MIT, ISC, Apache-2.0, OFL-1.1). The Geist fonts are under the SIL Open Font License 1.1: <https://openfontlicense.org>.
