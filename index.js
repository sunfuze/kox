/**
 * Created by sunfuze on 10/12/16.
 */
'use strict'
const { forEach } = require('lodash')
const bodyParser = require('koa-body')
const Hoek = require('hoek')
const join = require('path').resolve
const Utilities = require('./lib/utilities')

const controller = require('./lib/controller')
const api = require('./lib/api')
const error = require('./lib/error')

const DEFAULT_BODY_PARSER_CONFIG = {
  jsonLimit: '100KB',
  formLimit: '50KB',
  multipart: true,
  formidable: {
    uploadDir: join(process.cwd(), 'runtime')
  }
}

module.exports = function (options = {}) {
  const app = require('koa')()
  // we need body parser by default
  const bodyParserOpts = Hoek.applyToDefaults(DEFAULT_BODY_PARSER_CONFIG, options.bodyParser || {})
  if (Hoek.reach(bodyParserOpts, 'formidable.uploadDir')) {
    Utilities.ensureDir(bodyParserOpts.formidable.uploadDir)
  }
  app.use(bodyParser(bodyParserOpts))
  // app addon
  controller(app)
  api(app)
  error(app)

  app.loadDeps = loadDeps.bind(null, app)
  app.loadMiddlewares = loadMiddlewares.bind(null, app)
  return app
}

// 将依赖注入koa context
function loadDeps (app, deps) {
  forEach(deps, (dep, name) => {
    if (app.context[name]) {
      console.warn('multiple dependency:', name)
      return
    }
    app.context[name] = dep
    if (Utilities.isFunction(dep.middleware)) {
      app.use(dep.middleware())
    }
  })
  // set default logger
  if (!app.context.logger) {
    app.context.logger = console
  }
}

function loadMiddlewares (app, middlewares) {
  app._middlewares = app._middlewares || {}
  forEach(middlewares, (m) => {
    if (Utilities.isGenerator(m)) {
      useM(m)
    } else if (typeof m === 'object') {
      forEach(m, fn => {
        useM(fn)
      })
    } else {
      console.warn('middleware must be generator or object contain generators')
    }
  })
  // use middleware
  function useM (fn) {
    if (Utilities.isGenerator(fn)) {
      app.use(fn())
    } else {
      console.warn('please make sure middleware is generator function')
    }
  }
}
