/**
 * Created by sunfuze on 10/17/16.
 */
'use strict'
const http = require('http')
const app = require('./stores/server')

const server = http.createServer(app.callback())

server.listen(3838)
server.on('listening', function () {
  console.log('server is listening on port 3838')
})
