import { Component } from '@components';

export class Error extends Component {
  constructor() {
    super();
  }

  render() {
    return `
      <navbar-component></navbar-component>
      <error-content-component 
        refresh="${this.getAttribute('refresh')}" 
        message="${this.getAttribute('message') || 'An unexpected error occurred.'}">
      </error-content-component>
    `;
  }

  style() {
    return `
      <style>
        :host {
          display: block;
        }
      </style>
    `;
  }
}

customElements.define('error-component', Error);
