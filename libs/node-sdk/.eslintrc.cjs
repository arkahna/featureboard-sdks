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
      rules: {
        '@typescript-eslint/no-unsafe-return': 'off',
        '@typescript-eslint/no-unsafe-argument': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
      },
    },
  ],
  ignorePatterns: [
    '!**/*',
    'node_modules',
    'tsc-out',
    'test-setup.ts',
    'vitest.config.ts',
  ],
}
