/** @type {import('@types/eslint').Linter.BaseConfig} */
module.exports = {
  extends: ['../../.eslintrc.json', 'plugin:@nx/react', 'prettier'],

  overrides: [
    {
      parserOptions: {
        tsconfigRootDir: __dirname,
        project: ['./tsconfig.json'],
      },
      files: ['*.ts', '*.tsx'],
      rules: {
        '@typescript-eslint/no-unsafe-return': 'off',
        '@typescript-eslint/no-unsafe-argument': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
      },
    },
  ],
  ignorePatterns: ['!**/*', 'node_modules', 'out-tsc'],
}
