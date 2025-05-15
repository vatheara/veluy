module.exports = {
  extends: ["@repo/eslint-config/base"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "./tsconfig.json",
  },
  ignorePatterns: ["node_modules/", "dist/"],
}; 