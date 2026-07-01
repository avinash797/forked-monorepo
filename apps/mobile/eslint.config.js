// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierRecommended = require('eslint-plugin-prettier/recommended');

module.exports = defineConfig([
    expoConfig,
    // Registers eslint-plugin-prettier + eslint-config-prettier and enables
    // the prettier/prettier rule.
    prettierRecommended,
    {
        ignores: ['dist/*', 'supabase/*'],
    },
]);
