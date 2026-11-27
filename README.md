# PH Tax Calculator

Philippine income tax and take-home pay estimates, worked out in your browser. Nothing you type is sent anywhere.

**Live:** [ph-tax-calculator.rodzainna.com](https://ph-tax-calculator.rodzainna.com)

A portfolio project. Results are estimates for planning, not tax advice.

## What works now

- **Monthly**: take-home pay from a monthly salary (employees) or monthly income (self-employed), shown as a payslip with your tax bracket. The payslip has Monthly and Annual views, and a Cutoff view for employees.
- **Annual**: the year's income tax across several employers and/or business income, with the 13th-month ceiling, de minimis benefits, tax withheld and credits, ending in what is left to pay.
- **Taxpayer types**: employee and self-employed on both pages, and mixed income on Annual. For business income you choose the 8% option or graduated rates. Graduated rates use the 40% standard deduction, and Annual also takes itemized expenses. On Monthly, self-employed contributions start off, and only the ones you add are taken off.
- **Calculator**: opens from the header. It works out × and ÷ before + and −, shows the line as you build it, and takes keyboard input and pasted amounts. Move it by its title bar and resize it from its corner, by dragging or with the arrow keys. It can be hidden to a tab on the side, and its place is not saved after a reload.
- **About & sources**: where each rule comes from, how far it is confirmed, and what is assumed.
- **Privacy and Terms**: linked from the footer.

De minimis benefits (non-taxable allowances on Monthly) are treated as fully tax-free. The app does not check them against the legal limits, so the tax shown could be too low.

## Run it

```sh
pnpm install
pnpm dev        # http://localhost:5173
pnpm test       # vitest
pnpm lint       # oxlint
pnpm format     # prettier, on src/
pnpm build      # type-check, then a production build in dist/
```

Node version is in `.nvmrc`. Commit messages follow Conventional Commits; git hooks check them and format staged files.

## Checks

GitHub Actions runs on every push and every pull request: the format check, lint, tests, and a build that also checks the types (`.github/workflows/ci.yml`).

Changes reach `main` only through a pull request whose `Checks (pull_request)` run has passed on top of the latest `main`.

## Stack

React 19, Vite, TypeScript, Tailwind CSS 4, shadcn/ui (Radix), react-router. Tests with Vitest.

## How it is organised

| Folder | What lives there |
| --- | --- |
| `src/engine` | The tax maths as pure TypeScript functions with no UI: graduated tax, 8% option, 40% deduction, contributions, 13th month, monthly and annual results, with tests. |
| `src/engine/rules` | The rules as data (brackets, rates, ceilings by year), each with a source and a `verified` flag. |
| `src/lib` | Form state, formatting, the payslip periods, the bracket bar, the calculator's state machine, page titles, and analytics consent. |
| `src/config.ts` | The site name, owner, contact link and host shown on the Privacy and Terms pages, and whether the site has analytics. |
| `public` | The icons, the share image, `robots.txt`, `sitemap.xml` and `llms.txt`. |
| `src/components`, `src/pages` | The UI. Shared building blocks (cards, money rows, inputs, tips) are in `components/shared`. |

Each rule in `src/engine/rules` names its source. For 2026, the SSS figures from 2025 and the Pag-IBIG figures from February 2024 are assumed to still apply: no official source that restates them for 2026 was found.

## Privacy

- The figures you enter are not saved or sent anywhere. Reloading or closing the page clears them.
- In your browser's local storage the app keeps your light or dark choice, once you use the header button, and, if it has analytics, your answer to the analytics question.
- It has no analytics unless it is built with a Google tag ID in `VITE_GTM_ID` (see `.env.example`). With one, Google Analytics loads, and sets cookies for the site's own address, only after a visitor accepts. The answer can be changed from the footer and applies to every open tab. The site also tells it that a calculator gave an estimate (`monthly_estimate`, `annual_estimate`), with no figures.
- The Google tag's own settings are not in this repository. The Privacy Policy assumes that automatic detection of user-provided data stays off there.
- Fonts and images are served from the site itself.

## Deploying

Static site, hosted on Vercel, which builds a preview for each pull request and the live site from `main`. `VITE_GTM_ID` is set there for production only, so previews and local runs are not counted.

`pnpm build` writes the site to `dist/`, with one HTML file per page so that each has its own title and description in link previews (`src/lib/pageMeta.ts`). `vercel.json` sends other paths to `index.html`, so the app can show its own page for them. The Google Search Console verification tag is in `index.html`.

To host it on Netlify instead, `netlify.toml` and `public/_redirects` do the same there; the host named in the Privacy Policy is set in `src/config.ts`.

## Licence

The source is public so you can read it, and is licensed under the [PolyForm Strict License 1.0.0](LICENSE). In plain words: you may look at it and run it for personal, non-commercial purposes, but you may not copy it into another site or project, redistribute it, or make changes or new works based on it. The dependencies keep their own open-source licences, listed in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
