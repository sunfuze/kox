/**
 * Created by sunfuze on 10/14/16.
 */
'use strict'
const Joi = require('joi')

const StoreSchema = Joi.object({
  id: Joi.number().integer().required().description('商店id'),
  name: Joi.string().required().description('商店名称')
}).label('Store')

const ListStoreScheme = Joi.array().items(StoreSchema).label('StoreList')

module.exports = [
  {
    path: '/store',
    method: 'get',
    handler: 'store.list',
    id: 'find',
    summary: '商店列表',
    description: '获取所有商店信息',
    tags: ['store'],
    responses: {
      200: {
        description: '成功返回',
        schema: ListStoreScheme
      }
    }
  }, {
    path: '/store/{id}',
    method: 'get',
    handler: 'store.info',
    id: 'findById',
    summary: '获取商店详情',
    description: '获取单个商店详情',
    tags: ['store'],
    validate: {
      params: {
        id: Joi.number().integer().required().description('商店id')
      }
    },
    responses: {
      200: {
        description: '成功返回',
        schema: StoreSchema
      }
    }
  }, {
    path: '/store/{id}',
    method: 'put',
    handler: 'store.update',
    id: 'update',
    summary: '修改商店信息',
    tags: ['store'],
    validate: {
      params: {
        id: Joi.number().integer().required().description('商店id')
      },
      payload: {
        name: Joi.string().required().description('商店名称')
      }
    },
    responses: {
      200: {
        description: '成功返回',
        schema: StoreSchema
      }
    }
  }, {
    path: '/store/{id}',
    method: 'delete',
    handler: 'store.destroy',
    id: 'destroy',
    summary: '删除商店',
    tags: ['store'],
    validate: {
      params: {
        id: Joi.number().integer().required().description('商店id')
      }
    },
    responses: {
      200: {
        description: '成功返回',
        schema: StoreSchema
      }
    }
  }, {
    path: '/store/{id}/redirect',
    method: 'get',
    handler: 'store.redirect',
    id: 'redirect',
    validate: {
      params: {
        id: Joi.number().integer().required().description('商店id')
      }
    },
    responses: {
      302: {
        description: 'redirect to another host'
      }
    }
  }
]
