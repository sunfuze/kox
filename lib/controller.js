/**
 * Created by sunfuze on 10/12/16.
 */
'use strict'
const assert = require('assert')
const compose = require('koa-compose')
const { forEach, find, concat, reduce } = require('lodash')
const Utilities = require('./utilities')

class Controller {
  constructor (name, actions = {}) {
    assert(typeof name === 'string', 'Controller must have a name')

    this._name = name
    this._actions = actions
    this._beforeHooks = []
    this._afterHooks = []
  }

  get name () {
    return this._name
  }

  get actions () {
    return this._actions
  }

  mixin (mixins) {
    forEach(mixins, (m, name) => {
      this.action(name, m)
    })
  }

  action (name, fn) {
    if (typeof name === 'function') {
      fn = name
      name = fn.name
    }
    assert(Utilities.isString(name) && name.length, 'action must have a name')
    assert(Utilities.isFunction(fn), 'action handle must be a function')
    assert(!this._actions[name], `duplicate action [${name}] in controller ${this.name}`)

    this._actions[name] = fn
  }

  invoke (name) {
    assert(this._actions[name], `Controller[${this._name}] don't have an action named: ${name}`)

    const action = this._actions[name]
    const pres = reduce(this._beforeHooks, pickHook.bind(this), [])
    const posts = reduce(this._afterHooks, pickHook.bind(this), [])

    return compose([].concat(formatHooks(pres), wrapAction(action), formatHooks(posts)))

    function wrapAction (fn) {
      return function* (next) {
        this.body = Utilities.isGenerator(fn) ? (yield fn(this)) : fn(this)
        yield* next
      }
    }

    function formatHooks (hooks) {
      return hooks.map(formatHook)
    }

    function formatHook (hook) {
      return function* (next) {
        if (Utilities.isGenerator(hook)) {
          yield hook(this)
        } else {
          hook(this)
        }
        yield* next
      }
    }

    function pickHook (hooks = [], hook) {
      const { only = [], except = [] } = hook

      if (only.length) {
        if (only.indexOf(name) !== -1) {
          hooks.push(this._actions[hook.name])
        }
      } else if (except.indexOf(name) === -1) {
        hooks.push(this._actions[hook.name])
      }
      return hooks
    }
  }

  after (name, options) {
    this._addHooks('after', name, options)
  }

  before (name, options) {
    this._addHooks('before', name, options)
  }

  _addHooks (type, name, {only = [], except = []} = {}) {
    assert(!!this._actions[name], `Hook must be action, action [${name}] is not exists`)

    const hooks = type === 'after' ? this._afterHooks : this._beforeHooks

    let hook = find(hooks, { name: name })
    if (!hook) {
      hook = { name: name, except: [], only: [] }
      hooks.push(hook)
    }
    hook.only = concat(hook.only, formatFilter(only))
    hook.except = concat(hook.except, formatFilter(except))

    function formatFilter (filter) {
      if (Utilities.isString(filter) && validateFilterStr(filter)) {
        return filter.split(' ')
      } else if (Array.isArray(filter)) {
        return filter
      } else {
        return []
      }
    }

    function validateFilterStr (filter) {
      const FILTERS_REGEXP = /([a-z_0-9]+\s?)+/i
      return FILTERS_REGEXP.test(filter)
    }
  }
}

module.exports = function (app) {
  const controllers = app._controllers = {}

  /**
   * add controller
   * @param name controller name
   * @param init init function
   * @param actions init actions
   */
  app.controller = function (name, { init = () => {}, actions = {} }) {
    assert(!controllers[name], `Duplicate controller: ${name}`)
    assert(Utilities.isFunction(init), 'Controller initializer must be function')
    const ctrl = new Controller(name, actions)
    init.call(ctrl)
    controllers[name] = ctrl
  }

  /**
   * add multiple controllers
   * @param ctrls
   */
  app.loadCtrls = function (ctrls) {
    forEach(ctrls, ({ name, init = () => {}, actions = {} }, filename) => {
      app.controller(name || filename, {init, actions})
    })
  }
}

module.exports.Controller = Controller
