// Import all button components
import { FriendsButton } from './FriendsButton.js';
import { GithubButton } from './GithubButton.js';
import { IntraButton } from './IntraButton.js';
import { MultiplayerButton } from './MultiplayerButton.js';
import { ThemeButton } from './ThemeButton.js';

// Define custom elements for each button
customElements.define('friends-button-component', FriendsButton);
customElements.define('github-button-component', GithubButton);
customElements.define('intra-button-component', IntraButton);
customElements.define('multiplayer-button-component', MultiplayerButton);
customElements.define('theme-button-component', ThemeButton);

// Export all button components for centralized access
export {
  FriendsButton,
  GithubButton,
  IntraButton,
  MultiplayerButton,
  ThemeButton,
};
