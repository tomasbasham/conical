module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 2017,
    sourceType: 'module'
  },
  extends: 'eslint:recommended',
  env: {
    browser: true
  },
  rules: {
  },
  overrides: [
    // node files
    {
      files: [
        '.eslintrc.js'
      ],
      excludedFiles: [
        'src/**'
      ],
      parserOptions: {
        sourceType: 'script',
        ecmaVersion: 2015
      },
      env: {
        browser: false,
        mocha: true,
        node: true
      },
      plugins: [
        "chai-expect",
        "mocha"
      ],
      rules: {
        'mocha/no-exclusive-tests': 'error'
      }
    }
  ],
  globals: {
    'global': 'readable'
  }
};
