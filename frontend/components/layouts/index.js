// Layouts index file
// Import components from the folder
import { Friends } from './Friends.js';
import { FriendsSidebar } from './FriendsSidebar.js';

// Register custom elements for the layout components
customElements.define('friends-component', Friends);
customElements.define('friends-sidebar-component', FriendsSidebar);

// Export all layout components for easier access in other parts of the project
export {
  Friends,
  FriendsSidebar,
};
