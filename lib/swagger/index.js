/**
 * fork from: https://github.com/glennjones/hapi-swagger
 */
'use strict'
const assert = require('assert')
const Joi = require('joi')
const qs = require('querystring')
const Url = require('url')
const path = require('path')
const fs = require('fs')

const Builder = require('./builder')

const debug = require('debug')('kox:swagger')

// schema for plug-in properties
const schema = Joi.object({
  debug: Joi.boolean(),
  jsonPath: Joi.string(),
  documentationPath: Joi.string(),
  swaggerUIPath: Joi.string(),
  auth: Joi.alternatives().try(Joi.boolean(), Joi.string(), Joi.object()),
  pathPrefixSize: Joi.number().integer().positive(),
  payloadType: Joi.string().valid(['form', 'json']),
  documentationPage: Joi.boolean(),
  swaggerUI: Joi.boolean(),
  jsonEditor: Joi.boolean(),
  expanded: Joi.string().valid(['none', 'list', 'full']),
  lang: Joi.string().valid(['en', 'es', 'fr', 'it', 'ja', 'pl', 'pt', 'ru', 'tr', 'zh-cn']),
  sortTags: Joi.string().valid(['default', 'name']),
  sortEndpoints: Joi.string().valid(['path', 'method', 'ordered']),
  sortPaths: Joi.string().valid(['unsorted', 'path-method']),
  uiCompleteScript: Joi.string().allow(null),
  xProperties: Joi.boolean(),
  reuseModels: Joi.boolean(),
  deReference: Joi.boolean(),
  validatorUrl: Joi.string().allow(null),
  acceptToProduce: Joi.boolean(),
  connectionLabel: Joi.array().items(Joi.string()).single().allow(null),
  pathReplacements: Joi.array().items(Joi.object({
    replaceIn: Joi.string().valid(['groups', 'endpoints', 'all']),
    pattern: Joi.object().type(RegExp),
    replacement: Joi.string().allow('')
  }))
}).unknown()
/**
 * add swagger json route
 * @param router
 * @param apis
 * @param options
 */
exports.route = function (router, apis, settings) {
  debug('swagger settings:\r\n', settings)
  settings.log = (tags, data) => {
    tags.unshift('swagger')
    debug(tags, data)
  }
  settings.log(['info'], 'Started')

  function* middleware (next) {
    Joi.assert(settings, schema)

    if (this.query.tags) {
      settings.jsonPath = appendQueryString(settings.jsonPath, 'tags', this.query.tags)
    } else {
      settings.jsonPath = appendQueryString(settings.jsonPath, null, null)
    }
    this.body = yield Builder.getSwaggerJSON(settings, apis, this)
    yield next
  }

  if (settings.swaggerUI) {
    assert(settings.documentationPath && settings.swaggerUIPath,
      'if you want swagger UI, you cant set documentationPage and swaggerUIPath to null or undefined')

    const PUBLIC_DIR = path.resolve(__dirname, '../..', 'public')
    router.use(require('koa-serve')(PUBLIC_DIR))

    router.get(settings.documentationPath, (function () {
      const compiler = require('handlebars')
      const tpl = compiler.compile(fs.readFileSync(path.resolve(PUBLIC_DIR, 'swaggerui', 'index.html'), 'utf8'))
      return function* (next) {
        let jsonPath = this.query.tags
          ? appendQueryString(settings.jsonPath, 'tags', this.query.tags)
          : appendQueryString(settings.jsonPath, null, null)
        const keyPrefix = findAPIKeyPrefix(settings)
        this.body = tpl(Object.assign({jsonPath, keyPrefix}, settings))
        yield next
      }
    })())
  }

  router.get(settings.jsonPath, middleware)
}

/**
 * appends a querystring to a url path - will overwrite existings values
 *
 * @param  {String} url
 * @param  {String} qsName
 * @param  {String} qsValue
 * @return {String}
 */
const appendQueryString = function (url, qsName, qsValue) {
  let urlObj = Url.parse(url)
  if (qsName && qsValue) {
    urlObj.query = qs.parse(qsName + '=' + qsValue)
    urlObj.search = '?' + encodeURIComponent(qsName) + '=' + encodeURIComponent(qsValue)
  } else {
    urlObj.search = ''
  }
  return urlObj.format(urlObj)
}

/**
 * finds any keyPrefix in securityDefinitions - also add x- to name
 *
 * @param  {Object} settings
 * @return {String}
 */
const findAPIKeyPrefix = function (settings) {
  let out = ''
  if (settings.securityDefinitions) {
    Object.keys(settings.securityDefinitions).forEach((key) => {
      if (settings.securityDefinitions[key]['x-keyPrefix']) {
        out = settings.securityDefinitions[key]['x-keyPrefix']
      }
    })
  }
  return out
}
