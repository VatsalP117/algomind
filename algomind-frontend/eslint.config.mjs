import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'
import simpleImportSort from 'eslint-plugin-simple-import-sort'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
    baseDirectory: __dirname,
})

const eslintConfig = [
    // 1. Extend Next.js core vitals and Prettier
    ...compat.extends('next/core-web-vitals', 'prettier'),

    // 2. Define custom rules
    {
        plugins: {
            'simple-import-sort': simpleImportSort,
        },
        rules: {
            'simple-import-sort/exports': 'error',
            'simple-import-sort/imports': [
                'error',
                {
                    groups: [
                        // Packages `react` related packages come first.
                        ['^react', '^@?\\w'],
                        // Internal packages.
                        ['^(@|components)(/.*|$)'],
                        // Side effect imports.
                        ['^\\u0000'],
                        // Parent imports. Put `..` last.
                        ['^\\.\\.(?!/?$)', '^\\.\\./?$'],
                        // Other relative imports. Put same-folder imports and `.` last.
                        ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'],
                        // Style imports.
                        ['^.+\\.?(css)$'],
                    ],
                },
            ],
        },
    },
]

export default eslintConfig
