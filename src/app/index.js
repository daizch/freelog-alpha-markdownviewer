import Vue from 'vue'
import router from './router'
import './index.less'
import App from './pages/app'

var template = require('./index.html');

class FreelogAlphaMarkdownviewer extends HTMLElement {
  constructor() {
    super()
  }


  initApp() {
    var app = new Vue({
      el: this.querySelector('.freelog-alpha-markdownviewer-app'),
      router,
      template: '<App/>',
      components: {App}
    })
  }

  connectedCallback() {
    this.innerHTML = template
    this.initApp()
  }
}


customElements.define('freelog-alpha-markdownviewer', FreelogAlphaMarkdownviewer);
