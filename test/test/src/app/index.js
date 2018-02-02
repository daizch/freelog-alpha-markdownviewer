var template = document.currentScript.parentNode.querySelector('template');
class FreelogXxxxXxxx extends HTMLElement {
  constructor() {
    super()
    let self = this;
    let shadowRoot = self.attachShadow({mode: 'closed'});
    const instance = template.content.cloneNode(true);
    self.root = shadowRoot
    shadowRoot.appendChild(instance)
  }
}


customElements.define('freelog-xxxx-xxxx', FreelogXxxxXxxx);