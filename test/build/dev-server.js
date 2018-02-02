// require('./check-versions')()
const lodash = require('lodash')
const pkg = require('../package.json')

var config = require('../config')
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = JSON.parse(config.dev.env.NODE_ENV)
}

var opn = require('opn')
var path = require('path')
var express = require('express')
var proxyMiddleware = require('http-proxy-middleware')
var cors = require('cors')
// default port where dev server listens for incoming traffic
var port = process.env.PORT || config.dev.port
// automatically open browser, if not set will be false
var autoOpenBrowser = !!config.dev.autoOpenBrowser
// Define HTTP proxies to your custom API backend
// https://github.com/chimurai/http-proxy-middleware
var proxyTable = config.dev.proxyTable
var fs = require('fs')
var app = express()
var router = express.Router()

// proxy api requests
Object.keys(proxyTable).forEach(function (context) {
  var options = proxyTable[context]
  if (typeof options === 'string') {
    options = {target: options}
  }
  app.use(proxyMiddleware(options.filter || context, options))
})

// handle fallback for HTML5 history API
// app.use(require('connect-history-api-fallback')())
app.use(function (req, res, next) {
  if (req.url === '/') {
    var fp = path.join(__dirname, './index.html')
    var pagebuildPath = path.join(__dirname, `../src/pagebuild.html`)
    var tpl = lodash.template(fs.readFileSync(fp).toString())
    var pagebuildContent = fs.readFileSync(pagebuildPath).toString()
    pagebuildContent += `<link rel="import" href="/app/${pkg.name}.html">`
    var html = tpl({pagebuildContent: pagebuildContent})
    res.send(html)
  } else {
    next()
  }
})

app.use(cors())
// enable hot-reload and state-preserving
// compilation error display

// serve pure static assets
// var staticPath = path.posix.join(config.dev.assetsPublicPath, config.dev.assetsSubDirectory)
// app.use(staticPath, express.static('../dist'))

app.use(express.static(path.join(__dirname, '../dist')))

var uri = 'http://local.freelog.com'

if (autoOpenBrowser && process.env.NODE_ENV !== 'testing') {
  opn(uri)
}

var server = app.listen(port)
