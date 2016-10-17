module.exports = {
  root: true,
  extends: 'standard',
  rules: {
    'arrow-parens': 0,
    'generator-star-spacing': 0,
    'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 0,
    'no-unused-vars': 1,
    'no-throw-literal': 0,
    'no-trailing-spaces': 0,
    'yield-star-spacing': ['error', 'after']
  },
  env: {
    node: true,
    mocha: true
  },
  globals: {
    chai: true,
    expect: true,
    assert: true,
    Assertion: true,
    AssertionError: true
  }
}
