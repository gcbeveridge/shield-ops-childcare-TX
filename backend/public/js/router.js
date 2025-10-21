// =============================================
// SHIELD OPS ROUTING SYSTEM
// =============================================

class Router {
    constructor(routes) {
        this.routes = routes;
        this.currentRoute = null;
        this.params = {};
        this.init();
    }

    init() {
        // Listen for hash changes
        window.addEventListener('hashchange', () => this.handleRouteChange());

        // Listen for popstate (back/forward buttons)
        window.addEventListener('popstate', () => this.handleRouteChange());

        // Handle initial route immediately
        this.handleRouteChange();
    }

    handleRouteChange() {
        const hash = window.location.hash.slice(1) || '/dashboard';
        const path = hash.split('?')[0]; // Remove query string
        this.navigate(path, false); // false = don't update hash (already changed)
    }

    navigate(path, updateHash = true) {
        console.log('Router: Navigating to', path);

        const route = this.matchRoute(path);

        if (!route) {
            console.error('Route not found:', path);
            this.navigate('/dashboard', updateHash);
            return;
        }

        // Update hash if needed
        if (updateHash) {
            window.location.hash = path;
        }

        // Store current route
        this.currentRoute = route;
        this.params = route.params || {};

        // Update active navigation item
        this.updateActiveNav(path);

        // Execute route handler
        if (route.handler) {
            route.handler(this.params);
        }
    }

    updateActiveNav(path) {
        // Remove active class from all nav items
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => item.classList.remove('active'));

        // Find and activate matching nav item
        const matchingItem = document.querySelector(`.nav-item[href="#${path}"]`);
        if (matchingItem) {
            matchingItem.classList.add('active');
        } else {
            // Try to match base path (e.g., /staff for /staff/:id)
            const basePath = '/' + path.split('/')[1];
            const baseItem = document.querySelector(`.nav-item[href="#${basePath}"]`);
            if (baseItem) {
                baseItem.classList.add('active');
            }
        }
    }

    matchRoute(path) {
        // Try exact match first
        for (const route of this.routes) {
            if (route.path === path) {
                return { ...route, params: {} };
            }
        }

        // Try pattern matching with parameters
        for (const route of this.routes) {
            const params = this.matchPattern(route.path, path);
            if (params !== null) {
                return { ...route, params };
            }
        }

        return null;
    }

    matchPattern(pattern, path) {
        // Convert route pattern to regex
        // /staff/:id → /staff/([^/]+)
        const paramNames = [];
        const regexPattern = pattern.replace(/:([^/]+)/g, (match, paramName) => {
            paramNames.push(paramName);
            return '([^/]+)';
        });

        const regex = new RegExp(`^${regexPattern}$`);
        const match = path.match(regex);

        if (!match) {
            return null;
        }

        // Extract parameters
        const params = {};
        paramNames.forEach((name, index) => {
            params[name] = match[index + 1];
        });

        return params;
    }

    // Helper method to build URLs with parameters
    buildUrl(path, params = {}) {
        let url = path;
        Object.keys(params).forEach(key => {
            url = url.replace(`:${key}`, params[key]);
        });
        return url;
    }

    // Get current route info
    getCurrentRoute() {
        return {
            path: this.currentRoute?.path,
            params: this.params
        };
    }

    // Navigate programmatically
    go(path) {
        this.navigate(path, true);
    }

    // Go back
    back() {
        window.history.back();
    }

    // Go forward
    forward() {
        window.history.forward();
    }
}

// Export for use in app.js
window.Router = Router;
