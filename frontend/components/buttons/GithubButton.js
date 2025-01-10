import { Component } from '@components';
import { userManagementClient } from '@utils/api';
import { ErrorPage } from '@utils/ErrorPage.js';
import { LocalStorage } from '@utils/storage';

export class GitHubButton extends Component {
  constructor() {
    super();
    this.state = {
      isLoading: false,
      error: null,
      attempts: 0,
      lastAttempt: null
    };
    this.maxAttempts = 3;
    this.cooldownPeriod = 5 * 60 * 1000; // 5 minutes
  }

  connectedCallback() {
    super.connectedCallback();
    this.loadState();
  }

  loadState() {
    const savedState = LocalStorage.get('githubButtonState');
    if (savedState) {
      this.state = { ...this.state, ...JSON.parse(savedState) };
      this.updateButtonState();
    }
  }

  saveState() {
    LocalStorage.set('githubButtonState', JSON.stringify(this.state));
  }

  render() {
    if (this.state.error) {
      return this.renderError();
    }
    return `
      <button id="github-btn" 
        class="btn btn-lg mb-2 light-hover w-100 ${this.isDisabled() ? 'disabled' : ''}" 
        type="button"
        ${this.isDisabled() ? 'disabled' : ''}
        aria-label="Sign in with GitHub"
        data-tooltip="${this.getTooltipText()}"
      >
        ${this.getButtonContent()}
      </button>
      <div id="error-message" class="error-text"></div>
    `;
  }

  getButtonContent() {
    if (this.state.isLoading) {
      return `
        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        <span>Connecting...</span>
      `;
    }
    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-github" viewBox="0 0 16 16">
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
      </svg>
      Sign in with GitHub
    `;
  }

  renderError() {
    return `
      <div class="error-container">
        <button id="github-btn" class="btn btn-lg mb-2 light-hover w-100 error" type="button">
          <svg class="error-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          Try Again
        </button>
        <span class="error-message">${this.state.error}</span>
      </div>
    `;
  }

  style() {
    return `
      <style>
        #github-btn {
          background-color: #171717;
          color: #ffffff;
          border: 1px solid #171717;
          border-radius: 5px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: all 0.3s ease;
          position: relative;
        }

        #github-btn:not(.disabled):hover {
          background-color: #333333;
          border-color: #333333;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        #github-btn:active {
          background-color: #000000;
          transform: translateY(0);
        }

        #github-btn.disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .spinner-border {
          margin-right: 0.5rem;
        }

        .error-container {
          text-align: center;
        }

        .error-message {
          color: #dc3545;
          font-size: 0.875rem;
          margin-top: 0.5rem;
          display: block;
        }

        .error-icon {
          width: 24px;
          height: 24px;
          fill: currentColor;
          margin-right: 0.5rem;
        }

        #github-btn.error {
          background-color: #dc3545;
          border-color: #dc3545;
        }

        #github-btn.error:hover {
          background-color: #bb2d3b;
          border-color: #bb2d3b;
        }

        [data-tooltip] {
          position: relative;
        }

        [data-tooltip]:hover:after {
          content: attr(data-tooltip);
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          background-color: rgba(0,0,0,0.8);
          color: white;
          padding: 5px 10px;
          border-radius: 4px;
          font-size: 12px;
          white-space: nowrap;
          margin-bottom: 5px;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        .shake {
          animation: shake 0.5s ease-in-out;
        }
      </style>
    `;
  }

  postRender() {
    const btn = this.querySelector('#github-btn');
    if (btn) {
      this.addComponentEventListener(btn, 'click', this.handleGitHubConnect.bind(this));
    }
  }

  isDisabled() {
    if (this.state.attempts >= this.maxAttempts && 
        this.state.lastAttempt && 
        (Date.now() - this.state.lastAttempt < this.cooldownPeriod)) {
      return true;
    }
    return false;
  }

  getTooltipText() {
    if (this.isDisabled()) {
      const remainingTime = Math.ceil((this.cooldownPeriod - (Date.now() - this.state.lastAttempt)) / 60000);
      return `Too many attempts. Please try again in ${remainingTime} minutes`;
    }
    return 'Sign in with GitHub';
  }

  async handleGitHubConnect() {
    if (this.isDisabled() || this.state.isLoading) {
      this.addShakeAnimation();
      return;
    }

    this.setState({ isLoading: true, error: null });
    try {
      const source = window.location.origin + window.location.pathname;
      const { response, body } = await userManagementClient.getOAuthGithub(source);
      
      if (response.ok) {
        window.location.href = body['redirection_url'];
      } else {
        this.handleError('Failed to connect to GitHub. Please try again.');
      }
    } catch (error) {
      this.handleError('Network error. Please check your connection.');
      ErrorPage.loadNetworkError();
    }
  }

  handleError(errorMessage) {
    const newAttempts = this.state.attempts + 1;
    this.setState({
      isLoading: false,
      error: errorMessage,
      attempts: newAttempts,
      lastAttempt: Date.now()
    });
    this.reRender();
  }

  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.saveState();
    this.updateButtonState();
  }

  updateButtonState() {
    const btn = this.querySelector('#github-btn');
    if (btn) {
      btn.disabled = this.isDisabled();
      btn.setAttribute('data-tooltip', this.getTooltipText());
    }
  }

  addShakeAnimation() {
    const btn = this.querySelector('#github-btn');
    btn.classList.add('shake');
    setTimeout(() => btn.classList.remove('shake'), 500);
  }

  reRender() {
    this.innerHTML = this.render() + this.style();
    this.postRender();
  }
}

customElements.define('github-button-component', GitHubButton);