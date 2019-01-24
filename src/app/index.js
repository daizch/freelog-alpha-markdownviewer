import './index.less'

// var MarkdownParser = require('../lib/markdown-parser')
var htmlStr = require('./index.html')
var dependencies = require('../../package.json').freelogConfig.dependencies

class FreelogAlphaMarkdownviewer extends HTMLElement {
  constructor() {
    super()
    const self = this
    this.innerHTML = htmlStr
    self.root = document.body

    self.loadData()
      .then(function (list) {
        self.$viewerWrap = self.root.querySelector('.md-viewer-wrap')
        self.$viewer = self.root.querySelector('.js-md-viewer')
        self.$viewerTitle = self.root.querySelector('.js-md-title')

        self.responseList = list
        self.renderList(list)
        setTimeout(function () {
          self.bindEvent()
        }, 20)
      })
      .catch(function (err) {
        console.warn(err)
      })
  }

  connectedCallback() {

  }

  loadData() {
    return window.FreelogApp.QI.fetch(`/v1/presentables?nodeId=${window.__auth_info__.__auth_node_id__}&resourceType=markdown`).then(function (res) {
      return res.json()
    }).then(function (res) {
      var presentableList = res.data.dataList || [];
      var promises = presentableList.map(function (resource) {
        return window.FreelogApp.QI.fetchPresentableResourceData(resource.presentableId).then(function (res) {
          return {
            response: res,
            detail: resource
          }
        })
      });

      return Promise.all(promises)
    }).then(function (values) {
      var result = []
      values.forEach(function (val) {
        var res = val.response;
        var isError = !res.headers.get('freelog-resource-type')
        if (isError) {
          result.push(res.json().then(function (data) {
            val.json = data;
            return val
          }))

        } else {
          result.push(res.text().then(function (data) {
            val.text = data;
            return val
          }))
        }
      })

      return Promise.all(result)
    })
  }

  renderTitle(presentable) {
    var html = `<li class="md-title js-md-title js-md-title-${presentable.index}" data-index="${presentable.index}">${presentable.index + 1}. ${presentable.detail.presentableName}</li>`

    return html
  }

  loadPresentable(presentableId) {
    return window.FreelogApp.QI.fetchPresentableResourceData(presentableId).then(function (res) {
      var isError = !res.headers.get('freelog-resource-type')
      return isError ? res.json() : res.text()
    })
  }

  renderMarkdown(presentable) {
    window.FreelogApp.QI.requireSubResource(dependencies['markdown-parser'])
      .then(() => {
        this.$viewer.innerHTML = ''
        var markdownParser = new window.MarkdownParser({
          container: this.$viewer,
          renderImageError($el, data) {
            $el.src = ''
            //todo
            if (typeof data === 'string') {
              $el.src = ''
            } else {

            }
            console.log('renderImageError', arguments)
          }
        });
        markdownParser.render(presentable.text)
      })
  }

  reanderHead(presentable) {
    var name = presentable.detail.presentableName
    var date = (new Date(presentable.detail.createDate)).toLocaleDateString();
    var html = `<div class="article-title"><time datetime="${date}">${date}</time><h3>${name}</h3></div>`

    this.$viewerTitle.innerHTML = html
  }

  renderError(presentable) {
    var App = window.FreelogApp
    var errInfo = App.getErrorInfo(presentable.json || presentable)
    var html = `<span class="error-tip">${errInfo.desc}</span>
                         <button class="action-btn js-to-do" data-index="${presentable.index}">${errInfo.tip}</button>`

    this.$viewer.innerHTML = html
  }

  renderList(list) {
    var self = this;
    var titleHtml = ''
    var $titleWrap = this.root.querySelector('.js-md-titles')
    //资源名称为title
    list.forEach(function (presentable, index) {
      presentable.index = index
      titleHtml += self.renderTitle(presentable)
    });

    if (titleHtml) {
      $titleWrap.innerHTML = titleHtml
      this.renderContent(this.responseList[0])
    } else {
      this.root.querySelector('.js-md-viewer').innerHTML = '没有找到文章...'
    }
  }

  renderContent(presentable) {
    var target = this.root.querySelector(`.js-md-title-${presentable.index}`);
    this.reanderHead(presentable)
    if (presentable.json) {
      this.$viewerWrap.classList.add('md-error-wrap')
      this.renderError(presentable)
    } else {
      this.$viewerWrap.classList.remove('md-error-wrap')
      this.renderMarkdown(presentable)
    }
    var $selected = this.root.querySelector('.js-md-title.selected');
    if ($selected) {
      $selected.classList.remove('selected')
    }
    target.classList.add('selected');
  }

  bindEvent() {
    var self = this;
    self.root.querySelector('.js-wrapper').addEventListener('click', function (ev) {
      var target = ev.target;
      var classList = target.classList
      if (classList.contains('js-to-do')) {
        errorHandler(ev)
      } else if (classList.contains('js-md-title')) {
        changeMarkdownView(ev)
      }
    }, false)

    function changeMarkdownView(ev) {
      var target = ev.target;
      var index = target.dataset.index;
      var presentable = self.responseList[index];
      self.renderContent(presentable)
    }

    function errorHandler(ev) {
      var target = ev.target;
      var index = target.dataset.index;
      var data = self.responseList[index]
      window.FreelogApp.trigger('HANDLE_INVALID_RESPONSE', {
        response: data.json,
        callback: function () {
          self.loadPresentable(data.detail.presentableId).then(function (data) {
            var presentable = self.responseList[index]
            if (typeof data === 'string') {
              presentable.text = data
              self.renderMarkdown(presentable)
            } else {
              presentable.json = data
              self.renderError(presentable)
            }
          })
        }
      })
    }
  }
}


customElements.define('freelog-alpha-markdownviewer', FreelogAlphaMarkdownviewer);
