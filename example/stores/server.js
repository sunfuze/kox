/**
 * Created by sunfuze on 10/14/16.
 */
'use strict'
const requireDir = require('require-dir')

const controllers = requireDir('./controllers')
const apis = requireDir('./apis')
const deps = requireDir('./deps')
const app = require('../../index')()

const swaggerSetting = {
  info: {
    title: 'Store api document',
    version: '0.1.0'
  },
  validateResponse: false
}
app.swagger = swaggerSetting

app.loadServer()

// app.loadDeps(deps)
// app.loadCtrls(controllers)
// app.loadApis(apis, swaggerSetting)

module.exports = app
