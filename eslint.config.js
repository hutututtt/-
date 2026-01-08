import tsParser from '@typescript-eslint/parser';
import tseslint from '@typescript-eslint/eslint-plugin';
import boundaries from 'eslint-plugin-boundaries';

export default [
  {
    files: ['**/*.ts'],
    ignores: ['dist/**', 'node_modules/**'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        sourceType: 'module',
        project: './tsconfig.json'
      }
    },
    plugins: {
      '@typescript-eslint': tseslint,
      boundaries
    },
    settings: {
      'boundaries/elements': [
        { type: 'ai', pattern: 'src/ai/**' },
        { type: 'exchange', pattern: 'src/exchange/**' },
        { type: 'execution', pattern: 'src/execution/**' },
        { type: 'risk', pattern: 'src/risk/**' },
        { type: 'loops', pattern: 'src/loops/**' }
      ]
    },
    rules: {
      'boundaries/element-types': [
        'error',
        {
          default: 'allow',
          rules: [{ from: 'ai', disallow: ['exchange', 'execution'] }]
        }
      ]
    }
  }
];
