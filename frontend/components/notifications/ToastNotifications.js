import { Component } from '@components';
import { getRouter } from '@js/Router.js';
import { Cookies } from '@js/Cookies.js';

export class ToastNotifications extends Component {
  constructor() {
    super();
    this.toasts = [];
  }

  render() {
    return `
      <div id="toast-container" class="toast-container"></div>
    `;
  }

  style() {
    return `
      <style>
        .toast-container {
          position: fixed;
          top: 1rem;
          right: 1rem;
          z-index: 1050;
        }

        .toast {
          display: flex;
          align-items: center;
          padding: 1rem;
          margin-bottom: 1rem;
          background-color: #fff;
          border: 1px solid #ccc;
          border-radius: 0.5rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .toast-error {
          background-color: #f8d7da;
          color: #721c24;
          border-color: #f5c6cb;
        }

        .toast-policy {
          background-color: #cce5ff;
          color: #004085;
          border-color: #b8daff;
        }

        .toast .btn {
          margin-left: auto;
        }
      </style>
    `;
  }

  postRender() {
    window.addEventListener('scroll', () => this.adjustToastPosition());
  }

  adjustToastPosition() {
    const container = this.querySelector('#toast-container');
    if (container) {
      container.style.top = `${window.scrollY + 16}px`;
    }
  }

  static addErrorNotification(message) {
    const toastContainer = document.querySelector('toast-notifications-component')?.querySelector('#toast-container');
    if (toastContainer) {
      const toast = document.createElement('div');
      toast.classList.add('toast', 'toast-error');
      toast.innerHTML = `
        <span>${message}</span>
        <button class="btn btn-danger btn-sm">Dismiss</button>
      `;
      toast.querySelector('button').addEventListener('click', () => toast.remove());
      toastContainer.appendChild(toast);
    }
  }

  static addPolicyNotification(message) {
    const toastContainer = document.querySelector('toast-notifications-component')?.querySelector('#toast-container');
    if (toastContainer && !Cookies.get('policy')) {
      const toast = document.createElement('div');
      toast.classList.add('toast', 'toast-policy');
      toast.innerHTML = `
        <span>${message}</span>
        <button class="btn btn-primary btn-sm">Acknowledge</button>
      `;
      toast.querySelector('button').addEventListener('click', () => {
        Cookies.set('policy', 'acknowledged', { expires: 365 });
        toast.remove();
      });
      toastContainer.appendChild(toast);
    }
  }

  addFriendRequestNotification(notification) {
    const toastContainer = this.querySelector('#toast-container');
    if (toastContainer) {
      const toast = document.createElement('div');
      toast.classList.add('toast');
      toast.innerHTML = `
        <img src="${notification.avatar}" alt="Avatar" style="width: 40px; height: 40px; border-radius: 50%; margin-right: 1rem;" />
        <span>${notification.message}</span>
        <button class="btn btn-success btn-sm">Accept</button>
        <button class="btn btn-danger btn-sm">Decline</button>
      `;
      const [acceptButton, declineButton] = toast.querySelectorAll('button');

      acceptButton.addEventListener('click', () => {
        notification.onAccept();
        toast.remove();
      });

      declineButton.addEventListener('click', () => {
        notification.onDecline();
        toast.remove();
      });

      toastContainer.appendChild(toast);
    }
  }

  addTournamentStartNotification(notification) {
    const toastContainer = this.querySelector('#toast-container');
    if (toastContainer) {
      const toast = document.createElement('div');
      toast.classList.add('toast');
      toast.innerHTML = `
        <span>${notification.message}</span>
        <button class="btn btn-primary btn-sm">Join</button>
      `;
      const joinButton = toast.querySelector('button');
      joinButton.addEventListener('click', () => {
        getRouter().navigate(notification.joinUrl);
        toast.remove();
      });
      toastContainer.appendChild(toast);
    }
  }

  removeToast(toast) {
    setTimeout(() => {
      if (toast) toast.remove();
    }, 5000);
  }
}

customElements.define('toast-notifications-component', ToastNotifications);
