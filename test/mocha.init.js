global.chai = require('chai')
chai.use(require('chai-http'))
chai.config.includeStack = true
global.chai = chai
global.AssertionError = chai.AssertionError
global.Assertion = chai.Assertion
global.expect = chai.expect
global.assert = chai.assert
global.Promise = require('bluebird')
