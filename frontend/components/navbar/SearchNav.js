import { Component } from '@components';
import { userManagementClient } from '@utils/api';

export class SearchNav extends Component {
  constructor() {
    super();
    this.searchResults = [];
    this.activeIndex = -1; // Tracks the currently focused result
  }

  render() {
    return `
      <div id="search-nav" class="search-container">
        <input 
          type="text" 
          id="search-input" 
          class="form-control" 
          placeholder="Search..." 
          aria-label="Search"
        />
        <ul id="search-suggestions" class="dropdown-menu"></ul>
      </div>
    `;
  }

  style() {
    return `
      <style>
        .search-container {
          position: relative;
        }

        #search-input {
          width: 250px;
          border-radius: 5px;
          padding: 0.5rem;
        }

        #search-suggestions {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          max-height: 200px;
          overflow-y: auto;
          z-index: 10;
        }

        #search-suggestions li {
          padding: 0.5rem;
          cursor: pointer;
        }

        #search-suggestions li.active {
          background-color: var(--bs-primary-bg);
          color: var(--bs-light);
        }

        #search-suggestions li:hover {
          background-color: var(--bs-secondary-bg);
        }
      </style>
    `;
  }

  postRender() {
    this.searchInput = this.querySelector('#search-input');
    this.searchSuggestions = this.querySelector('#search-suggestions');

    this.addComponentEventListener(this.searchInput, 'input', this.#onSearchInput);
    this.addComponentEventListener(this.searchInput, 'keydown', this.#onSearchKeydown);
    this.addComponentEventListener(document, 'click', (e) => this.#closeSuggestions(e));
  }

  async #onSearchInput(event) {
    const query = event.target.value.trim();
    if (!query) {
      this.#clearSuggestions();
      return;
    }

    try {
      const { response, body } = await userManagementClient.search(query);
      if (response.ok) {
        this.searchResults = body.results;
        this.#updateSuggestions();
      } else {
        this.searchResults = [];
        this.#clearSuggestions();
      }
    } catch (error) {
      console.error('Search failed:', error);
      this.searchResults = [];
      this.#clearSuggestions();
    }
  }

  #onSearchKeydown(event) {
    const key = event.key;

    if (key === 'ArrowDown') {
      this.#moveFocus(1);
    } else if (key === 'ArrowUp') {
      this.#moveFocus(-1);
    } else if (key === 'Enter' && this.activeIndex >= 0) {
      this.#selectResult(this.searchResults[this.activeIndex]);
    }
  }

  #moveFocus(direction) {
    if (this.searchResults.length === 0) return;

    this.activeIndex = (this.activeIndex + direction + this.searchResults.length) % this.searchResults.length;

    const items = this.searchSuggestions.querySelectorAll('li');
    items.forEach((item, index) => {
      if (index === this.activeIndex) {
        item.classList.add('active');
        item.scrollIntoView({ block: 'nearest' });
      } else {
        item.classList.remove('active');
      }
    });
  }

  #selectResult(result) {
    const customEvent = new CustomEvent('searchselect', { detail: result });
    this.dispatchEvent(customEvent);
    this.#clearSuggestions();
    this.searchInput.value = '';
  }

  #updateSuggestions() {
    this.searchSuggestions.innerHTML = '';
    this.activeIndex = -1;

    if (this.searchResults.length === 0) {
      this.#clearSuggestions();
      return;
    }

    this.searchResults.forEach((result, index) => {
      const li = document.createElement('li');
      li.textContent = result.username;
      li.addEventListener('click', () => this.#selectResult(result));
      this.searchSuggestions.appendChild(li);
    });
  }

  #clearSuggestions() {
    this.searchSuggestions.innerHTML = '';
    this.searchResults = [];
    this.activeIndex = -1;
  }

  #closeSuggestions(event) {
    if (!this.contains(event.target)) {
      this.#clearSuggestions();
    }
  }
}

customElements.define('search-nav-component', SearchNav);
