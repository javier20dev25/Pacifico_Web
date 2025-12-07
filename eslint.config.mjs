// eslint.config.js
import globals from "globals";
import js from "@eslint/js";
import prettierConfig from "eslint-config-prettier";

export default [
  js.configs.recommended,
  prettierConfig, // Integración con Prettier
  {
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.commonjs,
        ...globals.browser,
      },
    },
    rules: {
        "no-unused-vars": ["error", { "caughtErrorsIgnorePattern": "^_" }],
        "no-useless-escape": "off",
    },
    ignores: [
        "node_modules/", 
        "dist/", 
        "build/", 
        // "react-editor/", // Habilitado para linting
        "react-editor.bak/", 
        "backups/", 
        "db/", 
        "payload_big.json", 
        "payload_small.json",
        "esquema_final.sql",
        "zustand-repro/"
    ],
  },
  {
    files: ["**/*.test.js"],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
  }
];
