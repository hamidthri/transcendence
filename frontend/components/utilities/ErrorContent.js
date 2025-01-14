import { Component } from '@components';
import { getRouter } from '@js/Router';

export class ErrorContent extends Component {
  static get observedAttributes() {
    return ['message', 'refresh', 'navigation-url'];
  }

  constructor() {
    super();
    this.message = 'An unexpected error occurred.';
    this.refresh = false;
    this.navigationUrl = '/';
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'message') this.message = newValue || this.message;
    if (name === 'refresh') this.refresh = newValue === 'true';
    if (name === 'navigation-url') this.navigationUrl = newValue || this.navigationUrl;
    this.update();
  }

  render() {
    return `
      <div class="error-content-container">
        <div class="error-card">
          <h1 class="error-title">Oops!</h1>
          <p class="error-message">${this.message}</p>
          <div class="error-actions">
            ${this.refresh ? `<button class="btn btn-primary" id="refresh-btn">Refresh</button>` : ''}
            <button class="btn btn-secondary" id="navigate-btn">Go Home</button>
          </div>
        </div>
      </div>
    `;
  }

  style() {
    return `
      <style>
        .error-content-container {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          background-color: var(--bs-body-bg);
          color: var(--bs-body-color);
          padding: 1rem;
          text-align: center;
        }
        .error-card {
          border: 1px solid var(--bs-border-color);
          border-radius: 8px;
          padding: 2rem;
          max-width: 400px;
          width: 100%;
          background-color: var(--bs-body-bg);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        .error-title {
          font-size: 2rem;
          color: var(--bs-danger);
        }
        .error-message {
          margin: 1rem 0;
          font-size: 1.1rem;
        }
        .error-actions {
          display: flex;
          gap: 0.5rem;
          justify-content: center;
        }
        .btn {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1rem;
        }
        .btn-primary {
          background-color: var(--bs-primary);
          color: var(--bs-white);
        }
        .btn-secondary {
          background-color: var(--bs-secondary-bg);
          color: var(--bs-body-color);
        }
        .btn:hover {
          opacity: 0.9;
        }
      </style>
    `;
  }

  postRender() {
    const refreshBtn = this.querySelector('#refresh-btn');
    const navigateBtn = this.querySelector('#navigate-btn');

    if (refreshBtn) {
      this.addComponentEventListener(refreshBtn, 'click', () => location.reload());
    }

    if (navigateBtn) {
      this.addComponentEventListener(navigateBtn, 'click', () => getRouter().navigate(this.navigationUrl));
    }
  }
}

customElements.define('error-content-component', ErrorContent);
