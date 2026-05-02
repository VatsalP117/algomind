import next from 'eslint-config-next'
import prettier from 'eslint-config-prettier'
import simpleImportSort from 'eslint-plugin-simple-import-sort'

const config = [
    ...next,
    prettier,
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
                        ['^react', '^@?\\w'],
                        ['^(@|components)(/.*|$)'],
                        ['^\\u0000'],
                        ['^\\.\\.(?!/?$)', '^\\.\\./?$'],
                        ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'],
                        ['^.+\\.?(css)$'],
                    ],
                },
            ],
        },
    },
]

export default config
