// Notifications index file
import { Notification } from './Notification.js';
import { ToastNotifications } from './ToastNotifications.js';

// Registering custom elements for notifications
customElements.define('notification-component', Notification);
customElements.define('toast-notifications-component', ToastNotifications);

// Exporting the components for external usage
export {
  Notification,
  ToastNotifications,
};
