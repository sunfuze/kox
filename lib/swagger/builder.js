'use strict'
const Hoek = require('hoek')
const Joi = require('joi')
const JSONDeRef = require('json-schema-ref-parser')
const Filter = require('./filter')
const Group = require('./group')
const Sort = require('./sort')
const Info = require('./info')
const Paths = require('./paths')
const Tags = require('./tags')
const Validate = require('./validate')
const Utilities = require('../utilities')

const builder = module.exports = {}
const internals = {}

/**
 * default data for swagger root object
 */
builder.default = {
  'swagger': '2.0',
  'host': 'localhost',
  'basePath': '/'
}

/**
 * schema for swagger root object
 */
builder.schema = Joi.object({
  swagger: Joi.string().valid('2.0').required(),
  info: Joi.any(),
  host: Joi.string(),  // JOI hostname validator too strict
  basePath: Joi.string().regex(/^\//),
  schemes: Joi.array().items(Joi.string().valid(['http', 'https', 'ws', 'wss'])).optional(),
  consumes: Joi.array().items(Joi.string()),
  produces: Joi.array().items(Joi.string()),
  paths: Joi.any(),
  definitions: Joi.any(),
  parameters: Joi.any(),
  responses: Joi.any(),
  securityDefinitions: Joi.any(),
  security: Joi.any(),
  tags: Joi.any(),
  externalDocs: Joi.object({
    description: Joi.string(),
    url: Joi.string().uri()
  }),
  cache: Joi.object({
    expiresIn: Joi.number(),
    expiresAt: Joi.string(),
    generateTimeout: Joi.number()
  })
})

/**
 * gets the Swagger JSON
 *
 * @param  {Object} settings
 * @param  {Object} context
 * @return {Promise}
 */
builder.getSwaggerJSON = function (settings, apis, context) {
  // remove items that cannot be changed by user
  delete settings.swagger

  // collect root information
  builder.default.host = internals.getHost(context)
  builder.default.schemes = [internals.getSchema(context)]

  settings = Hoek.applyToDefaults(builder.default, settings)
  if (settings.basePath !== '/') {
    settings.basePath = Utilities.removeTrailingSlash(settings.basePath)
  }
  let out = internals.removeNoneSchemaOptions(settings)
  Joi.assert(out, builder.schema)

  out.info = Info.build(settings)
  out.tags = Tags.build(settings)

  let routes = apis

  Sort.paths(settings.sortPaths, routes)

  // filter routes displayed based on tags passed in query string
  if (context.query.tags) {
    let filterTags = context.query.tags.split(',')
    routes = Filter.byTags(filterTags, routes)
  }

  // append group property - by path
  Group.appendGroupByPath(settings.pathPrefixSize, settings.basePath, routes, settings.pathReplacements)

  let paths = new Paths(settings)
  let pathData = paths.build(routes)
  out.paths = pathData.paths
  out.definitions = pathData.definitions
  if (Utilities.hasProperties(pathData['x-alt-definitions'])) {
    out['x-alt-definitions'] = pathData['x-alt-definitions']
  }
  out = internals.removeNoneSchemaOptions(out)

  if (settings.debug) {
    Validate.log(out, settings.log)
  }

  if (settings.deReference === true) {
    return builder.dereference(out)
  } else {
    return Promise.resolve(out)
  }
}

/**
 * dereference a schema
 *
 * @param {Object} schema
 * @param {Promise}
 */
builder.dereference = function (schema) {
  return new Promise((resolve, reject) => {
    JSONDeRef.dereference(schema, function (err, json) {
      if (err) {
        reject({ error: 'fail to dereference schema' })
      } else {
        delete json.definitions
        delete json['x-alt-definitions']
        resolve(json)
      }
    })
  })
}

/**
 * finds the current host
 *
 * @param  {Object} ctx
 * @return {String}
 */
internals.getHost = function (ctx) {
  return ctx.host
}

/**
 * finds the current schema
 *
 * @param  {Object} ctx
 * @return {String}
 */
internals.getSchema = function (ctx) {
  return ctx.protocol
}

/**
 * removes none schema properties from options
 *
 * @param  {Object} options
 * @return {Object}
 */
internals.removeNoneSchemaOptions = function (options) {
  let out = Hoek.clone(options)
  ;[
    'debug',
    'documentationPath',
    'documentationPage',
    'jsonPath',
    'auth',
    'swaggerUIPath',
    'swaggerUI',
    'pathPrefixSize',
    'payloadType',
    'expanded',
    'lang',
    'sortTags',
    'sortEndpoints',
    'sortPaths',
    'xProperties',
    'reuseModels',
    'uiCompleteScript',
    'deReference',
    'validatorUrl',
    'jsonEditor',
    'acceptToProduce',
    'connectionLabel',
    'cache',
    'pathReplacements',
    'log'
  ].forEach((element) => {
    delete out[element]
  })
  return out
}
