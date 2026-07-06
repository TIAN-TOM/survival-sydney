const js = require('@eslint/js');
const globals = require('globals');
const tseslint = require('typescript-eslint');

module.exports = [
  { ignores: ['node_modules/**', 'coverage/**', 'dist/**'] },
  js.configs.recommended,
  // Scope the TypeScript ruleset to .ts sources so this CommonJS config file stays plain JS.
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: ['**/*.ts'],
  })),
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: { ...globals.node },
    },
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['**/tests/**/*.ts'],
    languageOptions: {
      globals: { ...globals.node, ...globals.jest },
    },
  },
];
