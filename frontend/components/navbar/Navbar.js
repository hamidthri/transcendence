import { Component } from '@components';
import { userManagementClient } from '@utils/api';

export class Navbar extends Component {
  constructor() {
    super();
  }

  render() {
    return `
      <nav class="navbar navbar-expand-lg shadow-sm">
        ${userManagementClient.isAuth() ? `
          <connected-navbar-component></connected-navbar-component>
        ` : `
          <disconnected-navbar-component></disconnected-navbar-component>
        `}
      </nav>
    `;
  }

  style() {
    return `
      <style>
        .navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1030;
          background-color: var(--bs-body-bg);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .navbar-brand, .nav-link {
          font-family: 'JetBrains Mono', monospace;
          font-size: 1rem;
        }
      </style>
    `;
  }

  postRender() {
    this.updatePagePadding();

    super.addComponentEventListener(window, 'resize', this.updatePagePadding.bind(this));
  }

  disconnectedCallback() {
    super.removeAllComponentEventListeners();
  }

  updatePagePadding() {
    const disablePadding = this.getAttribute('disable-padding-top') === 'true';
    const body = document.body;

    if (!disablePadding) {
      body.style.paddingTop = `${this.height}px`;
    } else {
      body.style.paddingTop = '';
    }
  }

  hideCollapse() {
    const navbarToggler = this.querySelector('.navbar-toggler');
    if (navbarToggler && navbarToggler.classList.contains('collapsed')) {
      navbarToggler.click();
    }
  }

  addNotification(notification) {
    const notificationNav = this.querySelector('notification-nav-component');
    if (notificationNav) {
      notificationNav.addNotification(notification);
    }
  }

  get height() {
    return this.offsetHeight;
  }
}

// Define the custom element
customElements.define('navbar-component', Navbar);
