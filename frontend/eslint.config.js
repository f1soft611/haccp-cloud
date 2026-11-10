import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },

  {
    // 모드별 색은 theme.ts 토큰으로만 고르도록 컴포넌트의 palette.mode 비교를 막는다
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/app/theme.ts', 'src/test/**'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "BinaryExpression > MemberExpression[property.name='mode'][object.property.name='palette']",
          message:
            '모드별 색은 theme.ts 의 palette 토큰(surface, panel, nav, workMenu, dashboard, editor)이나 theme.applyStyles 로 처리한다.',
        },
      ],
    },
  },
])
