var path = require('path')

module.exports = {
  build: {
    env: require('./prod.env'),
    assetsSubDirectory: 'static',
    assetsPublicPath: '/'
  },
  dev: {
    env: require('./dev.env'),
    port: 9001,
    autoOpenBrowser: true,
    proxyTable: {},
  }
}
