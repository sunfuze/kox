/**
 * Created by sunfuze on 10/14/16.
 */
'use strict'
const chalk = require('chalk')

const STATUS_COLORS = {
  error: 'red',
  warn: 'yellow',
  info: 'green'
}

const logger = module.exports = console
/*
 * Logger
 *
 * @param {object} winstonInstance
 */
logger.middleware = function logger () {
  return function* middleWare (next) {
    const start = new Date()
    yield* next
    const ms = new Date() - start

    let logLevel
    if (this.status >= 500) {
      logLevel = 'error'
    } else if (this.status >= 400) {
      logLevel = 'warn'
    } else if (this.status >= 100) {
      logLevel = 'info'
    }

    let msg = (chalk.gray(`${this.method} ${this.originalUrl}`) +
      chalk[STATUS_COLORS[logLevel]](` ${this.status} `) +
      chalk.gray(`${ms}ms`))

    console[logLevel](msg)
  }
}
