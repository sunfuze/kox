/**
 * Created by sunfuze on 16/11/2016.
 */
'use strict'
const Promise = require('bluebird')
const assert = require('assert')
const SwaggerClient = require('swagger-client')
const hoek = require('hoek')

class Client {
  constructor (url) {
    this._url = url
    this._ready = false
    new SwaggerClient({
      url: this._url,
      usePromise: true
    }).then(client => {
      this._client = client
      this._ready = true
    }).catch(e => {
      console.error('Failed to init swagger client. \nError:', e)
      process.exit(1)
    })
  }

  isReady () {
    return this._ready
  }

  * invoke (method, args) {
    while (true) {
      let isReady = this.isReady()
      if (isReady) {
        break
      }
      yield Promise.delay(200)
    }
    const action = hoek.reach(this._client, method)
    assert(!!action, `${method} is not implemented`)
    return yield action.call(this._client, args)
  }
}

module.exports = function (url) {
  return new Client(url)
}
