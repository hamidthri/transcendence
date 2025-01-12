import { Component } from '@components';
import { userManagementClient } from '@utils/api';
import { ToastNotifications } from '@components/notifications';
import { getRouter } from '@js/Router.js';

export class Friend extends Component {
  constructor() {
    super();
    this.state = {
      username: '',
      avatarURL: '',
      status: 'offline', // 'online', 'offline', 'busy', etc.
      isInteractive: true, // Whether the user can interact with this friend
    };
  }

  connectedCallback() {
    super.connectedCallback();
    this.render();
    this.postRender();
  }

  render() {
    const { username, avatarURL, status, isInteractive } = this.state;

    return `
      <div class="friend d-flex align-items-center p-2">
        <img class="friend-avatar rounded-circle" src="${avatarURL}" alt="${username}" />
        <div class="friend-info ms-3">
          <h6 class="friend-username mb-0">${username}</h6>
          <small class="friend-status text-muted">${status}</small>
        </div>
        ${isInteractive ? this.renderActions() : ''}
      </div>
    `;
  }

  renderActions() {
    return `
      <div class="friend-actions ms-auto">
        <button class="btn btn-sm btn-primary send-message-btn">Message</button>
        <button class="btn btn-sm btn-danger remove-friend-btn">Remove</button>
      </div>
    `;
  }

  style() {
    return `
      <style>
        .friend {
          border-bottom: 1px solid var(--bs-border-color);
          display: flex;
          align-items: center;
          transition: background-color 0.2s ease;
        }

        .friend:hover {
          background-color: var(--bs-secondary-bg);
        }

        .friend-avatar {
          width: 40px;
          height: 40px;
          object-fit: cover;
        }

        .friend-info {
          flex-grow: 1;
        }

        .friend-username {
          font-size: 1rem;
          font-weight: 500;
        }

        .friend-status {
          font-size: 0.8rem;
          color: var(--bs-muted-color);
        }

        .friend-actions {
          display: flex;
          gap: 0.5rem;
        }

        .btn-sm {
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
        }
      </style>
    `;
  }

  postRender() {
    const sendMessageBtn = this.querySelector('.send-message-btn');
    const removeFriendBtn = this.querySelector('.remove-friend-btn');

    if (sendMessageBtn) {
      this.addComponentEventListener(sendMessageBtn, 'click', this.handleSendMessage);
    }

    if (removeFriendBtn) {
      this.addComponentEventListener(removeFriendBtn, 'click', this.handleRemoveFriend);
    }
  }

  setFriendData(data) {
    this.state = {
      ...this.state,
      username: data.username,
      avatarURL: userManagementClient.getURLAvatar(data.username),
      status: data.status || 'offline',
    };
    this.reRender();
  }

  handleSendMessage() {
    getRouter().navigate(`/messages/${this.state.username}/`);
  }

  async handleRemoveFriend() {
    try {
      const { response, body } = await userManagementClient.removeFriend(this.state.username);
      if (response.ok) {
        ToastNotifications.addNotification({
          type: 'success',
          message: `Successfully removed ${this.state.username} as a friend.`,
        });
        this.remove(); // Remove this friend component from the DOM
      } else {
        ToastNotifications.addErrorNotification(body?.errors?.[0] || 'Failed to remove friend.');
      }
    } catch (error) {
      ToastNotifications.addErrorNotification('Network error. Please try again later.');
    }
  }

  reRender() {
    this.innerHTML = this.render() + this.style();
    this.postRender();
  }
}

customElements.define('friend-component', Friend);
