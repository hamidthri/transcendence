class Router {
    constructor(options = {}) {
        this.routes = new Map();
        this.params = new Map();
        this.middlewares = []; // Support for middleware
        this.defaultRoute = null;
        this.options = {
            appendSlash: options.appendSlash || false,
            caseSensitive: options.caseSensitive || false,
            baseUrl: options.baseUrl || '',
            useHash: options.useHash || false, // Add hash routing
        };
        this.setupEventListeners();
    }

    setupEventListeners() {
        window.addEventListener('popstate', () => this.handleRoute());
        document.addEventListener('DOMContentLoaded', () => this.handleRoute());
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-router-link]')) {
                e.preventDefault();
                this.navigate(e.target.getAttribute('href'));
            }
        });
    }

    addRoute(path, handler, options = {}) {
        const pattern = this.pathToRegex(path);
        this.routes.set(pattern, {
            handler,
            options: { ...this.options, ...options },
        });
        return this;
    }

    use(middleware) {
        this.middlewares.push(middleware);
        return this;
    }

    setDefaultRoute(handler) {
        this.defaultRoute = handler;
        return this;
    }

    redirect(fromPath, toPath) {
        this.addRoute(fromPath, () => this.navigate(toPath));
        return this;
    }

    pathToRegex(path) {
        const paramNames = [];
        const pattern = path
            .replace(/:[a-zA-Z]+/g, (match) => {
                paramNames.push(match.slice(1));
                return '([^/]+)';
            })
            .replace(/\*/g, '.*')
            .replace(/\//g, '\\/');
        this.params.set(pattern, paramNames);
        return new RegExp(`^${pattern}${this.options.appendSlash ? '\\/?$' : '$'}`);
    }

    extractParams(pattern, path) {
        const params = {};
        const paramNames = this.params.get(pattern.source);
        const matches = path.match(pattern);
        if (matches && paramNames) {
            matches.slice(1).forEach((value, index) => {
                params[paramNames[index]] = value;
            });
        }
        return params;
    }

    async handleRoute() {
        const path = this.options.useHash
            ? window.location.hash.slice(1)
            : window.location.pathname;
        const normalizedPath = this.normalizePath(path);

        for (const [pattern, { handler, options }] of this.routes) {
            const matches = pattern.test(normalizedPath);
            if (matches) {
                const params = this.extractParams(pattern, normalizedPath);
                const context = {
                    params,
                    query: this.parseQueryParams(),
                    path: normalizedPath,
                    options,
                };

                // Run middlewares before handler
                for (const middleware of this.middlewares) {
                    const proceed = await middleware(context);
                    if (!proceed) return; // Abort if middleware fails
                }

                try {
                    await handler(context);
                } catch (error) {
                    console.error('Route handler error:', error);
                    if (this.defaultRoute) {
                        this.defaultRoute({ error });
                    }
                }
                return;
            }
        }

        if (this.defaultRoute) {
            this.defaultRoute({ path: normalizedPath });
        }
    }

    normalizePath(path) {
        let normalized = this.options.baseUrl
            ? path.replace(this.options.baseUrl, '')
            : path;

        if (!this.options.caseSensitive) {
            normalized = normalized.toLowerCase();
        }

        if (this.options.appendSlash && !normalized.endsWith('/')) {
            normalized += '/';
        } else if (!this.options.appendSlash && normalized.endsWith('/')) {
            normalized = normalized.slice(0, -1);
        }

        return normalized;
    }

    parseQueryParams() {
        const queryParams = {};
        const searchParams = new URLSearchParams(
            this.options.useHash
                ? window.location.hash.split('?')[1]
                : window.location.search
        );
        for (const [key, value] of searchParams) {
            queryParams[key] = value;
        }
        return queryParams;
    }

    navigate(path, options = {}) {
        const url = this.options.useHash ? `#${path}` : this.options.baseUrl + path;
        if (options.replace) {
            window.history.replaceState(null, '', url);
        } else {
            window.history.pushState(null, '', url);
        }
        this.handleRoute();
    }
}
