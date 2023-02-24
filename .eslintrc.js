module.exports = {
  root: true,
  env: { node: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/typescript',
    'plugin:import/recommended',
  ],
  plugins: [
    '@typescript-eslint',
    'import',
    'simple-import-sort',
  ],
  parser: '@typescript-eslint/parser',
  rules: {
    'simple-import-sort/imports': 'error',
    'simple-import-sort/exports': 'error',
    semi: ['error', 'always'],
    quotes: ['error', 'single'],
    'no-trailing-spaces': 'error',
  }
};
