import { Component } from '@components';
import { notificationClient, userManagementClient } from '@utils/api';
import { FriendsCache } from '@utils/cache';
import { ErrorPage } from '@utils/ErrorPage.js';
import { getRouter } from '@js/Router.js';
import { ToastNotifications } from './ToastNotifications.js';
import { Cookies } from '@js/Cookies.js';

export class Notification extends Component {
  constructor() {
    super();
    this.notifications = [];
    this.webSocket = null;
    this.notificationURL = `wss://${window.location.hostname}:6005/ws/notification/`;
    this.tokenRefreshInterval = null;
  }

  render() {
    return (`
      <toast-notifications-component></toast-notifications-component>
    `);
  }

  style() {
    return (`
      <style>
        /* Add styles for your notification component here */
      </style>
    `);
  }

  async postRender() {
    if (!Cookies.get('policy')) {
      ToastNotifications.addPolicyNotification(
        "We use cookies to enhance your experience. By continuing, you consent to our cookies policy."
      );
    }
    this.toastNotifications = this.querySelector('toast-notifications-component');
    await this.initializeWebSocket();
    this.startTokenRefresh();
  }

  disconnectedCallback() {
    this.cleanup();
  }

  cleanup() {
    if (this.webSocket) {
      this.webSocket.close();
    }
    if (this.tokenRefreshInterval) {
      clearInterval(this.tokenRefreshInterval);
    }
  }

  async initializeWebSocket() {
    try {
      const accessToken = await userManagementClient.getValidAccessToken();
      if (!accessToken) {
        getRouter().redirect('/signin/');
        return;
      }
      this.connectWebSocket(accessToken);
    } catch (error) {
      ErrorPage.loadNetworkError();
    }
  }

  connectWebSocket(accessToken) {
    this.webSocket = new WebSocket(`${this.notificationURL}?Authorization=${accessToken}`);

    this.webSocket.onopen = () => {
      console.log('WebSocket connected');
    };

    this.webSocket.onmessage = (event) => {
      this.handleMessage(event);
    };

    this.webSocket.onclose = () => {
      console.warn('WebSocket closed. Attempting reconnection...');
      setTimeout(() => this.initializeWebSocket(), 5000);
    };

    this.webSocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  async handleMessage(event) {
    try {
      const data = JSON.parse(event.data);
      const notification = JSON.parse(data.message);

      switch (notification.type) {
        case 'friend_status':
          await this.updateFriendStatus(notification);
          break;
        case 'friend_request':
        case 'tournament_start':
          this.addNotification(notification);
          break;
        case 'game_match_found':
          this.handleGameMatch(notification);
          break;
        default:
          console.warn('Unknown notification type:', notification.type);
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }

  async addNotification(notification) {
    this.notifications.push(notification);
    this.toastNotifications.addNotification(notification);
    const navbar = document.querySelector('navbar-component');
    if (navbar) {
      navbar.addNotification(notification);
    }
  }

  async updateFriendStatus(notification) {
    if (notification.status === 'deleted') {
      FriendsCache.delete(notification.friend_id);
    } else {
      const friend = FriendsCache.get(notification.friend_id);
      if (friend) {
        friend.connected_status = notification.status;
        FriendsCache.set(notification.friend_id, friend);
      } else {
        await this.addFriendToCache(notification);
      }
    }
  }

  async addFriendToCache(notification) {
    try {
      const { response, body } = await userManagementClient.getUsernameList([notification.friend_id]);
      if (response.ok) {
        FriendsCache.set(notification.friend_id, {
          id: notification.friend_id,
          username: body[notification.friend_id],
          connected_status: notification.status,
        });
      }
    } catch (error) {
      console.error('Error updating friend cache:', error);
    }
  }

  handleGameMatch(notification) {
    const { gameUrl } = notification.data;
    getRouter().navigate(gameUrl);
  }

  startTokenRefresh() {
    this.tokenRefreshInterval = setInterval(async () => {
      if (userManagementClient.accessToken.getTimeRemainingInSeconds() < 60) {
        await userManagementClient.refreshAccessToken();
      }
    }, 5000);
  }
}

customElements.define('notification-component', Notification);
