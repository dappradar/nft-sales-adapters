module.exports = {
    parser: "@typescript-eslint/parser",
    env: {
        es6: true,
        browser: true,
        node: true,
        jest: true,
    },
    extends: [
        "prettier",
        "plugin:@typescript-eslint/eslint-recommended",
        "plugin:@typescript-eslint/recommended"
    ],
    plugins: ["@typescript-eslint", "prettier"],
    rules: {
        "no-unused-vars": [
            "warn",
            {argsIgnorePattern: "^_", varsIgnorePattern: "^_"},
        ],
        "no-prototype-builtins": "off",
        "no-useless-escape": "warn",
        "prettier/prettier": "error",
        "no-console": "off",
        "no-var": "warn",
        "prefer-const": "warn",
        "no-constant-condition": "off",
        "no-inner-declarations": "off",
        "no-dupe-class-members": "off",
        "require-atomic-updates": "off", // until https://github.com/eslint/eslint/issues/11899
        "no-throw-literal": "error",
        "no-mixed-spaces-and-tabs": ["warn", "smart-tabs"],

        //"prettier/prettier": "warn",
        "no-restricted-imports": ["error"],
    },
};
