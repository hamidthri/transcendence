// Import all components in the navbar folder
import { ConnectedNavbar } from './ConnectedNavbar.js';
import { DisconnectedNavbar } from './DisconnectedNavbar.js';
import { Navbar } from './Navbar.js';
import { NotificationNav } from './NotificationNav.js';
import { SearchNav } from './SearchNav.js';

// Register custom elements for each component
customElements.define('connected-navbar-component', ConnectedNavbar);
customElements.define('disconnected-navbar-component', DisconnectedNavbar);
customElements.define('navbar-component', Navbar);
customElements.define('notification-nav-component', NotificationNav);
customElements.define('search-nav-component', SearchNav);

// Export components for reuse
export {
  ConnectedNavbar,
  DisconnectedNavbar,
  Navbar,
  NotificationNav,
  SearchNav,
};
