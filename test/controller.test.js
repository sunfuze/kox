/**
 * Created by sunfuze on 10/14/16.
 */
'use strict'
const { find } = require('lodash')

const Utilities = require('../lib/utilities')
const controller = require('../lib/controller')
const Controller = controller.Controller

describe('Controller', function () {
  describe('Class', function () {
    describe('#constructor', function () {
      it('should be ok with name', function () {
        const name = 'this is an controller'
        const ctrl = new Controller(name)
        expect(ctrl.name).to.be.equal(name)
        expect(ctrl.actions).to.be.an('object')
      })

      it('should raise an error without name', function () {
        function instance () {
          return new Controller()
        }
        expect(instance).to.throw('AssertionError: Controller must have a name')
      })
    })

    describe('#mixin', function () {
      it('should add actions to controller', function () {
        const mixins = {
          foo (context) {},
          bar (context) {}
        }

        const ctrl = new Controller('test mixin')
        ctrl.mixin(mixins)
        expect(ctrl.actions).to.have.property('foo')
        expect(ctrl.actions).to.have.property('bar')
      })
    })

    describe('#action', function () {
      it('should add action to controller', function () {
        const ctrl = new Controller('test action')
        ctrl.action('action', function (context) {})
        expect(ctrl.actions).to.have.property('action')
      })

      it('should raise an error, if actions have same name', function () {
        const ctrl = new Controller('test controller')
        ctrl.action('action1', context => {})
        expect(() => { ctrl.action('action1', ctx => {}) }).to.throw(`AssertionError: duplicate action [action1] in controller ${ctrl.name}`)
      })

      it('should raise an error, if action dont have a name', function () {
        const ctrl = new Controller('test controller')
        expect(() => { ctrl.action((ctx) => {}) }).to.throw(`AssertionError: action must have a name`)
      })

      it('should raise an error, if action dont have a handler or handler is not a function', function () {
        const ctrl = new Controller('test controller')
        expect(() => { ctrl.action('action') }).to.throw(`AssertionError: action handle must be a function`)
        expect(() => { ctrl.action('action', {foo: 'bar'}) }).to.throw(`AssertionError: action handle must be a function`)
      })
    })

    describe('#hook', function () {
      it('add hook should ok', function () {
        const ctrl = new Controller('test hook')
        const mixins = {
          foo (ctx) {
            ctx.foo = 'bar'
          },
          bar (ctx) {
            ctx.bar = 'foo'
          }
        }
        ctrl.mixin(mixins)
        ctrl.after('foo')
        ctrl.before('bar')

        expect(ctrl._afterHooks).to.be.instanceof(Array)
        expect(find(ctrl._afterHooks, {name: 'foo'})).to.have.property('name', 'foo')
        expect(find(ctrl._afterHooks, {name: 'foo'})).to.have.property('except')
        expect(find(ctrl._afterHooks, {name: 'foo'})).to.have.property('only')
        expect(ctrl._beforeHooks).to.be.instanceOf(Array)
        expect(find(ctrl._beforeHooks, {name: 'bar'})).to.have.property('name', 'bar')
        expect(find(ctrl._beforeHooks, {name: 'bar'})).to.have.property('except')
        expect(find(ctrl._beforeHooks, {name: 'bar'})).to.have.property('only')
      })

      it('same name hook will combine', function () {
        const ctrl = new Controller('test hook')
        const mixins = {
          foo (ctx) {
            ctx.foo = 'bar'
          },
          bar (ctx) {
            ctx.bar = 'foo'
          }
        }
        ctrl.mixin(mixins)
        ctrl.before('foo')
        const hook = find(ctrl._beforeHooks, {name: 'foo'})
        expect(hook).to.have.property('except')
        expect(hook.except.length).to.be.equal(0)
        ctrl.before('foo', {except: 'foo bar'})
        expect(hook.except.length).to.be.equal(2)
        ctrl.before('foo', {only: 'bar foo'})
        expect(hook.only.length).to.be.equal(2)
      })
    })

    describe('#invoke', function () {
      it('should get an generator', function* () {
        const ctrl = new Controller('test invoke')
        ctrl.action('foo', function* (ctx) {
          return {foo: 'bar'}
        })
        const action = ctrl.invoke('foo')
        expect(Utilities.isGenerator(action)).to.be.true
        const context = {}
        yield action.call(context)
        expect(context.body).to.have.property('foo', 'bar')
      })

      it('should combine mixin and raw action', function* () {
        const ctrl = new Controller('test invoke')
        ctrl.action('action', function (ctx) {
          return {foo: 'bar'}
        })
        ctrl.mixin({
          bar: function (ctx) {
            ctx.headers.bar = 'foo'
          },
          foo: function (ctx) {
            ctx.headers.foo = 'bar'
          }
        })
        ctrl.before('bar', {only: 'action'})
        ctrl.after('foo', {only: 'action'})
        const action = ctrl.invoke('action')
        const context = {
          headers: {}
        }
        yield action.call(context)
        expect(context.body).to.have.property('foo', 'bar')
        expect(context.headers).to.have.property('bar', 'foo')
        expect(context.headers).to.have.property('foo', 'bar')
      })
    })
  })
})
