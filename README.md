# PH Tax Calculator

Philippine income tax and take-home pay estimates, worked out in your browser. Nothing you type is sent anywhere.

- **Monthly**: take-home pay from a monthly salary (employees) or monthly income (self-employed), shown as a payslip with a Monthly, Cutoff and Annual view, plus your tax bracket.
- **Annual**: the year's income tax across several employers and/or business income, with the 13th-month ceiling, de minimis benefits, tax withheld and credits, ending in what is left to pay.
- **Taxpayer types**: employee, self-employed (8% option, or graduated rates with the 40% standard deduction or itemized expenses) and mixed income.
- **Built-in calculator**: a draggable, resizable calculator with a running expression.

This is a portfolio project. Results are estimates for planning, not tax advice.

## Run it

```sh
pnpm install
pnpm dev        # http://localhost:5173
pnpm test       # vitest
pnpm lint       # oxlint
pnpm build      # type-check, then a production build in dist/
```

Node version is in `.nvmrc`.

## Stack

React 19, Vite, TypeScript, Tailwind CSS 4, shadcn/ui (Radix), react-router. Tests with Vitest.

## How it is organised

| Folder | What lives there |
| --- | --- |
| `src/engine` | The tax maths as pure TypeScript functions with no UI: graduated tax, 8% option, 40% deduction, contributions, 13th month, monthly and annual results. Each has tests. |
| `src/engine/rules` | The rules as data (brackets, rates, ceilings by year), each with a source and a `verified` flag. |
| `src/lib` | Form state, formatting, the payslip periods, the bracket bar, the calculator's state machine. |
| `src/components`, `src/pages` | The UI. Shared building blocks (cards, money rows, inputs, tips) are in `components/shared`. |

The About page lists which rules have been checked against the law or the agency's own documents, and which have not.

## Privacy

- The figures you enter stay in your browser and are not stored.
- The only thing kept is your analytics choice, in local storage. Google Tag Manager loads only after you accept (`ANALYTICS_ENABLED` in `src/config.ts`).
- Fonts and images are served from the site itself.

## Deploying

Static site. `netlify.toml` builds with `pnpm build` and publishes `dist/`; `public/_redirects` sends every path to `index.html` so the routes work on refresh.

## Licence

The source is public so you can read it, and is licensed under the [PolyForm Strict License 1.0.0](LICENSE). In plain words: you may look at it and run it for personal, non-commercial purposes, but you may not copy it into another site or project, redistribute it, or make changes or new works based on it. The dependencies keep their own open-source licences, listed in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
