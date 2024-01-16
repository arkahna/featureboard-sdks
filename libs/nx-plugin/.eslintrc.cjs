/** @type {import('@types/eslint').Linter.BaseConfig} */
module.exports = {
  extends: ['../../.eslintrc.json', 'prettier'],

  overrides: [
    {
      parserOptions: {
        tsconfigRootDir: __dirname,
        project: ['./tsconfig.json'],
      },
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
  ignorePatterns: ['!**/*', 'src/**/*.d.ts', 'node_modules', 'out-tsc'],
}
