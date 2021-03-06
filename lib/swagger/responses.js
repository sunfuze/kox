'use strict'
const HTTPStatus = require('http-status')
const Hoek = require('hoek')
const Definitions = require('./definitions')
const Properties = require('./properties')

const Utilities = require('../utilities')

const internals = {}

exports = module.exports = internals.responses = function (settings, definitionCollection, altDefinitionCollection, definitionCache) {
  this.settings = settings
  this.definitionCollection = definitionCollection
  this.altDefinitionCollection = altDefinitionCollection

  this.definitions = new Definitions(settings)
  this.properties = new Properties(settings, this.definitionCollection, this.altDefinitionCollection, definitionCache)
}

/**
 * build swagger response object
 *
 * @param  {Object} userDefinedSchemas
 * @param  {Object} defaultSchema
 * @param  {Object} statusSchemas
 * @param  {Boolean} useDefinitions
 * @param  {Boolean} isAlt
 * @return {Object}
 */
internals.responses.prototype.build = function (userDefinedSchemas, defaultSchema, statusSchemas, useDefinitions, isAlt) {
  let out = {}

  // add defaultSchema to statusSchemas if needed
  if (Utilities.hasProperties(defaultSchema) && (Hoek.reach(statusSchemas, '200') === undefined)) {
    statusSchemas[200] = defaultSchema
  }

  // loop for each status and convert schema into a definition
  if (Utilities.hasProperties(statusSchemas)) {
    for (let key in statusSchemas) {
      // name, joiObj, parameterType, useDefinitions, isAlt
      let response = this.getResponse(key, statusSchemas[key], null, useDefinitions, isAlt)
      out[key] = response
    }
  }

  // use plug-in options overrides to enhance objects and properties
  if (Utilities.hasProperties(userDefinedSchemas) === true) {
    out = this.optionOverride(out, userDefinedSchemas, useDefinitions, isAlt)
  }

  // make sure 200 status always has a schema #237
  if (out[200] && out[200].schema === undefined) {
    out[200].schema = {
      'type': 'string'
    }
  }

  // make sure there is a default if no other responses are found
  if (Utilities.hasProperties(out) === false) {
    out.default = {
      'schema': {
        'type': 'string'
      },
      'description': 'Successful'
    }
  }

  return Utilities.deleteEmptyProperties(out)
}

/**
 * replaces discovered response objects with user defined objects
 *
 * @param  {Object} discoveredSchemas
 * @param  {Object} userDefinedSchemas
 * @param  {Boolean} useDefinitions
 * @param  {Boolean} isAlt
 * @return {Object}
 */
internals.responses.prototype.optionOverride = function (discoveredSchemas, userDefinedSchemas, useDefinitions, isAlt) {
  for (let key in userDefinedSchemas) {
    // create a new object by cloning - dont modify user defined objects
    let out = Hoek.clone(userDefinedSchemas[key])

    if (Hoek.reach(userDefinedSchemas[key], 'schema') && typeof userDefinedSchemas[key].schema === 'object') {
      userDefinedSchemas[key].schema = Utilities.toJoiObject(userDefinedSchemas[key].schema)
    }

    // test for any JOI objects
    if (Hoek.reach(userDefinedSchemas[key], 'schema.isJoi') && userDefinedSchemas[key].schema.isJoi === true) {
      out = this.getResponse(key, userDefinedSchemas[key].schema, useDefinitions, isAlt)
      out.description = userDefinedSchemas[key].description
    }

    // overwrite discovery with user defined
    if (!discoveredSchemas[key] && out) {
      // if it does not exist create it
      discoveredSchemas[key] = out
    } else {
      // add description to schema
      if (out.description) {
        discoveredSchemas[key].description = out.description
      }
      // overwrite schema
      if (out.schema) {
        discoveredSchemas[key].schema = out.schema
      }
    }
    discoveredSchemas[key] = Utilities.deleteEmptyProperties(discoveredSchemas[key])
  }
  return discoveredSchemas
}

/**
 * takes a joi object and creates a response object for a given http status code
 *
 * @param  {String} statusCode
 * @param  {Object} joiObj
 * @param  {Boolean} useDefinitions
 * @param  {Boolean} isAlt
 * @return {Object}
 */
internals.responses.prototype.getResponse = function (statusCode, joiObj, useDefinitions) {
  let out
  // name, joiObj, parent, parameterType, useDefinitions, isAlt
  let outProperties = this.properties.parseProperty(null, joiObj, null, 'body', useDefinitions, false)
  out = {
    'description': Hoek.reach(joiObj, '_description'),
    'schema': outProperties
  }

  out.headers = Utilities.getJoiMetaProperty(joiObj, 'headers')
  out.examples = Utilities.getJoiMetaProperty(joiObj, 'examples')
  delete out.schema['x-meta']
  out = Utilities.deleteEmptyProperties(out)

  // default description if not given
  if (!out.description) {
    out.description = HTTPStatus[statusCode].replace('OK', 'Successful')
  }

  return out
}
