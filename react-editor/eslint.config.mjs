import globals from "globals";
import js from "@eslint/js";
import tseslint from 'typescript-eslint';
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import prettierConfig from "eslint-config-prettier";

export default tseslint.config(
  // 1. Global ignores
  {
    ignores: [
      "node_modules/", 
      "dist/", 
      "build/", 
      "*.timestamp*",
      "*.cjs"
    ],
  },

  // 2. Base configs for all files
  js.configs.recommended,
  prettierConfig,

  // 3. Config for TS/TSX files (Typed Linting)
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: {
      react,
      "react-hooks": reactHooks,
      '@typescript-eslint': tseslint.plugin,
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: true, // Automatically find tsconfig.json
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      "react/react-in-jsx-scope": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }],
      "@typescript-eslint/no-explicit-any": "warn", // Use warn instead of error for now
    },
    settings: {
      react: { version: "detect" },
    },
  },

  // 4. Config for JS/MJS config files (No Typed Linting)
  {
    files: ['**/*.{js,mjs}'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    }
  }
);
