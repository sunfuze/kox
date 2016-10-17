'use strict'
const Utilities = require('../utilities')

/**
 * sort routes by path then method
 *
 * @param  {String} sortType
 * @param  {Array} routes
 * @return {Array}
 */
module.exports.paths = function (sortType, routes) {
  if (sortType === 'path-method') {
    routes.sort(
      Utilities.firstBy('path').thenBy('method')
    )
  }
  return routes
}
