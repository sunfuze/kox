/**
 * Created by sunfuze on 10/12/16.
 */
'use strict'
const { forEach } = require('lodash')
const bodyParser = require('koa-body')
const Hoek = require('hoek')
const join = require('path').resolve

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
    app.context[name] = dep
    if (isFunction(dep.middleware)) {
      app.use(dep.middleware())
    }
  })
  // set default logger
  if (!app.context.logger) {
    app.context.logger = console
  }
}

function loadMiddlewares (app, middlewares) {
  const router = require('koa-router')
  forEach(middlewares, (m) => {
    if (isFunction(m)) {
      const path = m.path || path
      router.use(path, m())
    } else if (typeof m === 'object') {
      forEach(m, fn => {
        const path = fn.path || '/'
        router.use(path, fn())
      })
    }
  })

  app.use(router.routes())
}

function isFunction (fn) {
  return !!fn && typeof fn === 'function'
}
