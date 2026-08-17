// ESLint flat config for OpenCode Mobile (Expo SDK 54 / React Native).
//
// Base: eslint-config-expo/flat (core + typescript + react + expo rulesets).
// Additions:
//   - scripts/*.mjs and config files run in Node, not the RN bundle → node globals
//   - ignore generated/native dirs (android/, ios/, website/, .expo, dist)
//   - '@/*' path alias (src/) resolved by import resolver

const { defineConfig } = require("eslint/config")
const expoConfig = require("eslint-config-expo/flat")

const nodeFiles = ["scripts/**/*.mjs", "*.config.js", "*.config.mjs"]

module.exports = defineConfig([
  ...expoConfig,
  {
    ignores: [
      "android/**",
      "ios/**",
      "website/**",
      "dist/**",
      "docs-site/**",
      ".expo/**",
      "node_modules/**",
      "*.d.ts",
    ],
  },
  {
    files: nodeFiles,
    languageOptions: {
      globals: {
        // Node globals for scripts + config files (expo config disables them)
        process: "readonly",
        require: "readonly",
        module: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        Buffer: "readonly",
      },
    },
  },
  // React Compiler rules flag 4 intentional patterns below that carry
  // explanatory comments (ref-in-render mirrors to fix issue #104 races;
  // the effect-synced form in the edit screen initialises from a prop).
  // Disable the compiler rules for these specific files only — every other
  // file keeps the full react-hooks compiler protection.
  {
    // `[id]` is a glob character class, so match the dynamic-route files by
    // directory instead of literal bracket pattern.
    files: [
      "app/connection/*.tsx",
      "app/session/*.tsx",
      "src/components/chat/DirectoryBrowserSheet.tsx",
    ],
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/refs": "off",
      "react-hooks/preserve-manual-memoization": "off",
    },
  },
])
