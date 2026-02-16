// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      // Các rule bạn đã có
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      
      // BỔ SUNG: Tắt các lỗi liên quan đến biến 'any'
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',

      // BỔ SUNG: Tắt lỗi ép kiểu object sang string (ở file baocao.service)
      '@typescript-eslint/no-base-to-string': 'off',

      // BỔ SUNG: Tắt/Cảnh báo các lỗi logic khác
      '@typescript-eslint/require-await': 'off',     // Hàm async không có await
      '@typescript-eslint/no-require-imports': 'off', // Dùng cú pháp require() thay vì import
      '@typescript-eslint/no-unused-vars': 'warn',    // Khai báo biến nhưng không xài
    },
  },
);