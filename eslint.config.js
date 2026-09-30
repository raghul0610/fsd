import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

const browserGlobals = {
  window: 'readonly', document: 'readonly', navigator: 'readonly', location: 'readonly',
  console: 'readonly', fetch: 'readonly', crypto: 'readonly', caches: 'readonly', self: 'readonly',
  URL: 'readonly', AbortController: 'readonly',
  addEventListener: 'readonly', removeEventListener: 'readonly', setTimeout: 'readonly', clearTimeout: 'readonly',
};

const nodeGlobals = {
  process: 'readonly',
};

export default [
  { ignores: ['**/dist/**', '**/coverage/**', '**/node_modules/**'] },
  js.configs.recommended,
  {
    files: ['apps/web/**/*.js', 'apps/web/**/*.jsx'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: browserGlobals,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': 'warn',
      'no-unused-vars': ['warn', { args: 'none' }],
    },
  },
  {
    files: ['apps/web/playwright.config.js', 'apps/web/e2e/**/*.js'],
    languageOptions: { globals: { ...browserGlobals, ...nodeGlobals } },
  },
  {
    files: ['**/*.test.js', '**/*.test.jsx'],
    languageOptions: {
      globals: {
        describe: 'readonly', it: 'readonly', test: 'readonly', expect: 'readonly',
        vi: 'readonly', beforeEach: 'readonly', afterEach: 'readonly',
      },
    },
  },
  {
    files: ['apps/api/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...nodeGlobals, console: 'readonly', setTimeout: 'readonly', clearTimeout: 'readonly' },
    },
    rules: { 'no-unused-vars': ['warn', { args: 'none' }] },
  },
];
