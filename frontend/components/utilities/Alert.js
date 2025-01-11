import { Component } from '@components';

export class Alert extends Component {
  static get observedAttributes() {
    return ['alert-message', 'alert-display', 'alert-type', 'dismissible'];
  }

  constructor() {
    super();
    this.message = '';
    this.type = 'info';
    this.display = false;
    this.dismissible = false;
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'alert-message') this.message = newValue;
    if (name === 'alert-type') this.type = newValue;
    if (name === 'alert-display') this.display = newValue === 'true';
    if (name === 'dismissible') this.dismissible = newValue === 'true';
    this.update();
  }

  render() {
    if (!this.display) return '';
    const dismissButton = this.dismissible
      ? `<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`
      : '';
    const alertClass = `alert-${this.type}`;
    return `
      <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
        <div>${this.message}</div>
        ${dismissButton}
      </div>
    `;
  }

  style() {
    return `
      <style>
        .alert {
          padding: 1rem;
          border-radius: 0.375rem;
          margin-bottom: 1rem;
          transition: opacity 0.3s ease;
        }
        .alert-info { background-color: #eaf4fc; color: #3178c6; }
        .alert-success { background-color: #eafaf1; color: #2e7d32; }
        .alert-warning { background-color: #fff8e1; color: #f9a825; }
        .alert-danger { background-color: #fbeaec; color: #d32f2f; }
        .btn-close { background: none; border: none; font-size: 1.2rem; cursor: pointer; }
      </style>
    `;
  }
}

customElements.define('alert-component', Alert);
