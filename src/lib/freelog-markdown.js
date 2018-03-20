;(function (root) {
  if (!window.marked) {
    return
  }

  function renderImageError(data) {
    var App = window.FreeLogApp
    var errInfo = App.ExceptionCode[data.errcode] || {}
    return `<p class="article-content"><span class="error-tip">该图片${errInfo.desc}</span>
                         <button class="action-btn js-auth-image">${errInfo.tip}</button></p>`
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
          loadFreelogImage(target._imageLink, function (fn) {
            fn(target)
          })
        }
      }
    });
  }

  function loadFreelogImage(href, done) {
    return window.QI.fetch(href)
      .then((res) => {
        //fetch image fail
        if (!res.headers.get('freelog-contract-id')) {
          return res.json().then(function (data) {
            done(function ($img) {
              var html = renderImageError(data)
              var $frag = document.createElement('div')
              $frag.innerHTML = html
              $frag._authData = data
              $frag._imageLink = href
              $img.replaceWith($frag)
              bindEvent($frag)
            })
          })
        } else {
          return res.blob().then(function (imgBlob) {
            done(function ($img) {
              $img.src = URL.createObjectURL(imgBlob);
            })
          })
        }
      })
      .catch((err) => {
      })
  }

  var __markdown_index = 0
  var renderHandles = {}
  var renderer = new marked.Renderer();
  var oldImage = renderer.image
  // Override function
  renderer.image = function (href, title, text) {
    var freelogSrcReg = /w+\.freelog\.com/gi;
    var presentableIdReg = /resource\/(.+)\.data/
    var isFreelogResource = (text === 'freelog-resource' || freelogSrcReg.test(href))
    var presentableId
    var markdownIndex = this.options.__markdown_index
    var container = this.options.container

    if (presentableIdReg.test(href)) {
      presentableId = presentableIdReg.exec(href)[1]
    }
    if (isFreelogResource && presentableId) {
      var out = '<img alt="' + text + '"';
      var domId = `md-img-${presentableId}`
      out += ` id="${domId}"`
      if (title) {
        out += ' title="' + title + '"';
      }
      out += this.options.xhtml ? '/>' : '>';

      loadFreelogImage(href, function (fn) {
        var $img = container.querySelector(`#${domId}`);
        if ($img) {
          fn($img)
        } else {
          renderHandles[markdownIndex] = renderHandles[markdownIndex] || [];
          renderHandles[markdownIndex].push(function renderImage() {
            $img = container.querySelector(`#${domId}`);
            if ($img) {
              fn($img)
            } else {
              setTimeout(function () {
                renderImage()
              }, 100)
            }
          })
        }
      })
      return out;
    } else {
      return oldImage.apply(renderer, [href, title, text]);
    }
  };

  function doneFn(index) {
    __markdown_index++;
    return function (err, out) {
      if (err) return
      setTimeout(function () {
        var handles = renderHandles[index]
        var h;
        if (handles) {
          while (h = handles.shift()) {
            h()
          }
          delete renderHandles[index]
        }
      }, 10)
      return out
    }
  }

  function freelogMarkdownParse(content, opts) {
    opts = opts || {}
    opts = Object.assign({
      gfm: true,
      breaks: true,
      tables: true,
      container: document.body,
      __markdown_index: __markdown_index,
      renderer: renderer
    }, opts);

    return marked(content, opts, doneFn(__markdown_index));
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