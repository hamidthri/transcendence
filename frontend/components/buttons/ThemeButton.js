import { Component } from '@components';
import { LocalStorage } from '@utils/storage';

export class ThemeButton extends Component {
  constructor() {
    super();
    this.state = {
      currentTheme: 'light', // Default theme
    };
  }

  connectedCallback() {
    super.connectedCallback();
    this.loadTheme(); // Load saved theme or default
    this.applyTheme(); // Apply the loaded theme
  }

  render() {
    return `
      <button id="theme-toggle-btn" class="theme-button" aria-label="Toggle Theme">
        ${this.getButtonContent()}
      </button>
    `;
  }

  getButtonContent() {
    const { currentTheme } = this.state;
    if (currentTheme === 'light') {
      return `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="5"></circle>
          <path d="M12 1v2"></path>
          <path d="M12 21v2"></path>
          <path d="M4.22 4.22l1.42 1.42"></path>
          <path d="M18.36 18.36l1.42 1.42"></path>
          <path d="M1 12h2"></path>
          <path d="M21 12h2"></path>
          <path d="M4.22 19.78l1.42-1.42"></path>
          <path d="M18.36 5.64l1.42-1.42"></path>
        </svg>
        Light Mode
      `;
    }
    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 12.79A9 9 0 0 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        <path d="M4 4l16 16"></path>
      </svg>
      Dark Mode
    `;
  }

  style() {
    return `
      <style>
        .theme-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          background-color: var(--bs-body-bg);
          color: var(--bs-body-color);
          border: 1px solid var(--bs-border-color);
          padding: 0.5rem 1rem;
          border-radius: 5px;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .theme-button:hover {
          background-color: var(--bs-primary-bg);
          color: var(--bs-primary-color);
        }

        .theme-button svg {
          width: 1.5rem;
          height: 1.5rem;
        }
      </style>
    `;
  }

  postRender() {
    const button = this.querySelector('#theme-toggle-btn');
    if (button) {
      this.addComponentEventListener(button, 'click', this.toggleTheme.bind(this));
    }
  }

  loadTheme() {
    const savedTheme = LocalStorage.get('selectedTheme') || 'light';
    this.state.currentTheme = savedTheme;
  }

  saveTheme() {
    LocalStorage.set('selectedTheme', this.state.currentTheme);
  }

  applyTheme() {
    const { currentTheme } = this.state;
    document.documentElement.setAttribute('data-theme', currentTheme);
  }

  toggleTheme() {
    this.state.currentTheme = this.state.currentTheme === 'light' ? 'dark' : 'light';
    this.saveTheme();
    this.applyTheme();
    this.reRender(); // Re-render the button to update its label/icon
  }

  reRender() {
    this.innerHTML = this.render() + this.style();
    this.postRender();
  }
}

customElements.define('theme-button-component', ThemeButton);
