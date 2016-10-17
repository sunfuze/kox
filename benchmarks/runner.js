/**
 * Created by sunfuze on 10/17/16.
 */
'use strict'
const kox = require('../index')

const app = kox()

const controller = {name: 'benchmark'}
controller.actions = {
  action (ctx) {
    return new Buffer('Hello World')
  }
}

let n = parseInt(process.env.MW || '1', 10)
console.log('  %s hooks', n)
const methods = ['get', 'post', 'put', 'delete']
const apis = methods.map(method => {
  return {method, path: '/', handler: 'benchmark.action'}
})

controller.init = function () {
  const mixins = {}
  while (n--) {
    mixins[`hook-${n}`] = function (ctx) {}
  }
  this.mixin(mixins)
  for (let mixin in mixins) {
    this.before(mixin)
  }
}

app.loadCtrls([controller])
app.loadApis(apis)

app.listen(3838)
