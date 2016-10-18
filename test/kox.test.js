/**
 * Created by sunfuze on 10/18/16.
 */
'use strict'
const kox = require('../index')

const controllers = {
  hello: {
    name: 'hello',
    init () {
      this.action('world', function (ctx) {
        return 'hello world'
      })
    }
  },
  bye: {
    name: 'bye',
    init () {
      this.action('bye', function (ctx) {
        return 'bye bye'
      })
    }
  }
}

describe('KOX', function () {
  describe('#loadCtrls', function () {
    it('should add controllers to app._controllers', function () {
      const app = kox()
      app.loadCtrls(controllers)
      expect(app._controllers).to.have.property('hello')
      expect(app._controllers).to.have.property('bye')
    })
  })
  describe('#controller', function () {
    it('should add a controller to app._controllers', function () {
      const app = kox()
      app.controller('hello', controllers.hello)
      expect(app._controllers).to.have.property('hello')
    })
  })
  describe('#loadDeps', function () {
    it('should add deps to app context', function () {
      const app = kox()
      const deps = {
        logger: console
      }
      app.loadDeps(deps)
      expect(app.context).to.have.property('logger')
    })
  })
  describe('#loadApis', function () {
    it('should route apis and generate Swagger json', function* () {
      const app = kox()
      const apis = [{
        method: 'get',
        path: '/hello',
        tags: ['apis'],
        summary: 'hello world',
        handler: function (ctx) {
          return 'hello world'
        }
      }, {
        method: 'get',
        path: '/bye',
        tags: ['apis'],
        summary: 'bye bye',
        handler: function (ctx) {
          return 'bye bye'
        }
      }]
      app.loadApis(apis)
      let response = yield chai.request(app.callback()).get('/hello')
      expect(response).to.have.status(200)
      expect(response).to.be.text
      response = yield chai.request(app.callback()).get('/bye')
      expect(response).to.have.status(200)
      expect(response).to.be.text
      response = yield chai.request(app.callback()).get('/swagger.json')
      expect(response).to.have.status(200)
      expect(response).to.be.json
    })
  })
  describe('#loadMiddlewares', function* () {
    const app = kox()
    const middlewares = {
      addHeader: function () {
        return function* (next) {
          this.set('x-powered-by', 'kox')
          yield* next
        }
      }
    }
    app.use(function* (next) {
      this.body = 'hello world'
      yield* next
    })
    app.loadMiddlewares(middlewares)
    let response = chai.request(app.callback()).get('/')
    expect(response).to.have.status(200)
    expect(response).to.be.text
    expect(response).to.have.property('headers')
    expect(response.headers).to.have.property('x-powered-by')
  })
})
