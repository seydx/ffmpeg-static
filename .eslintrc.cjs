/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution');

module.exports = {
  root: true,
  env: {
    node: true,
    es2021: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    //'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin', 'prettier'],
  ignorePatterns: [
    'updates.config.*',
    'dist',
    'node_modules',
    'binary',
    'scripts',
    '.eslintrc.*',
    'webpack.config.*',
    'test.*',
    'empty.*',
    'pwa-assets.config.*',
    'vite.config.*',
    'dev-dist',
    'public',
    '*.js',
    '*.d.ts',
  ],
  rules: {
    '@typescript-eslint/consistent-type-imports': 'error',
    '@typescript-eslint/await-thenable': 'error',
    semi: [1, 'always'],
    quotes: ['error', 'single'],
    'comma-dangle': ['error', 'only-multiline'],
    'no-multiple-empty-lines': ['warn', { max: 1, maxEOF: 0 }],
    'eol-last': ['error', 'always'],
    'space-before-function-paren': ['error', { named: 'never' }],
    'vue/multi-word-component-names': 'off',
    'vue/first-attribute-linebreak': 'off',
    'vue/require-default-prop': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    'prettier/prettier': 'error',
    'no-unused-vars': 'off',
    'no-case-declarations': 'off',
    'no-async-promise-executor': 'off',
    'no-control-regex': 'off',
    '@typescript-eslint/no-unused-vars': ['error'],
  },
};
