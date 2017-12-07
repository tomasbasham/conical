module.exports = {
  env: {
    mocha: true
  },
  plugins: [
    "chai-expect",
    "mocha"
  ],
  rules: {
    "mocha/no-exclusive-tests": "error"
  }
};
