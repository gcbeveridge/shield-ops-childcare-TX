// =============================================
// HTML PARTIAL LOADER UTILITY
// =============================================

class HTMLLoader {
    constructor() {
        this.cache = new Map();
        this.loading = new Map();
    }

    /**
     * Load an HTML partial from a file
     * @param {string} path - Path to the HTML file (relative to /partials/)
     * @param {boolean} useCache - Whether to use cached version (default: true)
     * @returns {Promise<string>} - HTML content
     */
    async loadPartial(path, useCache = true) {
        // Check cache first
        if (useCache && this.cache.has(path)) {
            console.log(`HTMLLoader: Using cached partial: ${path}`);
            return this.cache.get(path);
        }

        // Check if already loading (prevent duplicate requests)
        if (this.loading.has(path)) {
            console.log(`HTMLLoader: Waiting for in-progress load: ${path}`);
            return this.loading.get(path);
        }

        // Create loading promise
        const loadPromise = this.fetchPartial(path);
        this.loading.set(path, loadPromise);

        try {
            const html = await loadPromise;
            
            // Cache the result
            if (useCache) {
                this.cache.set(path, html);
            }
            
            return html;
        } finally {
            // Remove from loading map
            this.loading.delete(path);
        }
    }

    /**
     * Fetch HTML partial from server
     * @param {string} path - Path to the HTML file
     * @returns {Promise<string>} - HTML content
     */
    async fetchPartial(path) {
        console.log(`HTMLLoader: Fetching partial: ${path}`);
        
        try {
            const fullPath = `/partials/${path}`;
            const response = await fetch(fullPath);
            
            if (!response.ok) {
                throw new Error(`Failed to load partial: ${path} (${response.status})`);
            }
            
            const html = await response.text();
            console.log(`HTMLLoader: Successfully loaded: ${path}`);
            return html;
        } catch (error) {
            console.error(`HTMLLoader: Error loading ${path}:`, error);
            throw error;
        }
    }

    /**
     * Load and inject HTML into a container
     * @param {string} path - Path to the HTML file
     * @param {string|HTMLElement} container - Container selector or element
     * @param {boolean} append - Whether to append (true) or replace (false)
     * @returns {Promise<void>}
     */
    async loadInto(path, container, append = false) {
        const html = await this.loadPartial(path);
        
        const containerEl = typeof container === 'string' 
            ? document.querySelector(container) 
            : container;
        
        if (!containerEl) {
            throw new Error(`Container not found: ${container}`);
        }

        if (append) {
            containerEl.insertAdjacentHTML('beforeend', html);
        } else {
            containerEl.innerHTML = html;
        }
    }

    /**
     * Load multiple partials in parallel
     * @param {string[]} paths - Array of paths to HTML files
     * @param {boolean} useCache - Whether to use cached versions
     * @returns {Promise<Object>} - Object with path as key and HTML as value
     */
    async loadMultiple(paths, useCache = true) {
        console.log(`HTMLLoader: Loading ${paths.length} partials in parallel`);
        
        const promises = paths.map(path => 
            this.loadPartial(path, useCache)
                .then(html => ({ path, html }))
                .catch(error => ({ path, error }))
        );

        const results = await Promise.all(promises);
        
        // Convert array to object
        const resultMap = {};
        results.forEach(({ path, html, error }) => {
            if (error) {
                console.error(`HTMLLoader: Failed to load ${path}:`, error);
                resultMap[path] = null;
            } else {
                resultMap[path] = html;
            }
        });

        return resultMap;
    }

    /**
     * Preload partials (fetch and cache without inserting)
     * @param {string[]} paths - Array of paths to preload
     */
    async preload(paths) {
        console.log(`HTMLLoader: Preloading ${paths.length} partials`);
        await this.loadMultiple(paths, true);
    }

    /**
     * Clear cache for specific path or all paths
     * @param {string} [path] - Optional path to clear. If not provided, clears all cache
     */
    clearCache(path) {
        if (path) {
            this.cache.delete(path);
            console.log(`HTMLLoader: Cleared cache for ${path}`);
        } else {
            this.cache.clear();
            console.log('HTMLLoader: Cleared all cache');
        }
    }

    /**
     * Get cache statistics
     * @returns {Object} - Cache stats
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            paths: Array.from(this.cache.keys()),
            loading: Array.from(this.loading.keys())
        };
    }
}

// Create global instance
window.htmlLoader = new HTMLLoader();

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HTMLLoader;
}
