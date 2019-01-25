<template>
  <div class="freelog-alpha-markdownviewer-index">
    <div class="wrapper js-wrapper md-error-wrap">
      <div class="md-titles">
        <ul class="js-md-titles">
          <li class="md-title"
              @click="setCurrentPresentable(presentable)"
              :class="{selected: current.presentableId === presentable.presentableId}"
              v-for="(presentable, index) in presentables">
            {{index + 1}}. {{presentable.presentableName}}
          </li>
        </ul>
      </div>
      <div class="md-viewer-wrap article-item">
        <div class="js-md-title">
          <div class="article-title" v-if="current.presentableId">
            <time :datetime="current.date">{{current.date}}</time>
            <h3>{{current.presentableName}}</h3>
          </div>
        </div>
        <div class="md-content-viewer article-content">
          <template v-if="presentables.length === 0">
            没有找到文章...
          </template>
          <template v-else-if="current.errorInfo">
            <span class="error-tip">{{current.errorInfo.desc}}</span>
            <button class="action-btn" @click="errorHandler(current)">{{current.errorInfo.tip}}</button>
          </template>
          <div ref="viewer" v-show="current.presentableId && !current.errorInfo">
            <img src="//visuals.oss-cn-shenzhen.aliyuncs.com/loading.gif" class="loading-img" alt="">
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
var dependencies = require('../../../package.json').freelogConfig.dependencies

function createLoader(loader) {
  var handler
  var loading = false
  var done = false
  return function (fn) {
    handler = fn
    if (done) {
      handler()
    } else if (!loading) {
      loading = true
      loader(function (v) {
        done = true
        if (handler) {
          handler()
        }
      })
    }
  }
}

export default {
  name: 'home-page',

  data() {
    return {
      presentables: [],
      presentablesMap: {},
      current: {}
    }
  },

  mounted() {
    this.init()
  },

  created() {
    this.onloadParser = createLoader((callback) => {
      window.FreelogApp.QI.requireSubResource(dependencies['markdown-parser'])
        .then(() => {
          callback(true)
        })
    })
  },
  methods: {
    init() {
      this.loadPresentables()
        .then(list => {
          if (list && list.length) {
            list.forEach(presentable => {
              presentable.date = (new Date(presentable.createDate)).toLocaleDateString()
              this.presentablesMap[presentable.presentableId] = presentable
            })
            this.presentables = list
            this.setCurrentPresentable(this.presentables[0])
          }
        })
        .catch(function (err) {
          console.warn(err)
        })
    },
    setCurrentPresentable(presentable) {
      this.current = presentable

      if (!presentable._cachedResponse) {
        this.loadPresentable(presentable.presentableId)
          .then(data => {
            this.renderPresentable(presentable, data)
          })
      } else if (!presentable.errorInfo) {
        this.renderMarkdown(presentable)
      }
    },
    loadPresentables() {
      return window.FreelogApp.QI.fetch(`/v1/presentables?nodeId=${window.__auth_info__.__auth_node_id__}&resourceType=markdown&pageSize=100`).then(function (res) {
        return res.json()
      }).then(function (res) {
        return (res.data && res.data.dataList) || []
      })
    },
    loadPresentable(presentableId) {
      return window.FreelogApp.QI.fetchPresentableResourceData(presentableId).then(function (res) {
        var isError = !res.headers.get('freelog-resource-type')
        return isError ? res.json() : res.text()
      })
    },
    renderPresentable(presentable, data) {
      this.$set(presentable, '_cachedResponse', data)
      if (typeof data === 'string') {
        if (presentable.errorInfo) {
          this.$set(presentable, 'errorInfo', '')
        }
        this.renderMarkdown(presentable)
      } else {
        this.$set(presentable, 'errorInfo', this.resolveErrorInfo(presentable._cachedResponse))
      }
    },
    renderMarkdown(presentable) {
      this.$refs.viewer.innerHTML = ''

      if (presentable.errorInfo) return

      this.onloadParser(() => {
        var markdownParser = new window.MarkdownParser({
          container: this.$refs.viewer,
          renderImageError($el, data) {
            if ($el) {
              $el.src = ''
              //todo
              if (typeof data === 'string') {
                $el.src = ''
              } else {

              }
            }
            console.log('renderImageError', arguments)
          }
        })
        markdownParser.render(presentable._cachedResponse)
      })
    },
    resolveErrorInfo(resp) {
      var App = window.FreelogApp
      var errInfo = App.getErrorInfo(resp)
      return errInfo
    },

    errorHandler(presentable) {
      var self = this
      window.FreelogApp.trigger('HANDLE_INVALID_RESPONSE', {
        response: presentable._cachedResponse,
        callback: function () {
          self.loadPresentable(presentable.presentableId).then(data => {
            this.renderPresentable(presentable, data)
          })
        }
      })
    },
    changeMarkdownView() {

    },
  }
}
</script>


<style lang="less" scoped>
  .freelog-alpha-markdownviewer-index {
    .wrapper {
      padding: 15px 0 15px 15px;
      background: white;
      min-height: 100vh;
    }

    .md-title {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      cursor: pointer;
      line-height: 22px;
      transition: all .2s;
      padding: 2px;
      font-size: 14px;
      &.selected {
        font-weight: 600;
        font-size: 16px;
        color: #007bff;
        background-color: #eee;
        span {
          color: #007bff;
        }
      }
    }

    .md-title:hover {
      background-color: #ddd;
    }

    .md-titles {
      width: 300px;
      position: fixed;
      top: 0;
      left: 0;
      bottom: 0;
      overflow: auto;
      background: #fafafa;
      z-index: 1;
      padding: 10px;
      border-right: 1px solid rgba(0, 0, 0, 0.07);
      border-radius: 2px;
    }

    .md-viewer-wrap {
      background: #fff;
      margin-left: 330px;
      margin-right: 300px;
      overflow: auto;
    }

    .md-error-wrap {
      margin-right: 30px;
    }

    .article-title {
      border-left: 5px solid;
      margin-bottom: 20px;
      font-size: 30px;
      padding-left: 12px;
      padding-bottom: 9px;
    }

    .article-title time {
      font-size: 16px;
      color: #aaa;
      float: right;
      height: 58px;
      line-height: 58px;
      padding-right: 40px;
    }

    .article-item {
      border: 1px solid #ddd;
      border-radius: 3px;
      box-shadow: 0 2px 12px 0 rgba(0, 0, 0, .1);
    }

    .article-content {
      padding: 12px;
      overflow: auto;
    }

    .error-tip {
      color: #E6A23C;
    }

    .action-btn {
      display: inline-block;
      line-height: 1;
      white-space: nowrap;
      border: 1px solid #b3d8ff;
      text-align: center;
      box-sizing: border-box;
      outline: none;
      padding: 6px 9px;
      font-size: 14px;
      border-radius: 4px;
      color: #409eff;
      background: #ecf5ff;
      cursor: pointer;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }

      to {
        opacity: 1;
      }
    }

    .fadeIn {
      -webkit-animation-name: fadeIn;
      animation-name: fadeIn;
      -webkit-animation-duration: 1s;
      animation-duration: 1s;
      -webkit-animation-fill-mode: both;
      animation-fill-mode: both;
    }
  }
</style>
