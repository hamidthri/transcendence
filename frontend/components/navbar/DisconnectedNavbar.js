import { Component } from '@components';
import { getRouter } from '@js/Router.js';

export class DisconnectedNavbar extends Component {
  constructor() {
    super();
  }

  render() {
    return `
      <nav id="main-navbar" class="navbar navbar-expand-lg bg-body-tertiary">
          <div class="container-fluid">
              <a class="navbar-brand" onclick="window.router.navigate('/')">Transcendence</a>
              <button class="navbar-toggler" type="button" data-bs-toggle="collapse"
                      data-bs-target="#navbarSupportedContent"
                      aria-controls="navbarSupportedContent" aria-expanded="false"
                      aria-label="Toggle navigation">
                  <span class="navbar-toggler-icon"></span>
              </button>
              <div class="collapse navbar-collapse" id="navbarSupportedContent">
                  <ul class="navbar-nav me-auto mb-2 mb-lg-0">
                      <li class="nav-item">
                          ${this.#generateNavLink('home')}
                      </li>
                      <li class="nav-item">
                          ${this.#generateNavLink('about')}
                      </li>
                      <li class="nav-item">
                          ${this.#generateNavLink('features')}
                      </li>
                  </ul>
                  <div id="auth-buttons" class="d-flex align-items-center">
                      <button class="btn btn-outline-primary me-2" id="sign-in-btn">Sign In</button>
                      <button class="btn btn-primary" id="sign-up-btn">Sign Up</button>
                  </div>
              </div>
          </div>
      </nav>
    `;
  }

  style() {
    return `
      <style>
        .navbar {
          position: fixed;
          top: 0;
          width: 100%;
          z-index: 1030;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }

        .navbar-brand {
          font-family: 'JetBrains Mono', monospace;
          font-weight: bold;
          cursor: pointer;
        }

        .nav-link {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.9rem;
        }

        .nav-link.active {
          font-weight: bold;
        }

        #auth-buttons .btn {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.9rem;
        }

        @media (max-width: 576px) {
          #auth-buttons .btn {
            font-size: 0.8rem;
          }
        }
      </style>
    `;
  }

  postRender() {
    this.signInButton = this.querySelector('#sign-in-btn');
    this.signUpButton = this.querySelector('#sign-up-btn');
    this.homeLink = this.querySelector('#home');
    this.aboutLink = this.querySelector('#about');
    this.featuresLink = this.querySelector('#features');

    super.addComponentEventListener(this.signInButton, 'click', this.#navigateToSignIn);
    super.addComponentEventListener(this.signUpButton, 'click', this.#navigateToSignUp);
    super.addComponentEventListener(this.homeLink, 'click', this.#navigate);
    super.addComponentEventListener(this.aboutLink, 'click', this.#navigate);
    super.addComponentEventListener(this.featuresLink, 'click', this.#navigate);

    const disablePaddingTop = this.getAttribute('disable-padding-top');
    if (disablePaddingTop !== 'true') {
      const navbarHeight = this.querySelector('.navbar').offsetHeight;
      document.body.style.paddingTop = navbarHeight + 'px';
    } else {
      document.body.style.paddingTop = '0px';
    }
  }

  disconnectedCallback() {
    super.removeAllComponentEventListeners();
  }

  #navigate(event) {
    const linkId = event.target.id;
    getRouter().navigate(`/${linkId}/`);
  }

  #navigateToSignIn() {
    getRouter().navigate('/signin/');
  }

  #navigateToSignUp() {
    getRouter().navigate('/signup/');
  }

  #generateNavLink(linkId) {
    const activeLink = this.getAttribute('nav-active');
    const navLink = document.createElement('a');
    navLink.setAttribute('id', linkId);
    navLink.classList.add('nav-link');
    if (activeLink === linkId) {
      navLink.classList.add('active');
    }
    navLink.text = linkId.charAt(0).toUpperCase() + linkId.slice(1);
    navLink.setAttribute('role', 'button');
    navLink.setAttribute('aria-label', `${linkId} page`);
    return navLink.outerHTML;
  }
}
