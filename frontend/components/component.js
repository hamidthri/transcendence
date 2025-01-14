export class Component extends HTMLElement {
    #componentEventListeners;
    #rendered;
    #useShadow;
  
    constructor({ useShadow = true } = {}) {
      super();
      this.#rendered = false;
      this.#componentEventListeners = [];
      this.#useShadow = useShadow;
  
      // Attach Shadow DOM if enabled
      if (this.#useShadow) {
        this.attachShadow({ mode: "open" });
      }
    }
  
    /**
     * Lifecycle hook: called when the component is added to the DOM.
     * Triggers the `render` and `postRender` methods.
     */
    connectedCallback() {
      if (!this.#rendered) {
        try {
          const renderContent = this.render();
          const styles = this.style();
          const finalContent = styles + renderContent;
  
          if (this.#useShadow) {
            this.shadowRoot.innerHTML = finalContent;
          } else {
            this.innerHTML = finalContent;
          }
  
          this.#rendered = true;
          this.postRender();
        } catch (error) {
          console.error("Error during rendering:", error);
        }
      }
    }
  
    /**
     * Lifecycle hook: called when the component is removed from the DOM.
     * Cleans up all event listeners.
     */
    disconnectedCallback() {
      this.removeAllComponentEventListeners();
      this.onDestroy();
    }
  
    /**
     * Lifecycle hook: called when observed attributes change.
     */
    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue !== newValue) {
        this.update();
      }
    }
  
    /**
     * Adds event listeners to track and manage component events.
     * @param {HTMLElement} element - The target element.
     * @param {string} event - The event type (e.g., 'click').
     * @param {Function} callback - The callback function.
     * @param {Object} [callbackInstance] - Optional binding for the callback.
     */
    addComponentEventListener(element, event, callback, callbackInstance = this) {
      if (!element) {
        return;
      }
      if (!this.#componentEventListeners[event]) {
        this.#componentEventListeners[event] = [];
      }
      const eventCallback = callback.bind(callbackInstance);
      this.#componentEventListeners[event].push({ element, eventCallback });
      element.addEventListener(event, eventCallback);
    }
  
    /**
     * Removes a specific event listener from an element.
     * @param {HTMLElement} element - The target element.
     * @param {string} event - The event type (e.g., 'click').
     */
    removeComponentEventListener(element, event) {
      const eventListeners = this.#componentEventListeners[event];
  
      if (eventListeners) {
        for (const eventListener of eventListeners) {
          if (eventListener.element === element) {
            element.removeEventListener(event, eventListener.eventCallback);
            eventListeners.splice(eventListeners.indexOf(eventListener), 1);
          }
        }
      }
    }
  
    /**
     * Removes all event listeners tracked by the component.
     */
    removeAllComponentEventListeners() {
      for (const event in this.#componentEventListeners) {
        if (this.#componentEventListeners.hasOwnProperty(event)) {
          const eventListeners = this.#componentEventListeners[event];
          for (const eventListener of eventListeners) {
            eventListener.element.removeEventListener(
              event,
              eventListener.eventCallback
            );
          }
        }
      }
      this.#componentEventListeners = [];
    }
  
    /**
     * Updates the component by re-rendering its content.
     * @param {Object} newState - Optional new state to update.
     */
    update(newState = {}) {
      try {
        this.state = { ...this.state, ...newState };
        const renderContent = this.render();
        const styles = this.style();
        const finalContent = styles + renderContent;
  
        if (this.#useShadow) {
          this.shadowRoot.innerHTML = finalContent;
        } else {
          this.innerHTML = finalContent;
        }
  
        this.postRender();
      } catch (error) {
        console.error("Error during update:", error);
      }
    }
  
    /**
     * Lifecycle hook: allows additional actions after rendering.
     * Can be overridden in child classes.
     */
    postRender() {}
  
    /**
     * Lifecycle hook: called when the component is destroyed.
     * Can be overridden in child classes.
     */
    onDestroy() {}
  
    /**
     * Provides the HTML structure of the component.
     * Must be implemented in child classes.
     */
    render() {
      throw new Error("render() must be implemented in child classes.");
    }
  
    /**
     * Provides the styles of the component.
     * Can be overridden in child classes.
     */
    style() {
      return "<style></style>";
    }
  
    /**
     * Parses and retrieves observed attributes for dynamic updates.
     * Child classes must define observed attributes.
     */
    static get observedAttributes() {
      return [];
    }
  }
  