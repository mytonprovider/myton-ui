# 💎 MyTON UI

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-blue?logo=react&logoColor=white)](https://react.dev/)

**MyTON UI** holds what the MyTON fronts share: design tokens, base styles, components, the domain rules of the
TON Storage provider catalog and the texts they print. The package ships TypeScript and CSS sources; each front
compiles them with its own Vite build.

## Install

A front takes the package from a git tag:

```json
"dependencies": {
  "@myton/ui": "github:mytonprovider/myton-ui#v0.1.0"
}
```

React 19 is a peer dependency; `i18next` and `react-i18next` are needed only for `@myton/ui/i18n`.

## Usage

```ts
import "@myton/ui/fonts.css"
import "@myton/ui/styles.css"
import { Button, Sheet, UiProvider } from "@myton/ui"
import { fmt, providerStatus } from "@myton/ui/domain"
import { locales } from "@myton/ui/locale"
```

| Entry                         | What it holds                                                      |
|-------------------------------|--------------------------------------------------------------------|
| `@myton/ui`                   | Components, hooks and browser helpers                              |
| `@myton/ui/domain`            | Catalog parsing, status, filters, sorting and formatters, no React |
| `@myton/ui/locale`            | Russian and English texts of the shared parts                      |
| `@myton/ui/i18n`              | i18next setup with the language rule of every front                |
| `@myton/ui/styles.css`        | Tokens and base styles                                             |
| `@myton/ui/site.css`          | Page rules for the fronts that run as websites                     |
| `@myton/ui/fonts.css`         | Inter and JetBrains Mono                                           |
| `@myton/ui/tokens.css`        | Tokens alone, for a build step that reads their values             |
| `@myton/ui/text.module.css`   | Text classes to compose from                                       |
| `@myton/ui/motion.module.css` | Motion classes to compose from                                     |

## Local development

To work on the package and a front together, start the front's dev server with `UI_SRC` pointing at a checkout;
its `vite.config.ts` then aliases every package entry to that checkout's `src`:

```bash
UI_SRC=/path/to/myton-ui pnpm dev
```

Without `UI_SRC` the front uses the installed copy, as its production build does.

The package's own checks:

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
```

## License

This repository is distributed under the [Apache License 2.0](LICENSE).
