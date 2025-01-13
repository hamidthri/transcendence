import { Component } from '@components';
import { ToastNotifications } from '@components/notifications';
import { userManagementClient } from '@utils/api';
import { ErrorPage } from '@utils/ErrorPage.js';

export class NotificationNav extends Component {
  constructor() {
    super();
    this.notifications = [];
  }

  render() {
    return `
      <div id="notification-nav" class="dropdown">
        <button id="notification-btn" class="btn btn-light dropdown-toggle position-relative" 
                type="button" data-bs-toggle="dropdown" aria-expanded="false">
          <i class="bi bi-bell"></i>
          <span id="notification-count" class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
            0
          </span>
        </button>
        <ul class="dropdown-menu dropdown-menu-end" id="notification-list">
          <li class="dropdown-header">Notifications</li>
          <li id="notification-empty" class="dropdown-item text-muted">No new notifications</li>
        </ul>
      </div>
    `;
  }

  style() {
    return `
      <style>
        #notification-nav {
          position: relative;
        }

        #notification-btn {
          font-size: 1.2rem;
        }

        #notification-count {
          font-size: 0.8rem;
          display: none; /* Hidden when there are no notifications */
        }

        .dropdown-item {
          cursor: pointer;
        }

        .dropdown-item:hover {
          background-color: #f8f9fa;
        }
      </style>
    `;
  }

  postRender() {
    this.notificationButton = this.querySelector('#notification-btn');
    this.notificationList = this.querySelector('#notification-list');
    this.notificationCount = this.querySelector('#notification-count');
    this.notificationEmpty = this.querySelector('#notification-empty');

    this.loadNotifications();
    super.addComponentEventListener(this.notificationButton, 'click', this.markAllAsRead);
  }

  async loadNotifications() {
    try {
      const { response, body } = await userManagementClient.getNotifications();
      if (response.ok) {
        this.notifications = body.notifications || [];
        this.updateNotifications();
      } else {
        ErrorPage.loadServerError();
      }
    } catch (error) {
      ErrorPage.loadNetworkError();
    }
  }

  updateNotifications() {
    this.clearNotificationList();

    if (this.notifications.length === 0) {
      this.notificationEmpty.style.display = 'block';
      this.notificationCount.style.display = 'none';
      return;
    }

    this.notificationEmpty.style.display = 'none';
    this.notificationCount.style.display = 'inline-block';
    this.notificationCount.textContent = this.notifications.length;

    this.notifications.forEach((notification) => {
      const notificationItem = this.createNotificationItem(notification);
      this.notificationList.appendChild(notificationItem);
    });
  }

  clearNotificationList() {
    const items = Array.from(this.notificationList.querySelectorAll('.dropdown-item.notification'));
    items.forEach((item) => item.remove());
  }

  createNotificationItem(notification) {
    const li = document.createElement('li');
    li.classList.add('dropdown-item', 'notification');
    li.innerHTML = `
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <strong>${notification.title}</strong>
          <p class="mb-0 text-muted">${notification.message}</p>
        </div>
        <button class="btn btn-sm btn-danger" data-id="${notification.id}">Delete</button>
      </div>
    `;
    const deleteButton = li.querySelector('button');
    super.addComponentEventListener(deleteButton, 'click', () => this.deleteNotification(notification.id));
    return li;
  }

  async deleteNotification(notificationId) {
    try {
      const { response } = await userManagementClient.deleteNotification(notificationId);
      if (response.ok) {
        this.notifications = this.notifications.filter((n) => n.id !== notificationId);
        this.updateNotifications();
        ToastNotifications.addErrorNotification('Notification deleted successfully');
      } else {
        ToastNotifications.addErrorNotification('Failed to delete notification');
      }
    } catch (error) {
      ErrorPage.loadNetworkError();
    }
  }

  markAllAsRead() {
    this.notifications.forEach((notification) => (notification.read = true));
    this.updateNotifications();
  }

  addNotification(notification) {
    this.notifications.push(notification);
    this.updateNotifications();
  }

  removeNotification(notification) {
    this.notifications = this.notifications.filter((n) => n.id !== notification.id);
    this.updateNotifications();
  }
}

customElements.define('notification-nav-component', NotificationNav);
