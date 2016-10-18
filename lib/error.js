/**
 * Created by sunfuze on 10/14/16.
 */
'use strict'
const { omit } = require('lodash')

module.exports = function (app) {
  const context = app.context

  const _onerror = context.onerror

  context.onerror = function (err = {}) {
    if (err === null) return
    if (err.code) {
      if (this.headerSent || !this.writable) {
        err.headerSent = true
        return
      }

      this.type = 'json'

      this.status = err.code >= 1000 ? err.code / 10 >> 0 : err.code

      let body = omit(err, ['name', 'stack'])
      // using i18next
      if (this.i18next && typeof this.t === 'function') {
        for (let key in body) {
          if (body.hasOwnProperty[key] && typeof body[key] === 'string') {
            body[key] = this.t(body[key])
          }
        }
      }
      body = JSON.stringify(body)
      this.length = Buffer.byteLength(body)
      return this.res.end(body)
    } else {
      _onerror.call(this, err)
    }
  }
}
