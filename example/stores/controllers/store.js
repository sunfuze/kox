/**
 * Created by sunfuze on 10/14/16.
 */
'use strict'
const { find, findIndex } = require('lodash')

const storeController = module.exports = {}
// set controller name
storeController.name = 'store'

const stores = [
  {
    id: 1,
    name: 'pet store'
  },
  {
    id: 2,
    name: 'vegetable store'
  }
]

storeController.init = function () {
  this.mixin({
    detail (ctx) {
      const id = ctx.params.id
      const store = find(stores, {id})
      if (!store) {
        this.throw(404)
      }
      ctx.store = store
    }
  })

  this.before('detail', {except: 'list'})
}

storeController.actions = {
  list (ctx) {
    return stores
  },
  info (ctx) {
    return ctx.store
  },
  update (ctx) {
    Object.assign(ctx.store, this.body)
    return ctx.store
  },
  destroy (ctx) {
    let index = findIndex(stores, {id: ctx.params.id})
    stores.splice(index, 1)
    return ctx.store
  }
}
