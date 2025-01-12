import { Component } from '@components';
import { Cookies } from '@js/Cookies.js';

export class FriendsSidebar extends Component {
  constructor() {
    super();
  }

  render() {
    const mainComponent = this.getAttribute('main-component');
    const navbarHeight = document.querySelector('navbar-component')?.height || 0;
    const sidebarPosition = Cookies.get('sidebar-position') || 'hidden';
    const sidebarPositionClass = sidebarPosition === 'visible' ? '' : 'active';

    return `
      <div id="wrapper">
        <div id="main-content" class="${sidebarPositionClass}">
          <${mainComponent} ${this.getHeritedAttributes()}></${mainComponent}>
        </div>
        <nav id="sidebar-content" class="${sidebarPositionClass}" style="margin-top: ${navbarHeight}px;">
          <div class="m-2 ms-0">
            <friends-component></friends-component>
          </div>
        </nav>
      </div>
    `;
  }

  style() {
    return `
      <style>
        .wrapper {
          display: flex;
          width: 100%;
        }

        #sidebar-content {
          width: 250px;
          position: fixed;
          top: 0;
          left: calc(100% - 250px);
          height: 100vh;
          z-index: 999;
          transition: all 0.3s ease;
          background-color: var(--bs-secondary-bg);
        }

        #sidebar-content.active {
          margin-left: +250px;
        }

        #main-content {
          width: calc(100% - 250px);
          position: absolute;
          transition: all 0.3s ease;
        }

        #main-content.active {
          width: 100%;
        }

        @media (max-width: 768px) {
          #sidebar-content {
            width: 100vw;
            position: fixed;
            top: 0;
            padding-left: 0.5rem;
            left: 0;
            height: 100vh;
            z-index: 999;
            transition: all 0.3s ease;
          }

          #sidebar-content.active {
            margin-left: +2500px;
          }

          #main-content {
            width: 100%;
          }

          #main-content.active {
            width: 100%;
          }
        }
      </style>
    `;
  }

  postRender() {
    this.mainContent = this.querySelector('#main-content');
    this.sidebarContent = this.querySelector('#sidebar-content');

    const sidebarPosition = Cookies.get('sidebar-position');
    if (sidebarPosition === 'visible') {
      this.mainContent?.classList.remove('active');
      this.sidebarContent?.classList.remove('active');
    } else {
      this.mainContent?.classList.add('active');
      this.sidebarContent?.classList.add('active');
    }

    // Ensure visibility toggle works correctly
    this.addEventListener('toggle-sidebar', this.toggleVisibility.bind(this));
  }

  toggleVisibility() {
    if (this.mainContent) {
      this.mainContent.classList.toggle('active');
    }
    if (this.sidebarContent) {
      this.sidebarContent.classList.toggle('active');
    }

    const currentPosition = Cookies.get('sidebar-position');
    Cookies.add('sidebar-position', currentPosition === 'visible' ? 'hidden' : 'visible');

    // Trigger a resize event for layout adjustments
    window.dispatchEvent(new Event('resize'));
  }

  getHeritedAttributes() {
    const attributeNames = this.getAttributeNames();
    return attributeNames
      .filter((name) => name !== 'main-component' && name !== 'sidebar-component')
      .map((name) => `${name}="${this.getAttribute(name)}"`)
      .join(' ');
  }
}

customElements.define('friends-sidebar-component', FriendsSidebar);
