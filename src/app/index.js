var template = document.currentScript.parentNode.querySelector('template');

class FreelogAlphaMarkdownviewer extends HTMLElement {
  constructor() {
    super()
    let self = this;
    let shadowRoot = self.attachShadow({mode: 'closed'});
    const instance = template.content.cloneNode(true);

    self.root = shadowRoot
    shadowRoot.appendChild(instance)
    self.loadData()
      .then(function (list) {
        self.$viewer = self.root.querySelector('.js-md-viewer')
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

  loadData() {
    var self = this;
    return window.QI.fetch(`//markdowns.freelog.com/api/v1/presentables?nodeId=${window.__auth_info__.__auth_node_id__}&resourceType=markdown&tags=show`).then(function (res) {
      return res.json()
    }).then(function (data) {
      self.presentableList = data.data || [];
      var promises = self.presentableList.map(function (resource) {
        var target = resource.presentableId + '.data';
        return window.QI.fetch(`//markdowns.freelog.com/api/v1/presentables/resource/${target}?nodeId=${window.__auth_info__.__auth_node_id__}`)
      });

      return Promise.all(promises)
    }).then(function (values) {
      var result = []

      values.forEach(function (res) {
        var isError = false// !res.headers.get('freelog-resource-type')
        if (isError) {
          result.push(res.json())
        } else {
          result.push(res.text())
        }
      })

      return Promise.all(result)
    })
  }

  renderTitle(presentable, index) {
    var html = `<li class="md-title js-md-title" data-index="${index}">${index + 1}. ${presentable.name}</li>`
    return html
  }

  loadPresentable(presentableId) {
    return window.QI.fetchPresentable(presentableId + '.data').then(function (res) {
      var isError = !res.headers.get('freelog-contract-id')
      return isError ? res.json() : res.text()
    })
  }

  renderMarkdown(content, presentable, index) {
    var name = presentable.name
    var mdHtml = window.freelogMarkdownParse(content, {
      container: this.root
    })
    var date = (new Date(presentable.createDate)).toLocaleDateString()
    var html = `<div class="article-item js-article-item fadeIn" data-index="${index}" title="${name}">
                        <div class="article-title"><time datetime="${date}">${date}</time><h3>${name}</h3></div>
                        <article class="article-content">${mdHtml}</article>
                    </div>`

    return html
  }

  renderError(data, presentable, index) {
    var App = window.FreeLogApp
    var name = presentable.name
    var date = (new Date(presentable.createDate)).toLocaleDateString();

    var errInfo = App.ExceptionCode[data.errcode] || {}
    var html = `<div class="article-item error-item fadeIn">
                        <div class="article-title"><time datetime="${date}">${date}</time><h3>${name}</h3></div>
                        <p class="article-content"><span class="error-tip">${errInfo.desc}</span>
                         <button class="action-btn js-to-do" data-index="${index}">${errInfo.tip}</button></p>
                    </div>`

    return html
  }

  renderList(list) {
    var html = '';
    var self = this;
    var titleHtml = ''
    var $titleWrap = this.root.querySelector('.js-md-titles')
    var mdHtmlList = []
    //资源名称为title
    list.forEach(function (data, index) {
      var presentable = self.presentableList[index]
      titleHtml += self.renderTitle(presentable, index)
      if (typeof data === 'string') {
        html = self.renderMarkdown(data, presentable, index)
      } else {
        html = self.renderError(data, presentable, index)
      }

      mdHtmlList.push(html)
    });

    self.mdHtmlList = mdHtmlList
    $titleWrap.innerHTML = titleHtml
    if (mdHtmlList.length) {
      this.root.querySelector('.js-md-viewer').innerHTML = mdHtmlList[0]
      $titleWrap.querySelector('.js-md-title').classList.add('selected')
    } else {
      this.root.querySelector('.js-md-viewer').innerHTML = '没有找到文章...'
    }
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
      self.root.querySelector('.js-md-title.selected').classList.remove('selected')
      setMarkdownContent(index)
      target.classList.add('selected')
    }

    function setMarkdownContent(index) {
      index = index || 0
      self.$viewer.innerHTML = self.mdHtmlList[index]
    }

    function errorHandler(ev) {
      var target = ev.target;
      var index = target.dataset.index;
      var App = window.FreeLogApp
      var data = self.responseList[index]
      var exception = App.ExceptionCode[data.errcode]
      var event = exception.action || App.EventCode.invalidResponse
      App.trigger(event, {
        data: data,
        callback: function (presentable) {
          self.loadPresentable(presentable.presentableId).then(function (data) {
            self.responseList.splice(index, 1, data)
            var html
            var presentable = self.presentableList[index]
            if (typeof data === 'string') {
              html = self.renderMarkdown(data, presentable, index)
            } else {
              html = self.renderError(data, presentable, index)
            }
            self.mdHtmlList[index] = html
            setMarkdownContent(index)
          })
        }
      });
    }
  }
}

customElements.define('freelog-alpha-markdownviewer', FreelogAlphaMarkdownviewer);