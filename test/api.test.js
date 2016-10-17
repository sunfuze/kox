/**
 * Created by sunfuze on 10/14/16.
 */
'use strict'
const util = require('util')
const { clone } = require('lodash')

const SWAGGER_OPTIONS = {
  info: {
    title: 'Store api document',
    version: '0.1.0'
  }
}

const kox = require('../index')

const methods = ['get', 'post', 'put', 'delete']
const DEFAULT_APIS = methods.map(method => {
  return {method, path: '/api', handler: ctx => `${method} api`}
})

describe('Api', function () {
  describe('Koa Route', function () {
    it('should generate route: GET /api', function* () {
      const app = kox()

      app.loadApis(DEFAULT_APIS)

      for (let i = 0, len = methods.length; i < len; i++) {
        let method = methods[i]
        let res = yield chai.request(app.callback())[method]('/api')
        expect(res).to.have.status(200)
        expect(res).to.be.text
        expect(res.text).to.equal(`${method} api`)
      }
    })

    it('can load action from controller', function* () {
      const app = kox()
      app.controller('foo', {actions: {
        hello (ctx) {
          const method = ctx.method.toLowerCase()
          return `${method} api`
        }
      }})

      const methods = ['get', 'post', 'put', 'delete']
      const apis = DEFAULT_APIS.map(a => {
        const api = clone(a)
        api.handler = 'foo.hello'
        return api
      })
      app.loadApis(apis)
      for (let i = 0, len = methods.length; i < len; i++) {
        let method = methods[i]
        let res = yield chai.request(app.callback())[method]('/api')
        expect(res).to.have.status(200)
        expect(res).to.be.text
        expect(res.text).to.equal(`${method} api`)
      }
    })
  })

  describe('Swagger', function () {
    it('generate get swagger json route: GET /swagger.json', function* () {
      const app = kox()
      app.loadApis(DEFAULT_APIS, SWAGGER_OPTIONS)
      let res = yield chai.request(app.callback()).get('/swagger.json')
      expect(res).to.have.status(200)
      expect(res).to.be.json
      expect(res.body.info).to.deep.equal(SWAGGER_OPTIONS.info)
    })
  })
})
