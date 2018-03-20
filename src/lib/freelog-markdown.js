;(function (root) {
  if (!window.marked) {
    return
  }

  function renderImageError(data) {
    var App = window.FreeLogApp
    var errInfo = App.ExceptionCode[data.errcode]
    if (errInfo) {
      return `<div class="article-content"><span class="error-tip">该图片${errInfo.desc}</span>
                         <button class="action-btn js-auth-image">${errInfo.tip}</button></div>`
    } else if (data && data.msg) {
      return `<div class="article-content"><span class="error-tip">该图片${data.msg}</span>
                         <button class="action-btn">授权错误码：${data.data.authCode}</button></div>`
    } else {
      return '<div class="article-content"><span class="error-tip">图片加载出错</span></div>'
    }
  }

  function bindEvent(container) {
    container.addEventListener('click', function (ev) {
      var target = ev.target;
      var classList = target.classList
      if (classList.contains('js-auth-image')) {
        authImageHandler(container)
      }
    }, false)
  }

  function authImageHandler(target) {
    var App = window.FreeLogApp
    var data = target._authData
    var exception = App.ExceptionCode[data.errcode]
    var event = exception.action || App.EventCode.invalidResponse
    App.trigger(event, {
      data: data,
      callback: function (presentable) {
        var contractDetail = presentable && presentable.contractDetail;
        if (!data.data.contract || (contractDetail && contractDetail.fsmState !== data.data.contract.fsmState)) {
          loadFreelogImage(target._presentableId, function (fn) {
            fn(target)
          })
        }
      }
    });
  }

  function loadFreelogImage(presentableId, done) {
    return window.QI.fetchPresentableData(presentableId)
      .then((res) => {
        //fetch image fail
        if (!res.headers.get('freelog-contract-id')) {
          return res.json().then(function (data) {
            done(function ($img) {
              var html = renderImageError(data)
              var $frag = document.createElement('div')
              $frag.innerHTML = html
              $frag._authData = data
              $frag._presentableId = presentableId
              $img.replaceWith($frag)
              bindEvent($frag)
            })
          })
        } else {
          return res.blob().then(function (imgBlob) {
            done(function ($img) {
              var src = URL.createObjectURL(imgBlob);
              if ($img.nodeName !== 'IMG') {
                var $image = document.createElement('img')
                $image.src = src
                $img.replaceWith($image)
              } else {
                $img.src = src;
              }
            })
          })
        }
      })
      .catch((err) => {
      })
  }

  var renderHandles = {}
  var renderer = new marked.Renderer();
  var oldImage = renderer.image
  // Override function

  window.loadFreelogMarkdownImageHandler = function ($img) {
    if (renderHandles[$img.id]) {
      renderHandles[$img.id]()
      delete renderHandles[$img.id]
    }
  }
  renderer.image = function (href, title, text) {
    var freelogSrcReg = /w+\.freelog\.com/gi;
    var presentableIdReg = /resource\/(.+)\.data/
    var presentableId
    var container = this.options.container

    if (text === 'freelog-resource') {
      presentableId = presentableIdReg.test(href) ? presentableIdReg.exec(href)[1] : href
    } else if (freelogSrcReg.test(href) && presentableIdReg.test(href)) {
      presentableId = presentableIdReg.exec(href)[1]
    }

    if (presentableId) {
      var out = '<img src="//visuals.oss-cn-shenzhen.aliyuncs.com/loading.gif" onload="loadFreelogMarkdownImageHandler(this)" alt="' + text + '"';
      var domId = `md-img-${presentableId}`
      out += ` id="${domId}"`
      if (title) {
        out += ' title="' + title + '"';
      }
      out += this.options.xhtml ? '/>' : '>';

      loadFreelogImage(presentableId, function (fn) {
        var $img = container.querySelector(`#${domId}`);
        if ($img) {
          fn($img)
        } else {
          renderHandles[domId] = function renderImage() {
            $img = container.querySelector(`#${domId}`);
            if ($img) {
              fn($img)
            }
          };
        }
      })
      return out;
    } else {
      return oldImage.apply(renderer, [href, title, text]);
    }
  };

  function freelogMarkdownParse(content, opts) {
    opts = opts || {}
    opts = Object.assign({
      gfm: true,
      breaks: true,
      tables: true,
      container: document.body,
      renderer: renderer
    }, opts);

    return marked(content, opts);
  }

  if (typeof module !== 'undefined' && typeof exports === 'object') {
    module.exports = freelogMarkdownParse
  } else if (typeof define === 'function' && define.amd) {
    define(function () {
      return freelogMarkdownParse
    })
  } else {
    root.freelogMarkdownParse = freelogMarkdownParse
  }
})(this || (typeof window !== 'undefined' ? window : global));