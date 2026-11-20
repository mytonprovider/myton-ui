import eslint from "@eslint/js"
import reactHooks from "eslint-plugin-react-hooks"
import globals from "globals"
import tseslint from "typescript-eslint"

export default tseslint.config(
  { ignores: ["dist"] },
  {
    files: ["src/**/*.{ts,tsx}"],
    extends: [eslint.configs.recommended, ...tseslint.configs.recommendedTypeChecked],
    plugins: {
      "react-hooks": reactHooks,
    },
    languageOptions: {
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: { ...globals.browser },
    },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",
    },
  },
  {
    // domain and locale are imported without React (tests) and must not reach the browser
    files: ["src/domain/**/*.ts", "src/locale/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "react",
                "react/*",
                "react-dom",
                "react-dom/*",
                "../components",
                "../components/*",
                "../hooks",
                "../hooks/*",
                "../lib",
                "../lib/*",
              ],
              message: "domain and locale stay free of React and of the ui layer",
            },
          ],
        },
      ],
      "no-restricted-globals": ["error", "window", "document", "navigator", "localStorage"],
    },
  },
)
