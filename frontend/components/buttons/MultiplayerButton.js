import { Component } from '@components';
import { userManagementClient } from '@utils/api';
import { ErrorPage } from '@utils/ErrorPage.js';
import { LocalStorage } from '@utils/storage';

export class MultiplayerButton extends Component {
  constructor() {
    super();
    this.state = {
      isLoading: false,
      error: null,
      playerCount: 0,
      isEnabled: true,
      lastConnectionAttempt: null
    };
    this.reconnectDelay = 5000; // 5 seconds
  }

  connectedCallback() {
    super.connectedCallback();
    this.loadState();
    this.startPlayerCountPolling();
  }

  disconnectedCallback() {
    this.stopPlayerCountPolling();
  }

  loadState() {
    const savedState = LocalStorage.get('multiplayerButtonState');
    if (savedState) {
      this.state = { ...this.state, ...JSON.parse(savedState) };
      this.updateButtonState();
    }
  }

  saveState() {
    LocalStorage.set('multiplayerButtonState', JSON.stringify(this.state));
  }

  render() {
    return `
      <button id="multiplayer-btn" 
        class="btn btn-lg mb-2 light-hover w-100 ${this.getButtonClasses()}" 
        type="button"
        ${!this.state.isEnabled ? 'disabled' : ''}
        aria-label="Join Multiplayer Game"
        data-tooltip="${this.getTooltipText()}"
      >
        ${this.getButtonContent()}
      </button>
      ${this.getErrorMessage()}
    `;
  }

  getButtonClasses() {
    const classes = ['multiplayer-btn'];
    if (this.state.isLoading) classes.push('loading');
    if (!this.state.isEnabled) classes.push('disabled');
    if (this.state.error) classes.push('error');
    return classes.join(' ');
  }

  getButtonContent() {
    if (this.state.isLoading) {
      return `
        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        <span>Connecting...</span>
      `;
    }

    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
      </svg>
      Join Multiplayer (${this.state.playerCount} online)
    `;
  }

  getErrorMessage() {
    if (!this.state.error) return '';
    return `
      <div class="error-message">
        ${this.state.error}
        <button class="retry-btn" onclick="this.handleRetry()">
          Try Again
        </button>
      </div>
    `;
  }

  getTooltipText() {
    if (!this.state.isEnabled) {
      return 'Server connection lost. Retrying...';
    }
    return `Join a multiplayer game with ${this.state.playerCount} other players`;
  }

  style() {
    return `
      <style>
        #multiplayer-btn {
          background-color: #4a148c;
          color: #ffffff;
          border: none;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 12px 24px;
          font-size: 1rem;
          font-weight: 500;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        #multiplayer-btn:not(.disabled):hover {
          background-color: #6a1b9a;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(74, 20, 140, 0.2);
        }

        #multiplayer-btn:active {
          transform: translateY(0);
        }

        #multiplayer-btn.disabled {
          opacity: 0.7;
          cursor: not-allowed;
          background-color: #9e9e9e;
        }

        #multiplayer-btn.loading {
          background-color: #7b1fa2;
        }

        #multiplayer-btn.error {
          background-color: #d32f2f;
        }

        .spinner-border {
          width: 1.2rem;
          height: 1.2rem;
        }

        .error-message {
          color: #d32f2f;
          font-size: 0.875rem;
          margin-top: 0.5rem;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .retry-btn {
          background: none;
          border: none;
          color: #4a148c;
          text-decoration: underline;
          cursor: pointer;
          padding: 0;
          font-size: 0.875rem;
        }

        .retry-btn:hover {
          color: #6a1b9a;
        }

        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.6; }
          100% { opacity: 1; }
        }

        .loading .spinner-border {
          animation: pulse 1.5s infinite;
        }

        [data-tooltip]:hover:after {
          content: attr(data-tooltip);
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          background-color: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 8px 12px;
          border-radius: 4px;
          font-size: 0.875rem;
          white-space: nowrap;
          margin-bottom: 8px;
          z-index: 1000;
        }
      </style>
    `;
  }

  startPlayerCountPolling() {
    this.pollInterval = setInterval(() => this.updatePlayerCount(), 10000);
    this.updatePlayerCount(); // Initial count
  }

  stopPlayerCountPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }

  async updatePlayerCount() {
    try {
      const { response, body } = await userManagementClient.getOnlinePlayers();
      if (response.ok) {
        this.setState({
          playerCount: body.count,
          isEnabled: true,
          error: null
        });
      } else {
        this.handleServerError();
      }
    } catch (error) {
      this.handleServerError();
    }
  }

  handleServerError() {
    this.setState({
      isEnabled: false,
      error: 'Server connection lost'
    });
    setTimeout(() => this.updatePlayerCount(), this.reconnectDelay);
  }

  async handleMultiplayerConnect() {
    if (!this.state.isEnabled || this.state.isLoading) return;

    this.setState({ isLoading: true, error: null });
    try {
      const { response, body } = await userManagementClient.joinMultiplayerGame();
      
      if (response.ok) {
        window.location.href = body.gameUrl;
      } else {
        this.handleError('Failed to join multiplayer game');
      }
    } catch (error) {
      this.handleError('Network error. Please check your connection');
      ErrorPage.loadNetworkError();
    }
  }

  handleError(errorMessage) {
    this.setState({
      isLoading: false,
      error: errorMessage,
      lastConnectionAttempt: Date.now()
    });
  }

  handleRetry() {
    this.setState({ error: null });
    this.handleMultiplayerConnect();
  }

  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.saveState();
    this.reRender();
  }

  postRender() {
    const btn = this.querySelector('#multiplayer-btn');
    if (btn) {
      this.addComponentEventListener(btn, 'click', this.handleMultiplayerConnect.bind(this));
    }
  }

  reRender() {
    this.innerHTML = this.render() + this.style();
    this.postRender();
  }
}

customElements.define('multiplayer-button-component', MultiplayerButton);