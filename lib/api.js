/**
 * Created by sunfuze on 10/12/16.
 */
'use strict'
const assert = require('assert')
const Router = require('koa-router')
const Hoek = require('hoek')
const { omit, flatten, values, forEach } = require('lodash')
const path = require('path')
const Utilities = require('./utilities')
const Defaults = require('./swagger/defaults')
const swagger = require('./swagger')

const HTTP_METHODS = ['get', 'post', 'put', 'delete', 'patch', 'head']

module.exports = function (app) {
  // add load apis function to app
  app.loadApis = function (apiCfs, settings = {}) {
    assert(app._controllers, 'app must load controllers before load apis')

    settings = Hoek.applyToDefaults(Defaults, settings, true)

    if (settings.basePath !== '/') {
      settings.basePath = Utilities.removeTrailingSlash(settings.basePath)
    }

    const apis = flatten(values(omit(apiCfs, 'options')))
    const router = new Router({ prefix: settings.basePath })

    // add swagger route
    swagger.route(router, apis, settings)
    // add api route
    forEach(apis, api => {
      validateAPI(api)
      route(app, router, api)
    })
    if (settings.swaggerUI) {
      assert(settings.documentationPath && settings.swaggerUIPath,
        'if you want swagger UI, you cant set documentationPage and swaggerUIPath to null, undefined or ""')

      const PUBLIC_DIR = path.resolve(__dirname, '..', 'public')
      app.use(require('koa-static')(PUBLIC_DIR))
    }
    app.use(router.routes())
  }
}

function route (app, router, api) {
  let action
  if (typeof api.handler === 'string') {
    const [ctrl, actionName] = api.handler.split('.')
    assert(app._controllers[ctrl], `app don't have controller named: ${ctrl}`)
    const controller = app._controllers[ctrl]
    action = controller.invoke(actionName)
  } else {
    action = function* (next) {
      this.body = Utilities.isGenerator(api.handler) ? yield api.handler(this) : api.handler(this)
      yield* next
    }
  }

  router[api.method](formatPath(api.path), function* (next) {
    // validate request
    if (api.validate) {
      [
        'payload', 'headers', 'params', 'query'
      ].forEach(p => {
        if (api.validate[p]) {
          const joi = Utilities.toJoiObject(api.validate[p])
          let payload
          if (p === 'payload') {
            payload = this.request.body
          } else {
            payload = this[p]
          }

          const validation = joi.validate(Array.isArray(payload) ? payload : omit(payload, '0'))
          // if got error, throw it and handle by global error handler
          if (validation.error) {
            this.throw({ code: 4001, error: validation.error })
          }

          Object.assign(payload, validation.value)
        }
      })
    }
    yield action.call(this, next)
    // validate response body
    if (Hoek.reach(api, 'responses')) {
      const code = this.status || 200
      const response = Hoek.reach(api, `responses.${code}`)
      if (response) {
        const joi = Utilities.toJoiObject(response.schema)
        const validation = joi.validate(this.body)
        // if got error, throw
        if (validation.error) {
          this.throw({ code: 5001, error: validation.error })
        }
      }
    }
  })
}

function validateAPI (api) {
  assert(typeof api === 'object', 'api must be object')
  assert(typeof api.path === 'string', 'api must have a string path')
  assert(validateHttpMethod(api.method), `${api.method} is not in (${HTTP_METHODS.join(', ')})`)
  if (typeof api.handler === 'string') {
    assert(api.handler.indexOf('.') !== -1, 'api must have a handler like <controller>.<action>')
  } else {
    assert(Utilities.isFunction(api.handler), 'api handler must be function')
  }
}

function validateHttpMethod (method) {
  return typeof method === 'string' && HTTP_METHODS.indexOf(method.toLowerCase()) !== -1
}

function formatPath (str) {
  return str.split('').reduce((ret, c) => {
    if (c === '{') {
      ret.push(':')
    } else if (c !== '}') {
      ret.push(c)
    }
    return ret
  }, []).join('')
}
