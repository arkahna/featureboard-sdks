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
      rules: {
        '@typescript-eslint/restrict-template-expressions': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        '@typescript-eslint/no-unsafe-argument': 'off',
      },
    },
  ],
  ignorePatterns: ['!**/*', '*.d.ts', 'node_modules', 'out-tsc'],
}
