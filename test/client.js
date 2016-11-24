/**
 * Created by sunfuze on 24/11/2016.
 */
'use strict'
const http = require('http')
const app = require('../example/stores/server')

let client
const port = 38888

describe('Client', function () {
  before(function (done) {
    const server = http.createServer(app.callback())
    server.listen(port, 'localhost')
    server.on('listening', function () {
      console.log('store server is listening')
      client = require('../client')(`http://localhost:${port}/swagger.json`)
      done()
    })
  })

  describe('#invoke', function () {
    it('should invoke store find', function* () {
      const ret = yield* client.invoke('store.find')
      expect(ret.status).to.be.equal(200)
      expect(ret.obj).to.be.instanceOf(Array)
    })
  })
})
