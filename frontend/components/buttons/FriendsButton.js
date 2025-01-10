import { Component } from '@components';
import { NavbarUtils } from '@utils/NavbarUtils.js';

export class FriendsButton extends Component {
  constructor() {
    super();
  }

  render() {
    return `
      <button class="friends-button d-flex justify-content-center align-items-center">
        <span class="icon bi bi-people-fill fs-5"></span>
        <span class="label">Friends</span>
      </button>
    `;
  }

  style() {
    return `
      <style>
        .friends-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.4rem 0.8rem;
          background-color: var(--primary-bg, transparent);
          border: 2px solid var(--primary-color, #007bff);
          border-radius: 5px;
          cursor: pointer;
          color: var(--primary-color, #007bff);
          font-size: 1rem;
          font-weight: 500;
          gap: 0.4rem;
          transition: all 0.3s ease;
        }

        .friends-button:hover {
          background-color: var(--primary-hover-bg, #0056b3);
          color: var(--hover-text-color, #fff);
        }

        .friends-button:active {
          background-color: var(--primary-active-bg, #003f7f);
          border-color: var(--primary-active-border, #003f7f);
        }

        .friends-button .icon {
          font-size: 1.25rem;
        }

        .friends-button .label {
          display: none; /* Hide the label by default for compact design */
        }

        @media (min-width: 768px) {
          .friends-button .label {
            display: inline; /* Show label on larger screens */
          }
        }
      </style>
    `;
  }

  postRender() {
    const button = this.querySelector('.friends-button');
    this.addComponentEventListener(button, 'click', this.handleFriendsToggle.bind(this));
  }

  handleFriendsToggle() {
    const sidebar = document.querySelector('friends-sidebar-component');
    if (sidebar && typeof sidebar.toggleVisibility === 'function') {
      sidebar.toggleVisibility();
    } else {
      console.warn('Friends sidebar component not found or invalid.');
    }

    NavbarUtils.hideCollapse();
  }
}

// Register the custom element
customElements.define('friends-button-component', FriendsButton);
