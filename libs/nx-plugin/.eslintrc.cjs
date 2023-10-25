/** @type {import('@types/eslint').Linter.BaseConfig} */
module.exports = {
  extends: ['../../.eslintrc.json', 'prettier'],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.json'],
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      rules: {},
    },
    {
      files: ['./package.json', './generators.json'],
      parser: 'jsonc-eslint-parser',
      rules: {
        '@nx/nx-plugin-checks': 'error',
      },
    },
  ],
  ignorePatterns: ['!**/*', 'node_modules', 'out-tsc'],
}
