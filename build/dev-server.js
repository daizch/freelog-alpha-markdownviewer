var gulp = require('./gulpfile')
var runSequence = require('run-sequence').use(gulp)
var server = require('@freelog/freelog-dev-server')

server.ready.then(function () {
  runSequence('build','watch')
})