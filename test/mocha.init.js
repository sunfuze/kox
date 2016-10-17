global.chai = require('chai')
const chaiHttp = require('chai-http')
chai.use(chaiHttp)
chai.config.includeStack = true
global.chai = chai
global.AssertionError = chai.AssertionError
global.Assertion = chai.Assertion
global.expect = chai.expect
global.assert = chai.assert
