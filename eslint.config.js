import globals from 'globals';

export default [
    {
        files: ['public/js/**/*.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                ...globals.browser,
                Chart: 'readonly',
                CSS: 'readonly',
            },
        },
        rules: {
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
            'no-undef': 'error',
            'no-constant-condition': 'warn',
            'no-debugger': 'error',
            'no-duplicate-imports': 'error',
            'no-template-curly-in-string': 'warn',
            'eqeqeq': ['warn', 'smart'],
            'no-var': 'error',
            'prefer-const': ['warn', { destructuring: 'all' }],
        },
    },
    {
        files: ['public/sw.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'script',
            globals: {
                ...globals.serviceworker,
            },
        },
        rules: {
            'no-undef': 'error',
            'no-debugger': 'error',
            'no-var': 'error',
        },
    },
];
