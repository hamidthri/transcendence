import { Component } from '@components';
import { userManagementClient } from '@utils/api';
import { getRouter } from '@js/Router.js';

export class ConnectedNavbar extends Component {
  constructor() {
    super();
  }

  render() {
    const user = userManagementClient.getCurrentUser();
    return `
      <div class="container-fluid">
        <a class="navbar-brand" href="/" onclick="event.preventDefault(); getRouter().navigate('/')">
          PongGame
        </a>
        <button
          class="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarContent"
          aria-controls="navbarContent"
          aria-expanded="false"
          aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarContent">
          <ul class="navbar-nav me-auto mb-2 mb-lg-0">
            <li class="nav-item">
              <a class="nav-link" href="/profile/${user.username}" 
                onclick="event.preventDefault(); getRouter().navigate('/profile/${user.username}')">
                Profile
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="/settings"
                onclick="event.preventDefault(); getRouter().navigate('/settings')">
                Settings
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="/tournaments"
                onclick="event.preventDefault(); getRouter().navigate('/tournaments')">
                Tournaments
              </a>
            </li>
          </ul>
          <div class="d-flex">
            <notification-nav-component></notification-nav-component>
            <button class="btn btn-danger ms-3" id="logout-button">Logout</button>
          </div>
        </div>
      </div>
    `;
  }

  style() {
    return `
      <style>
        .navbar-brand {
          font-family: 'JetBrains Mono', monospace;
          font-size: 1.25rem;
        }

        .nav-link {
          font-family: 'JetBrains Mono', monospace;
          font-size: 1rem;
          transition: color 0.3s ease;
        }

        .nav-link:hover {
          color: var(--bs-primary);
        }

        #logout-button {
          font-size: 0.9rem;
          padding: 0.5rem 1rem;
          border: none;
          background-color: var(--bs-danger);
          color: #fff;
          border-radius: 4px;
          transition: background-color 0.3s ease;
        }

        #logout-button:hover {
          background-color: #b71c1c;
        }
      </style>
    `;
  }

  postRender() {
    const logoutButton = this.querySelector('#logout-button');
    this.addComponentEventListener(logoutButton, 'click', this.logoutUser);
  }

  async logoutUser() {
    try {
      await userManagementClient.logout();
      getRouter().navigate('/signin/');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }
}

// Define the custom element
customElements.define('connected-navbar-component', ConnectedNavbar);
