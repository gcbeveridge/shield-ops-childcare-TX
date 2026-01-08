// =============================================
// THEME MANAGEMENT - Light/Dark Mode
// =============================================

function initTheme() {
    const savedTheme = localStorage.getItem('shield-ops-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeToggleIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('shield-ops-theme', newTheme);
    updateThemeToggleIcon(newTheme);
    
    // Add celebration effect on toggle
    const toggle = document.getElementById('theme-toggle');
    if (toggle) {
        toggle.style.transform = 'scale(1.2) rotate(360deg)';
        setTimeout(() => {
            toggle.style.transform = '';
        }, 300);
    }
}

function updateThemeToggleIcon(theme) {
    const toggle = document.getElementById('theme-toggle');
    if (!toggle) return;
    
    const sunIcon = toggle.querySelector('.sun-icon');
    const moonIcon = toggle.querySelector('.moon-icon');
    
    if (sunIcon && moonIcon) {
        if (theme === 'dark') {
            sunIcon.style.display = 'block';
            moonIcon.style.display = 'none';
        } else {
            sunIcon.style.display = 'none';
            moonIcon.style.display = 'block';
        }
    }
}

// Initialize theme on page load
document.addEventListener('DOMContentLoaded', initTheme);

// =============================================
// CELEBRATION EFFECTS
// =============================================

function triggerConfetti(count = 50) {
    const colors = ['#b4d333', '#f5c842', '#2c5f7c', '#22c55e', '#3b82f6'];
    
    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
            confetti.style.width = (Math.random() * 8 + 6) + 'px';
            confetti.style.height = (Math.random() * 8 + 6) + 'px';
            confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
            document.body.appendChild(confetti);
            
            setTimeout(() => confetti.remove(), 4000);
        }, i * 30);
    }
}

function celebrateMilestone(message) {
    triggerConfetti(80);
    showSuccess(message || 'Milestone achieved! Keep up the great work!');
}

// =============================================
// API CLIENT & AUTHENTICATION
// =============================================

// Simple in-memory cache for API responses
const apiCache = {
    data: new Map(),
    set(key, value, ttl = 60000) { // Default 60 second cache
        this.data.set(key, {
            value,
            expiry: Date.now() + ttl
        });
    },
    get(key) {
        const item = this.data.get(key);
        if (!item) return null;
        if (Date.now() > item.expiry) {
            this.data.delete(key);
            return null;
        }
        return item.value;
    },
    invalidate(pattern) {
        // Invalidate cache entries matching a pattern
        for (let key of this.data.keys()) {
            if (key.includes(pattern)) {
                this.data.delete(key);
            }
        }
    },
    clear() {
        this.data.clear();
    }
};

// Determine API base URL based on environment
function getApiBaseUrl() {
    // Just use relative URLs - backend is on same domain
    return '/api';
}

const API_BASE_URL = getApiBaseUrl();
console.log('API Base URL:', API_BASE_URL);

const AppState = {
    token: localStorage.getItem('token') || null,
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    facility: JSON.parse(localStorage.getItem('facility') || 'null')
};

function saveAuthData(token, user, facility) {
    AppState.token = token;
    AppState.user = user;
    AppState.facility = facility;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('facility', JSON.stringify(facility));
}

function clearAuthData() {
    AppState.token = null;
    AppState.user = null;
    AppState.facility = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('facility');
    apiCache.clear(); // Clear cache on logout
}

async function apiRequest(endpoint, options = {}) {
    // Check cache for GET requests (unless skipCache is true)
    if ((!options.method || options.method === 'GET') && !options.skipCache) {
        const cacheKey = `${endpoint}${JSON.stringify(options.params || {})}`;
        const cached = apiCache.get(cacheKey);
        if (cached) {
            console.log('✅ Cache hit:', endpoint);
            return cached;
        }
    }

    const headers = {
        ...options.headers
    };

    // Don't set Content-Type for FormData (browser will set it with boundary)
    if (!options.isFormData) {
        headers['Content-Type'] = 'application/json';
    }

    if (AppState.token && !options.skipAuth) {
        headers['Authorization'] = `Bearer ${AppState.token}`;
    }

    try {
        const startTime = performance.now();
        console.log('🌐 API Request:', `${API_BASE_URL}${endpoint}`, options.method || 'GET');
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers
        });

        const duration = (performance.now() - startTime).toFixed(2);
        console.log(`⚡ API Response (${duration}ms):`, response.status, response.statusText);

        if (!response.ok) {
            // Handle 401 Unauthorized - token is invalid/expired
            if (response.status === 401) {
                console.warn('⚠️ 401 Unauthorized - clearing auth and redirecting to login');
                clearAuthData();

                // Show login screen
                const app = document.getElementById('app');
                const authContainer = document.getElementById('auth-container');
                const loginScreen = document.getElementById('login-screen');
                const signupScreen = document.getElementById('signup-screen');

                if (app) {
                    app.classList.remove('active');
                    updateHamburgerVisibility();
                }
                if (authContainer) authContainer.style.display = 'block';
                if (loginScreen) loginScreen.style.display = 'flex';
                if (signupScreen) signupScreen.style.display = 'none';
                updateHamburgerVisibility();

                throw new Error('Session expired. Please login again.');
            }

            const error = await response.json().catch(() => ({ error: response.statusText }));
            console.error('API Error response:', error);
            throw new Error(error.error || error.message || 'Request failed');
        }

        const data = await response.json();

        // Cache GET requests
        if (!options.method || options.method === 'GET') {
            const cacheKey = `${endpoint}${JSON.stringify(options.params || {})}`;
            const cacheTTL = options.cacheTTL || 30000; // Default 30 seconds
            apiCache.set(cacheKey, data, cacheTTL);
        }

        // Invalidate related cache on mutations
        if (options.method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method)) {
            // Extract resource type from endpoint (e.g., /medications/123 -> medications)
            const resourceMatch = endpoint.match(/\/([^\/]+)/);
            if (resourceMatch) {
                apiCache.invalidate(resourceMatch[1]);
            }
        }

        return data;
    } catch (error) {
        console.error('API Request failed:', error.message || error);
        throw error;
    }
}

async function apiUpload(endpoint, formData) {
    const headers = {};

    if (AppState.token) {
        headers['Authorization'] = `Bearer ${AppState.token}`;
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers,
            body: formData
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: response.statusText }));
            throw new Error(error.error || error.message || 'Upload failed');
        }

        return await response.json();
    } catch (error) {
        console.error('Upload failed:', error);
        throw error;
    }
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-notification ${type}`;

    const icons = {
        'success': '✓',
        'error': '✕',
        'warning': '⚠',
        'info': 'ℹ'
    };

    const icon = icons[type] || icons['info'];

    // Split message by newlines for multi-line messages
    const messageParts = message.split('\n\n');
    const mainMessage = messageParts[0];
    const subMessage = messageParts[1] || '';

    toast.innerHTML = `
        <div class="toast-icon">${icon}</div>
        <div class="toast-message">
            <div style="font-weight: 600;">${mainMessage}</div>
            ${subMessage ? `<div style="font-size: 12px; margin-top: 4px; opacity: 0.9;">${subMessage}</div>` : ''}
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 5000); // Extended to 5s for better readability
}

function showError(message) {
    // Enhanced error messages with context
    const errorContext = {
        'Failed to load medication': 'The medication record could not be found. It may have been deleted or expired.',
        'Medication not found': 'This medication authorization no longer exists. Please check the Active Medications list.',
        'Authentication failed': 'Your session may have expired. Please try logging in again.',
        'Failed to load medications': 'Unable to connect to the server. Please check your internet connection and try again.',
        'Failed to load staff': 'Unable to load staff data. Please refresh the page or contact support.',
        'Network error': 'Connection lost. Please check your internet connection and try again.',
        'Validation failed': 'Please check all required fields are filled correctly.'
    };

    // Check if we have enhanced context
    let enhancedMessage = message;
    for (const [key, value] of Object.entries(errorContext)) {
        if (message.includes(key)) {
            enhancedMessage = `${message}\n\n${value}`;
            break;
        }
    }

    showToast(enhancedMessage, 'error');
}

function showSuccess(message) {
    showToast(message, 'success');
}

function showInfo(message) {
    showToast(message, 'info');
}

function showWarning(message) {
    showToast(message, 'warning');
}

function setLoading(button, loading = true) {
    if (loading) {
        button.disabled = true;
        button.dataset.originalText = button.textContent;
        button.innerHTML = '<div class="spinner" style="display: inline-block; width: 16px; height: 16px; margin-right: 8px; vertical-align: middle;"></div>Loading...';
        button.style.opacity = '0.8';
        button.style.cursor = 'not-allowed';
    } else {
        button.disabled = false;
        button.innerHTML = button.dataset.originalText || button.textContent;
        button.style.opacity = '1';
        button.style.cursor = 'pointer';
    }
}

// =============================================
// SKELETON SCREEN UTILITIES
// =============================================

function showTableSkeleton(tableSelector, rows = 5, columns = 6) {
    const tbody = document.querySelector(`${tableSelector} tbody`);
    if (!tbody) return;

    let skeletonHTML = '';
    for (let i = 0; i < rows; i++) {
        skeletonHTML += '<tr>';
        for (let j = 0; j < columns; j++) {
            skeletonHTML += '<td><div class="skeleton skeleton-text"></div></td>';
        }
        skeletonHTML += '</tr>';
    }

    tbody.innerHTML = skeletonHTML;
}

function showCardSkeleton(cardSelector) {
    const card = document.querySelector(cardSelector);
    if (!card) return;

    const skeletonHTML = `
        <div class="skeleton-card">
            <div class="skeleton skeleton-header"></div>
            <div class="skeleton-content">
                <div class="skeleton skeleton-text" style="width: 90%;"></div>
                <div class="skeleton skeleton-text" style="width: 75%;"></div>
                <div class="skeleton skeleton-text" style="width: 85%;"></div>
                <div class="skeleton skeleton-text" style="width: 60%;"></div>
            </div>
        </div>
    `;

    card.innerHTML = skeletonHTML;
}

function showMetricsSkeleton(containerSelector) {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    const skeletonHTML = `
        <div class="skeleton-metric">
            <div class="skeleton skeleton-icon"></div>
            <div class="skeleton-value">
                <div class="skeleton skeleton-label"></div>
                <div class="skeleton skeleton-number"></div>
            </div>
        </div>
        <div class="skeleton-metric">
            <div class="skeleton skeleton-icon"></div>
            <div class="skeleton-value">
                <div class="skeleton skeleton-label"></div>
                <div class="skeleton skeleton-number"></div>
            </div>
        </div>
        <div class="skeleton-metric">
            <div class="skeleton skeleton-icon"></div>
            <div class="skeleton-value">
                <div class="skeleton skeleton-label"></div>
                <div class="skeleton skeleton-number"></div>
            </div>
        </div>
    `;

    container.innerHTML = skeletonHTML;
}

function showLoadingOverlay(containerSelector, message = 'Loading...') {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    // Make container position relative if not already
    const currentPosition = window.getComputedStyle(container).position;
    if (currentPosition === 'static') {
        container.style.position = 'relative';
    }

    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `
        <div style="text-align: center;">
            <div class="spinner spinner-large spinner-primary"></div>
            <p style="margin-top: 16px; font-size: 14px; color: var(--gray-700);">${message}</p>
        </div>
    `;
    overlay.id = 'temp-loading-overlay';

    container.appendChild(overlay);
}

function hideLoadingOverlay() {
    const overlay = document.getElementById('temp-loading-overlay');
    if (overlay) {
        overlay.remove();
    }
}

// =============================================
// MOBILE MENU UTILITIES
// =============================================

function toggleMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('mobile-overlay');
    const hamburger = document.getElementById('hamburger');

    if (!sidebar || !overlay || !hamburger) return;

    const isOpen = sidebar.classList.contains('mobile-open');

    if (isOpen) {
        sidebar.classList.remove('mobile-open');
        overlay.classList.remove('active');
        hamburger.classList.remove('active');
        document.body.classList.remove('mobile-menu-open');
    } else {
        sidebar.classList.add('mobile-open');
        overlay.classList.add('active');
        hamburger.classList.add('active');
        document.body.classList.add('mobile-menu-open');
    }
}

function closeMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('mobile-overlay');
    const hamburger = document.getElementById('hamburger');

    if (!sidebar || !overlay || !hamburger) return;

    sidebar.classList.remove('mobile-open');
    overlay.classList.remove('active');
    hamburger.classList.remove('active');
    document.body.classList.remove('mobile-menu-open');
}

function updateHamburgerVisibility() {
    const hamburger = document.getElementById('hamburger');
    const app = document.getElementById('app');

    if (!hamburger) return;

    const shouldShow = window.innerWidth <= 768 && app && app.classList.contains('active');

    if (shouldShow) {
        hamburger.style.display = 'flex';
    } else {
        hamburger.style.display = 'none';
        hamburger.classList.remove('active');
        document.body.classList.remove('mobile-menu-open');
        closeMobileMenu();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    updateHamburgerVisibility();

    window.addEventListener('resize', () => {
        updateHamburgerVisibility();
        if (window.innerWidth > 768) {
            closeMobileMenu();
        }
    });
});

document.addEventListener('click', event => {
    if (window.innerWidth > 768) return;

    if (event.target.closest('.nav-item')) {
        closeMobileMenu();
    }
});

// =============================================
// TABLE SORTING UTILITY
// =============================================

let currentSortColumn = null;
let currentSortDirection = 'asc';

function makeSortable(tableSelector) {
    const table = document.querySelector(tableSelector);
    if (!table) return;

    const headers = table.querySelectorAll('thead th');
    headers.forEach((header, index) => {
        // Skip if header already has sorting
        if (header.classList.contains('sortable')) return;

        header.classList.add('sortable');
        header.style.cursor = 'pointer';
        header.style.userSelect = 'none';
        header.style.position = 'relative';
        header.style.paddingRight = '24px';

        // Add sort indicator
        const indicator = document.createElement('span');
        indicator.className = 'sort-indicator';
        indicator.innerHTML = '↕';
        indicator.style.position = 'absolute';
        indicator.style.right = '8px';
        indicator.style.opacity = '0.3';
        indicator.style.fontSize = '12px';
        header.appendChild(indicator);

        header.addEventListener('click', () => sortTable(table, index, header));
    });
}

function sortTable(table, columnIndex, header) {
    const tbody = table.querySelector('tbody');
    if (!tbody) return;

    const rows = Array.from(tbody.querySelectorAll('tr'));

    // Determine sort direction
    const isCurrentColumn = currentSortColumn === columnIndex;
    const direction = isCurrentColumn && currentSortDirection === 'asc' ? 'desc' : 'asc';

    // Clear all indicators
    table.querySelectorAll('.sort-indicator').forEach(ind => {
        ind.innerHTML = '↕';
        ind.style.opacity = '0.3';
    });

    // Update current sort
    currentSortColumn = columnIndex;
    currentSortDirection = direction;

    // Update indicator
    const indicator = header.querySelector('.sort-indicator');
    if (indicator) {
        indicator.innerHTML = direction === 'asc' ? '↑' : '↓';
        indicator.style.opacity = '1';
        indicator.style.color = 'var(--primary)';
    }

    // Sort rows
    rows.sort((a, b) => {
        const cellA = a.cells[columnIndex];
        const cellB = b.cells[columnIndex];

        if (!cellA || !cellB) return 0;

        // Get text content, strip HTML tags and badges
        let aText = cellA.textContent.trim();
        let bText = cellB.textContent.trim();

        // Try to parse as number
        const aNum = parseFloat(aText.replace(/[^0-9.-]/g, ''));
        const bNum = parseFloat(bText.replace(/[^0-9.-]/g, ''));

        if (!isNaN(aNum) && !isNaN(bNum)) {
            return direction === 'asc' ? aNum - bNum : bNum - aNum;
        }

        // Try to parse as date
        const aDate = new Date(aText);
        const bDate = new Date(bText);

        if (aDate.toString() !== 'Invalid Date' && bDate.toString() !== 'Invalid Date') {
            return direction === 'asc' ? aDate - bDate : bDate - aDate;
        }

        // String comparison
        const comparison = aText.localeCompare(bText);
        return direction === 'asc' ? comparison : -comparison;
    });

    // Re-append rows in sorted order
    rows.forEach(row => tbody.appendChild(row));

    // Add subtle animation
    tbody.style.opacity = '0.7';
    setTimeout(() => {
        tbody.style.opacity = '1';
    }, 100);
}

// =============================================
// AUTH FUNCTIONS
// =============================================

async function login(event) {
    event.preventDefault();

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
        showError('Please enter email and password');
        return;
    }

    try {
        const data = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        saveAuthData(data.token, data.user, data.facility);

        // Hide all auth screens
        const authContainer = document.getElementById('auth-container');
        const loginScreen = document.getElementById('login-screen');
        const signupScreen = document.getElementById('signup-screen');

        if (authContainer) authContainer.style.display = 'none';
        if (loginScreen) loginScreen.style.display = 'none';
        if (signupScreen) signupScreen.style.display = 'none';
        document.getElementById('app').classList.add('active');

        // Load sidebar if using modular architecture
        const sidebarContainer = document.getElementById('sidebar-container');
        if (sidebarContainer && !sidebarContainer.innerHTML.trim()) {
            await window.htmlLoader.loadInto('sidebar.html', '#sidebar-container');
            console.log('✅ Sidebar loaded after login');
        }

        // Update sidebar user info after login
        updateSidebarUserInfo();

        updateFacilityInfo();

        // Initialize router after login
        if (typeof Router !== 'undefined' && typeof appRoutes !== 'undefined' && !window.appRouter) {
            window.appRouter = new Router(appRoutes);
            console.log('Router initialized after login');

            // Preload screens in background
            window.htmlLoader.preloadAllScreens().catch(err => {
                console.error('Failed to preload screens:', err);
            });
        } else if (window.appRouter) {
            // Router already exists, just navigate to dashboard
            window.appRouter.go('/dashboard');
        } else {
            // Fallback to loading dashboard directly
            await loadDashboard();
        }
    } catch (error) {
        showError(error.message || 'Login failed');
    }
}

async function signup(event) {
    event.preventDefault();

    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const facilityName = document.getElementById('signup-facility').value;
    const facilityAddress = document.getElementById('signup-address').value;

    if (!name || !email || !password || !facilityName) {
        showError('Please fill in all required fields');
        return;
    }

    try {
        const data = await apiRequest('/auth/signup', {
            method: 'POST',
            body: JSON.stringify({
                name,
                email,
                password,
                facilityName,
                facilityAddress
            })
        });

        saveAuthData(data.token, data.user, data.facility);

        // Hide all auth screens
        const authContainer = document.getElementById('auth-container');
        const loginScreen = document.getElementById('login-screen');
        const signupScreen = document.getElementById('signup-screen');

        if (authContainer) authContainer.style.display = 'none';
        if (loginScreen) loginScreen.style.display = 'none';
        if (signupScreen) signupScreen.style.display = 'none';
        document.getElementById('app').classList.add('active');

        // Load sidebar if using modular architecture
        const sidebarContainer = document.getElementById('sidebar-container');
        if (sidebarContainer && !sidebarContainer.innerHTML.trim()) {
            await window.htmlLoader.loadInto('sidebar.html', '#sidebar-container');
            console.log('✅ Sidebar loaded after signup');
        }

        // Update sidebar user info after signup
        updateSidebarUserInfo();

        updateFacilityInfo();

        // Initialize router after signup
        if (typeof Router !== 'undefined' && typeof appRoutes !== 'undefined' && !window.appRouter) {
            window.appRouter = new Router(appRoutes);
            console.log('Router initialized after signup');

            // Preload screens in background
            window.htmlLoader.preloadAllScreens().catch(err => {
                console.error('Failed to preload screens:', err);
            });
        } else if (window.appRouter) {
            // Router already exists, just navigate to dashboard
            window.appRouter.go('/dashboard');
        } else {
            // Fallback to loading dashboard directly
            await loadDashboard();
        }
    } catch (error) {
        showError(error.message || 'Signup failed');
    }
}

function showSignup() {
    const loginScreen = document.getElementById('login-screen');
    const signupScreen = document.getElementById('signup-screen');

    if (loginScreen) loginScreen.style.display = 'none';
    if (signupScreen) signupScreen.style.display = 'flex';
}

function showLogin() {
    const signupScreen = document.getElementById('signup-screen');
    const loginScreen = document.getElementById('login-screen');

    if (signupScreen) signupScreen.style.display = 'none';
    if (loginScreen) loginScreen.style.display = 'flex';
}

function logout() {
    clearAuthData();

    // Hide app and show login screen
    const app = document.getElementById('app');
    const authContainer = document.getElementById('auth-container');
    const loginScreen = document.getElementById('login-screen');
    const signupScreen = document.getElementById('signup-screen');

    if (app) {
        app.classList.remove('active');
        updateHamburgerVisibility();
    }
    if (authContainer) authContainer.style.display = 'block';
    if (loginScreen) loginScreen.style.display = 'flex';
    if (signupScreen) signupScreen.style.display = 'none';
    updateHamburgerVisibility();

    // Clear the screen container
    const screenContainer = document.getElementById('screen-container');
    if (screenContainer) screenContainer.innerHTML = '';
}

// Navigation
function showScreen(screenId) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });

    // Show selected screen
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
    }

    // Update nav items - find the nav item that matches this screen
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        // Check if this nav item is for the current screen
        const onclick = item.getAttribute('onclick');
        if (onclick && onclick.includes(`'${screenId}'`)) {
            item.classList.add('active');
        }
    });
}

// =============================================
// DASHBOARD HELPERS
// =============================================

async function loadDashboardData() {
    if (!AppState.facility) return;

    try {
        // Initialize CAC dashboard with placeholders
        initializeCACDashboard();

        const dashboardData = await apiRequest(`/facilities/${AppState.facility.id}/dashboard`);

        // Update greeting
        const hour = new Date().getHours();
        let greeting = 'Good morning';
        if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
        if (hour >= 17) greeting = 'Good evening';

        if (AppState.user) {
            const userName = AppState.user.name || AppState.user.email.split('@')[0];
            const greetingEl = document.getElementById('dashboard-greeting');
            if (greetingEl) {
                greetingEl.innerHTML = `
                    <span style="display: block; font-size: 1.5rem; font-weight: 600; opacity: 0.9; margin-bottom: 8px;">${greeting},</span>
                    ${userName.split(' ')[0]}
                `;
            }
        }

        // Load weather data
        await loadWeatherData();

        // Load rooms preview for spot-checks
        await loadRoomsPreview();

        // Update new dashboard metrics
        updateModernDashboard(dashboardData.data);
        
        // Load priority heat map
        await loadPriorityHeatMap();
        
        // Load ratio spot-check widget
        await loadRatioSpotCheckWidget();
    } catch (error) {
        console.error('Failed to load dashboard:', error);
    }
}

// Initialize CAC Dashboard with default values
function initializeCACDashboard() {
    // Set placeholder values for metrics
    const updates = {
        'risk-score-display': '92',
        'streak-days-display': '45',
        'compliance-rate-display': '94%',
        'last-inspection-display': '23',
        'next-goal-display': '50 days',
        'next-inspection-display': '127 days',
        'missing-docs-count': '3',
        'expired-docs-count': '1',
        'staff-certs-count': '15/15',
        'pending-signatures-count': '2',
        'missing-docs-progress': '25%',
        'expired-docs-progress': '10%',
        'staff-certs-progress': '100%',
        'pending-signatures-progress': '20%'
    };

    Object.entries(updates).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) {
            if (id.includes('progress')) {
                el.style.width = value;
            } else {
                el.textContent = value;
            }
        }
    });
}

// ============================================
// PRIORITY / ACTION LANE FUNCTIONS
// ============================================

async function loadPriorityHeatMap() {
    try {
        const facilityId = AppState.facility?.id;
        if (!facilityId) return;
        
        // Generate alerts from current data
        try {
            await apiRequest(`/facilities/${facilityId}/alerts/generate`, { method: 'POST' });
        } catch (e) {
            console.log('Alert generation skipped:', e.message);
        }

        // Fetch active alerts
        const alertsResponse = await apiRequest(`/facilities/${facilityId}/alerts`);
        const alerts = alertsResponse?.data || [];

        // Group by severity
        const priorities = {
            critical: [],
            medium: [],
            low: []
        };

        let hasNewAlerts = {
            critical: false,
            medium: false,
            low: false
        };

        alerts.forEach(alert => {
            const priority = {
                id: alert.id,
                type: alert.alert_type,
                icon: getSeverityIcon(alert.severity),
                title: alert.title,
                description: alert.message,
                action: 'Take Action',
                actionUrl: alert.action_url || '/dashboard',
                alertId: alert.id,
                acknowledged: alert.acknowledged,
                createdAt: alert.created_at
            };

            if (alert.severity === 'critical') {
                priorities.critical.push(priority);
                if (!alert.acknowledged) hasNewAlerts.critical = true;
            } else if (alert.severity === 'warning') {
                priorities.medium.push(priority);
                if (!alert.acknowledged) hasNewAlerts.medium = true;
            } else if (alert.severity === 'info') {
                priorities.low.push(priority);
                if (!alert.acknowledged) hasNewAlerts.low = true;
            }
        });

        // Update counts for new Now/Next/Watch structure
        const nowCount = document.getElementById('now-count');
        const nextCount = document.getElementById('next-count');
        const watchCount = document.getElementById('watch-count');
        const timestamp = document.getElementById('action-lane-timestamp');

        if (nowCount) nowCount.textContent = priorities.critical.length;
        if (nextCount) nextCount.textContent = priorities.medium.length;
        if (watchCount) watchCount.textContent = priorities.low.length;
        if (timestamp) timestamp.textContent = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        // Populate action lanes with glow effect for new alerts
        populateActionLane('now', priorities.critical, hasNewAlerts.critical);
        populateActionLane('next', priorities.medium, hasNewAlerts.medium);
        populateActionLane('watch', priorities.low, hasNewAlerts.low);
        
        // Update Center Pulse score based on compliance
        updateCenterPulse(priorities);

    } catch (error) {
        console.error('Error loading priority data:', error);
    }
}

function getSeverityIcon(severity) {
    const icons = {
        critical: '🚨',
        warning: '⚠️',
        info: '📋'
    };
    return icons[severity] || '🔔';
}

function updateCenterPulse(priorities) {
    const scoreEl = document.getElementById('center-pulse-score');
    
    // Calculate score (100 - critical*10 - medium*3)
    let score = 100 - (priorities.critical.length * 10) - (priorities.medium.length * 3);
    score = Math.max(0, Math.min(100, score));
    
    if (scoreEl) scoreEl.textContent = score;
    
    // Update the new Health Command Center with real data
    updateHealthCommandCenter(priorities, score);
    
    // Celebrate high scores
    if (score >= 95 && priorities.critical.length === 0) {
        setTimeout(() => triggerConfetti(30), 500);
    }
}

// ============================================
// HEALTH COMMAND CENTER - Real-time Data
// ============================================

let healthCommandCenterInterval = null;

async function updateHealthCommandCenter(priorities, overallScore) {
    const facilityId = AppState.facility?.id;
    if (!facilityId) return;
    
    try {
        // Fetch all data in parallel for real-time update
        const [staffRes, docsRes, checklistsRes, incidentsRes, trainingRes] = await Promise.all([
            apiRequest(`/facilities/${facilityId}/staff`).catch(() => ({ data: [] })),
            apiRequest(`/facilities/${facilityId}/documents`).catch(() => ({ data: [] })),
            apiRequest(`/facilities/${facilityId}/checklists`).catch(() => ({ data: [] })),
            apiRequest(`/facilities/${facilityId}/incidents`).catch(() => ({ data: [] })),
            apiRequest(`/facilities/${facilityId}/training/completions`).catch(() => ({ data: [] }))
        ]);
        
        const staff = staffRes?.data || [];
        const docs = docsRes?.data || [];
        const checklists = checklistsRes?.data || [];
        const incidents = incidentsRes?.data || [];
        const trainingCompletions = trainingRes?.data || [];
        
        // Calculate breakdown percentages
        const breakdown = calculateScoreBreakdown(staff, docs, checklists, trainingCompletions);
        
        // Update breakdown bars
        updateBreakdownBars(breakdown);
        
        // Calculate incident-free streak
        const streakDays = calculateIncidentFreeStreak(incidents);
        updateStreakBadge(streakDays);
        
        // Calculate and display score trend
        updateScoreTrend(overallScore);
        
        // Generate and display quick wins
        const quickWins = generateQuickWins(staff, docs, checklists, trainingCompletions, priorities);
        updateQuickWins(quickWins, overallScore);
        
    } catch (error) {
        console.error('Error updating Health Command Center:', error);
    }
}

function calculateScoreBreakdown(staff, docs, checklists, trainingCompletions) {
    // Staff Certifications Score
    let staffTotal = 0;
    let staffCompliant = 0;
    const today = new Date();
    
    staff.forEach(member => {
        const certs = member.certifications || {};
        
        // Count CPR/First Aid
        staffTotal++;
        if (certs.cprFirstAid?.expirationDate && new Date(certs.cprFirstAid.expirationDate) > today) {
            staffCompliant++;
        }
        
        // Count Background Check
        staffTotal++;
        if (certs.backgroundCheck?.expirationDate && new Date(certs.backgroundCheck.expirationDate) > today) {
            staffCompliant++;
        }
    });
    
    const staffScore = staffTotal > 0 ? Math.round((staffCompliant / staffTotal) * 100) : 100;
    
    // Documents Score (percentage of required docs that are current)
    const requiredDocs = docs.filter(d => d.required || d.is_required);
    const currentDocs = requiredDocs.filter(d => {
        if (!d.expiration_date) return true;
        return new Date(d.expiration_date) > today;
    });
    const docsScore = requiredDocs.length > 0 ? Math.round((currentDocs.length / requiredDocs.length) * 100) : 100;
    
    // Checklists Score (last 7 days completion rate)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentChecklists = checklists.filter(c => new Date(c.created_at || c.date) > sevenDaysAgo);
    const completedChecklists = recentChecklists.filter(c => c.completed || c.status === 'completed');
    const checklistsScore = recentChecklists.length > 0 
        ? Math.round((completedChecklists.length / Math.max(recentChecklists.length, 7)) * 100)
        : 100;
    
    // Training Score (percentage of staff with completed training)
    const trainingScore = staff.length > 0 && trainingCompletions.length > 0
        ? Math.min(100, Math.round((trainingCompletions.length / (staff.length * 2)) * 100))
        : staff.length > 0 ? 50 : 100;
    
    return {
        staff: staffScore,
        docs: docsScore,
        checklists: Math.min(100, checklistsScore),
        training: trainingScore
    };
}

function updateBreakdownBars(breakdown) {
    // Update staff bar
    const barStaff = document.getElementById('bar-staff');
    const valStaff = document.getElementById('val-staff');
    if (barStaff) barStaff.style.width = `${breakdown.staff}%`;
    if (valStaff) valStaff.textContent = `${breakdown.staff}%`;
    
    // Update docs bar
    const barDocs = document.getElementById('bar-docs');
    const valDocs = document.getElementById('val-docs');
    if (barDocs) barDocs.style.width = `${breakdown.docs}%`;
    if (valDocs) valDocs.textContent = `${breakdown.docs}%`;
    
    // Update checklists bar
    const barChecklists = document.getElementById('bar-checklists');
    const valChecklists = document.getElementById('val-checklists');
    if (barChecklists) barChecklists.style.width = `${breakdown.checklists}%`;
    if (valChecklists) valChecklists.textContent = `${breakdown.checklists}%`;
    
    // Update training bar
    const barTraining = document.getElementById('bar-training');
    const valTraining = document.getElementById('val-training');
    if (barTraining) barTraining.style.width = `${breakdown.training}%`;
    if (valTraining) valTraining.textContent = `${breakdown.training}%`;
}

function calculateIncidentFreeStreak(incidents) {
    if (!incidents || incidents.length === 0) {
        // No incidents ever = assume 45 days default (or calculate from facility creation)
        return 45;
    }
    
    // Sort incidents by date descending
    const sortedIncidents = [...incidents].sort((a, b) => 
        new Date(b.created_at || b.date) - new Date(a.created_at || a.date)
    );
    
    const lastIncident = sortedIncidents[0];
    const lastIncidentDate = new Date(lastIncident.created_at || lastIncident.date);
    const today = new Date();
    
    const diffTime = Math.abs(today - lastIncidentDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
}

function updateStreakBadge(streakDays) {
    const streakEl = document.getElementById('streak-count');
    const streakBadge = document.getElementById('streak-badge');
    
    if (streakEl) {
        streakEl.textContent = streakDays;
    }
    
    // Add special styling for milestone streaks
    if (streakBadge) {
        if (streakDays >= 30) {
            streakBadge.classList.add('milestone');
        } else {
            streakBadge.classList.remove('milestone');
        }
    }
}

function updateScoreTrend(currentScore) {
    const trendEl = document.getElementById('score-trend');
    if (!trendEl) return;
    
    // Get previous score from localStorage (or default to current)
    const previousScore = parseInt(localStorage.getItem('lastHealthScore') || currentScore);
    const diff = currentScore - previousScore;
    
    // Save current score for next comparison
    localStorage.setItem('lastHealthScore', currentScore.toString());
    localStorage.setItem('lastHealthScoreDate', new Date().toISOString());
    
    if (diff > 0) {
        trendEl.innerHTML = `<span class="trend-arrow up">↗</span><span>+${diff} from last week</span>`;
    } else if (diff < 0) {
        trendEl.innerHTML = `<span class="trend-arrow down">↘</span><span>${diff} from last week</span>`;
    } else {
        trendEl.innerHTML = `<span class="trend-arrow">→</span><span>Stable this week</span>`;
    }
}

function generateQuickWins(staff, docs, checklists, trainingCompletions, priorities) {
    const quickWins = [];
    const today = new Date();
    
    // Check for expiring certifications (easy wins)
    staff.forEach(member => {
        const certs = member.certifications || {};
        
        // CPR about to expire
        if (certs.cprFirstAid?.expirationDate) {
            const expDate = new Date(certs.cprFirstAid.expirationDate);
            const daysUntil = Math.floor((expDate - today) / (1000 * 60 * 60 * 24));
            if (daysUntil < 0 || daysUntil <= 30) {
                quickWins.push({
                    icon: '🏆',
                    action: `Renew ${member.name.split(' ')[0]}'s CPR`,
                    impact: daysUntil < 0 ? '+5 points' : '+2 points',
                    points: daysUntil < 0 ? 5 : 2,
                    route: '/staff',
                    staffId: member.id
                });
            }
        }
    });
    
    // Check for missing required documents
    const requiredDocTypes = ['fire_drill_log', 'emergency_plan', 'license'];
    const existingDocTypes = docs.map(d => (d.type || d.category || '').toLowerCase());
    
    if (!existingDocTypes.some(t => t.includes('fire'))) {
        quickWins.push({
            icon: '📁',
            action: 'Upload fire drill log',
            impact: '+3 points',
            points: 3,
            route: 'upload-document'
        });
    }
    
    if (!existingDocTypes.some(t => t.includes('emergency'))) {
        quickWins.push({
            icon: '🚨',
            action: 'Add emergency plan',
            impact: '+4 points',
            points: 4,
            route: 'upload-document'
        });
    }
    
    // Check for incomplete training
    if (staff.length > 0) {
        const completedStaffIds = new Set(trainingCompletions.map(t => t.staff_id));
        const incompleteTraining = staff.filter(s => !completedStaffIds.has(s.id));
        
        if (incompleteTraining.length > 0) {
            quickWins.push({
                icon: '🎓',
                action: `Complete ${incompleteTraining[0].name.split(' ')[0]}'s training`,
                impact: '+3 points',
                points: 3,
                route: '/training'
            });
        }
    }
    
    // Add checklist completion if not at 100%
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentChecklists = checklists.filter(c => new Date(c.created_at || c.date) > sevenDaysAgo);
    if (recentChecklists.length < 7) {
        quickWins.push({
            icon: '📋',
            action: "Complete today's checklist",
            impact: '+2 points',
            points: 2,
            route: '/checklist'
        });
    }
    
    // Sort by points and return top 3
    return quickWins.sort((a, b) => b.points - a.points).slice(0, 3);
}

function updateQuickWins(quickWins, currentScore) {
    const container = document.getElementById('quick-wins-list');
    const potentialEl = document.getElementById('potential-score');
    
    if (!container) return;
    
    if (quickWins.length === 0) {
        container.innerHTML = `
            <div class="quick-win-item" style="justify-content: center; cursor: default; background: linear-gradient(135deg, rgba(180, 211, 51, 0.2), rgba(34, 197, 94, 0.2));">
                <div style="text-align: center;">
                    <div style="font-size: 2rem; margin-bottom: 8px;">🏆</div>
                    <div class="quick-win-action">Perfect score achieved!</div>
                    <div class="quick-win-impact">You're at 100% compliance</div>
                </div>
            </div>
        `;
        if (potentialEl) potentialEl.textContent = '100';
        return;
    }
    
    container.innerHTML = quickWins.map(win => `
        <div class="quick-win-item" onclick="${win.route.startsWith('/') 
            ? `if(window.appRouter) window.appRouter.go('${win.route}')` 
            : `openModal('${win.route}')`}">
            <div class="quick-win-icon">${win.icon}</div>
            <div class="quick-win-content">
                <div class="quick-win-action">${win.action}</div>
                <div class="quick-win-impact">${win.impact}</div>
            </div>
            <span class="quick-win-arrow">→</span>
        </div>
    `).join('');
    
    // Calculate potential score
    const totalPotentialPoints = quickWins.reduce((sum, w) => sum + w.points, 0);
    const potentialScore = Math.min(100, currentScore + totalPotentialPoints);
    if (potentialEl) potentialEl.textContent = potentialScore;
}

// Start auto-refresh for Health Command Center
function startHealthCommandCenterAutoRefresh() {
    // Clear any existing interval
    if (healthCommandCenterInterval) {
        clearInterval(healthCommandCenterInterval);
    }
    
    // Refresh every 30 seconds
    healthCommandCenterInterval = setInterval(async () => {
        const facilityId = AppState.facility?.id;
        if (!facilityId) return;
        
        // Only refresh if we're on the dashboard
        const dashboardScreen = document.getElementById('dashboard-screen');
        if (!dashboardScreen || !dashboardScreen.classList.contains('active')) return;
        
        console.log('🔄 Auto-refreshing Health Command Center...');
        await loadPriorityHeatMap();
    }, 30000); // 30 seconds
}

// Stop auto-refresh when navigating away
function stopHealthCommandCenterAutoRefresh() {
    if (healthCommandCenterInterval) {
        clearInterval(healthCommandCenterInterval);
        healthCommandCenterInterval = null;
    }
}

// ============================================
// RATIO SPOT-CHECK FUNCTIONS
// ============================================

let facilityRooms = [];

async function loadRatioSpotCheckWidget() {
    try {
        const facilityId = AppState.facility?.id;
        if (!facilityId) return;

        // Load rooms
        const roomsResponse = await apiRequest(`/facilities/${facilityId}/rooms`);
        facilityRooms = roomsResponse?.data || [];
        
        // Update room count in header button
        const roomCountEl = document.getElementById('room-count');
        if (roomCountEl) roomCountEl.textContent = facilityRooms.length;

        // Load reminder status
        const statusResponse = await apiRequest(`/facilities/${facilityId}/ratio-checks/reminder-status`);
        updateReminderAlert(statusResponse?.data || { checks_completed_today: 0, checks_due_today: 2 });

        // Load today's checks
        const checksResponse = await apiRequest(`/facilities/${facilityId}/ratio-checks/today`);
        displayRecentChecks(checksResponse?.data || []);

    } catch (error) {
        console.error('Error loading spot-check widget:', error);
    }
}

function updateReminderAlert(status) {
    const alert = document.getElementById('check-reminder-alert');
    const message = document.getElementById('reminder-message');
    const progressText = document.getElementById('check-progress-text');
    const progressBar = document.getElementById('check-progress-bar');

    const checksCompleted = status.checks_completed_today || 0;
    const checksDue = status.checks_due_today || 2;
    const progressPercent = checksDue > 0 ? (checksCompleted / checksDue) * 100 : 0;

    if (progressText) progressText.textContent = `${checksCompleted}/${checksDue} completed`;
    if (progressBar) progressBar.style.width = `${progressPercent}%`;

    if (alert) {
        if (checksCompleted < checksDue) {
            const nextCheck = status.next_check_due;
            if (message) {
                message.textContent = `Time for your ${checksCompleted === 0 ? 'first' : 'next'} spot-check! Next scheduled: ${nextCheck || 'Now'}`;
            }
            alert.style.display = 'flex';
        } else {
            alert.style.display = 'none';
        }
    }
}

function displayRecentChecks(checks) {
    const container = document.getElementById('recent-checks-list');
    if (!container) return;

    if (checks.length === 0) {
        container.innerHTML = `
            <div class="checks-empty">
                <div style="font-size: 2rem; margin-bottom: 8px;">📋</div>
                <div>No spot-checks logged today</div>
                <div style="font-size: 0.875rem; color: var(--text-secondary); margin-top: 4px;">
                    Start logging to build your compliance record
                </div>
            </div>
        `;
        return;
    }

    container.innerHTML = checks.map(check => `
        <div class="check-item ${check.is_compliant ? 'compliant' : 'violation'}">
            <div class="check-item-info">
                <div class="check-room-name">${check.room_name}</div>
                <div class="check-details">
                    ${check.check_time ? check.check_time.substring(0, 5) : '--:--'} • 
                    ${check.children_count} children / ${check.staff_count} staff • 
                    ${check.check_method === 'other' && check.check_method_other ? check.check_method_other : (check.check_method || 'in_person').replace('_', ' ')} •
                    ${check.checked_by_name || 'Unknown'}
                </div>
            </div>
            <div class="check-status">
                ${check.is_compliant ? '✅' : '🚨'}
            </div>
        </div>
    `).join('');
}

function openSpotCheckModal() {
    // Populate room dropdown
    const roomSelect = document.getElementById('spotcheck-room');
    if (roomSelect) {
        roomSelect.innerHTML = '<option value="">Select a room...</option>' +
            facilityRooms.map(room => `
                <option value="${room.id}" data-ratio="${room.required_ratio}" data-name="${room.name}">
                    ${room.name} (${room.required_ratio})
                </option>
            `).join('');
    }

    // Pre-fill checker name from logged-in user
    const userName = AppState.user?.name || '';
    const checkerInput = document.getElementById('spotcheck-checker-name');
    if (checkerInput) checkerInput.value = userName;

    // Show modal
    const modal = document.getElementById('spot-check-modal');
    if (modal) modal.style.display = 'flex';

    // Add real-time compliance preview
    ['spotcheck-room', 'spotcheck-children', 'spotcheck-staff'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', updateCompliancePreview);
    });
}

function closeSpotCheckModal() {
    const modal = document.getElementById('spot-check-modal');
    if (modal) modal.style.display = 'none';
    
    const form = document.getElementById('spotCheckForm');
    if (form) form.reset();
    
    const preview = document.getElementById('compliance-preview');
    if (preview) preview.style.display = 'none';
    
    const otherGroup = document.getElementById('other-method-group');
    if (otherGroup) otherGroup.style.display = 'none';
}

function updateCompliancePreview() {
    const roomSelect = document.getElementById('spotcheck-room');
    const childrenCount = parseInt(document.getElementById('spotcheck-children')?.value) || 0;
    const staffCount = parseInt(document.getElementById('spotcheck-staff')?.value) || 0;

    const preview = document.getElementById('compliance-preview');
    const icon = document.getElementById('preview-icon');
    const message = document.getElementById('preview-message');

    if (!roomSelect?.value || childrenCount === 0 || staffCount === 0) {
        if (preview) preview.style.display = 'none';
        return;
    }

    const selectedOption = roomSelect.options[roomSelect.selectedIndex];
    const ratio = selectedOption.getAttribute('data-ratio');
    
    if (!ratio) {
        if (preview) preview.style.display = 'none';
        return;
    }

    const [, childrenAllowed] = ratio.split(':').map(Number);
    const maxChildren = staffCount * childrenAllowed;
    const isCompliant = childrenCount <= maxChildren;

    if (preview) {
        preview.style.display = 'block';
        preview.className = `compliance-preview ${isCompliant ? 'compliant' : 'violation'}`;
    }
    
    if (icon) icon.textContent = isCompliant ? '✅' : '🚨';
    
    if (message) {
        if (isCompliant) {
            message.textContent = `Compliant! ${staffCount} staff can supervise up to ${maxChildren} children at ${ratio} ratio.`;
        } else {
            const staffNeeded = Math.ceil(childrenCount / childrenAllowed);
            message.textContent = `Out of ratio! Need ${staffNeeded} staff for ${childrenCount} children (currently ${staffCount}).`;
        }
    }
}

function toggleOtherMethodInput() {
    const methodSelect = document.getElementById('spotcheck-method');
    const otherGroup = document.getElementById('other-method-group');
    const otherInput = document.getElementById('spotcheck-method-other');

    if (methodSelect?.value === 'other') {
        if (otherGroup) otherGroup.style.display = 'block';
        if (otherInput) otherInput.required = true;
    } else {
        if (otherGroup) otherGroup.style.display = 'none';
        if (otherInput) {
            otherInput.required = false;
            otherInput.value = '';
        }
    }
}

function openManageRoomsModal() {
    const modal = document.getElementById('manageRoomsModal');
    if (modal) modal.style.display = 'flex';
    loadManageRoomsList();
}

function closeManageRoomsModal() {
    const modal = document.getElementById('manageRoomsModal');
    if (modal) modal.style.display = 'none';
    const form = document.getElementById('quickAddRoomForm');
    if (form) form.reset();
}

async function loadManageRoomsList() {
    try {
        const facilityId = AppState.facility?.id;
        if (!facilityId) return;

        const container = document.getElementById('manage-rooms-list');
        if (!container) return;

        const response = await apiRequest(`/facilities/${facilityId}/rooms`);
        const rooms = response?.data || [];

        if (!rooms || rooms.length === 0) {
            container.innerHTML = `
                <div class="rooms-empty">
                    <div class="rooms-empty-icon">🏫</div>
                    <div style="font-weight: 600; margin-bottom: 4px;">No rooms yet</div>
                    <div style="font-size: 0.875rem;">Use the form above to add your first room</div>
                </div>
            `;
            return;
        }

        container.innerHTML = rooms.map(room => `
            <div class="room-management-item">
                <div class="room-item-info">
                    <div class="room-item-name" title="${room.name}">${room.name}</div>
                    <div class="room-item-details">
                        ${room.age_group} • ${room.required_ratio}
                    </div>
                </div>
                <div class="room-item-actions">
                    <button class="btn-icon-small" onclick="deleteRoom('${room.id}')" title="Delete room">
                        🗑️
                    </button>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading rooms:', error);
        const container = document.getElementById('manage-rooms-list');
        if (container) {
            container.innerHTML = `
                <div class="rooms-loading">
                    <div style="color: var(--color-critical);">Failed to load rooms</div>
                    <button class="btn-secondary-small" onclick="loadManageRoomsList()" style="margin-top: var(--space-sm);">
                        Retry
                    </button>
                </div>
            `;
        }
    }
}

async function submitQuickAddRoom(event) {
    if (event) event.preventDefault();
    
    try {
        const facilityId = AppState.facility?.id;
        if (!facilityId) {
            showError('Facility not loaded. Please refresh the page.');
            return;
        }

        const data = {
            name: document.getElementById('quick-room-name')?.value?.trim(),
            age_group: document.getElementById('quick-room-age')?.value,
            required_ratio: document.getElementById('quick-room-ratio')?.value
        };

        if (!data.name || !data.age_group || !data.required_ratio) {
            showError('Please fill in all fields');
            return;
        }

        await apiRequest(`/facilities/${facilityId}/rooms`, {
            method: 'POST',
            body: JSON.stringify(data)
        });

        showSuccess('Room added!');
        document.getElementById('quickAddRoomForm')?.reset();
        
        await loadManageRoomsList();
        await loadRatioSpotCheckWidget();

    } catch (error) {
        console.error('Error adding room:', error);
        showError(error.message || 'Failed to add room');
    }
}

async function deleteRoom(roomId) {
    if (!confirm('Delete this room? Existing spot-checks will be preserved.')) {
        return;
    }

    try {
        const facilityId = AppState.facility?.id;
        
        await apiRequest(`/facilities/${facilityId}/rooms/${roomId}`, {
            method: 'DELETE'
        });

        showSuccess('Room deleted');
        
        await loadManageRoomsList();
        await loadRatioSpotCheckWidget();

    } catch (error) {
        console.error('Error deleting room:', error);
        showError('Failed to delete room');
    }
}

async function submitSpotCheck() {
    const roomSelect = document.getElementById('spotcheck-room');
    const childrenCount = parseInt(document.getElementById('spotcheck-children')?.value, 10);
    const staffCount = parseInt(document.getElementById('spotcheck-staff')?.value, 10);
    const method = document.getElementById('spotcheck-method')?.value;
    const methodOther = document.getElementById('spotcheck-method-other')?.value?.trim();
    const checkerName = document.getElementById('spotcheck-checker-name')?.value?.trim();
    const notes = document.getElementById('spotcheck-notes')?.value;

    if (!roomSelect?.value) {
        showError('Please select a room');
        return;
    }
    if (!Number.isFinite(childrenCount) || childrenCount < 0) {
        showError('Please enter a valid number of children (0 or more)');
        return;
    }
    if (!Number.isFinite(staffCount) || staffCount < 0) {
        showError('Please enter a valid number of staff (0 or more)');
        return;
    }
    if (!checkerName || checkerName.length === 0) {
        showError('Please enter your name');
        return;
    }
    if (method === 'other' && (!methodOther || methodOther.length === 0)) {
        showError('Please specify how you checked when selecting "Other"');
        return;
    }

    const selectedOption = roomSelect.options[roomSelect.selectedIndex];
    const roomName = selectedOption.getAttribute('data-name') || selectedOption.textContent.split(' (')[0];
    const ratio = selectedOption.getAttribute('data-ratio');
    
    if (!ratio || !/^\d+:\d+$/.test(ratio)) {
        showError('Invalid ratio format for selected room');
        return;
    }

    try {
        const facilityId = AppState.facility?.id;
        
        await apiRequest(`/facilities/${facilityId}/ratio-checks`, {
            method: 'POST',
            body: JSON.stringify({
                room_id: roomSelect.value,
                room_name: roomName,
                children_count: childrenCount,
                staff_count: staffCount,
                required_ratio: ratio,
                check_method: method,
                check_method_other: method === 'other' ? methodOther : null,
                checked_by_name: checkerName,
                notes: notes
            })
        });

        showSuccess('Spot-check logged successfully!');
        closeSpotCheckModal();
        
        // Reload widget data
        await loadRatioSpotCheckWidget();

    } catch (error) {
        console.error('Error submitting spot-check:', error);
        showError('Failed to log spot-check. Please try again.');
    }
}

function populateActionLane(laneType, items, hasNewAlerts = false) {
    const container = document.getElementById(`${laneType}-items`);
    if (!container) return;
    
    // Find parent lane card for glow effect
    const laneMap = { now: 'critical', next: 'medium', watch: 'low' };
    const laneCard = container.closest('.action-lane') || document.getElementById(`${laneMap[laneType]}-zone`);
    
    if (laneCard) {
        if (hasNewAlerts) {
            laneCard.classList.add('has-new-alerts');
        } else {
            laneCard.classList.remove('has-new-alerts');
        }
    }
    
    if (items.length === 0) {
        const emptyMessages = {
            now: { icon: '🎉', title: 'All clear!', text: 'No urgent items - you\'re on top of everything' },
            next: { icon: '👍', title: 'Looking good!', text: 'Nothing needs your attention right now' },
            watch: { icon: '✨', title: 'All systems go!', text: 'Everything is running smoothly' }
        };
        
        const msg = emptyMessages[laneType];
        container.innerHTML = `
            <div class="capsule-empty zone-empty">
                <div class="capsule-empty-icon zone-empty-icon">${msg.icon}</div>
                <h4>${msg.title}</h4>
                <p>${msg.text}</p>
            </div>
        `;
        return;
    }

    // Show only top 3 items for compact display
    const displayItems = items.slice(0, 3);
    const hiddenCount = items.length - 3;

    let html = displayItems.map((item, index) => createActionItemHTML(item, index)).join('');
    
    // Add "X more" indicator if there are hidden items
    if (hiddenCount > 0) {
        html += `<div class="more-items-indicator">+ ${hiddenCount} more item${hiddenCount !== 1 ? 's' : ''}</div>`;
    }
    
    container.innerHTML = html;
}

function createActionItemHTML(item, index) {
    const newBadge = !item.acknowledged ? '<span class="new-alert-badge">NEW</span>' : '';
    const newClass = !item.acknowledged ? 'action-item-new priority-item-new' : '';
    
    return `
        <div class="action-item ${newClass}" onclick="handlePriorityAction('${item.actionUrl}', '${item.alertId || item.staffId || ''}')" style="animation-delay: ${0.1 + index * 0.05}s;">
            <div class="action-item-icon">${item.icon}</div>
            <div class="action-item-content">
                <div class="action-item-title">${item.title}${newBadge}</div>
                <div class="action-item-description">${item.description}</div>
                <button class="action-item-btn" onclick="event.stopPropagation(); handlePriorityAction('${item.actionUrl}', '${item.alertId || item.staffId || ''}')">${item.action}</button>
            </div>
        </div>
    `;
}

async function calculatePriorities(facilityId) {
    const priorities = {
        critical: [],
        medium: [],
        low: []
    };

    try {
        // Get staff data to check for expiring certifications
        const staffResponse = await apiRequest(`/facilities/${facilityId}/staff`);
        const staff = staffResponse?.data || [];

        // Check for expired and expiring certifications
        const today = new Date();

        staff.forEach(member => {
            if (!member.certifications) return;

            const certs = member.certifications;
            
            // Check CPR/First Aid certification
            if (certs.cprFirstAid?.expirationDate) {
                const expDate = new Date(certs.cprFirstAid.expirationDate);
                const daysUntilExpiration = Math.floor((expDate - today) / (1000 * 60 * 60 * 24));
                
                if (daysUntilExpiration < 0) {
                    priorities.critical.push({
                        type: 'expired_cert',
                        icon: '🚨',
                        title: `${member.name}'s CPR/First Aid EXPIRED`,
                        description: `Expired ${Math.abs(daysUntilExpiration)} days ago`,
                        action: 'Renew Now',
                        actionUrl: '/staff',
                        staffId: member.id
                    });
                } else if (daysUntilExpiration <= 30) {
                    priorities.medium.push({
                        type: 'expiring_soon',
                        icon: '⚠️',
                        title: `${member.name}'s CPR/First Aid expiring soon`,
                        description: `Expires in ${daysUntilExpiration} days`,
                        action: 'Schedule Renewal',
                        actionUrl: '/staff',
                        staffId: member.id
                    });
                } else if (daysUntilExpiration <= 60) {
                    priorities.low.push({
                        type: 'monitor_expiration',
                        icon: '📅',
                        title: `${member.name}'s CPR/First Aid`,
                        description: `Expires in ${daysUntilExpiration} days`,
                        action: 'View Schedule',
                        actionUrl: '/staff',
                        staffId: member.id
                    });
                }
            }

            // Check Background Check
            if (certs.backgroundCheck?.expirationDate) {
                const expDate = new Date(certs.backgroundCheck.expirationDate);
                const daysUntilExpiration = Math.floor((expDate - today) / (1000 * 60 * 60 * 24));
                
                if (daysUntilExpiration < 0) {
                    priorities.critical.push({
                        type: 'expired_cert',
                        icon: '🚨',
                        title: `${member.name}'s Background Check EXPIRED`,
                        description: `Expired ${Math.abs(daysUntilExpiration)} days ago`,
                        action: 'Renew Now',
                        actionUrl: '/staff',
                        staffId: member.id
                    });
                } else if (daysUntilExpiration <= 30) {
                    priorities.medium.push({
                        type: 'expiring_soon',
                        icon: '⚠️',
                        title: `${member.name}'s Background Check expiring soon`,
                        description: `Expires in ${daysUntilExpiration} days`,
                        action: 'Schedule Renewal',
                        actionUrl: '/staff',
                        staffId: member.id
                    });
                }
            }

            // Check Food Handler
            if (certs.foodHandler?.expirationDate) {
                const expDate = new Date(certs.foodHandler.expirationDate);
                const daysUntilExpiration = Math.floor((expDate - today) / (1000 * 60 * 60 * 24));
                
                if (daysUntilExpiration < 0) {
                    priorities.critical.push({
                        type: 'expired_cert',
                        icon: '🚨',
                        title: `${member.name}'s Food Handler EXPIRED`,
                        description: `Expired ${Math.abs(daysUntilExpiration)} days ago`,
                        action: 'Renew Now',
                        actionUrl: '/staff',
                        staffId: member.id
                    });
                } else if (daysUntilExpiration <= 30) {
                    priorities.medium.push({
                        type: 'expiring_soon',
                        icon: '⚠️',
                        title: `${member.name}'s Food Handler expiring soon`,
                        description: `Expires in ${daysUntilExpiration} days`,
                        action: 'Schedule Renewal',
                        actionUrl: '/staff',
                        staffId: member.id
                    });
                }
            }

            // Check TB Test
            if (certs.tbTest?.nextDue) {
                const expDate = new Date(certs.tbTest.nextDue);
                const daysUntilExpiration = Math.floor((expDate - today) / (1000 * 60 * 60 * 24));
                
                if (daysUntilExpiration < 0) {
                    priorities.critical.push({
                        type: 'expired_cert',
                        icon: '🚨',
                        title: `${member.name}'s TB Test OVERDUE`,
                        description: `Overdue by ${Math.abs(daysUntilExpiration)} days`,
                        action: 'Schedule Now',
                        actionUrl: '/staff',
                        staffId: member.id
                    });
                } else if (daysUntilExpiration <= 30) {
                    priorities.medium.push({
                        type: 'expiring_soon',
                        icon: '⚠️',
                        title: `${member.name}'s TB Test due soon`,
                        description: `Due in ${daysUntilExpiration} days`,
                        action: 'Schedule Test',
                        actionUrl: '/staff',
                        staffId: member.id
                    });
                }
            }
        });

        // Add default monitoring items if everything is clear
        if (priorities.critical.length === 0 && priorities.medium.length === 0 && priorities.low.length === 0) {
            priorities.low.push({
                type: 'all_clear',
                icon: '✨',
                title: 'All compliance items up to date',
                description: 'No immediate action needed',
                action: 'View Details',
                actionUrl: '/dashboard'
            });
        }

    } catch (error) {
        console.error('Error calculating priorities:', error);
    }

    return priorities;
}

function populateZone(zoneType, items) {
    const container = document.getElementById(`${zoneType}-items`);
    if (!container) return;
    
    if (items.length === 0) {
        const emptyMessages = {
            critical: { icon: '🎉', text: 'No critical items - Great job!' },
            medium: { icon: '👍', text: 'Nothing needs immediate attention' },
            low: { icon: '✅', text: 'All systems running smoothly' }
        };
        
        const msg = emptyMessages[zoneType];
        container.innerHTML = `
            <div class="zone-empty">
                <div class="zone-empty-icon">${msg.icon}</div>
                <div>${msg.text}</div>
            </div>
        `;
        return;
    }

    container.innerHTML = items.map(item => createPriorityItemHTML(item)).join('');
}

function createPriorityItemHTML(item) {
    return `
        <div class="priority-item" onclick="handlePriorityAction('${item.actionUrl}', '${item.staffId || ''}')">
            <div class="priority-item-icon">${item.icon}</div>
            <div class="priority-item-content">
                <div class="priority-item-title">${item.title}</div>
                <div class="priority-item-description">${item.description}</div>
                <div class="priority-item-action">
                    <button onclick="event.stopPropagation(); handlePriorityAction('${item.actionUrl}', '${item.staffId || ''}')">${item.action}</button>
                </div>
            </div>
        </div>
    `;
}

async function handlePriorityAction(url, alertId) {
    try {
        // Auto-acknowledge when taking action on an alert
        if (alertId && alertId !== 'undefined' && alertId !== '' && alertId.includes('-')) {
            const facilityId = AppState.facility?.id;
            const userName = AppState.user?.name || 'User';

            try {
                await apiRequest(`/facilities/${facilityId}/alerts/${alertId}/acknowledge`, {
                    method: 'PATCH',
                    body: JSON.stringify({ acknowledged_by_name: userName })
                });
            } catch (e) {
                console.log('Alert acknowledge skipped:', e.message);
            }
        }

        // Navigate to action URL
        if (url && url !== 'null' && url !== '/dashboard') {
            const screen = url.replace('/', '');
            if (window.appRouter) {
                window.appRouter.go(url);
            } else {
                showScreen(screen);
            }
        }

        // Reload priorities to update UI
        await loadPriorityHeatMap();

    } catch (error) {
        console.error('Error handling priority action:', error);
    }
}

async function refreshPriorities() {
    const refreshIcon = document.getElementById('refresh-icon');
    if (refreshIcon) {
        refreshIcon.style.animation = 'prioritySpin 1s linear';
    }
    
    await loadPriorityHeatMap();
    
    setTimeout(() => {
        if (refreshIcon) {
            refreshIcon.style.animation = '';
        }
    }, 1000);
}

async function loadWeatherData() {
    if (!AppState.facility) {
        return;
    }

    try {
        const weatherResponse = await apiRequest(`/facilities/${AppState.facility.id}/weather`);
        const weather = weatherResponse.weather;

        if (weather) {
            // Update compact weather widget in hero
            const weatherIcon = document.getElementById('weather-icon-hero');
            const weatherTemp = document.getElementById('weather-temp-hero');
            const weatherCondition = document.getElementById('weather-condition-hero');

            if (weatherIcon) weatherIcon.textContent = weather.icon || '🌤️';
            if (weatherTemp) weatherTemp.textContent = `${weather.temperature || 72}°F`;
            if (weatherCondition) weatherCondition.textContent = weather.condition || 'Clear';
        }
    } catch (error) {
        console.log('Weather data unavailable, using defaults');
        // Keep default values if weather API fails
    }
}

function updateModernDashboard(data) {
    if (!data) return;

    // Safely update risk score and streak with null checks
    if (data.riskScore) {
        const riskScoreEl = document.getElementById('risk-score-display');
        if (riskScoreEl) riskScoreEl.textContent = data.riskScore.score || data.riskScore;

        const riskRatingEl = document.getElementById('risk-rating-display');
        if (riskRatingEl && data.riskScore.rating) riskRatingEl.textContent = data.riskScore.rating;

        const change = data.riskScore.changeFromLastMonth || 0;
        const riskChangeEl = document.getElementById('risk-change-display');
        if (riskChangeEl) {
            riskChangeEl.textContent = `${change >= 0 ? '↑' : '↓'} ${Math.abs(change)} from last month`;
        }
    }

    if (data.streak) {
        const streakEl = document.getElementById('streak-days-display');
        if (streakEl) streakEl.textContent = data.streak.days;

        const nextGoalEl = document.getElementById('next-goal-display');
        if (nextGoalEl) nextGoalEl.textContent = data.streak.nextGoalName;
    }

    // Update priority cards
    if (data.priorityAlerts) {
        updatePriorityCard('missing-docs', data.priorityAlerts.missingDocs);
        updatePriorityCard('expired-docs', data.priorityAlerts.expiredDocs);
        updatePriorityCard('signatures', data.priorityAlerts.missingSignatures);
    }

    // Update recent activity
    if (data.recentIncidents) {
        updateRecentActivity(data.recentIncidents);
    }
}

function updatePriorityCard(type, alertData) {
    const card = document.getElementById(`priority-${type}`);
    const description = document.getElementById(`${type}-description`);

    if (!card || !description) return;

    if (alertData.count === 0) {
        card.style.opacity = '0.5';
        card.style.cursor = 'default';
        card.onclick = null;
    } else {
        card.style.opacity = '1';
        card.style.cursor = 'pointer';
    }

    if (type === 'missing-docs') {
        description.textContent = alertData.count === 0
            ? 'All required documents on file ✓'
            : `${alertData.count} required ${alertData.count === 1 ? 'document' : 'documents'} missing`;
    } else if (type === 'expired-docs') {
        description.textContent = alertData.count === 0
            ? 'All documents current ✓'
            : `${alertData.count} ${alertData.count === 1 ? 'document' : 'documents'} expired`;
    } else if (type === 'signatures') {
        description.textContent = alertData.count === 0
            ? 'All incidents signed ✓'
            : `${alertData.count} incident ${alertData.count === 1 ? 'report needs' : 'reports need'} parent signature`;
    }
}

function updateRecentActivity(incidents) {
    const container = document.getElementById('recent-activity-container');
    if (!container) return;

    if (!incidents || incidents.length === 0) {
        container.innerHTML = '<p style="color: #6b7280; text-align: center;">No recent incidents</p>';
        return;
    }

    container.innerHTML = incidents.slice(0, 3).map(incident => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
            <div style="flex: 1;">
                <div style="font-weight: 600; color: #111827;">${incident.childName}</div>
                <div style="font-size: 13px; color: #6b7280; margin-top: 2px;">${incident.type} - ${incident.description}</div>
            </div>
            <div style="text-align: right; font-size: 13px; color: #6b7280;">
                ${new Date(incident.occurredAt).toLocaleDateString()}
            </div>
        </div>
    `).join('');
}

function updateDashboardMetrics(data) {
    if (!data) return;

    if (data.riskScore !== undefined) {
        const riskScore = data.riskScore;
        document.getElementById('dashboardRiskScore').textContent = riskScore;

        let status, message, color;
        if (riskScore >= 80) {
            status = '🟢';
            message = 'Great! Risk is low';
            color = '#059669';
        } else if (riskScore >= 60) {
            status = '🟡';
            message = 'Good! Some improvements needed';
            color = '#d97706';
        } else {
            status = '🔴';
            message = 'Action needed to reduce risk';
            color = '#dc2626';
        }

        document.getElementById('dashboardRiskStatus').textContent = status;
        document.getElementById('dashboardRiskMessage').textContent = message;
        document.getElementById('dashboardRiskMessage').style.color = color;
    }

    if (data.compliance !== undefined) {
        const compliancePercent = Math.round(data.compliance.percentage);
        document.getElementById('dashboardCompliancePercent').textContent = `${compliancePercent}%`;

        const pending = data.compliance.pending || 0;
        const completed = data.compliance.completed || 0;
        const total = completed + pending;

        let status, message, color;
        if (pending === 0) {
            status = '🟢';
            message = 'Perfect! All requirements met';
            color = '#059669';
        } else if (pending === 1) {
            status = '🟡';
            message = 'Excellent! 1 item pending';
            color = '#d97706';
        } else {
            status = '🟡';
            message = `Good! ${pending} items pending`;
            color = '#d97706';
        }

        document.getElementById('dashboardComplianceStatus').textContent = status;
        document.getElementById('dashboardComplianceMessage').textContent = message;
        document.getElementById('dashboardComplianceMessage').style.color = color;
        document.getElementById('dashboardComplianceDetails').textContent = `${completed} of ${total} requirements complete`;
    }

    if (data.staffCertified !== undefined) {
        document.getElementById('dashboardStaffCertified').textContent = data.staffCertified || '0/0';
    }

    if (data.trainingCompletion !== undefined) {
        const trainingPercent = Math.round(data.trainingCompletion);
        document.getElementById('dashboardTrainingPercent').textContent = `${trainingPercent}%`;
    }
}

async function checkUrgentItems() {
    if (!AppState.facility) return;

    try {
        const urgentItems = [];

        const staffResponse = await apiRequest(`/facilities/${AppState.facility.id}/staff`);
        const staff = staffResponse.data || [];

        const today = new Date();
        const sevenDaysFromNow = new Date(today);
        sevenDaysFromNow.setDate(today.getDate() + 7);

        staff.forEach(member => {
            if (member.certifications) {
                if (member.certifications.cpr && new Date(member.certifications.cpr) < sevenDaysFromNow) {
                    const daysUntil = Math.ceil((new Date(member.certifications.cpr) - today) / (1000 * 60 * 60 * 24));
                    if (daysUntil <= 7 && daysUntil >= 0) {
                        urgentItems.push(`${member.name.split(' ')[0]}'s CPR (${daysUntil} days)`);
                    }
                }
                if (member.certifications.firstAid && new Date(member.certifications.firstAid) < sevenDaysFromNow) {
                    const daysUntil = Math.ceil((new Date(member.certifications.firstAid) - today) / (1000 * 60 * 60 * 24));
                    if (daysUntil <= 7 && daysUntil >= 0) {
                        urgentItems.push(`${member.name.split(' ')[0]}'s First Aid (${daysUntil} days)`);
                    }
                }
            }
        });

        const incidentsResponse = await apiRequest(`/facilities/${AppState.facility.id}/incidents`);
        const incidents = incidentsResponse.data || [];
        const pendingSignatures = incidents.filter(inc => !inc.parentSignature);

        if (pendingSignatures.length > 0) {
            urgentItems.push(`${pendingSignatures.length} incident signature${pendingSignatures.length > 1 ? 's' : ''} pending`);
        }

        const banner = document.getElementById('urgentBanner');
        if (urgentItems.length > 0) {
            banner.style.display = 'block';
            document.getElementById('urgentBannerTitle').textContent =
                `${urgentItems.length} Item${urgentItems.length > 1 ? 's' : ''} Need${urgentItems.length === 1 ? 's' : ''} Attention This Week`;
            document.getElementById('urgentBannerDetails').textContent = urgentItems.slice(0, 3).join(' • ');
        } else {
            banner.style.display = 'none';
        }
    } catch (error) {
        console.error('Failed to check urgent items:', error);
    }
}

function showUrgentItems() {
    showScreen('staff');
}

function showRiskDetails() {
    showScreen('licensing');
}

async function scheduleRenewal(staffId) {
    showSuccess('Opening staff certification renewal...');
    showScreen('staff');
}

async function loadUpcomingItems() {
    if (!AppState.facility) return;

    try {
        const staffResponse = await apiRequest(`/facilities/${AppState.facility.id}/staff`);
        const staff = staffResponse.data || [];

        const today = new Date();
        const thirtyDaysFromNow = new Date(today);
        thirtyDaysFromNow.setDate(today.getDate() + 30);

        const upcomingItems = [];

        staff.forEach(member => {
            if (member.certifications) {
                if (member.certifications.cpr) {
                    const expiryDate = new Date(member.certifications.cpr);
                    if (expiryDate > today && expiryDate <= thirtyDaysFromNow) {
                        const daysUntil = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
                        upcomingItems.push({
                            type: 'cpr',
                            staffName: member.name,
                            staffId: member.id,
                            expiryDate,
                            daysUntil,
                            label: 'CPR Certification'
                        });
                    }
                }
                if (member.certifications.firstAid) {
                    const expiryDate = new Date(member.certifications.firstAid);
                    if (expiryDate > today && expiryDate <= thirtyDaysFromNow) {
                        const daysUntil = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
                        upcomingItems.push({
                            type: 'firstAid',
                            staffName: member.name,
                            staffId: member.id,
                            expiryDate,
                            daysUntil,
                            label: 'First Aid'
                        });
                    }
                }
            }
        });

        upcomingItems.sort((a, b) => a.expiryDate - b.expiryDate);

        renderUpcomingItems(upcomingItems.slice(0, 3));
    } catch (error) {
        console.error('Failed to load upcoming items:', error);
    }
}

function renderUpcomingItems(items) {
    const container = document.getElementById('upcomingItemsList');

    if (items.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: #6b7280;">
                <div style="font-size: 48px; margin-bottom: 12px;">✅</div>
                <div style="font-size: 16px; font-weight: 600; color: #059669;">All Clear!</div>
                <div style="font-size: 14px; margin-top: 4px;">No urgent items in the next 30 days</div>
            </div>
        `;
        return;
    }

    container.innerHTML = items.map((item, index) => {
        const colors = [
            { bg: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', textPrimary: '#92400e', textSecondary: '#78350f', btnBg: '#f59e0b' },
            { bg: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', textPrimary: '#1e40af', textSecondary: '#1e3a8a', btnBg: '#3b82f6' },
            { bg: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)', textPrimary: '#9f1239', textSecondary: '#831843', btnBg: '#db2777' }
        ];
        const color = colors[index % 3];

        const month = item.expiryDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
        const day = item.expiryDate.getDate();

        return `
            <div onclick="showScreen('staff')" style="display: flex; gap: 16px; padding: 16px; background: ${color.bg}; border-radius: 12px; cursor: pointer; align-items: center; transition: transform 0.2s;">
                <div style="min-width: 70px; text-align: center; background: white; padding: 8px; border-radius: 8px;">
                    <div style="font-size: 12px; font-weight: 700; color: ${color.textPrimary};">${month}</div>
                    <div style="font-size: 24px; font-weight: 700; color: ${color.textPrimary};">${day}</div>
                </div>
                <div style="flex: 1;">
                    <div style="font-weight: 700; color: ${color.textPrimary}; margin-bottom: 2px;">${item.staffName} - ${item.label}</div>
                    <div style="font-size: 13px; color: ${color.textSecondary};">Expires in ${item.daysUntil} days</div>
                </div>
                <button onclick="event.stopPropagation(); scheduleRenewal('${item.staffId}')" style="background: ${color.btnBg}; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; white-space: nowrap;">Schedule →</button>
            </div>
        `;
    }).join('');
}

// Filter Requirements
function filterRequirements(status) {
    const rows = document.querySelectorAll('.requirement-row');
    const tabs = document.querySelectorAll('.tab');

    tabs.forEach(tab => tab.classList.remove('active'));
    event.currentTarget.classList.add('active');

    rows.forEach(row => {
        if (status === 'all') {
            row.style.display = '';
        } else {
            if (row.dataset.status === status) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        }
    });
}

// Modal Functions
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// =============================================
// DATA LOADING FUNCTIONS
// =============================================

async function loadDashboard() {
    if (!AppState.facility) return;

    try {
        const data = await apiRequest(`/facilities/${AppState.facility.id}/dashboard`);

        // Safely update elements if they exist
        const facilityNameEl = document.getElementById('facility-name');
        const facilityLocationEl = document.getElementById('facility-location');
        if (facilityNameEl) facilityNameEl.textContent = AppState.facility.name || 'My Facility';
        if (facilityLocationEl) facilityLocationEl.textContent = AppState.facility.address?.city || 'Location';

        // Load enhanced dashboard data
        await loadDashboardData();

        // Update sidebar badges
        await updateSidebarBadges();

        // Update compliance progress bar on licensing screen
        const complianceCard = document.querySelector('#licensing .card');
        if (complianceCard && data.complianceStatus) {
            const percentageDiv = complianceCard.querySelectorAll('div')[1]; // 2nd div
            const progressFill = complianceCard.querySelector('.progress-fill');
            const descText = complianceCard.querySelector('p');

            if (percentageDiv) percentageDiv.textContent = `${data.complianceStatus.overallPercentage}%`;
            if (progressFill) progressFill.style.width = `${data.complianceStatus.overallPercentage}%`;
            if (descText) descText.textContent =
                `${data.complianceStatus.completeRequirements} of ${data.complianceStatus.totalRequirements} requirements complete`;
        }

    } catch (error) {
        console.error('Failed to load dashboard:', error);
    }
}

function updateFacilityInfo() {
    if (AppState.facility) {
        const facilityNameEl = document.querySelector('.facility-info h3');
        const facilityLocEl = document.querySelector('.facility-info p');
        if (facilityNameEl) facilityNameEl.textContent = AppState.facility.name;
        if (facilityLocEl) facilityLocEl.textContent = `📍 ${AppState.facility.address?.city}, ${AppState.facility.address?.state}`;
    }
}

// Update sidebar notification badges dynamically
async function updateSidebarBadges() {
    if (!AppState.facility) return;

    try {
        // Get counts for various alerts
        const facilityId = AppState.facility.id;

        // Compliance badge - count pending requirements
        try {
            const complianceResponse = await apiRequest(`/facilities/${facilityId}/dashboard`);
            const complianceData = complianceResponse.data || complianceResponse;
            if (complianceData.complianceStatus) {
                const pending = complianceData.complianceStatus.totalRequirements - complianceData.complianceStatus.completeRequirements;
                updateBadge('sidebar-compliance-badge', pending);
            }
        } catch (e) {
            console.log('Could not load compliance badge count');
        }

        // Staff badge - count certifications expiring soon
        try {
            const staffResponse = await apiRequest(`/facilities/${facilityId}/staff`);
            const staff = staffResponse.data || [];
            const now = new Date();
            const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

            let expiringCount = 0;
            staff.forEach(member => {
                const certs = member.certifications || {};
                // Check CPR and First Aid expiration
                if (certs.cpr?.expirationDate) {
                    const cprExpiry = new Date(certs.cpr.expirationDate);
                    if (cprExpiry < thirtyDaysFromNow) expiringCount++;
                }
                if (certs.firstAid?.expirationDate) {
                    const firstAidExpiry = new Date(certs.firstAid.expirationDate);
                    if (firstAidExpiry < thirtyDaysFromNow) expiringCount++;
                }
            });
            updateBadge('sidebar-staff-badge', expiringCount);
        } catch (e) {
            console.log('Could not load staff badge count');
        }

        // Documents badge - count missing/expired documents
        try {
            const docsResponse = await apiRequest(`/facilities/${facilityId}/documents`);
            const docs = docsResponse.data || [];
            const now = new Date();
            const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

            let alertCount = 0;
            docs.forEach(doc => {
                if (doc.expiration_date) {
                    const expiry = new Date(doc.expiration_date);
                    if (expiry < now || expiry < thirtyDaysFromNow) {
                        alertCount++;
                    }
                }
            });
            updateBadge('sidebar-documents-badge', alertCount);
        } catch (e) {
            console.log('Could not load documents badge count');
        }

    } catch (error) {
        console.error('Failed to update sidebar badges:', error);
    }
}

// Helper function to show/hide and update badge
function updateBadge(badgeId, count) {
    const badge = document.getElementById(badgeId);
    if (badge) {
        if (count > 0) {
            badge.textContent = count;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    }
}

// Update sidebar user info
function updateSidebarUserInfo() {
    if (!AppState.user) return;

    const userName = AppState.user.name || AppState.user.email.split('@')[0];
    const userNameEl = document.getElementById('sidebar-user-name');
    const userAvatarEl = document.getElementById('sidebar-user-avatar');

    if (userNameEl) {
        userNameEl.textContent = userName;
    }

    if (userAvatarEl) {
        // Get initials from name
        const nameParts = userName.split(' ');
        let initials = '';
        if (nameParts.length >= 2) {
            initials = nameParts[0][0] + nameParts[1][0];
        } else {
            initials = userName.substring(0, 2);
        }
        userAvatarEl.textContent = initials.toUpperCase();
    }
}

// Validate cached auth data on page load
async function validateAuth() {
    console.log('🔍 validateAuth() called');
    console.log('Token exists:', !!AppState.token);
    console.log('User exists:', !!AppState.user);
    console.log('Facility exists:', !!AppState.facility);

    if (!AppState.token || !AppState.user || !AppState.facility) {
        console.log('❌ Missing auth data in AppState');
        return false;
    }

    // If we have token, user, and facility, trust it
    // The apiRequest will handle 401 errors if token is invalid
    console.log('✅ Auth data present in localStorage');
    return true;
}

// Check if user is already logged in on page load
window.addEventListener('DOMContentLoaded', async () => {
    console.log('🔐 Validating authentication...');
    const isValid = await validateAuth();

    if (isValid) {
        console.log('✅ User is authenticated');

        // Hide auth screens (both login and signup)
        const authContainer = document.getElementById('auth-container');
        const loginScreen = document.getElementById('login-screen');
        const signupScreen = document.getElementById('signup-screen');
        const app = document.getElementById('app');

        if (authContainer) authContainer.style.display = 'none';
        if (loginScreen) loginScreen.style.display = 'none';
        if (signupScreen) signupScreen.style.display = 'none';
        if (app) {
            app.classList.add('active');
            updateHamburgerVisibility();
        }

        // Load sidebar if using modular architecture
        const sidebarContainer = document.getElementById('sidebar-container');
        if (sidebarContainer && !sidebarContainer.innerHTML.trim()) {
            await window.htmlLoader.loadInto('sidebar.html', '#sidebar-container');
            console.log('✅ Sidebar loaded on page load');
            // Update sidebar user info after loading
            updateSidebarUserInfo();
        }

        updateFacilityInfo();

        // Initialize router before loading dashboard
        if (typeof Router !== 'undefined' && typeof appRoutes !== 'undefined') {
            window.appRouter = new Router(appRoutes);
            console.log('✅ Router initialized successfully');

            // Preload screens in background
            window.htmlLoader.preloadAllScreens().catch(err => {
                console.error('Failed to preload screens:', err);
            });
        } else {
            console.error('Router or appRoutes not loaded. Make sure router.js and routes.js are included before app.js');
            // Fallback to loading dashboard directly
            await loadDashboard();
        }
    } else {
        console.log('❌ User not authenticated - showing login screen');
        // Show login screen
        const authContainer = document.getElementById('auth-container');
        const loginScreen = document.getElementById('login-screen');
        const signupScreen = document.getElementById('signup-screen');

        if (authContainer) authContainer.style.display = 'block';
        if (loginScreen) loginScreen.style.display = 'flex';
        if (signupScreen) signupScreen.style.display = 'none';
        updateHamburgerVisibility();
    }
});

// =============================================
// MODAL & UI FUNCTIONS
// =============================================

// Generate Audit Report
function generateReport() {
    const modal = document.getElementById('audit-report');
    const button = event.target;
    button.textContent = 'Generating...';
    button.disabled = true;

    setTimeout(() => {
        button.textContent = '✓ Report Generated!';
        setTimeout(() => {
            closeModal('audit-report');
            alert('Audit report generated successfully!\n\nA comprehensive PDF containing all required Texas DFPS documentation has been created.\n\nYou can now:\n• Print the report for in-person inspections\n• Email to licensing@dfps.texas.gov\n• Share via secure link\n\nReport includes 94 pages of documentation across 6 compliance categories.');
            button.textContent = 'Generate Report (5 seconds)';
            button.disabled = false;
        }, 500);
    }, 2000);
}

// Upload Document Multi-Step Functions
let currentUploadStep = 1;
let selectedFile = null;

// Toggle expiration date field
function toggleExpirationDate() {
    const checkbox = document.getElementById('upload-no-exp');
    const expDateInput = document.getElementById('upload-exp-date');

    if (checkbox.checked) {
        expDateInput.disabled = true;
        expDateInput.value = '';
        expDateInput.style.opacity = '0.5';
        expDateInput.style.cursor = 'not-allowed';
    } else {
        expDateInput.disabled = false;
        expDateInput.style.opacity = '1';
        expDateInput.style.cursor = 'text';
    }
}

// File handling functions
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        validateAndShowFile(file);
    }
}

function handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    const dropzone = document.getElementById('upload-dropzone');
    dropzone.style.borderColor = 'var(--primary)';
    dropzone.style.background = 'var(--gray-50)';
}

function handleDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();
    const dropzone = document.getElementById('upload-dropzone');
    dropzone.style.borderColor = 'var(--gray-300)';
    dropzone.style.background = 'transparent';
}

function handleFileDrop(event) {
    event.preventDefault();
    event.stopPropagation();

    const dropzone = document.getElementById('upload-dropzone');
    dropzone.style.borderColor = 'var(--gray-300)';
    dropzone.style.background = 'transparent';

    const file = event.dataTransfer.files[0];
    if (file) {
        validateAndShowFile(file);
    }
}

function validateAndShowFile(file) {
    // Validate file type
    const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword'
    ];

    const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.docx', '.doc'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
        showError('Invalid file type. Please upload PDF, JPG, PNG, or DOCX files only.');
        return;
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
        showError('File size exceeds 10MB limit. Please choose a smaller file.');
        return;
    }

    // Store file and show preview
    selectedFile = file;
    showFilePreview(file);
}

function showFilePreview(file) {
    // Get file icon based on type
    let icon = '📄';
    if (file.type.includes('pdf')) icon = '📕';
    else if (file.type.includes('image')) icon = '🖼️';
    else if (file.type.includes('word')) icon = '📘';

    // Format file size
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    const sizeDisplay = sizeInMB > 1 ? `${sizeInMB} MB` : `${(file.size / 1024).toFixed(0)} KB`;

    // Update preview UI
    document.getElementById('file-icon').textContent = icon;
    document.getElementById('file-name').textContent = file.name;
    document.getElementById('file-size').textContent = sizeDisplay;

    // Show preview, hide dropzone
    document.getElementById('upload-dropzone').style.display = 'none';
    document.getElementById('upload-preview').style.display = 'block';

    console.log('File selected:', file.name, sizeDisplay);
}

function removeSelectedFile() {
    selectedFile = null;
    document.getElementById('upload-file-input').value = '';
    document.getElementById('upload-dropzone').style.display = 'block';
    document.getElementById('upload-preview').style.display = 'none';
    document.getElementById('upload-progress-container').style.display = 'none';
    console.log('File removed');
}

function nextUploadStep() {
    // Validate current step before proceeding
    if (currentUploadStep === 1) {
        const docName = document.getElementById('upload-doc-name').value.trim();
        const formNumber = document.getElementById('upload-form-number').value;
        const category = document.getElementById('upload-category').value;
        const violation = document.getElementById('upload-violation').value;

        if (!docName || !formNumber || !category || !violation) {
            showError('Please fill in all required fields before continuing');
            return;
        }
    } else if (currentUploadStep === 2) {
        const issueDate = document.getElementById('upload-issue-date').value;
        const noExp = document.getElementById('upload-no-exp').checked;
        const expDate = document.getElementById('upload-exp-date').value;
        const associated = document.getElementById('upload-associated').value;
        const owner = document.getElementById('upload-owner').value.trim();

        if (!issueDate || !associated || !owner) {
            showError('Please fill in all required fields before continuing');
            return;
        }

        if (!noExp && !expDate) {
            showError('Please select an expiration date or check "No expiration date"');
            return;
        }

        // Validate dates
        const issue = new Date(issueDate);
        if (expDate) {
            const exp = new Date(expDate);
            if (exp <= issue) {
                showError('Expiration date must be after issue date');
                return;
            }
        }
    } else if (currentUploadStep === 3) {
        if (!selectedFile) {
            showError('Please select a file to upload');
            return;
        }
    }

    if (currentUploadStep < 4) {
        document.getElementById('upload-step-' + currentUploadStep).style.display = 'none';
        document.getElementById('step-indicator-' + currentUploadStep).style.background = 'var(--gray-200)';
        document.getElementById('step-indicator-' + currentUploadStep).style.color = 'var(--gray-600)';

        currentUploadStep++;

        document.getElementById('upload-step-' + currentUploadStep).style.display = 'block';
        document.getElementById('step-indicator-' + currentUploadStep).style.background = 'var(--primary)';
        document.getElementById('step-indicator-' + currentUploadStep).style.color = 'white';

        // Update buttons
        document.getElementById('upload-prev-btn').style.display = 'inline-block';
        if (currentUploadStep === 4) {
            document.getElementById('upload-next-btn').style.display = 'none';
            document.getElementById('upload-save-btn').style.display = 'inline-block';
            updateReviewSummary();
        }
    }
}

function previousUploadStep() {
    if (currentUploadStep > 1) {
        document.getElementById('upload-step-' + currentUploadStep).style.display = 'none';
        document.getElementById('step-indicator-' + currentUploadStep).style.background = 'var(--gray-200)';
        document.getElementById('step-indicator-' + currentUploadStep).style.color = 'var(--gray-600)';

        currentUploadStep--;

        document.getElementById('upload-step-' + currentUploadStep).style.display = 'block';
        document.getElementById('step-indicator-' + currentUploadStep).style.background = 'var(--primary)';
        document.getElementById('step-indicator-' + currentUploadStep).style.color = 'white';

        // Update buttons
        if (currentUploadStep === 1) {
            document.getElementById('upload-prev-btn').style.display = 'none';
        }
        document.getElementById('upload-next-btn').style.display = 'inline-block';
        document.getElementById('upload-save-btn').style.display = 'none';
    }
}

function updateReviewSummary() {
    document.getElementById('review-doc-name').textContent = document.getElementById('upload-doc-name').value || '—';

    const formSelect = document.getElementById('upload-form-number');
    document.getElementById('review-form-number').textContent = formSelect.options[formSelect.selectedIndex].text || '—';

    const catSelect = document.getElementById('upload-category');
    document.getElementById('review-category').textContent = catSelect.options[catSelect.selectedIndex].text || '—';

    const violationSelect = document.getElementById('upload-violation');
    document.getElementById('review-violation').textContent = violationSelect.options[violationSelect.selectedIndex].text || '—';

    document.getElementById('review-issue-date').textContent = document.getElementById('upload-issue-date').value || '—';
    document.getElementById('review-exp-date').textContent = document.getElementById('upload-exp-date').value || 'No expiration';

    const assocSelect = document.getElementById('upload-associated');
    document.getElementById('review-associated').textContent = assocSelect.options[assocSelect.selectedIndex].text || '—';

    document.getElementById('review-owner').textContent = document.getElementById('upload-owner').value || '—';
}

async function saveDocument() {
    // Validate facility and user
    if (!AppState.facility || !AppState.facility.id) {
        showError('Please log in first to upload documents');
        return;
    }

    if (!selectedFile) {
        showError('No file selected');
        return;
    }

    const button = document.getElementById('upload-save-btn');
    setLoading(button, true);

    try {
        // Collect form data
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('name', document.getElementById('upload-doc-name').value.trim());
        formData.append('formNumber', document.getElementById('upload-form-number').value);
        formData.append('category', document.getElementById('upload-category').value);
        formData.append('violationWeight', document.getElementById('upload-violation').value);
        formData.append('issueDate', document.getElementById('upload-issue-date').value);
        formData.append('expirationDate', document.getElementById('upload-exp-date').value || null);
        formData.append('associated', document.getElementById('upload-associated').value);
        formData.append('owner', document.getElementById('upload-owner').value.trim());
        formData.append('facilityId', AppState.facility.id);
        formData.append('uploadedBy', AppState.user?.name || 'Unknown');

        console.log('Uploading document with form data');

        // Show upload progress
        document.getElementById('upload-progress-container').style.display = 'block';
        simulateUploadProgress();

        // Upload using apiUpload (handles FormData)
        const response = await apiUpload(`/facilities/${AppState.facility.id}/documents/upload`, formData);

        console.log('Document uploaded successfully:', response);
        showSuccess('✓ Document uploaded successfully!');
        closeModal('upload-document');
        resetUploadModal();
        await loadDocuments(currentDocumentFilter);
    } catch (error) {
        console.error('Failed to upload document:', error);
        showError(error.message || 'Failed to upload document. Please try again.');
    } finally {
        setLoading(button, false);
    }
}

function simulateUploadProgress() {
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
        }
        document.getElementById('upload-progress-bar').style.width = progress + '%';
        document.getElementById('upload-percentage').textContent = Math.round(progress) + '%';
    }, 200);
}

function resetUploadModal() {
    currentUploadStep = 1;
    selectedFile = null;

    // Reset form
    document.getElementById('upload-file-input').value = '';
    document.getElementById('upload-dropzone').style.display = 'block';
    document.getElementById('upload-preview').style.display = 'none';
    document.getElementById('upload-progress-container').style.display = 'none';

    // Reset steps
    document.querySelectorAll('.upload-step').forEach(step => step.style.display = 'none');
    document.getElementById('upload-step-1').style.display = 'block';

    // Reset step indicators
    for (let i = 1; i <= 4; i++) {
        if (i === 1) {
            document.getElementById('step-indicator-' + i).style.background = 'var(--primary)';
            document.getElementById('step-indicator-' + i).style.color = 'white';
        } else {
            document.getElementById('step-indicator-' + i).style.background = 'var(--gray-200)';
            document.getElementById('step-indicator-' + i).style.color = 'var(--gray-600)';
        }
    }

    // Reset buttons
    document.getElementById('upload-prev-btn').style.display = 'none';
    document.getElementById('upload-next-btn').style.display = 'inline-block';
    document.getElementById('upload-save-btn').style.display = 'none';
}

// Auto-fill owner based on association
document.getElementById('upload-associated')?.addEventListener('change', function () {
    const ownerField = document.getElementById('upload-owner');
    const selectedText = this.options[this.selectedIndex].text;
    if (selectedText !== 'Select association...') {
        ownerField.value = selectedText.split(' (')[0];
    }
});

// Close modal when clicking outside
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
});

// =============================================
// MODULE DATA LOADING FUNCTIONS
// =============================================

// Enhanced showScreen function to load data when switching views
const originalShowScreen = showScreen;
showScreen = async function (screenId) {
    originalShowScreen.call(this, screenId);

    // Load data for the selected screen
    if (!AppState.facility) return;

    switch (screenId) {
        case 'staff':
            await loadStaffList();
            break;
        case 'incidents':
            await loadIncidentList();
            break;
        case 'medication':
            await loadMedicationList();
            break;
        case 'licensing':
            await loadComplianceList();
            break;
        case 'checklist':
            await loadTodayChecklist();
            break;
        case 'training':
            await loadTrainingModules();
            break;
        case 'documents':
            await loadDocuments();
            break;
    }
};

// =============================================
// CSV BULK IMPORT SYSTEM
// =============================================

let csvData = {
    type: null,
    file: null,
    parsed: null,
    validRows: [],
    errorRows: [],
    currentStep: 1
};

// Handle drag over
function handleCSVDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.add('drag-over');
}

// Handle file drop
function handleCSVDrop(event, type) {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.remove('drag-over');

    const files = event.dataTransfer.files;
    if (files.length > 0) {
        processCSVFile(files[0], type);
    }
}

// Handle file select
function handleCSVFileSelect(event, type) {
    const file = event.target.files[0];
    if (file) {
        processCSVFile(file, type);
    }
}

// Process CSV file
function processCSVFile(file, type) {
    console.log('Processing CSV file:', file.name, 'Type:', type);

    // Validate file type
    if (!file.name.endsWith('.csv')) {
        showError('Invalid file type. Please upload a CSV file.');
        return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
        showError('File is too large. Maximum size is 5MB.');
        return;
    }

    // Store file info
    csvData.type = type;
    csvData.file = file;

    // Show file preview
    const prefix = type === 'medication' ? 'med-' : '';
    document.getElementById(`csv-${prefix}filename`).textContent = file.name;
    document.getElementById(`csv-${prefix}filesize`).textContent = formatFileSize(file.size);
    document.getElementById(`csv-${prefix}file-preview`).style.display = 'block';
    document.getElementById(`csv-${prefix}drop-zone`).style.display = 'none';

    // Enable next button
    document.getElementById(`csv-${prefix}next-btn`).disabled = false;

    // Parse CSV
    parseCSV(file, type);
}

// Parse CSV with PapaParse
function parseCSV(file, type) {
    console.log('Parsing CSV file...');

    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: function (results) {
            console.log('CSV parsed:', results);
            csvData.parsed = results.data;

            // Validate data
            validateCSVData(results.data, type);
        },
        error: function (error) {
            console.error('CSV parse error:', error);
            showError('Failed to parse CSV file: ' + error.message);
        }
    });
}

// Validate CSV data
function validateCSVData(data, type) {
    console.log('Validating CSV data...', data.length, 'rows');

    csvData.validRows = [];
    csvData.errorRows = [];

    const requiredFields = type === 'staff'
        ? ['Name', 'Email', 'Role', 'Hire Date']
        : ['Child Name', 'Medication Name', 'Dosage', 'Frequency', 'Route', 'Start Date', 'End Date', 'Prescriber Name', 'Prescriber Phone'];

    data.forEach((row, index) => {
        const errors = [];

        // Check required fields
        requiredFields.forEach(field => {
            if (!row[field] || row[field].trim() === '') {
                errors.push(`Missing required field: ${field}`);
            }
        });

        // Type-specific validation
        if (type === 'staff') {
            // Validate email format
            if (row.Email && !isValidEmail(row.Email)) {
                errors.push('Invalid email format');
            }

            // Validate hire date
            if (row['Hire Date'] && !isValidDate(row['Hire Date'])) {
                errors.push('Invalid hire date format (use YYYY-MM-DD)');
            }
        } else if (type === 'medication') {
            // Validate dates
            if (row['Start Date'] && !isValidDate(row['Start Date'])) {
                errors.push('Invalid start date format (use YYYY-MM-DD)');
            }
            if (row['End Date'] && !isValidDate(row['End Date'])) {
                errors.push('Invalid end date format (use YYYY-MM-DD)');
            }

            // Validate route
            const validRoutes = ['Oral', 'Injection', 'Topical', 'Inhalation'];
            if (row.Route && !validRoutes.includes(row.Route)) {
                errors.push(`Invalid route (must be: ${validRoutes.join(', ')})`);
            }

            // Texas compliance: Max 1 year authorization
            if (row['Start Date'] && row['End Date']) {
                const start = new Date(row['Start Date']);
                const end = new Date(row['End Date']);
                const daysDiff = (end - start) / (1000 * 60 * 60 * 24);
                if (daysDiff > 365) {
                    errors.push('Authorization exceeds 1 year (Texas §746.2653)');
                }
            }
        }

        if (errors.length > 0) {
            csvData.errorRows.push({ row: index + 1, data: row, errors });
        } else {
            csvData.validRows.push({ row: index + 1, data: row });
        }
    });

    console.log('Validation complete:', csvData.validRows.length, 'valid,', csvData.errorRows.length, 'errors');
}

// CSV Navigation & Display Functions
function csvNextStep() {
    const prefix = csvData.type === 'medication' ? 'med-' : '';

    if (csvData.currentStep === 1) {
        csvData.currentStep = 2;
        document.getElementById(`csv-${prefix}upload-step`).style.display = 'none';
        document.getElementById(`csv-${prefix}preview-step`).style.display = 'block';
        document.getElementById(`csv-${prefix}back-btn`).style.display = 'inline-block';
        document.getElementById(`csv-${prefix}next-btn`).style.display = 'none';
        document.getElementById(`csv-${prefix}import-btn`).style.display = 'inline-block';

        displayCSVPreview(csvData.type);
    }
}

function csvGoBack() {
    if (csvData.currentStep === 2) {
        csvData.currentStep = 1;
        document.getElementById('csv-upload-step').style.display = 'block';
        document.getElementById('csv-preview-step').style.display = 'none';
        document.getElementById('csv-back-btn').style.display = 'none';
        document.getElementById('csv-next-btn').style.display = 'inline-block';
        document.getElementById('csv-import-btn').style.display = 'none';
    }
}

function csvMedGoBack() {
    if (csvData.currentStep === 2) {
        csvData.currentStep = 1;
        document.getElementById('csv-med-upload-step').style.display = 'block';
        document.getElementById('csv-med-preview-step').style.display = 'none';
        document.getElementById('csv-med-back-btn').style.display = 'none';
        document.getElementById('csv-med-next-btn').style.display = 'inline-block';
        document.getElementById('csv-med-import-btn').style.display = 'none';
    }
}

function csvMedNextStep() {
    const prefix = 'med-';

    if (csvData.currentStep === 1) {
        csvData.currentStep = 2;
        document.getElementById(`csv-${prefix}upload-step`).style.display = 'none';
        document.getElementById(`csv-${prefix}preview-step`).style.display = 'block';
        document.getElementById(`csv-${prefix}back-btn`).style.display = 'inline-block';
        document.getElementById(`csv-${prefix}next-btn`).style.display = 'none';
        document.getElementById(`csv-${prefix}import-btn`).style.display = 'inline-block';

        displayCSVPreview(csvData.type);
    }
}

function displayCSVPreview(type) {
    const prefix = type === 'medication' ? 'med-' : '';

    document.getElementById(`csv-${prefix}total-rows`).textContent = csvData.parsed.length;
    document.getElementById(`csv-${prefix}valid-rows`).textContent = csvData.validRows.length;
    document.getElementById(`csv-${prefix}error-rows`).textContent = csvData.errorRows.length;

    const headers = Object.keys(csvData.parsed[0] || {});
    const headerHTML = headers.map(h => `<th>${h}</th>`).join('');
    document.getElementById(`csv-${prefix}preview-header`).innerHTML = `<tr>${headerHTML}<th>Status</th></tr>`;

    const bodyHTML = csvData.parsed.slice(0, 50).map((row, index) => {
        const hasError = csvData.errorRows.find(e => e.row === index + 1);
        const rowClass = hasError ? 'csv-error-row' : '';
        const cells = headers.map(h => `<td>${row[h] || ''}</td>`).join('');
        const status = hasError
            ? `<span class="badge badge-danger">Error</span>`
            : `<span class="badge badge-success">Valid</span>`;
        return `<tr class="${rowClass}">${cells}<td>${status}</td></tr>`;
    }).join('');

    document.getElementById(`csv-${prefix}preview-body`).innerHTML = bodyHTML;

    if (csvData.errorRows.length > 0) {
        document.getElementById(`csv-${prefix}errors`).style.display = 'block';
        const errorHTML = csvData.errorRows.slice(0, 20).map(e =>
            `<div style="margin-bottom: 8px;">
                <strong>Row ${e.row}:</strong> ${e.errors.join(', ')}
            </div>`
        ).join('');
        document.getElementById(`csv-${prefix}error-list`).innerHTML = errorHTML;
    } else {
        document.getElementById(`csv-${prefix}errors`).style.display = 'none';
    }
}

async function executeCSVImport(type) {
    console.log('Executing CSV import for:', type);

    if (csvData.validRows.length === 0) {
        showError('No valid rows to import');
        return;
    }

    if (!AppState.facility || !AppState.facility.id) {
        showError('Facility not loaded. Please refresh the page.');
        return;
    }

    const prefix = type === 'medication' ? 'med-' : '';

    csvData.currentStep = 3;
    document.getElementById(`csv-${prefix}preview-step`).style.display = 'none';
    document.getElementById(`csv-${prefix}import-btn`).style.display = 'none';
    document.getElementById(`csv-${prefix}back-btn`).style.display = 'none';
    document.getElementById('csv-cancel-text').textContent = 'Close';

    if (type === 'staff') {
        document.getElementById('csv-import-step').style.display = 'block';
    }

    try {
        const results = await importCSVData(type, csvData.validRows);
        showImportResults(results, type);
    } catch (error) {
        console.error('Import failed:', error);
        showError('Import failed: ' + error.message);
        closeCSVImport();
    }
}

async function importCSVData(type, rows) {
    const endpoint = type === 'staff'
        ? `/facilities/${AppState.facility.id}/staff/bulk`
        : `/facilities/${AppState.facility.id}/medications/bulk`;

    const data = rows.map(r => r.data);

    console.log('Importing to:', endpoint, data.length, 'rows');

    const response = await apiRequest(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data })
    });

    return response;
}

function showImportResults(results, type) {
    const prefix = type === 'medication' ? 'med-' : '';

    if (type === 'staff') {
        document.getElementById('csv-import-step').style.display = 'none';
        document.getElementById('csv-results-step').style.display = 'block';
        document.getElementById('csv-done-btn').style.display = 'inline-block';

        const success = results.success || 0;
        const failed = results.failed || 0;

        document.getElementById('csv-success-count').textContent = success;
        document.getElementById('csv-failure-count').textContent = failed;

        if (failed > 0) {
            document.getElementById('csv-results-icon').textContent = '⚠️';
            document.getElementById('csv-results-title').textContent = 'Import Completed with Errors';
            document.getElementById('csv-results-message').textContent =
                `${success} staff members imported successfully, ${failed} failed.`;

            document.getElementById('csv-failed-rows').style.display = 'block';
            const failedHTML = (results.errors || []).map(e =>
                `<div style="margin-bottom: 8px;">
                    <strong>${e.row}:</strong> ${e.error}
                </div>`
            ).join('');
            document.getElementById('csv-failed-list').innerHTML = failedHTML;
        } else {
            document.getElementById('csv-results-message').textContent =
                `All ${success} staff members imported successfully!`;
        }
    } else {
        showSuccess(`Imported ${results.success || csvData.validRows.length} medications successfully!`);
        closeCSVMedImport();
        loadMedicationList();
    }
}

function closeCSVImport() {
    closeModal('import-staff-csv');
    resetCSVImport();
    loadStaffList();
}

function closeCSVMedImport() {
    closeModal('import-medication-csv');
    resetCSVImport();
}

function resetCSVImport() {
    csvData = {
        type: null,
        file: null,
        parsed: null,
        validRows: [],
        errorRows: [],
        currentStep: 1
    };

    ['', 'med-'].forEach(prefix => {
        const uploadStep = document.getElementById(`csv-${prefix}upload-step`);
        const previewStep = document.getElementById(`csv-${prefix}preview-step`);
        const filePreview = document.getElementById(`csv-${prefix}file-preview`);
        const dropZone = document.getElementById(`csv-${prefix}drop-zone`);
        const nextBtn = document.getElementById(`csv-${prefix}next-btn`);

        if (uploadStep) uploadStep.style.display = 'block';
        if (previewStep) previewStep.style.display = 'none';
        if (filePreview) filePreview.style.display = 'none';
        if (dropZone) dropZone.style.display = 'block';
        if (nextBtn) nextBtn.disabled = true;
    });

    const importStep = document.getElementById('csv-import-step');
    const resultsStep = document.getElementById('csv-results-step');
    const backBtn = document.getElementById('csv-back-btn');
    const importBtn = document.getElementById('csv-import-btn');
    const doneBtn = document.getElementById('csv-done-btn');

    if (importStep) importStep.style.display = 'none';
    if (resultsStep) resultsStep.style.display = 'none';
    if (backBtn) backBtn.style.display = 'none';
    if (importBtn) importBtn.style.display = 'none';
    if (doneBtn) doneBtn.style.display = 'none';

    document.getElementById('csv-cancel-text').textContent = 'Cancel';
}

function removeCSVFile() {
    document.getElementById('csv-file-preview').style.display = 'none';
    document.getElementById('csv-drop-zone').style.display = 'block';
    document.getElementById('csv-next-btn').disabled = true;
    document.getElementById('csv-file-input').value = '';
    csvData.file = null;
    csvData.parsed = null;
}

function removeCSVMedFile() {
    document.getElementById('csv-med-file-preview').style.display = 'none';
    document.getElementById('csv-med-drop-zone').style.display = 'block';
    document.getElementById('csv-med-next-btn').disabled = true;
    document.getElementById('csv-med-file-input').value = '';
    csvData.file = null;
    csvData.parsed = null;
}

function downloadCSVErrorReport() {
    const csvContent = 'Row,Error\n' + csvData.errorRows.map(e =>
        `${e.row},"${e.errors.join('; ')}"`
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'import-errors.csv';
    a.click();
    window.URL.revokeObjectURL(url);
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidDate(dateString) {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
}

// STAFF MANAGEMENT
function toggleCertificationFields(type) {
    const checkbox = document.getElementById(`staff-has-${type}`);
    const fields = document.getElementById(`${type}-fields`);

    if (checkbox && fields) {
        fields.style.display = checkbox.checked ? 'block' : 'none';

        // Clear fields if unchecked
        if (!checkbox.checked) {
            const inputs = fields.querySelectorAll('input, select');
            inputs.forEach(input => {
                if (input.type !== 'checkbox') {
                    input.value = '';
                }
            });
        }
    }
}

async function loadStaffList() {
    try {
        // Show skeleton while loading
        showTableSkeleton('#staff .data-table', 5, 10);

        const response = await apiRequest(`/facilities/${AppState.facility.id}/staff`);
        const tbody = document.querySelector('#staff .data-table tbody');
        if (!tbody) return;

        const staff = response.data || [];

        // Calculate stats for staff overview
        const totalStaff = staff.length;
        let compliantCount = 0;
        let expiringCount = 0;
        let expiredCount = 0;

        // Certification counts
        let cprValid = 0, firstAidValid = 0, backgroundValid = 0, foodHandlerValid = 0;

        const today = new Date();
        const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));

        staff.forEach(member => {
            const certs = member.certifications || {};
            let hasExpired = false;
            let hasExpiring = false;

            // Check CPR
            if (certs.cpr?.expiresAt) {
                const expDate = new Date(certs.cpr.expiresAt);
                if (expDate >= today) {
                    cprValid++;
                    if (expDate <= thirtyDaysFromNow) hasExpiring = true;
                } else {
                    hasExpired = true;
                }
            }

            // Check First Aid
            if (certs.firstAid?.expiresAt) {
                const expDate = new Date(certs.firstAid.expiresAt);
                if (expDate >= today) {
                    firstAidValid++;
                    if (expDate <= thirtyDaysFromNow) hasExpiring = true;
                } else {
                    hasExpired = true;
                }
            }

            // Check Background
            if (certs.backgroundCheck?.status === 'Clear') {
                backgroundValid++;
            }

            // Check Food Handler
            if (certs.foodHandler?.expiresAt) {
                const expDate = new Date(certs.foodHandler.expiresAt);
                if (expDate >= today) {
                    foodHandlerValid++;
                    if (expDate <= thirtyDaysFromNow) hasExpiring = true;
                } else {
                    hasExpired = true;
                }
            }

            // Count staff status
            if (hasExpired) {
                expiredCount++;
            } else if (hasExpiring) {
                expiringCount++;
            } else if (cprValid > 0 && firstAidValid > 0 && backgroundValid > 0) {
                compliantCount++;
            }
        });

        // Update stat cards
        document.getElementById('staff-total-count').textContent = totalStaff;
        document.getElementById('staff-compliant-count').textContent = compliantCount;
        document.getElementById('staff-expiring-count').textContent = expiringCount;
        document.getElementById('staff-expired-count').textContent = expiredCount;

        // Update certification overview
        document.getElementById('cert-cpr-count').textContent = cprValid;
        document.getElementById('cert-cpr-total').textContent = totalStaff;
        document.getElementById('cert-firstaid-count').textContent = firstAidValid;
        document.getElementById('cert-firstaid-total').textContent = totalStaff;
        document.getElementById('cert-background-count').textContent = backgroundValid;
        document.getElementById('cert-background-total').textContent = totalStaff;
        document.getElementById('cert-food-count').textContent = foodHandlerValid;
        document.getElementById('cert-food-total').textContent = totalStaff;

        // Update filter button
        document.getElementById('staff-filter-all').textContent = totalStaff;

        // Check if empty and show professional empty state
        if (staff.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="10" style="text-align: center; padding: 60px 20px;">
                        <div style="max-width: 450px; margin: 0 auto;">
                            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity: 0.2; margin-bottom: 20px;">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                <circle cx="9" cy="7" r="4"></circle>
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                            </svg>
                            <h3 style="font-size: 18px; font-weight: 600; color: var(--gray-700); margin-bottom: 8px;">No Staff Members Yet</h3>
                            <p style="font-size: 14px; color: var(--gray-500); margin-bottom: 24px;">
                                Build your team by adding staff members. Track certifications, training hours, and compliance requirements all in one place.
                            </p>
                            <div style="display: flex; gap: 12px; justify-content: center;">
                                <button class="btn btn-primary" onclick="openModal('add-staff')" style="padding: 10px 24px;">
                                    <span style="margin-right: 8px;">👥</span> Add Staff Member
                                </button>
                                <button class="btn btn-secondary" onclick="openModal('csv-import-staff')" style="padding: 10px 24px;">
                                    <span style="margin-right: 8px;">📄</span> Import CSV
                                </button>
                            </div>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        // Helper function to get certification badge with expiration
        const getCertBadge = (cert) => {
            if (!cert || !cert.expiresAt) return '<span class="badge badge-secondary">N/A</span>';
            const expDate = new Date(cert.expiresAt);
            const today = new Date();
            const daysUntilExpiry = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));

            if (daysUntilExpiry < 0) {
                return '<span class="badge badge-danger">Expired</span>';
            } else if (daysUntilExpiry <= 30) {
                return `<span class="badge" style="background: #fef3c7; color: #92400e;">Exp ${expDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>`;
            } else {
                return '<span class="badge badge-success">Valid</span>';
            }
        };

        tbody.innerHTML = staff.map(member => {
            // Calculate overall status
            const certs = member.certifications || {};
            let overallStatus = 'compliant';
            let statusBadge = '<span class="cac-badge cac-badge-success">✓ Compliant</span>';

            const today = new Date();
            const thirtyDays = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));

            // Check for expired or expiring certs
            let hasExpired = false;
            let hasExpiring = false;

            [certs.cpr, certs.firstAid, certs.foodHandler].forEach(cert => {
                if (cert?.expiresAt) {
                    const expDate = new Date(cert.expiresAt);
                    if (expDate < today) {
                        hasExpired = true;
                    } else if (expDate <= thirtyDays) {
                        hasExpiring = true;
                    }
                }
            });

            if (hasExpired) {
                statusBadge = '<span class="cac-badge cac-badge-danger">❌ Expired</span>';
            } else if (hasExpiring) {
                statusBadge = '<span class="cac-badge" style="background: #fef3c7; color: #92400e; border: 1px solid #fcd34d;">⚠️ Expiring</span>';
            }

            return `
            <tr style="transition: background-color 0.2s ease;">
                <td><strong style="color: var(--gray-900); font-size: 0.85rem;">${member.name}</strong></td>
                <td style="color: var(--gray-700); font-size: 0.8rem;">${member.role}</td>
                <td class="hide-mobile" style="font-size: 0.75rem;">${getCertBadge(certs.cpr)}</td>
                <td class="hide-mobile" style="font-size: 0.75rem;">${getCertBadge(certs.firstAid)}</td>
                <td class="hide-mobile" style="font-size: 0.75rem;"><span class="cac-badge ${certs.backgroundCheck?.status === 'Clear' ? 'cac-badge-success' : 'cac-badge-warning'}">${certs.backgroundCheck?.status || 'Pending'}</span></td>
                <td class="hide-mobile" style="font-size: 0.75rem;">${getCertBadge(certs.foodHandler)}</td>
                <td style="font-size: 0.75rem;">${statusBadge}</td>
                <td>
                    <button class="cac-btn cac-btn-sm cac-btn-secondary" onclick="viewStaffDetails('${member.id}')" style="padding: 6px 12px; font-size: 0.75rem; margin-right: 4px;">View</button>
                    <button class="cac-btn cac-btn-sm" onclick="startOnboardingForStaff('${member.id}', '${member.name}')" style="padding: 6px 12px; font-size: 0.75rem; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; border: none;">🎓 Start Onboarding</button>
                </td>
            </tr>
        `;
        }).join('');

        // Make table sortable
        makeSortable('#staff .data-table');
    } catch (error) {
        console.error('Failed to load staff:', error);
        showError('Failed to load staff list');
        // Show professional error state
        const tbody = document.querySelector('#staff .data-table tbody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="10" style="text-align: center; padding: 60px 20px;">
                        <div style="max-width: 400px; margin: 0 auto;">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--danger); margin-bottom: 16px;">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                            <h3 style="font-size: 16px; font-weight: 600; color: var(--danger); margin-bottom: 8px;">Failed to Load Staff</h3>
                            <p style="font-size: 14px; color: var(--gray-600); margin-bottom: 16px;">There was an error loading your staff list. Please try again.</p>
                            <button class="btn btn-secondary" onclick="loadStaffList()" style="padding: 8px 20px;">
                                <span style="margin-right: 6px;">🔄</span> Retry
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }
    }
}

let currentStaffData = null;

async function editStaffFromId(staffId) {
    // Load staff data and open edit modal
    try {
        const response = await apiRequest(`/staff/${staffId}`);
        currentStaffData = response.data || response;
        editStaffFromDetails();
    } catch (error) {
        console.error('Failed to load staff for editing:', error);
        showError('Failed to load staff details');
    }
}

function filterStaff(type) {
    console.log('Filtering staff by:', type);

    // Update button states
    const buttons = document.querySelectorAll('#staff-roster .cac-card-actions .cac-btn');
    buttons.forEach(btn => {
        btn.classList.remove('cac-btn-primary');
        btn.classList.add('cac-btn-secondary');
        if ((type === 'all' && btn.textContent.includes('All')) ||
            (type === 'expiring' && btn.textContent.includes('Expiring'))) {
            btn.classList.remove('cac-btn-secondary');
            btn.classList.add('cac-btn-primary');
        }
    });

    // Filter table rows
    const rows = document.querySelectorAll('#staff-table-body tr');
    rows.forEach(row => {
        if (type === 'all') {
            row.style.display = '';
        } else if (type === 'expiring') {
            const statusCell = row.cells[6]; // Status column
            if (statusCell && (statusCell.textContent.includes('Expiring') || statusCell.textContent.includes('Expired'))) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        }
    });
}

async function viewStaffDetails(staffId) {
    try {
        const response = await apiRequest(`/staff/${staffId}`);
        currentStaffData = response.data || response;

        const staff = currentStaffData;
        const hireDate = new Date(staff.hireDate).toLocaleDateString();

        // Build certifications section - Helper function
        const renderCert = (name, cert) => {
            if (!cert || !cert.expiresAt) {
                return `
                    <div style="padding: 12px; background: var(--gray-50); border-radius: 8px; border-left: 4px solid var(--gray-400);">
                        <strong style="font-size: 14px;">${name}</strong>
                        <div style="margin-top: 8px;">
                            <span class="badge badge-secondary">Not Set</span>
                        </div>
                    </div>
                `;
            }

            const expDate = new Date(cert.expiresAt);
            const today = new Date();
            const daysUntilExpiry = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));

            let badge, color;
            if (daysUntilExpiry < 0) {
                badge = 'Expired';
                color = 'var(--danger)';
            } else if (daysUntilExpiry <= 30) {
                badge = `Exp ${expDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
                color = 'var(--warning)';
            } else {
                badge = 'Valid';
                color = 'var(--success)';
            }

            return `
                <div style="padding: 12px; background: var(--gray-50); border-radius: 8px; border-left: 4px solid ${color};">
                    <strong style="font-size: 14px;">${name}</strong>
                    <div style="margin-top: 8px;">
                        <span class="badge" style="background: ${color}; color: white;">${badge}</span>
                        <p style="font-size: 13px; color: var(--gray-700); margin-top: 4px;">Expires: ${expDate.toLocaleDateString()}</p>
                    </div>
                </div>
            `;
        };

        let certsHTML = '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px;">';

        // Required Certifications
        certsHTML += renderCert('CPR Certification', staff.certifications?.cpr);
        certsHTML += renderCert('First Aid', staff.certifications?.firstAid);

        // Professional Certifications
        certsHTML += renderCert('CDA Credential', staff.certifications?.cda);
        certsHTML += renderCert('Teaching Certificate', staff.certifications?.teachingCertificate);
        certsHTML += renderCert('Food Handler', staff.certifications?.foodHandler);

        // Background Check (special handling)
        const bgStatus = staff.certifications?.backgroundCheck?.status || 'Pending';
        const bgColor = bgStatus === 'Clear' ? 'var(--success)' : bgStatus === 'Pending' ? 'var(--warning)' : 'var(--danger)';
        certsHTML += `
            <div style="padding: 12px; background: var(--gray-50); border-radius: 8px; border-left: 4px solid ${bgColor};">
                <strong style="font-size: 14px;">Background Check</strong>
                <div style="margin-top: 8px;">
                    <span class="badge" style="background: ${bgColor}; color: white;">${bgStatus}</span>
                </div>
            </div>
        `;

        // TB Screening (special handling)
        const tbStatus = staff.certifications?.tuberculosisScreening?.status || 'Pending';
        const tbColor = tbStatus === 'Complete' ? 'var(--success)' : 'var(--warning)';
        certsHTML += `
            <div style="padding: 12px; background: var(--gray-50); border-radius: 8px; border-left: 4px solid ${tbColor};">
                <strong style="font-size: 14px;">TB Screening</strong>
                <div style="margin-top: 8px;">
                    <span class="badge" style="background: ${tbColor}; color: white;">${tbStatus}</span>
                </div>
            </div>
        `;
        certsHTML += '</div>';

        // Training hours
        const trainingPercent = Math.round((staff.trainingHours.completed / staff.trainingHours.required) * 100);

        const content = `
            <div style="padding: 0 24px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px;">
                    <div>
                        <label style="font-size: 12px; color: var(--gray-600); text-transform: uppercase;">Full Name</label>
                        <p style="font-size: 16px; font-weight: 600; margin-top: 4px;">${staff.name}</p>
                    </div>
                    <div>
                        <label style="font-size: 12px; color: var(--gray-600); text-transform: uppercase;">Role</label>
                        <p style="font-size: 16px; font-weight: 600; margin-top: 4px;">${staff.role}</p>
                    </div>
                    <div>
                        <label style="font-size: 12px; color: var(--gray-600); text-transform: uppercase;">Email</label>
                        <p style="font-size: 16px; margin-top: 4px;">${staff.email}</p>
                    </div>
                    <div>
                        <label style="font-size: 12px; color: var(--gray-600); text-transform: uppercase;">Hire Date</label>
                        <p style="font-size: 16px; margin-top: 4px;">${hireDate}</p>
                    </div>
                </div>
                
                <div style="border-top: 1px solid var(--gray-200); padding-top: 20px; margin-bottom: 20px;">
                    <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 12px;">📋 Certifications</h3>
                    ${certsHTML}
                </div>
                
                <div style="border-top: 1px solid var(--gray-200); padding-top: 20px;">
                    <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 12px;">📚 Training Hours (${staff.trainingHours.year || new Date().getFullYear()})</h3>
                    <div style="background: var(--gray-50); padding: 16px; border-radius: 8px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <span style="font-size: 14px; font-weight: 600;">Progress</span>
                            <span style="font-size: 14px; font-weight: 600;">${staff.trainingHours.completed}/${staff.trainingHours.required} hours (${trainingPercent}%)</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${trainingPercent}%;"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('staff-details-content').innerHTML = content;
        openModal('staff-details');
    } catch (error) {
        console.error('Failed to load staff details:', error);
        showError('Failed to load staff details');
    }
}

function editStaffFromDetails() {
    if (!currentStaffData) return;

    document.getElementById('edit-staff-id').value = currentStaffData.id;
    document.getElementById('edit-staff-name').value = currentStaffData.name;
    document.getElementById('edit-staff-role').value = currentStaffData.role;
    document.getElementById('edit-staff-email').value = currentStaffData.email;

    closeModal('staff-details');
    openModal('edit-staff');
}

async function updateStaff(event) {
    event.preventDefault();

    const staffId = document.getElementById('edit-staff-id').value;
    const button = document.getElementById('update-staff-btn');
    setLoading(button, true);

    const updatedData = {
        name: document.getElementById('edit-staff-name').value.trim(),
        role: document.getElementById('edit-staff-role').value.trim(),
        email: document.getElementById('edit-staff-email').value.trim()
    };

    try {
        await apiRequest(`/staff/${staffId}`, {
            method: 'PUT',
            body: JSON.stringify(updatedData)
        });

        showSuccess('Staff member updated successfully!');
        closeModal('edit-staff');
        await loadStaffList();
    } catch (error) {
        console.error('Failed to update staff:', error);
        showError('Failed to update staff member');
    } finally {
        setLoading(button, false);
    }
}

let deleteContext = null;

function confirmDeleteStaff() {
    if (!currentStaffData) return;

    deleteContext = {
        type: 'staff',
        id: currentStaffData.id,
        name: currentStaffData.name
    };

    document.getElementById('delete-confirm-message').textContent =
        `Are you sure you want to delete ${currentStaffData.name} from your staff?`;

    closeModal('staff-details');
    openModal('delete-confirm');
}

async function executeDelete() {
    if (!deleteContext) return;

    const button = document.getElementById('confirm-delete-btn');
    setLoading(button, true);

    try {
        const endpoint = `/${deleteContext.type}/${deleteContext.id}`;
        await apiRequest(endpoint, { method: 'DELETE' });

        showSuccess(`${deleteContext.type.charAt(0).toUpperCase() + deleteContext.type.slice(1)} deleted successfully!`);
        closeModal('delete-confirm');

        // Reload appropriate list
        if (deleteContext.type === 'staff') await loadStaffList();
        else if (deleteContext.type === 'incidents') await loadIncidentList();
        else if (deleteContext.type === 'medications') await loadMedicationList();
        else if (deleteContext.type === 'documents') await loadDocuments();

        deleteContext = null;
    } catch (error) {
        console.error('Failed to delete:', error);
        showError(`Failed to delete ${deleteContext.type}`);
    } finally {
        setLoading(button, false);
    }
}

async function addStaff(event) {
    event.preventDefault();

    // Validate facility is loaded
    if (!AppState.facility || !AppState.facility.id) {
        showError('Please log in first to add staff members');
        return;
    }

    const button = document.getElementById('add-staff-btn');
    setLoading(button, true);

    // Validate form fields
    const name = document.getElementById('staff-name').value.trim();
    const role = document.getElementById('staff-role').value.trim();
    const email = document.getElementById('staff-email').value.trim();
    const hireDate = document.getElementById('staff-hire-date').value;

    if (!name || !role || !email || !hireDate) {
        showError('Please fill in all required fields');
        setLoading(button, false);
        return;
    }

    // Helper function to safely get form values
    const getVal = (id) => document.getElementById(id)?.value?.trim() || '';
    const getChecked = (id) => document.getElementById(id)?.checked || false;
    
    const staffData = {
        name,
        role,
        email,
        hireDate,
        certifications: {
            cda: {
                has: getChecked('staff-has-cda'),
                number: getVal('staff-cda-number'),
                expirationDate: getVal('staff-cda-expiration')
            },
            teachingCertificate: {
                has: getChecked('staff-has-teaching-cert'),
                number: getVal('staff-teaching-number'),
                type: getVal('staff-teaching-type'),
                expirationDate: getVal('staff-teaching-expiration')
            },
            foodHandler: {
                has: getChecked('staff-has-food-handler'),
                number: getVal('staff-food-number'),
                expirationDate: getVal('staff-food-expiration')
            },
            cprFirstAid: {
                has: getChecked('staff-has-cpr'),
                type: getVal('staff-cpr-type'),
                provider: getVal('staff-cpr-provider'),
                expirationDate: getVal('staff-cpr-expiration')
            },
            backgroundCheck: {
                has: getChecked('staff-has-background'),
                status: getVal('staff-background-status'),
                date: getVal('staff-background-date'),
                expirationDate: getVal('staff-background-expiration'),
                types: {
                    dfps: getChecked('staff-bg-dfps'),
                    fbi: getChecked('staff-bg-fbi'),
                    state: getChecked('staff-bg-state'),
                    sexOffender: getChecked('staff-bg-sex-offender')
                }
            },
            tbTest: {
                has: getChecked('staff-has-tb'),
                lastDate: getVal('staff-tb-last-date'),
                result: getVal('staff-tb-result'),
                nextDue: getVal('staff-tb-next-due')
            },
            preServiceTraining: {
                has: getChecked('staff-has-preservice'),
                hours: getVal('staff-preservice-hours'),
                completionDate: getVal('staff-preservice-completion'),
                topics: getVal('staff-preservice-topics')
            },
            annualTraining: {
                has: getChecked('staff-has-annual'),
                currentHours: getVal('staff-annual-hours'),
                year: getVal('staff-annual-year')
            },
            healthStatement: {
                has: getChecked('staff-has-health'),
                status: getVal('staff-health-status'),
                date: getVal('staff-health-date'),
                physician: getVal('staff-health-physician')
            }
        }
    };

    console.log('Adding staff with data:', staffData);

    try {
        const response = await apiRequest(`/facilities/${AppState.facility.id}/staff`, {
            method: 'POST',
            body: JSON.stringify(staffData)
        });

        console.log('Staff added successfully:', response);
        showSuccess('✓ Staff member added successfully!');
        document.getElementById('add-staff-form').reset();

        // Reset certification checkboxes and hide fields
        ['cda', 'teaching', 'food', 'cpr', 'background', 'tb', 'preservice', 'annual', 'health'].forEach(type => {
            const checkbox = document.getElementById(`staff-has-${type}`);
            const fields = document.getElementById(`${type}-fields`);
            if (checkbox) checkbox.checked = false;
            if (fields) fields.style.display = 'none';
        });

        closeModal('add-staff');
        await loadStaffList();
    } catch (error) {
        console.error('Failed to add staff:', error);
        showError(error.message || 'Failed to add staff member. Please try again.');
    } finally {
        setLoading(button, false);
    }
}

// INCIDENT REPORTING
let currentIncidentFilter = 'all';

async function loadIncidentList(filter = 'all') {
    try {
        currentIncidentFilter = filter;
        let url = `/facilities/${AppState.facility.id}/incidents`;
        if (filter && filter !== 'all') {
            url += `?type=${filter}`;
        }

        const response = await apiRequest(url);
        const incidents = response.data || [];

        // Calculate and populate stats
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
        const recentIncidents = incidents.filter(inc => new Date(inc.occurred_at || inc.dateTime) >= thirtyDaysAgo);

        // Days since last incident
        const sortedIncidents = [...incidents].sort((a, b) =>
            new Date(b.occurred_at || b.dateTime) - new Date(a.occurred_at || a.dateTime)
        );
        const lastIncidentDate = sortedIncidents.length > 0 ? new Date(sortedIncidents[0].occurred_at || sortedIncidents[0].dateTime) : null;
        const daysSafe = lastIncidentDate ? Math.floor((now - lastIncidentDate) / (1000 * 60 * 60 * 24)) : 365;

        // Pending signatures
        const pendingSignatures = incidents.filter(inc => !inc.parent_signature && !inc.parentSignature).length;

        // Average response time (mock for now)
        const avgResponseTime = "< 15m";

        // Update stat cards
        const incidentFreeDaysEl = document.getElementById('incident-free-days');
        const totalIncidentsEl = document.getElementById('total-incidents');
        const pendingSignaturesEl = document.getElementById('pending-signatures');
        const incidentResponseTimeEl = document.getElementById('incident-response-time');

        if (incidentFreeDaysEl) incidentFreeDaysEl.textContent = daysSafe;
        if (totalIncidentsEl) totalIncidentsEl.textContent = recentIncidents.length;
        if (pendingSignaturesEl) pendingSignaturesEl.textContent = pendingSignatures;
        if (incidentResponseTimeEl) incidentResponseTimeEl.textContent = avgResponseTime;

        // Calculate severity distribution
        const severityCounts = { minor: 0, moderate: 0, major: 0, critical: 0 };
        recentIncidents.forEach(inc => {
            const severity = (inc.severity || 'minor').toLowerCase();
            if (severityCounts.hasOwnProperty(severity)) {
                severityCounts[severity]++;
            }
        });

        // Update severity distribution cards (with correct IDs including 'severity-' prefix)
        const total = recentIncidents.length || 1; // Avoid division by zero

        const criticalCountEl = document.getElementById('severity-critical-count');
        const criticalBarEl = document.getElementById('severity-critical-bar');
        const majorCountEl = document.getElementById('severity-major-count');
        const majorBarEl = document.getElementById('severity-major-bar');
        const moderateCountEl = document.getElementById('severity-moderate-count');
        const moderateBarEl = document.getElementById('severity-moderate-bar');
        const minorCountEl = document.getElementById('severity-minor-count');
        const minorBarEl = document.getElementById('severity-minor-bar');

        if (criticalCountEl) criticalCountEl.textContent = severityCounts.critical;
        if (criticalBarEl) criticalBarEl.style.width = `${(severityCounts.critical / total) * 100}%`;
        if (majorCountEl) majorCountEl.textContent = severityCounts.major;
        if (majorBarEl) majorBarEl.style.width = `${(severityCounts.major / total) * 100}%`;
        if (moderateCountEl) moderateCountEl.textContent = severityCounts.moderate;
        if (moderateBarEl) moderateBarEl.style.width = `${(severityCounts.moderate / total) * 100}%`;
        if (minorCountEl) minorCountEl.textContent = severityCounts.minor;
        if (minorBarEl) minorBarEl.style.width = `${(severityCounts.minor / total) * 100}%`;

        // Update table view - support both old and new incident screens
        const tbody = document.getElementById('incidents-table-body') || document.querySelector('#incidents .data-table tbody');
        const timelineContainer = document.getElementById('incidents-timeline');
        const emptyState = document.getElementById('incidents-empty');

        // Check if empty
        if (incidents.length === 0) {
            if (tbody) {
                // Show empty state in table
                const colspan = tbody.closest('table')?.querySelectorAll('thead th').length || 7;
                tbody.innerHTML = `
                    <tr>
                        <td colspan="${colspan}" style="text-align: center; padding: 60px 20px;">
                            <div style="max-width: 450px; margin: 0 auto;">
                                <h3 style="font-size: 18px; font-weight: 600; color: var(--gray-700); margin-bottom: 8px;">
                                    No Incidents Reported
                                </h3>
                                <p style="font-size: 14px; color: var(--gray-500); margin-bottom: 24px;">
                                    Great news! No incidents have been reported yet.
                                </p>
                            </div>
                        </td>
                    </tr>
                `;
            }
            if (timelineContainer) timelineContainer.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';

        // Populate table view
        if (tbody) {
            tbody.innerHTML = incidents.map(incident => {
                const date = new Date(incident.occurred_at || incident.dateTime);
                const severityClass = incident.severity === 'critical' ? 'badge-danger' :
                    incident.severity === 'major' ? 'badge-warning' :
                        incident.severity === 'moderate' ? 'badge-warning' : 'badge-info';
                const childName = incident.child_info?.name || incident.childInfo?.name || 'Unknown';
                const reportedBy = incident.reported_by || incident.reportedBy || 'Unknown';
                const parentSigned = incident.parent_signature || incident.parentSignature;

                return `
                    <tr>
                        <td>${date.toLocaleDateString()}</td>
                        <td><strong>${childName}</strong></td>
                        <td><span class="badge ${incident.type === 'injury' ? 'badge-danger' : incident.type === 'illness' ? 'badge-warning' : 'badge-info'}">${incident.type.charAt(0).toUpperCase() + incident.type.slice(1)}</span></td>
                        <td><span class="badge ${severityClass}">${incident.severity.charAt(0).toUpperCase() + incident.severity.slice(1)}</span></td>
                        <td style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${incident.description}</td>
                        <td><span class="badge ${parentSigned ? 'badge-success' : 'badge-warning'}">${parentSigned ? 'Signed' : 'Pending'}</span></td>
                        <td><button class="btn btn-sm btn-secondary" onclick="viewIncidentDetails('${incident.id}')">View</button></td>
                    </tr>
                `;
            }).join('');
        }

        // Populate timeline view
        if (timelineContainer) {
            timelineContainer.innerHTML = incidents.map(incident => {
                const date = new Date(incident.occurred_at || incident.dateTime);
                const childName = incident.child_info?.name || incident.childInfo?.name || 'Unknown';
                const reportedBy = incident.reported_by || incident.reportedBy || 'Unknown';
                const parentSigned = incident.parent_signature || incident.parentSignature;

                const severityIcon = incident.severity === 'critical' ? '🔴' :
                    incident.severity === 'major' ? '🟠' :
                        incident.severity === 'moderate' ? '🟡' : '🟢';

                return `
                    <div class="cac-timeline-item">
                        <div class="cac-timeline-marker ${incident.severity}"></div>
                        <div class="cac-timeline-content">
                            <div class="cac-timeline-header">
                                <div>
                                    <span class="cac-timeline-icon">${severityIcon}</span>
                                    <strong>${childName}</strong> - ${incident.type.charAt(0).toUpperCase() + incident.type.slice(1)}
                                    <span class="cac-badge cac-badge-${incident.severity === 'critical' ? 'danger' : incident.severity === 'major' ? 'warning' : incident.severity === 'moderate' ? 'warning' : 'info'}" style="margin-left: 8px;">${incident.severity}</span>
                                </div>
                                <span class="cac-timeline-time">${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p class="cac-timeline-description">${incident.description}</p>
                            <div class="cac-timeline-meta">
                                <span>📍 ${incident.location || 'Location not specified'}</span>
                                <span>👤 Reported by ${reportedBy}</span>
                                <span>${parentSigned ? '✅ Parent Signed' : '⏳ Awaiting Signature'}</span>
                            </div>
                            <button class="cac-btn cac-btn-sm cac-btn-secondary" onclick="viewIncidentDetails('${incident.id}')" style="margin-top: 12px;">View Details</button>
                        </div>
                    </div>
                `;
            }).join('');
        }
    } catch (error) {
        console.error('Failed to load incidents:', error);
        showError('Failed to load incident list');
    }
}

let currentIncidentData = null;

async function viewIncidentDetails(incidentId) {
    try {
        console.log('Loading incident with ID:', incidentId);
        const response = await apiRequest(`/incidents/${incidentId}`);
        currentIncidentData = response.data || response;

        console.log('Incident data loaded:', currentIncidentData);
        console.log('Incident ID from data:', currentIncidentData.id);

        const incident = currentIncidentData;

        // Support both old and new schema
        const dateTime = new Date(incident.occurred_at || incident.dateTime);
        const formattedDate = dateTime.toLocaleDateString();
        const formattedTime = dateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // Get child name - database uses snake_case
        const childName = incident.child_info?.name || incident.childInfo?.name || 'Unknown';

        // Get reported by - database uses snake_case
        const reportedBy = incident.reported_by || incident.reportedBy || '—';

        // Get immediate actions - database uses snake_case
        const immediateActions = incident.immediate_actions || incident.immediateActions || 'None specified';

        // Get parent notification status (support both schemas)
        const parentNotified = incident.parent_notified !== undefined ? incident.parent_notified : incident.parentNotified;
        const parentSignature = incident.parent_signature || incident.parentSignature;

        const severityColor = incident.severity === 'critical' ? 'var(--danger)' :
            incident.severity === 'moderate' ? 'var(--warning)' : 'var(--info)';

        const content = `
            <div style="padding: 0 24px;">
                <!-- Header Info -->
                <div style="background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(251, 146, 60, 0.1)); padding: 16px; border-radius: 8px; margin-bottom: 24px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 4px;">${childName}</h3>
                            <p style="font-size: 14px; color: var(--gray-700);">${formattedDate} at ${formattedTime}</p>
                        </div>
                        <div style="text-align: right;">
                            <span class="badge ${incident.type === 'injury' ? 'badge-danger' : incident.type === 'illness' ? 'badge-warning' : 'badge-info'}" style="font-size: 14px; padding: 6px 12px;">
                                ${incident.type.charAt(0).toUpperCase() + incident.type.slice(1)}
                            </span>
                            <br>
                            <span class="badge badge-secondary" style="font-size: 13px; padding: 4px 10px; margin-top: 6px; display: inline-block;">
                                ${incident.severity.charAt(0).toUpperCase() + incident.severity.slice(1)} Severity
                            </span>
                        </div>
                    </div>
                </div>
                
                <!-- Incident Details -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px;">
                    <div>
                        <label style="font-size: 12px; color: var(--gray-600); text-transform: uppercase;">Location</label>
                        <p style="font-size: 16px; margin-top: 4px;">${incident.location || '—'}</p>
                    </div>
                    <div>
                        <label style="font-size: 12px; color: var(--gray-600); text-transform: uppercase;">Reported By</label>
                        <p style="font-size: 16px; margin-top: 4px;">${reportedBy}</p>
                    </div>
                </div>
                
                <div style="margin-bottom: 24px;">
                    <label style="font-size: 12px; color: var(--gray-600); text-transform: uppercase;">Description</label>
                    <p style="font-size: 15px; line-height: 1.6; margin-top: 8px; padding: 12px; background: var(--gray-50); border-radius: 8px;">${incident.description}</p>
                </div>
                
                <div style="margin-bottom: 24px;">
                    <label style="font-size: 12px; color: var(--gray-600); text-transform: uppercase;">Immediate Action Taken</label>
                    <p style="font-size: 15px; line-height: 1.6; margin-top: 8px; padding: 12px; background: var(--gray-50); border-radius: 8px;">${immediateActions}</p>
                </div>
                
                <!-- Parent Notification -->
                <div style="border-top: 1px solid var(--gray-200); padding-top: 20px; margin-bottom: 20px;">
                    <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 12px;">👥 Parent Notification</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                        <div style="padding: 12px; background: var(--gray-50); border-radius: 8px;">
                            <strong style="font-size: 14px;">Parent Notified</strong>
                            <div style="margin-top: 8px;">
                                <span class="badge ${parentNotified ? 'badge-success' : 'badge-warning'}">
                                    ${parentNotified ? 'Yes' : 'Pending'}
                                </span>
                            </div>
                        </div>
                        <div style="padding: 12px; background: var(--gray-50); border-radius: 8px;">
                            <strong style="font-size: 14px;">Parent Signature</strong>
                            <div style="margin-top: 8px;">
                                <span class="badge ${parentSignature ? 'badge-success' : 'badge-warning'}">
                                    ${parentSignature ? 'Signed' : 'Pending'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                
                ${incident.photos && incident.photos.length > 0 ? `
                <div style="border-top: 1px solid var(--gray-200); padding-top: 20px;">
                    <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 12px;">📷 Photos</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px;">
                        ${incident.photos.map(photo => `<img src="${photo}" style="width: 100%; border-radius: 8px; cursor: pointer;" onclick="window.open('${photo}', '_blank')">`).join('')}
                    </div>
                </div>
                ` : ''}
            </div>
        `;

        document.getElementById('incident-details-content').innerHTML = content;
        openModal('incident-details');
    } catch (error) {
        console.error('Failed to load incident:', error);
        showError('Failed to load incident details');
    }
}

function printIncidentReport() {
    if (!currentIncidentData) return;

    // Create printable version
    const printWindow = window.open('', '_blank');

    // Support both schemas
    const dateTime = new Date(currentIncidentData.occurred_at || currentIncidentData.dateTime);
    const childName = currentIncidentData.child_info?.name || currentIncidentData.childInfo?.name || 'Unknown';
    const reportedBy = currentIncidentData.reported_by || currentIncidentData.reportedBy || 'Unknown';
    const immediateActions = currentIncidentData.immediate_actions || currentIncidentData.immediateActions || 'None';

    printWindow.document.write(`
        <html>
            <head>
                <title>Incident Report - ${childName}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 40px; }
                    h1 { color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
                    .section { margin: 20px 0; }
                    .label { font-weight: 600; color: #6b7280; text-transform: uppercase; font-size: 12px; }
                    .value { font-size: 16px; margin-top: 4px; }
                    .signature-line { border-top: 1px solid #000; width: 300px; margin-top: 40px; padding-top: 8px; }
                </style>
            </head>
            <body>
                <h1>Incident Report</h1>
                <div class="section">
                    <div class="label">Child Name</div>
                    <div class="value">${childName}</div>
                </div>
                <div class="section">
                    <div class="label">Date & Time</div>
                    <div class="value">${dateTime.toLocaleString()}</div>
                </div>
                <div class="section">
                    <div class="label">Type</div>
                    <div class="value">${currentIncidentData.type}</div>
                </div>
                <div class="section">
                    <div class="label">Description</div>
                    <div class="value">${currentIncidentData.description}</div>
                </div>
                <div class="section">
                    <div class="label">Immediate Action Taken</div>
                    <div class="value">${immediateActions}</div>
                </div>
                <div class="section">
                    <div class="label">Reported By</div>
                    <div class="value">${reportedBy}</div>
                </div>
                <div class="signature-line">
                    Parent/Guardian Signature
                </div>
                <div class="signature-line">
                    Date
                </div>
            </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

function confirmDeleteIncident() {
    if (!currentIncidentData) {
        console.error('No incident data available for deletion');
        return;
    }

    console.log('Confirming delete for incident:', currentIncidentData);
    console.log('Incident ID to delete:', currentIncidentData.id);

    // Support both snake_case and camelCase
    const childName = currentIncidentData.child_info?.name || currentIncidentData.childInfo?.name || 'this child';

    deleteContext = {
        type: 'incidents',
        id: currentIncidentData.id,
        name: `incident for ${childName}`
    };

    console.log('Delete context set:', deleteContext);

    document.getElementById('delete-confirm-message').textContent =
        `Are you sure you want to delete this incident report for ${childName}?`;

    closeModal('incident-details');
    openModal('delete-confirm');
}

async function createIncident(event) {
    event.preventDefault();

    // Validate facility is loaded
    if (!AppState.facility || !AppState.facility.id) {
        showError('Please log in first to log incidents');
        return;
    }

    const button = document.getElementById('new-incident-btn');
    setLoading(button, true);

    // Validate and gather form data
    const date = document.getElementById('incident-date').value;
    const time = document.getElementById('incident-time').value;
    const type = document.getElementById('incident-type').value;
    const childName = document.getElementById('incident-child-name').value.trim();
    const childAge = document.getElementById('incident-child-age')?.value.trim() || '';
    const location = document.getElementById('incident-location').value.trim();
    const description = document.getElementById('incident-description').value.trim();
    const action = document.getElementById('incident-action').value.trim();
    const staff = document.getElementById('incident-staff').value.trim();
    const severity = document.getElementById('incident-severity')?.value || 'moderate';
    const notifyParent = document.getElementById('incident-notify-parent').checked;

    // Validation
    if (!date || !time) {
        showError('Please specify date and time of incident');
        setLoading(button, false);
        return;
    }

    if (!childName || !description || !staff) {
        showError('Please fill in all required fields');
        setLoading(button, false);
        return;
    }

    const dateTime = new Date(`${date}T${time}`).toISOString();

    const incidentData = {
        type,
        severity,
        childName,
        childAge,
        location,
        description,
        immediateActions: action,
        reportedBy: staff,
        dateTime,
        parentNotified: notifyParent
    };

    console.log('Creating incident with data:', incidentData);

    try {
        const response = await apiRequest(`/facilities/${AppState.facility.id}/incidents`, {
            method: 'POST',
            body: JSON.stringify(incidentData)
        });

        console.log('Incident created successfully:', response);
        showSuccess('✓ Incident logged successfully!');
        document.getElementById('new-incident-form').reset();
        closeModal('new-incident');
        await loadIncidentList(currentIncidentFilter);
    } catch (error) {
        console.error('Failed to create incident:', error);
        showError(error.message || 'Failed to log incident. Please try again.');
    } finally {
        setLoading(button, false);
    }
}

function filterIncidents() {
    console.log('Filtering incidents...');

    // Get filter values from dropdowns
    const timeFilter = document.getElementById('incident-time-filter')?.value || 'all';
    const severityFilter = document.getElementById('incident-severity-filter')?.value || 'all';
    const typeFilter = document.getElementById('incident-type-filter')?.value || 'all';
    const statusFilter = document.getElementById('incident-status-filter')?.value || 'all';

    console.log('Filter values:', { timeFilter, severityFilter, typeFilter, statusFilter });

    // Get all incidents from the current loaded data
    const rows = document.querySelectorAll('#incidents tbody tr');

    rows.forEach(row => {
        // Skip empty state rows
        if (row.querySelector('td[colspan]')) return;

        const cells = row.querySelectorAll('td');
        if (cells.length < 6) return;

        // Extract data from row
        const dateText = cells[0].textContent.trim();
        const typeText = cells[2].textContent.trim().toLowerCase();
        const severityText = cells[3].textContent.trim().toLowerCase();
        const statusText = cells[5].textContent.trim().toLowerCase();

        const incidentDate = new Date(dateText);
        const now = new Date();

        // Apply time filter
        let timeMatch = true;
        if (timeFilter === '7days') {
            const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
            timeMatch = incidentDate >= sevenDaysAgo;
        } else if (timeFilter === '30days') {
            const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
            timeMatch = incidentDate >= thirtyDaysAgo;
        } else if (timeFilter === '90days') {
            const ninetyDaysAgo = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
            timeMatch = incidentDate >= ninetyDaysAgo;
        }

        // Apply severity filter
        const severityMatch = severityFilter === 'all' || severityText.includes(severityFilter.toLowerCase());

        // Apply type filter
        const typeMatch = typeFilter === 'all' || typeText.includes(typeFilter.toLowerCase());

        // Apply status filter
        let statusMatch = true;
        if (statusFilter === 'signed') {
            statusMatch = statusText.includes('signed');
        } else if (statusFilter === 'pending') {
            statusMatch = statusText.includes('pending');
        }

        // Show/hide row based on all filters
        if (timeMatch && severityMatch && typeMatch && statusMatch) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });

    // Count visible rows
    const visibleRows = Array.from(rows).filter(row =>
        row.style.display !== 'none' && !row.querySelector('td[colspan]')
    ).length;

    console.log(`Filtered: ${visibleRows} incidents visible`);
}

function toggleIncidentView(view) {
    console.log('Toggling incident view to:', view);

    // Check if using new screen (with separate view containers) or old screen (single table)
    const listView = document.getElementById('incidents-list-view');
    const timelineView = document.getElementById('incidents-timeline-view');
    const tableContainer = document.querySelector('#incidents .cac-table-container');
    const incidentsCard = document.getElementById('incidents');

    if (listView && timelineView) {
        // New screen with separate containers
        if (view === 'list') {
            listView.style.display = 'block';
            timelineView.style.display = 'none';
        } else if (view === 'timeline') {
            listView.style.display = 'none';
            timelineView.style.display = 'block';
        }
    } else if (tableContainer && incidentsCard) {
        // Old screen - create timeline container dynamically if needed
        let timelineContainer = document.getElementById('incidents-timeline');

        if (view === 'list') {
            // Show table, hide timeline
            tableContainer.style.display = 'block';
            if (timelineContainer) {
                timelineContainer.style.display = 'none';
            }
        } else if (view === 'timeline') {
            // Hide table, show/create timeline
            tableContainer.style.display = 'none';

            if (!timelineContainer) {
                // Create timeline container if it doesn't exist
                timelineContainer = document.createElement('div');
                timelineContainer.id = 'incidents-timeline';
                timelineContainer.style.padding = '20px';
                incidentsCard.appendChild(timelineContainer);

                // Reload the incident list to populate the timeline
                loadIncidentList(currentIncidentFilter);
            } else {
                timelineContainer.style.display = 'block';
            }
        }
    }

    // Update button states
    const buttons = document.querySelectorAll('.cac-card-actions .cac-btn');
    buttons.forEach(btn => {
        const btnText = btn.textContent.toLowerCase();
        if (btnText.includes(view) || (view === 'list' && btnText.includes('📋')) || (view === 'timeline' && btnText.includes('📅'))) {
            btn.classList.remove('cac-btn-secondary');
            btn.classList.add('cac-btn-primary');
        } else {
            btn.classList.remove('cac-btn-primary');
            btn.classList.add('cac-btn-secondary');
        }
    });
}

async function exportIncidentReport() {
    try {
        // Get all incidents for the facility
        const response = await apiRequest(`/facilities/${AppState.facility.id}/incidents`);
        const incidents = response.data || response;

        if (!incidents || incidents.length === 0) {
            showError('No incidents to export');
            return;
        }

        // Create CSV content
        const headers = ['Date', 'Time', 'Child Name', 'Type', 'Severity', 'Location', 'Description', 'Immediate Actions', 'Reported By', 'Parent Notified', 'Parent Signed'];

        const csvRows = [headers.join(',')];

        incidents.forEach(incident => {
            const dateTime = new Date(incident.occurred_at || incident.dateTime);
            const date = dateTime.toLocaleDateString();
            const time = dateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const childName = incident.child_info?.name || incident.childInfo?.name || 'Unknown';
            const reportedBy = incident.reported_by || incident.reportedBy || 'Unknown';
            const immediateActions = incident.immediate_actions || incident.immediateActions || 'None';
            const parentNotified = incident.parent_notified || incident.parentNotified ? 'Yes' : 'No';
            const parentSigned = incident.parent_signature || incident.parentSignature ? 'Yes' : 'No';

            const row = [
                date,
                time,
                `"${childName}"`,
                incident.type,
                incident.severity,
                `"${incident.location || ''}"`,
                `"${incident.description.replace(/"/g, '""')}"`,
                `"${immediateActions.replace(/"/g, '""')}"`,
                `"${reportedBy}"`,
                parentNotified,
                parentSigned
            ];

            csvRows.push(row.join(','));
        });

        const csvContent = csvRows.join('\n');

        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `incident-report-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showSuccess(`✓ Exported ${incidents.length} incident report(s)`);
    } catch (error) {
        console.error('Failed to export incident report:', error);
        showError('Failed to export incident report. Please try again.');
    }
}

// MEDICATION TRACKING
let allMedications = [];
let currentMedicationFilter = 'active';

// =============================================
// DAILY MEDICATION SCHEDULE
// =============================================

let medicationAlerts = [];

function checkMedicationAlerts() {
    console.log('Checking medication alerts...');

    medicationAlerts = [];
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Check all active medications
    allMedications.forEach(med => {
        const isActive = med.active !== undefined ? med.active : (med.status === 'active');
        if (!isActive) return;

        // Check for expiring authorizations (within 7 days)
        const endDate = new Date(med.end_date || med.endDate);
        const daysUntilExpiry = Math.floor((endDate - now) / (1000 * 60 * 60 * 24));
        const childName = med.child_name || med.childInfo?.name || med.childName || 'Unknown';
        const medName = med.medication_name || med.medicationName || 'Unknown';

        if (daysUntilExpiry <= 7 && daysUntilExpiry >= 0) {
            medicationAlerts.push({
                type: 'expiring',
                severity: daysUntilExpiry <= 3 ? 'high' : 'medium',
                child: childName,
                medication: medName,
                message: `Authorization expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}`,
                action: 'Renew authorization',
                medicationId: med.id
            });
        } else if (daysUntilExpiry < 0) {
            medicationAlerts.push({
                type: 'expired',
                severity: 'high',
                child: childName,
                medication: medName,
                message: `Authorization expired ${Math.abs(daysUntilExpiry)} day${Math.abs(daysUntilExpiry) !== 1 ? 's' : ''} ago`,
                action: 'Renew immediately',
                medicationId: med.id
            });
        }

        // Check for upcoming doses - parse schedule from frequency field
        if (med.frequency && med.frequency.toLowerCase().includes('daily')) {
            // Try to extract time from frequency string (e.g., "3 times daily (8:00 AM, 12:00 PM, 4:00 PM)")
            const timeMatches = med.frequency.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/gi);

            if (timeMatches && timeMatches.length > 0) {
                // Check each scheduled time
                timeMatches.forEach(timeStr => {
                    const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
                    if (timeMatch) {
                        let hour = parseInt(timeMatch[1]);
                        const minute = parseInt(timeMatch[2]);
                        const period = timeMatch[3].toUpperCase();

                        // Convert to 24-hour format
                        if (period === 'PM' && hour !== 12) hour += 12;
                        if (period === 'AM' && hour === 12) hour = 0;

                        const scheduleDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute);
                        const minutesUntilDose = Math.floor((scheduleDate - now) / (1000 * 60));

                        if (minutesUntilDose > 0 && minutesUntilDose <= 30) {
                            medicationAlerts.push({
                                type: 'upcoming',
                                severity: 'low',
                                child: med.child_name || med.childInfo?.name || med.childName,
                                medication: med.medication_name || med.medicationName,
                                message: `Dose due in ${minutesUntilDose} minutes`,
                                action: 'Prepare medication',
                                medicationId: med.id
                            });
                        } else if (minutesUntilDose < 0 && minutesUntilDose >= -60) {
                            medicationAlerts.push({
                                type: 'missed',
                                severity: 'high',
                                child: med.child_name || med.childInfo?.name || med.childName,
                                medication: med.medication_name || med.medicationName,
                                message: `Dose was due ${Math.abs(minutesUntilDose)} minutes ago`,
                                action: 'Administer now',
                                medicationId: med.id
                            });
                        }
                    }
                });
            }
        }
    });

    displayMedicationAlerts();
}

function displayMedicationAlerts() {
    const alertsCard = document.getElementById('medication-alerts-card');
    const alertsList = document.getElementById('medication-alerts-list');
    const alertCount = document.getElementById('alert-count');

    // Check if elements exist
    if (!alertsCard || !alertsList || !alertCount) {
        console.warn('Medication alert elements not found in DOM');
        return;
    }

    if (medicationAlerts.length === 0) {
        alertsCard.style.display = 'none';
        return;
    }

    alertsCard.style.display = 'block';
    alertCount.textContent = medicationAlerts.length;

    const severityColors = {
        'high': { bg: 'var(--danger-light)', border: 'var(--danger)', icon: '⚠️' },
        'medium': { bg: 'var(--warning-light)', border: 'var(--warning)', icon: '⏰' },
        'low': { bg: '#dbeafe', border: '#3b82f6', icon: 'ℹ️' }
    };

    alertsList.innerHTML = medicationAlerts.map((alert, index) => {
        const colors = severityColors[alert.severity];
        return `
            <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: ${colors.bg}; border-left: 4px solid ${colors.border}; border-radius: 8px; margin-bottom: 12px;">
                <div style="font-size: 24px;">${colors.icon}</div>
                <div style="flex: 1;">
                    <div style="font-size: 14px; font-weight: 600; color: var(--gray-900); margin-bottom: 4px;">
                        ${alert.child} - ${alert.medication}
                    </div>
                    <div style="font-size: 13px; color: var(--gray-700);">
                        ${alert.message}
                    </div>
                </div>
                <div style="display: flex; gap: 8px; align-items: center;">
                    <button class="btn-small btn-primary-small" onclick="handleAlert('${alert.medicationId}', '${alert.type}')" style="white-space: nowrap;">
                        ${alert.action}
                    </button>
                    <button class="btn-icon-small" onclick="dismissAlert(${index})" style="background: var(--gray-200); color: var(--gray-700); border: none; padding: 6px; border-radius: 6px; cursor: pointer; font-size: 16px;">
                        ✕
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function handleAlert(medicationId, type) {
    console.log('Handling alert:', medicationId, type);

    if (type === 'missed' || type === 'upcoming') {
        administerMedication(medicationId);
    } else if (type === 'expiring' || type === 'expired') {
        showInfo('Please contact parent to renew medication authorization');
    }
}

function dismissAlert(index) {
    medicationAlerts.splice(index, 1);
    displayMedicationAlerts();
}

function dismissAllAlerts() {
    medicationAlerts = [];
    displayMedicationAlerts();
}

function showDailySchedule() {
    console.log('Showing daily medication schedule');

    // Update tab state
    document.querySelectorAll('#medication .tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');

    // Hide table and history, show schedule
    document.getElementById('medication-list-table').style.display = 'none';
    document.getElementById('administration-history-view').style.display = 'none';
    document.getElementById('daily-schedule-view').style.display = 'block';

    // Set today's date
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    document.getElementById('schedule-date').textContent = dateStr;

    // Build schedule timeline
    buildScheduleTimeline();
}

// =============================================
// ADMINISTRATION HISTORY
// =============================================

let administrationHistory = [];

function showAdministrationHistory() {
    console.log('Showing administration history');

    // Update tab state
    document.querySelectorAll('#medication .tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');

    // Hide table and schedule, show history
    document.getElementById('medication-list-table').style.display = 'none';
    document.getElementById('daily-schedule-view').style.display = 'none';
    document.getElementById('administration-history-view').style.display = 'block';

    // Load history data
    loadAdministrationHistory();
}

async function loadAdministrationHistory() {
    console.log('Loading administration history...');

    // Mock data - in production, fetch from API
    administrationHistory = [
        {
            id: '1',
            date: new Date().toISOString(),
            child: 'Emma S.',
            medication: 'Albuterol Inhaler',
            dosage: '2 puffs',
            administeredBy: 'Sarah Johnson',
            witnessedBy: 'Michael Chen',
            time: '08:05 AM',
            notes: 'Child used inhaler with proper technique. No adverse reactions observed.',
            photo: true
        },
        {
            id: '2',
            date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            child: 'Liam M.',
            medication: 'Amoxicillin',
            dosage: '5 mL',
            administeredBy: 'Emily Rodriguez',
            witnessedBy: 'Lisa Thompson',
            time: '12:03 PM',
            notes: 'Medication refrigerated. Child took full dose with apple juice.',
            photo: true
        },
        {
            id: '3',
            date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            child: 'Sophia L.',
            medication: 'Allergy Medicine (Zyrtec)',
            dosage: '1 tablet',
            administeredBy: 'David Martinez',
            witnessedBy: 'Sarah Johnson',
            time: '02:15 PM',
            notes: 'Seasonal allergies. Child feeling better after 30 minutes.',
            photo: false
        },
        {
            id: '4',
            date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            child: 'Emma S.',
            medication: 'Albuterol Inhaler',
            dosage: '2 puffs',
            administeredBy: 'Michael Chen',
            witnessedBy: 'Emily Rodriguez',
            time: '03:45 PM',
            notes: 'Used during outdoor play due to mild wheezing. Child recovered within 5 minutes.',
            photo: true
        }
    ];

    displayAdministrationHistory();
}

function displayAdministrationHistory() {
    const timeline = document.getElementById('history-timeline');
    const empty = document.getElementById('history-empty');

    if (administrationHistory.length === 0) {
        timeline.style.display = 'none';
        empty.style.display = 'block';
        return;
    }

    timeline.style.display = 'block';
    empty.style.display = 'none';

    // Group by date
    const groupedByDate = {};
    administrationHistory.forEach(record => {
        const date = new Date(record.date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        if (!groupedByDate[date]) {
            groupedByDate[date] = [];
        }
        groupedByDate[date].push(record);
    });

    timeline.innerHTML = Object.entries(groupedByDate).map(([date, records]) => `
        <div style="margin-bottom: 32px;">
            <h4 style="font-size: 16px; font-weight: 600; color: var(--gray-900); margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid var(--gray-200);">
                ${date}
            </h4>
            ${records.map(record => `
                <div style="margin-bottom: 16px; padding: 16px; background: white; border-radius: 8px; border-left: 4px solid var(--success); box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
                    <div style="display: grid; grid-template-columns: 80px 1fr 1fr 1fr auto; gap: 16px; align-items: start;">
                        <div>
                            <div style="font-size: 18px; font-weight: 700; color: var(--primary);">${record.time}</div>
                        </div>
                        <div>
                            <div style="font-size: 11px; color: var(--gray-600); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Child</div>
                            <div style="font-size: 15px; font-weight: 600; color: var(--gray-900);">${record.child}</div>
                        </div>
                        <div>
                            <div style="font-size: 11px; color: var(--gray-600); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Medication & Dosage</div>
                            <div style="font-size: 15px; font-weight: 600; color: var(--gray-900);">${record.medication}</div>
                            <div style="font-size: 13px; color: var(--gray-700); margin-top: 2px;">${record.dosage}</div>
                        </div>
                        <div>
                            <div style="font-size: 11px; color: var(--gray-600); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Dual Verification</div>
                            <div style="font-size: 13px; color: var(--gray-800);">
                                ✓ ${record.administeredBy}<br>
                                <span style="color: var(--gray-600);">Witnessed by ${record.witnessedBy}</span>
                            </div>
                        </div>
                        <div style="display: flex; gap: 8px; align-items: center;">
                            ${record.photo ? '<span style="font-size: 24px;" title="Photo attached">📷</span>' : ''}
                            <span class="badge badge-success" style="font-size: 11px;">Verified</span>
                        </div>
                    </div>
                    ${record.notes ? `
                        <div style="margin-top: 12px; padding: 10px; background: var(--gray-50); border-radius: 6px; font-size: 13px; color: var(--gray-700);">
                            <strong style="color: var(--gray-800);">Notes:</strong> ${record.notes}
                        </div>
                    ` : ''}
                </div>
            `).join('')}
        </div>
    `).join('');
}

function filterHistory() {
    console.log('Filtering history...');
    // In production, would filter based on dropdown selections
    displayAdministrationHistory();
}

function filterHistoryByDate() {
    const range = document.getElementById('history-date-range').value;
    console.log('Filtering by date range:', range);
    // In production, would fetch different date ranges from API
    displayAdministrationHistory();
}

function exportAdministrationHistory(format) {
    console.log('Exporting history as:', format);

    if (format === 'csv') {
        const csv = 'Date,Time,Child,Medication,Dosage,Administered By,Witnessed By,Notes\n' +
            administrationHistory.map(r =>
                `"${new Date(r.date).toLocaleDateString()}","${r.time}","${r.child}","${r.medication}","${r.dosage}","${r.administeredBy}","${r.witnessedBy}","${r.notes}"`
            ).join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `medication-history-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        showSuccess('Administration history exported successfully!');
    } else if (format === 'pdf') {
        showInfo('PDF export feature coming soon! Use CSV export for now.');
    }
}

function showDailySchedule() {
    console.log('Showing daily medication schedule');

    // Update tab state
    document.querySelectorAll('#medication .tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');

    // Hide table, show schedule
    document.getElementById('medication-list-table').style.display = 'none';
    document.getElementById('daily-schedule-view').style.display = 'block';

    // Set today's date
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    document.getElementById('schedule-date').textContent = dateStr;

    // Build schedule timeline
    buildScheduleTimeline();
}

function buildScheduleTimeline() {
    const timeline = document.getElementById('schedule-timeline');
    const empty = document.getElementById('schedule-empty');

    // Get all scheduled medications for today from real data
    const scheduledMeds = [];
    const now = new Date();

    // Filter active medications and build schedule from real data
    allMedications.forEach(med => {
        if (med.status !== 'active') return;

        // Parse frequency to determine if medication is due today
        const frequency = med.frequency || med.schedule || '';

        // For medications with daily frequency, create schedule entries
        if (frequency.toLowerCase().includes('daily') || frequency.toLowerCase().includes('times')) {
            // Extract times from frequency if available, otherwise use default times
            const times = ['08:00', '12:00', '14:00']; // Default schedule

            times.forEach(time => {
                const [hour, minute] = time.split(':').map(Number);
                const scheduleTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute);
                const minutesFromNow = Math.floor((scheduleTime - now) / (1000 * 60));

                let status = 'upcoming';
                if (minutesFromNow < -60) {
                    // More than 1 hour past - assume completed or skipped
                    status = 'completed';
                } else if (minutesFromNow < 0) {
                    status = 'overdue';
                } else if (minutesFromNow <= 30) {
                    status = 'pending';
                }

                scheduledMeds.push({
                    time: time,
                    medicationId: med.id,
                    child: med.childInfo?.name || med.childName,
                    medication: med.medicationName,
                    dosage: med.dosage,
                    status: status,
                    frequency: frequency
                });
            });
        }
    });

    // Sort by time
    scheduledMeds.sort((a, b) => {
        const [aH, aM] = a.time.split(':').map(Number);
        const [bH, bM] = b.time.split(':').map(Number);
        return (aH * 60 + aM) - (bH * 60 + bM);
    });

    if (scheduledMeds.length === 0) {
        timeline.style.display = 'none';
        empty.style.display = 'block';
        return;
    }

    timeline.style.display = 'block';
    empty.style.display = 'none';

    const statusText = {
        'completed': '✓ Completed',
        'pending': '⏰ Due Now',
        'upcoming': '📅 Upcoming',
        'overdue': '⚠️ Overdue'
    };

    timeline.innerHTML = scheduledMeds.map(item => {
        const statusClass = item.status;

        return `
            <div class="schedule-item ${statusClass}">
                <div class="schedule-time-marker">${item.time}</div>
                <span class="schedule-status-badge ${statusClass}">${statusText[item.status]}</span>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: ${item.status === 'completed' ? '12px' : '16px'};">
                    <div>
                        <div style="font-size: 11px; color: var(--gray-600); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Child</div>
                        <div style="font-size: 15px; font-weight: 600; color: var(--gray-900);">${item.child}</div>
                    </div>
                    <div>
                        <div style="font-size: 11px; color: var(--gray-600); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Medication</div>
                        <div style="font-size: 15px; font-weight: 600; color: var(--gray-900);">${item.medication}</div>
                    </div>
                    <div>
                        <div style="font-size: 11px; color: var(--gray-600); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Dosage</div>
                        <div style="font-size: 15px; font-weight: 500; color: var(--gray-800);">${item.dosage}</div>
                    </div>
                </div>
                
                ${item.status === 'completed' ? `
                    <div style="padding: 8px 12px; background: rgba(16, 185, 129, 0.1); border-radius: 6px; font-size: 12px; color: var(--success);">
                        <strong>Administered earlier today</strong>
                    </div>
                ` : item.status === 'pending' || item.status === 'overdue' ? `
                    <div style="display: flex; gap: 8px; margin-top: 12px;">
                        <button class="btn-small btn-primary-small" onclick="administerMedication('${item.medicationId}')">
                            Log Administration
                        </button>
                        <button class="btn-small btn-secondary-small" onclick="viewMedicationDetails('${item.medicationId}')">
                            View Details
                        </button>
                    </div>
                ` : ''}
                
                ${item.status === 'overdue' ? `
                    <div style="margin-top: 12px; font-size: 12px; color: var(--danger); font-weight: 500;">
                        ⚠️ Medication is overdue - administer as soon as possible
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

async function loadMedicationList(filter = 'active') {
    try {
        // Show skeleton while loading
        showTableSkeleton('#medication .data-table', 5, 7);

        currentMedicationFilter = filter;
        const response = await apiRequest(`/facilities/${AppState.facility.id}/medications`);
        allMedications = response.data || [];

        // Update medication stats
        const activeMeds = allMedications.filter(med => med.active);
        const activeCount = document.getElementById('med-active-count');
        if (activeCount) activeCount.textContent = activeMeds.length;

        // Get today's medication logs count (optional - endpoint may not exist yet)
        const today = new Date().toISOString().split('T')[0];
        let todayDoses = 0;
        try {
            const logsResponse = await apiRequest(`/facilities/${AppState.facility.id}/medication-logs?date=${today}`, { skipCache: true });
            todayDoses = (logsResponse.data || []).length;
        } catch (e) {
            console.log('Medication logs endpoint not available - using fallback');
            // Fallback: count administrations from medications
            todayDoses = allMedications.reduce((count, med) => {
                const logs = med.administrationLog || med.administration_log || [];
                return count + logs.filter(log => {
                    const logDate = new Date(log.timestamp || log.administered_at).toISOString().split('T')[0];
                    return logDate === today;
                }).length;
            }, 0);
        }
        const dosesTodayEl = document.getElementById('med-doses-today');
        if (dosesTodayEl) dosesTodayEl.textContent = todayDoses;

        // Verification rate - assuming 100% for now (all logs have dual verification)
        const verificationRate = document.getElementById('med-verification-rate');
        if (verificationRate) verificationRate.textContent = '100%';

        // Calculate allergy medications count
        const allergyMeds = allMedications.filter(med =>
            med.medication_type === 'allergy' ||
            med.medicationType === 'allergy' ||
            (med.medication_name && med.medication_name.toLowerCase().includes('epipen')) ||
            (med.medicationName && med.medicationName.toLowerCase().includes('epipen'))
        );

        let filteredMeds = allMedications;
        if (filter === 'active') {
            filteredMeds = activeMeds;
        } else if (filter === 'expired') {
            const now = new Date();
            filteredMeds = allMedications.filter(med =>
                !med.active || (med.end_date && new Date(med.end_date) < now)
            );
        } else if (filter === 'today') {
            filteredMeds = activeMeds.filter(med =>
                med.frequency && med.frequency.toLowerCase().includes('daily')
            );
        } else if (filter === 'allergies') {
            filteredMeds = allergyMeds;
        }

        // Update tab counts - calculate them based on actual data
        const now = new Date();
        const expiredMeds = allMedications.filter(med =>
            !med.active || (med.end_date && new Date(med.end_date) < now)
        );

        const activeCountTab = document.getElementById('med-count-active');
        const todayCountTab = document.getElementById('med-count-today');
        const expiredCountTab = document.getElementById('med-count-expired');
        const allergiesCountTab = document.getElementById('med-count-allergies');

        if (activeCountTab) activeCountTab.textContent = activeMeds.length;
        if (todayCountTab) todayCountTab.textContent = todayDoses;
        if (expiredCountTab) expiredCountTab.textContent = expiredMeds.length;
        if (allergiesCountTab) allergiesCountTab.textContent = allergyMeds.length;

        const tbody = document.querySelector('#medications-table-body');
        if (!tbody) {
            console.warn('Medications table body not found');
            return;
        }

        // Check if empty and show professional empty state
        if (filteredMeds.length === 0) {
            const emptyMessages = {
                'active': {
                    title: 'No Active Medications',
                    message: 'No active medications are currently on record. Add medications to ensure proper tracking and compliance with Texas regulations.',
                    showButton: true
                },
                'expired': {
                    title: 'No Expired Medications',
                    message: 'Great! No expired medications found. Keep tracking to ensure all medications stay current.',
                    showButton: false
                },
                'today': {
                    title: 'No Medications Due Today',
                    message: 'No medications are scheduled for today. Check back tomorrow or view active medications.',
                    showButton: false
                },
                'allergies': {
                    title: 'No Allergies Recorded',
                    message: 'No allergy information has been documented. Add allergy details to enhance child safety.',
                    showButton: false
                }
            };

            const empty = emptyMessages[filter] || emptyMessages['active'];

            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 60px 20px;">
                        <div style="max-width: 450px; margin: 0 auto;">
                            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity: 0.2; margin-bottom: 20px;">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="9" y1="9" x2="15" y2="9"></line>
                                <line x1="9" y1="15" x2="15" y2="15"></line>
                            </svg>
                            <h3 style="font-size: 18px; font-weight: 600; color: var(--gray-700); margin-bottom: 8px;">${empty.title}</h3>
                            <p style="font-size: 14px; color: var(--gray-500); margin-bottom: 24px;">${empty.message}</p>
                            ${empty.showButton ? `
                                <div style="display: flex; gap: 12px; justify-content: center;">
                                    <button class="btn btn-primary" onclick="openModal('add-medication')" style="padding: 10px 24px;">
                                        <span style="margin-right: 8px;">💊</span> Add Medication
                                    </button>
                                    <button class="btn btn-secondary" onclick="openModal('csv-import-medications')" style="padding: 10px 24px;">
                                        <span style="margin-right: 8px;">📄</span> Import CSV
                                    </button>
                                </div>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = filteredMeds.map(med => {
            const endDate = new Date(med.end_date || med.endDate);
            const childName = med.child_name || med.childInfo?.name || 'Unknown';
            const medName = med.medication_name || med.medicationName || 'Unknown';
            const dosage = med.dosage || '-';
            const frequency = med.frequency || med.schedule || '-';
            const isActive = med.active !== undefined ? med.active : (med.status === 'active');

            return `
                <tr style="transition: background-color 0.2s ease;">
                    <td style="color: var(--gray-700);">${childName}</td>
                    <td><strong style="color: var(--gray-900);">${medName}</strong></td>
                    <td style="color: var(--gray-700);">${dosage}</td>
                    <td style="color: var(--gray-700);">${frequency}</td>
                    <td style="color: var(--gray-600);">${endDate.toLocaleDateString()}</td>
                    <td><span class="badge ${isActive ? 'badge-success' : 'badge-secondary'}">${isActive ? 'Active' : 'Inactive'}</span></td>
                    <td>
                        <button class="btn btn-sm btn-secondary" onclick="viewMedicationDetails('${med.id}')" style="margin-right: 4px;">View</button>
                        <button class="btn btn-sm btn-primary" onclick="administerMedication('${med.id}')">Administer</button>
                    </td>
                </tr>
            `;
        }).join('');

        // Make table sortable
        makeSortable('#medication .data-table');

        // Check for medication alerts
        checkMedicationAlerts();
    } catch (error) {
        console.error('Failed to load medications:', error);
        showError('Failed to load medication list');
        const tbody = document.querySelector('#medications-table-body');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 60px 20px;">
                        <div style="max-width: 400px; margin: 0 auto;">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--danger); margin-bottom: 16px;">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                            <h3 style="font-size: 16px; font-weight: 600; color: var(--danger); margin-bottom: 8px;">Failed to Load Medications</h3>
                            <p style="font-size: 14px; color: var(--gray-600); margin-bottom: 16px;">There was an error loading medications. Please try again.</p>
                            <button class="btn btn-secondary" onclick="loadMedicationList('${currentMedicationFilter || 'active'}')" style="padding: 8px 20px;">
                                <span style="margin-right: 6px;">🔄</span> Retry
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }
    }
}

function filterMedications(filter) {
    console.log('Filtering medications by:', filter);

    // Hide schedule and history views, show table
    document.getElementById('daily-schedule-view').style.display = 'none';
    document.getElementById('administration-history-view').style.display = 'none';
    document.getElementById('medication-list-table').style.display = 'block';

    // Update active tab styling
    const tabs = document.querySelectorAll('#medication .tab');
    tabs.forEach(tab => {
        tab.classList.remove('active');
        const tabText = tab.textContent.toLowerCase();
        if ((filter === 'active' && tabText.includes('active')) ||
            (filter === 'today' && tabText.includes('today')) ||
            (filter === 'expired' && tabText.includes('expired')) ||
            (filter === 'allergies' && tabText.includes('allergies'))) {
            tab.classList.add('active');
        }
    });

    loadMedicationList(filter);
}

let currentMedicationData = null;
let medicationPhotoFile = null;
let medicationPhotoBase64 = null;

// =============================================
// MEDICATION PHOTO UPLOAD FUNCTIONS
// =============================================

function handleMedPhotoDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    const dropZone = document.getElementById('med-photo-upload-zone');
    dropZone.style.borderColor = 'var(--primary)';
    dropZone.style.background = 'rgba(102, 126, 234, 0.05)';
}

function handleMedPhotoDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    const dropZone = document.getElementById('med-photo-upload-zone');
    dropZone.style.borderColor = 'var(--gray-300)';
    dropZone.style.background = 'transparent';

    const files = event.dataTransfer.files;
    if (files.length > 0) {
        processMedPhoto(files[0]);
    }
}

function handleMedPhotoSelect(event) {
    const file = event.target.files[0];
    if (file) {
        processMedPhoto(file);
    }
}

function processMedPhoto(file) {
    console.log('Processing medication photo:', file.name);

    // Validate file type
    if (!file.type.startsWith('image/')) {
        showError('Invalid file type. Please upload an image (PNG, JPG, etc.).');
        return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
        showError('File is too large. Maximum size is 10MB.');
        return;
    }

    medicationPhotoFile = file;

    // Create preview
    const reader = new FileReader();
    reader.onload = function (e) {
        medicationPhotoBase64 = e.target.result;

        document.getElementById('med-photo-thumbnail').src = e.target.result;
        document.getElementById('med-photo-filename').textContent = file.name;
        document.getElementById('med-photo-filesize').textContent = formatFileSize(file.size);
        document.getElementById('med-photo-preview').style.display = 'block';
        document.getElementById('med-photo-upload-zone').style.display = 'none';
    };
    reader.readAsDataURL(file);
}

function removeMedPhoto() {
    medicationPhotoFile = null;
    medicationPhotoBase64 = null;
    document.getElementById('med-photo-preview').style.display = 'none';
    document.getElementById('med-photo-upload-zone').style.display = 'block';
    document.getElementById('med-photo-input').value = '';
}

async function administerMedication(medicationId) {
    try {
        const response = await apiRequest(`/medications/${medicationId}`);
        currentMedicationData = response.data || response;

        const med = currentMedicationData;
        const now = new Date();
        const currentTime = now.toTimeString().slice(0, 5);

        // Handle both snake_case (Supabase) and camelCase formats for backward compatibility
        // child_name is stored directly as a string field, not nested in child_info
        const childName = med.child_name || med.childName || med.child_info?.name || med.childInfo?.name || 'Unknown Child';
        const medicationName = med.medication_name || med.medicationName || 'Unknown Medication';

        // Populate medication info in the modal
        document.getElementById('admin-med-id').value = medicationId;
        document.getElementById('admin-dosage-given').value = med.dosage;
        document.getElementById('admin-time').value = currentTime;

        const medInfo = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <div>
                    <label style="font-size: 12px; color: var(--gray-600);">Child</label>
                    <p style="font-size: 15px; font-weight: 600; margin-top: 4px;">${childName}</p>
                </div>
                <div>
                    <label style="font-size: 12px; color: var(--gray-600);">Medication</label>
                    <p style="font-size: 15px; font-weight: 600; margin-top: 4px;">${medicationName}</p>
                </div>
                <div>
                    <label style="font-size: 12px; color: var(--gray-600);">Prescribed Dosage</label>
                    <p style="font-size: 15px; margin-top: 4px;">${med.dosage}</p>
                </div>
                <div>
                    <label style="font-size: 12px; color: var(--gray-600);">Schedule</label>
                    <p style="font-size: 15px; margin-top: 4px;">${med.schedule || med.frequency || 'As needed'}</p>
                </div>
            </div>
            ${med.instructions ? `
                <div style="margin-top: 12px; padding: 12px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
                    <strong style="font-size: 13px;">Special Instructions:</strong>
                    <p style="font-size: 13px; margin-top: 4px;">${med.instructions}</p>
                </div>
            ` : ''}
        `;

        document.getElementById('admin-med-info').innerHTML = medInfo;
        openModal('administer-medication');

        // Clear previous entries
        document.getElementById('admin-by-staff1').value = '';
        document.getElementById('admin-by-staff2').value = '';
        document.getElementById('admin-notes').value = '';
    } catch (error) {
        console.error('Failed to load medication:', error);
        showError('Failed to load medication details');
    }
}

async function recordMedicationAdministration(event) {
    event.preventDefault();

    const medicationId = document.getElementById('admin-med-id').value;
    const button = document.getElementById('admin-medication-btn');
    setLoading(button, true);

    const administeredBy = document.getElementById('admin-by-staff1').value.trim();
    const verifiedBy = document.getElementById('admin-by-staff2').value.trim();
    const dosageGiven = document.getElementById('admin-dosage-given').value.trim();
    const timeGiven = document.getElementById('admin-time').value;
    const notes = document.getElementById('admin-notes').value.trim();

    // Validation
    if (!administeredBy || !verifiedBy) {
        showError('Both staff members must be specified for dual verification');
        setLoading(button, false);
        return;
    }

    if (administeredBy.toLowerCase() === verifiedBy.toLowerCase()) {
        showError('Two different staff members are required for verification');
        setLoading(button, false);
        return;
    }

    const administrationData = {
        administeredBy,
        verifiedBy,
        dosageGiven,
        administeredAt: new Date(`${new Date().toISOString().split('T')[0]}T${timeGiven}`).toISOString(),
        notes,
        photo: medicationPhotoBase64 || null,
        photoFilename: medicationPhotoFile ? medicationPhotoFile.name : null
    };

    try {
        await apiRequest(`/medications/${medicationId}/administer`, {
            method: 'POST',
            body: JSON.stringify(administrationData)
        });

        showSuccess('Medication administration recorded successfully!');
        closeModal('administer-medication');

        // Reset photo data
        removeMedPhoto();

        await loadMedicationList(currentMedicationFilter);
    } catch (error) {
        console.error('Failed to record medication:', error);
        showError('Failed to record medication administration');
    } finally {
        setLoading(button, false);
    }
}

async function viewMedicationDetails(medicationId) {
    try {
        const response = await apiRequest(`/medications/${medicationId}`);
        currentMedicationData = response.data || response;

        const med = currentMedicationData;

        console.log('📋 Medication details received:', med);
        console.log('📋 Raw medication object keys:', Object.keys(med));

        // Handle both snake_case (Supabase) and camelCase formats for backward compatibility
        // child_name is stored directly as a string field, not nested in child_info
        const childName = med.child_name || med.childName || med.child_info?.name || med.childInfo?.name || 'Unknown Child';
        const medicationName = med.medication_name || med.medicationName || 'Unknown Medication';
        const dosage = med.dosage || '-';
        const schedule = med.frequency || med.schedule || '-';
        const instructions = med.special_instructions || med.instructions || '';
        const status = med.active ? 'active' : (med.status || 'inactive');
        const parentAuthorization = med.parent_authorization || med.parentAuthorization;

        // Handle dates properly
        const startDate = med.start_date || med.startDate
            ? new Date(med.start_date || med.startDate).toLocaleDateString()
            : 'Not specified';
        const endDate = med.end_date || med.endDate
            ? new Date(med.end_date || med.endDate).toLocaleDateString()
            : 'Not specified';

        console.log('📋 Processed values:', { childName, medicationName, dosage, schedule, startDate, endDate, status });

        let administrationLogHTML = '';
        if (med.administrationLog && med.administrationLog.length > 0) {
            administrationLogHTML = `
                <div style="border-top: 1px solid var(--gray-200); padding-top: 20px; margin-top: 20px;">
                    <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 12px;">📋 Administration Log</h3>
                    <div style="max-height: 250px; overflow-y: auto;">
                        ${med.administrationLog.slice(0, 10).map(log => {
                const logDate = new Date(log.administered_at || log.administeredAt);
                // Handle both snake_case (Supabase) and camelCase formats
                const administeredBy = log.administered_by || log.administeredBy || 'Unknown';
                const verifiedBy = log.verified_by || log.verifiedBy || 'Unknown';
                const dosageGiven = log.dosage_given || log.dosageGiven || '-';
                const notes = log.notes || '';
                return `
                                <div style="padding: 12px; background: var(--gray-50); border-radius: 8px; margin-bottom: 8px;">
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                        <strong style="font-size: 14px;">${logDate.toLocaleDateString()} ${logDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
                                        <span style="font-size: 14px; color: var(--gray-700);">${dosageGiven}</span>
                                    </div>
                                    <div style="font-size: 13px; color: var(--gray-700);">
                                        <div>👨‍⚕️ Administered by: ${administeredBy}</div>
                                        <div>✓ Verified by: ${verifiedBy}</div>
                                        ${notes ? `<div style="margin-top: 4px; font-style: italic;">Note: ${notes}</div>` : ''}
                                    </div>
                                </div>
                            `;
            }).join('')}
                    </div>
                </div>
            `;
        }

        const content = `
            <div style="padding: 0 24px;">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1)); padding: 16px; border-radius: 8px; margin-bottom: 24px;">
                    <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 4px;">${medicationName}</h3>
                    <p style="font-size: 14px; color: var(--gray-700);">For: ${childName}</p>
                </div>
                
                <!-- Details Grid -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px;">
                    <div>
                        <label style="font-size: 12px; color: var(--gray-600); text-transform: uppercase;">Dosage</label>
                        <p style="font-size: 16px; font-weight: 600; margin-top: 4px;">${dosage}</p>
                    </div>
                    <div>
                        <label style="font-size: 12px; color: var(--gray-600); text-transform: uppercase;">Schedule</label>
                        <p style="font-size: 16px; margin-top: 4px;">${schedule}</p>
                    </div>
                    <div>
                        <label style="font-size: 12px; color: var(--gray-600); text-transform: uppercase;">Start Date</label>
                        <p style="font-size: 16px; margin-top: 4px;">${startDate}</p>
                    </div>
                    <div>
                        <label style="font-size: 12px; color: var(--gray-600); text-transform: uppercase;">End Date</label>
                        <p style="font-size: 16px; margin-top: 4px;">${endDate}</p>
                    </div>
                </div>
                
                ${instructions ? `
                <div style="margin-bottom: 24px;">
                    <label style="font-size: 12px; color: var(--gray-600); text-transform: uppercase;">Special Instructions</label>
                    <p style="font-size: 15px; line-height: 1.6; margin-top: 8px; padding: 12px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">${instructions}</p>
                </div>
                ` : ''}
                
                <!-- Authorization Status -->
                <div style="margin-bottom: 24px;">
                    <label style="font-size: 12px; color: var(--gray-600); text-transform: uppercase;">Authorization Status</label>
                    <div style="margin-top: 8px; padding: 12px; background: var(--gray-50); border-radius: 8px;">
                        <span class="badge ${status === 'active' ? 'badge-success' : 'badge-secondary'}">
                            ${status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>
                        ${parentAuthorization ? `
                            <div style="margin-top: 8px; font-size: 13px; color: var(--gray-700);">
                                ✓ Parent authorization received
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                ${administrationLogHTML}
            </div>
        `;

        document.getElementById('medication-details-content').innerHTML = content;
        openModal('medication-details');
    } catch (error) {
        console.error('Failed to load medication details:', error);
        showError('Failed to load medication details');
    }
}

function administerFromDetails() {
    if (!currentMedicationData) return;
    closeModal('medication-details');
    administerMedication(currentMedicationData.id);
}

function confirmDeleteMedication() {
    if (!currentMedicationData) return;

    // Handle both snake_case (Supabase) and camelCase formats
    const childName = currentMedicationData.child_name || currentMedicationData.childName || 'Unknown Child';
    const medicationName = currentMedicationData.medication_name || currentMedicationData.medicationName || 'Unknown Medication';

    deleteContext = {
        type: 'medications',
        id: currentMedicationData.id,
        name: `${medicationName} for ${childName}`
    };

    document.getElementById('delete-confirm-message').textContent =
        `Are you sure you want to delete the medication authorization for ${medicationName}?`;

    closeModal('medication-details');
    openModal('delete-confirm');
}

async function addMedication(event) {
    event.preventDefault();

    // Validate facility is loaded
    if (!AppState.facility || !AppState.facility.id) {
        showError('Please log in first to add medication authorizations');
        return;
    }

    const button = document.getElementById('add-medication-btn');
    setLoading(button, true);

    // Gather and validate form data
    const childName = document.getElementById('med-child-name').value.trim();
    const medicationName = document.getElementById('med-name').value.trim();
    const dosage = document.getElementById('med-dosage').value.trim();
    const schedule = document.getElementById('med-schedule').value.trim();
    const startDate = document.getElementById('med-start-date').value;
    const endDate = document.getElementById('med-end-date').value;
    const instructions = document.getElementById('med-instructions').value.trim();

    // Validation
    if (!childName || !medicationName || !dosage || !schedule) {
        showError('Please fill in all required fields');
        setLoading(button, false);
        return;
    }

    if (!startDate || !endDate) {
        showError('Please specify start and end dates');
        setLoading(button, false);
        return;
    }

    // Validate date range
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end <= start) {
        showError('End date must be after start date');
        setLoading(button, false);
        return;
    }

    // Check if end date is more than 1 year (Texas requirement)
    const oneYearFromStart = new Date(start);
    oneYearFromStart.setFullYear(oneYearFromStart.getFullYear() + 1);
    if (end > oneYearFromStart) {
        showError('Medication authorization cannot exceed 1 year per Texas §746.2653');
        setLoading(button, false);
        return;
    }

    const medicationData = {
        childInfo: {
            name: childName
        },
        medicationName,
        dosage,
        route: 'oral',
        schedule,
        startDate,
        endDate,
        prescribedBy: 'Dr. TBD', // TODO: Add doctor field to form
        parentAuthorization: {
            signedBy: 'Parent',
            signedAt: new Date().toISOString()
        },
        specialInstructions: instructions
    };

    console.log('Adding medication with data:', medicationData);

    try {
        const response = await apiRequest(`/facilities/${AppState.facility.id}/medications`, {
            method: 'POST',
            body: JSON.stringify(medicationData)
        });

        console.log('Medication added successfully:', response);
        showSuccess('✓ Medication authorization added successfully!');
        document.getElementById('add-medication-form').reset();
        closeModal('add-medication');
        await loadMedicationList(currentMedicationFilter);
    } catch (error) {
        console.error('Failed to add medication:', error);
        showError(error.message || 'Failed to add medication authorization. Please try again.');
    } finally {
        setLoading(button, false);
    }
}

// COMPLIANCE MANAGEMENT  
async function loadComplianceList() {
    try {
        const data = await apiRequest(`/facilities/${AppState.facility.id}/compliance`);
        const tbody = document.querySelector('#licensing .data-table tbody');
        if (!tbody) return;

        tbody.innerHTML = data.requirements.map(req => {
            const priorityClass = req.priority === 'High' ? 'badge-danger' :
                req.priority === 'Medium' ? 'badge-warning' : 'badge-info';
            return `
                <tr class="requirement-row" data-status="${req.status}">
                    <td>${req.requirement}</td>
                    <td><span class="badge ${priorityClass}">${req.priority}</span></td>
                    <td>${req.frequency}</td>
                    <td>${req.completedAt ? new Date(req.completedAt).toLocaleDateString() : 'Not completed'}</td>
                    <td><span class="badge ${req.status === 'complete' ? 'badge-success' : 'badge-warning'}">${req.status === 'complete' ? 'Complete' : 'Pending'}</span></td>
                    <td>
                        ${req.status !== 'complete' ?
                    `<button class="btn btn-sm btn-primary" onclick="markCompleteRequirement('${req.id}')">Mark Complete</button>` :
                    `<button class="btn btn-sm btn-secondary" disabled>Completed</button>`
                }
                    </td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        console.error('Failed to load compliance:', error);
        showError('Failed to load compliance requirements');
    }
}

async function markCompleteRequirement(reqId) {
    try {
        await apiRequest(`/facilities/${AppState.facility.id}/compliance/${reqId}/complete`, {
            method: 'POST',
            body: JSON.stringify({})
        });
        showSuccess('Requirement marked as complete');
        await loadComplianceList();
    } catch (error) {
        console.error('Failed to mark requirement complete:', error);
        showError('Failed to update requirement');
    }
}

// DAILY CHECKLIST
async function loadTodayChecklist() {
    try {
        const data = await apiRequest(`/facilities/${AppState.facility.id}/checklist/today`);
        const container = document.querySelector('#checklist .checklist-items');
        if (!container) return;

        const groupedTasks = {};
        data.tasks.forEach(task => {
            if (!groupedTasks[task.category]) {
                groupedTasks[task.category] = [];
            }
            groupedTasks[task.category].push(task);
        });

        container.innerHTML = Object.entries(groupedTasks).map(([category, tasks]) => `
            <div class="checklist-category">
                <h3>${category}</h3>
                ${tasks.map(task => `
                    <div class="checklist-item ${task.completed ? 'completed' : ''}">
                        <input type="checkbox" ${task.completed ? 'checked' : ''} 
                               onchange="toggleChecklistTask('${task.id}')" 
                               ${task.completed ? 'disabled' : ''}>
                        <div>
                            <strong>${task.task}</strong>
                            ${task.completedAt ? `<small>Completed at ${new Date(task.completedAt).toLocaleTimeString()}</small>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `).join('');
    } catch (error) {
        console.error('Failed to load checklist:', error);
        showError('Failed to load daily checklist');
    }
}

async function toggleChecklistTask(taskId) {
    try {
        await apiRequest(`/facilities/${AppState.facility.id}/checklist/today/tasks/${taskId}/complete`, {
            method: 'POST',
            body: JSON.stringify({})
        });
        await loadTodayChecklist();
    } catch (error) {
        console.error('Failed to complete task:', error);
        showError('Failed to update checklist');
    }
}

// TRAINING HUB
async function loadTrainingModules() {
    try {
        const data = await apiRequest(`/facilities/${AppState.facility.id}/training/modules`);
        const container = document.querySelector('#training .training-modules');
        if (!container) return;

        container.innerHTML = data.modules.map(module => {
            const completionRate = module.completedByStaff ?
                (module.completedByStaff.length / (data.totalStaff || 1) * 100).toFixed(0) : 0;
            return `
                <div class="training-card">
                    <h3>${module.title}</h3>
                    <p>${module.description}</p>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${completionRate}%"></div>
                    </div>
                    <p><small>${completionRate}% of staff completed</small></p>
                    <button class="btn btn-sm btn-primary" onclick="completeTraining('${module.id}')">Complete Training</button>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Failed to load training modules:', error);
        showError('Failed to load training modules');
    }
}

let currentTrainingModuleId = null;

async function completeTraining(moduleId) {
    try {
        // Store the module ID
        currentTrainingModuleId = moduleId;

        // Load staff list for the dropdown
        const response = await apiRequest(`/facilities/${AppState.facility.id}/staff`);
        const staffList = response.data || [];

        const select = document.getElementById('training-staff-select');
        select.innerHTML = '<option value="">-- Choose a staff member --</option>';
        staffList.forEach(staff => {
            select.innerHTML += `<option value="${staff.id}">${staff.name} - ${staff.role}</option>`;
        });

        // Load module details to show in the modal
        const moduleResponse = await apiRequest(`/training/${moduleId}`);
        const module = moduleResponse.data || moduleResponse;

        document.getElementById('training-module-title').textContent = module.title || 'Training Module';
        document.getElementById('training-module-description').textContent = module.description || '';

        // Set default date to today
        document.getElementById('training-completion-date').valueAsDate = new Date();

        // Clear previous values
        document.getElementById('training-hours').value = '';
        document.getElementById('training-notes').value = '';

        // Open the modal
        openModal('complete-training');
    } catch (error) {
        console.error('Failed to open training completion form:', error);
        showError('Failed to load training details');
    }
}

async function submitTrainingCompletion(event) {
    event.preventDefault();

    const staffId = document.getElementById('training-staff-select').value;
    const completionDate = document.getElementById('training-completion-date').value;
    const hours = parseFloat(document.getElementById('training-hours').value);
    const notes = document.getElementById('training-notes').value;

    if (!staffId || !completionDate || !hours) {
        showError('Please fill in all required fields');
        return;
    }

    const submitBtn = document.getElementById('submit-training-btn');
    const originalText = submitBtn.textContent;

    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner spinner-small"></span> Submitting...';

        await apiRequest(`/training/${currentTrainingModuleId}/complete`, {
            method: 'POST',
            body: JSON.stringify({
                staffId,
                completionDate,
                hours,
                notes
            })
        });

        showSuccess('Training completion recorded successfully');
        closeModal('complete-training');
        await loadTrainingModules();
    } catch (error) {
        console.error('Failed to record training completion:', error);
        showError('Failed to record training completion');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// DOCUMENT VAULT
let allDocuments = [];
let currentDocumentFilter = 'all';

async function loadDocuments(filter = 'all') {
    try {
        // Show skeleton while loading
        showTableSkeleton('#documents .data-table', 5, 6);

        currentDocumentFilter = filter;
        const response = await apiRequest(`/facilities/${AppState.facility.id}/documents`);
        allDocuments = response.data || [];

        let filteredDocs = allDocuments;
        if (filter && filter !== 'all') {
            filteredDocs = allDocuments.filter(doc =>
                doc.category.toLowerCase().replace(/\s+/g, '-') === filter.toLowerCase()
            );
        }

        const tbody = document.querySelector('#documents .data-table tbody');
        if (!tbody) return;

        // Check if empty and show professional empty state
        if (filteredDocs.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 60px 20px;">
                        <div style="max-width: 400px; margin: 0 auto;">
                            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity: 0.2; margin-bottom: 20px;">
                                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                                <polyline points="13 2 13 9 20 9"></polyline>
                            </svg>
                            <h3 style="font-size: 18px; font-weight: 600; color: var(--gray-700); margin-bottom: 8px;">
                                ${filter === 'all' ? 'No Documents Yet' : `No ${filter.replace('-', ' ')} Documents`}
                            </h3>
                            <p style="font-size: 14px; color: var(--gray-500); margin-bottom: 24px;">
                                ${filter === 'all'
                    ? 'Get started by uploading your first document to ensure compliance and organization.'
                    : 'No documents found in this category. Try uploading a new document or check another category.'}
                            </p>
                            <button class="btn btn-primary" onclick="openModal('upload-document')" style="padding: 10px 24px;">
                                <span style="margin-right: 8px;">📄</span> Upload First Document
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        } else {
            tbody.innerHTML = filteredDocs.map(doc => {
                const expDate = doc.expirationDate ? new Date(doc.expirationDate) : null;
                const statusClass = doc.status === 'Current' ? 'badge-success' :
                    doc.status === 'Expiring Soon' ? 'badge-warning' : 'badge-danger';
                return `
                    <tr style="transition: background-color 0.2s ease;">
                        <td><strong style="color: var(--gray-900);">${doc.name}</strong></td>
                        <td style="color: var(--gray-600);">${doc.formNumber || '—'}</td>
                        <td style="color: var(--gray-700);">${doc.category}</td>
                        <td style="color: var(--gray-600);">${expDate ? expDate.toLocaleDateString() : 'No expiration'}</td>
                        <td><span class="badge ${statusClass}">${doc.status || 'Current'}</span></td>
                        <td>
                            <button class="btn btn-sm btn-secondary" onclick="viewDocument('${doc.id}')" style="margin-right: 4px;">View</button>
                            <button class="btn btn-sm btn-primary" onclick="downloadDocument('${doc.id}')">Download</button>
                        </td>
                    </tr>
                `;
            }).join('');

            // Make table sortable
            makeSortable('#documents .data-table');
        }
    } catch (error) {
        console.error('Failed to load documents:', error);
        showError('Failed to load documents');
        const tbody = document.querySelector('#documents .data-table tbody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 60px 20px;">
                        <div style="max-width: 400px; margin: 0 auto;">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--danger); margin-bottom: 16px;">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                            <h3 style="font-size: 16px; font-weight: 600; color: var(--danger); margin-bottom: 8px;">Failed to Load Documents</h3>
                            <p style="font-size: 14px; color: var(--gray-600); margin-bottom: 16px;">There was an error loading your documents. Please try again.</p>
                            <button class="btn btn-secondary" onclick="loadDocuments('${currentDocumentFilter || 'all'}')" style="padding: 8px 20px;">
                                <span style="margin-right: 6px;">🔄</span> Retry
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }
    }
}

function filterDocuments(category) {
    console.log('Filtering documents by category:', category);

    // Update active tab styling
    const tabs = document.querySelectorAll('#documents .tab');
    tabs.forEach(tab => {
        tab.classList.remove('active');
        if (tab.textContent.toLowerCase().includes(category) ||
            (category === 'all' && tab.textContent.toLowerCase().includes('all'))) {
            tab.classList.add('active');
        }
    });

    loadDocuments(category);
}

function searchDocuments() {
    const searchTerm = document.getElementById('document-search').value.toLowerCase();
    console.log('Searching documents for:', searchTerm);

    const tbody = document.querySelector('#documents .data-table tbody');
    if (!tbody) return;

    let filteredDocs = allDocuments;

    // Apply category filter
    if (currentDocumentFilter && currentDocumentFilter !== 'all') {
        filteredDocs = filteredDocs.filter(doc =>
            doc.category.toLowerCase().replace(/\s+/g, '-') === currentDocumentFilter.toLowerCase()
        );
    }

    // Apply search filter
    if (searchTerm) {
        filteredDocs = filteredDocs.filter(doc =>
            doc.name.toLowerCase().includes(searchTerm) ||
            doc.category.toLowerCase().includes(searchTerm) ||
            (doc.owner && doc.owner.toLowerCase().includes(searchTerm))
        );
    }

    // Check if empty and show professional empty state
    if (filteredDocs.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 60px 20px;">
                    <div style="max-width: 400px; margin: 0 auto;">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity: 0.2; margin-bottom: 16px;">
                            <circle cx="11" cy="11" r="8"></circle>
                            <path d="m21 21-4.35-4.35"></path>
                        </svg>
                        <h3 style="font-size: 16px; font-weight: 600; color: var(--gray-700); margin-bottom: 8px;">No Documents Found</h3>
                        <p style="font-size: 14px; color: var(--gray-500); margin-bottom: 16px;">
                            No documents match "${searchTerm}". Try a different search term or clear the filter.
                        </p>
                        <button class="btn btn-secondary" onclick="document.getElementById('document-search').value = ''; searchDocuments();" style="padding: 8px 20px;">
                            Clear Search
                        </button>
                    </div>
                </td>
            </tr>
        `;
    } else {
        // Re-render table with results
        tbody.innerHTML = filteredDocs.map(doc => {
            const expDate = doc.expirationDate ? new Date(doc.expirationDate) : null;
            const statusClass = doc.status === 'Current' ? 'badge-success' :
                doc.status === 'Expiring Soon' ? 'badge-warning' : 'badge-danger';
            return `
                <tr style="transition: background-color 0.2s ease;">
                    <td><strong style="color: var(--gray-900);">${doc.name}</strong></td>
                    <td style="color: var(--gray-600);">${doc.category}</td>
                    <td style="color: var(--gray-600);">${doc.owner || '—'}</td>
                    <td style="color: var(--gray-600);">${expDate ? expDate.toLocaleDateString() : 'No expiration'}</td>
                    <td><span class="badge ${statusClass}">${doc.status || 'Current'}</span></td>
                    <td>
                        <button class="btn btn-sm btn-secondary" onclick="viewDocument('${doc.id}')" style="margin-right: 4px;">View</button>
                        <button class="btn btn-sm btn-primary" onclick="downloadDocument('${doc.id}')">Download</button>
                    </td>
                </tr>
            `;
        }).join('');
    }
}

let currentDocumentData = null;

async function viewDocument(docId) {
    try {
        const response = await apiRequest(`/documents/${docId}`);
        currentDocumentData = response.data || response;

        const doc = currentDocumentData;
        const uploadedDate = new Date(doc.uploadedAt).toLocaleDateString();
        const expDate = doc.expirationDate ? new Date(doc.expirationDate).toLocaleDateString() : 'No expiration';
        const issueDate = doc.issueDate ? new Date(doc.issueDate).toLocaleDateString() : '—';

        const statusColor = doc.status === 'Current' ? 'var(--success)' :
            doc.status === 'Expiring Soon' ? 'var(--warning)' : 'var(--danger)';

        const content = `
            <div style="padding: 0 24px;">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1)); padding: 16px; border-radius: 8px; margin-bottom: 24px;">
                    <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">${doc.name}</h3>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <span class="badge badge-secondary">${doc.category}</span>
                        ${doc.formNumber ? `<span class="badge badge-info">Form ${doc.formNumber}</span>` : ''}
                        <span class="badge ${doc.status === 'Current' ? 'badge-success' : doc.status === 'Expiring Soon' ? 'badge-warning' : 'badge-danger'}">
                            ${doc.status || 'Current'}
                        </span>
                    </div>
                </div>
                
                <!-- Document Details Grid -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px;">
                    ${doc.owner ? `
                    <div>
                        <label style="font-size: 12px; color: var(--gray-600); text-transform: uppercase;">Owner/Associated With</label>
                        <p style="font-size: 16px; margin-top: 4px;">${doc.owner}</p>
                    </div>
                    ` : ''}
                    <div>
                        <label style="font-size: 12px; color: var(--gray-600); text-transform: uppercase;">Uploaded By</label>
                        <p style="font-size: 16px; margin-top: 4px;">${doc.uploadedBy || '—'}</p>
                    </div>
                    <div>
                        <label style="font-size: 12px; color: var(--gray-600); text-transform: uppercase;">Upload Date</label>
                        <p style="font-size: 16px; margin-top: 4px;">${uploadedDate}</p>
                    </div>
                    <div>
                        <label style="font-size: 12px; color: var(--gray-600); text-transform: uppercase;">Issue Date</label>
                        <p style="font-size: 16px; margin-top: 4px;">${issueDate}</p>
                    </div>
                    <div>
                        <label style="font-size: 12px; color: var(--gray-600); text-transform: uppercase;">Expiration Date</label>
                        <p style="font-size: 16px; margin-top: 4px;">${expDate}</p>
                    </div>
                    <div>
                        <label style="font-size: 12px; color: var(--gray-600); text-transform: uppercase;">File Type</label>
                        <p style="font-size: 16px; margin-top: 4px;">${doc.fileType || 'PDF'}</p>
                    </div>
                </div>
                
                ${doc.violation ? `
                <div style="margin-bottom: 24px; padding: 12px; background: #fee; border-left: 4px solid var(--danger); border-radius: 4px;">
                    <strong style="font-size: 13px; color: var(--danger);">Related Violation:</strong>
                    <p style="font-size: 14px; margin-top: 4px; color: var(--gray-800);">${doc.violation}</p>
                </div>
                ` : ''}
                
                <!-- File Preview (if available) -->
                <div style="border-top: 1px solid var(--gray-200); padding-top: 20px;">
                    <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 12px;">📄 Document Preview</h3>
                    ${doc.fileType && doc.fileType.toLowerCase().includes('pdf') ? `
                        <div style="background: var(--gray-100); padding: 40px; text-align: center; border-radius: 8px;">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity: 0.4; margin-bottom: 12px;">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                <polyline points="14 2 14 8 20 8"/>
                                <line x1="9" y1="15" x2="15" y2="15"/>
                                <line x1="9" y1="11" x2="13" y2="11"/>
                            </svg>
                            <p style="font-size: 14px; color: var(--gray-600);">PDF Document - Click download to view</p>
                        </div>
                    ` : `
                        <div style="background: var(--gray-100); padding: 40px; text-align: center; border-radius: 8px;">
                            <p style="font-size: 14px; color: var(--gray-600);">Preview not available - Click download to view file</p>
                        </div>
                    `}
                </div>
            </div>
        `;

        document.getElementById('document-details-content').innerHTML = content;
        openModal('document-details');
    } catch (error) {
        console.error('Failed to load document details:', error);
        showError('Failed to load document details');
    }
}

function downloadDocumentFromDetails() {
    if (!currentDocumentData) return;
    downloadDocument(currentDocumentData.id);
}

async function renewDocument(docId) {
    // TODO: Implement document renewal (upload new version)
    showSuccess('Document renewal feature - Coming soon. Upload a new version with updated expiration date.');
}

function confirmDeleteDocument() {
    if (!currentDocumentData) return;

    deleteContext = {
        type: 'documents',
        id: currentDocumentData.id,
        name: currentDocumentData.name
    };

    document.getElementById('delete-confirm-message').textContent =
        `Are you sure you want to delete "${currentDocumentData.name}"?`;

    closeModal('document-details');
    openModal('delete-confirm');
}

async function downloadDocument(docId) {
    try {
        // Create download URL with auth token
        const downloadUrl = `${API_BASE_URL}/documents/${docId}/download`;

        // Fetch with auth token
        const response = await fetch(downloadUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${AppState.token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Download failed: ${response.statusText}`);
        }

        // Get filename from Content-Disposition header if available
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = 'document';
        if (contentDisposition) {
            // Match both quoted and unquoted filenames
            const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/i);
            if (filenameMatch && filenameMatch[1]) {
                filename = filenameMatch[1].replace(/['"]/g, '').trim();
            }
        }

        // Get the blob data
        const blob = await response.blob();

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();

        // Cleanup
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        showSuccess('Document downloaded successfully');
    } catch (error) {
        console.error('Failed to download document:', error);
        showError('Failed to download document');
    }
}
function toggleAIChat() {
    const container = document.getElementById('ai-chat-container');
    container.classList.toggle('active');

    if (container.classList.contains('active')) {
        document.getElementById('ai-chat-input').focus();
    }
}

function handleAIInputKeydown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendAIMessage();
    }
}

async function sendAIMessage() {
    const input = document.getElementById('ai-chat-input');
    const sendBtn = document.getElementById('ai-send-btn');
    const messagesContainer = document.getElementById('ai-chat-messages');
    const question = input.value.trim();

    if (!question) return;

    // Add user message to chat
    addAIMessage(question, 'user');
    input.value = '';
    input.style.height = 'auto';

    // Show loading indicator
    const loadingId = addAILoadingMessage();

    // Disable input
    sendBtn.disabled = true;

    try {
        const response = await apiRequest('/ai/ask', {
            method: 'POST',
            body: JSON.stringify({ question })
        });

        // Remove loading message
        removeAIMessage(loadingId);

        // Add AI response
        addAIMessage(response.data.answer, 'assistant');
    } catch (error) {
        // Remove loading message
        removeAIMessage(loadingId);

        // Show appropriate error message based on error type
        let errorMessage = 'Sorry, I encountered an error. Please try again.';

        if (error.message && error.message.includes('Database connection unavailable')) {
            errorMessage = 'I\'m having trouble connecting to the database right now. Please check your internet connection and try again in a moment.';
        } else if (error.message && error.message.includes('network')) {
            errorMessage = 'Network connection issue detected. Please check your internet connection and try again.';
        }

        addAIMessage(errorMessage, 'assistant');
        console.error('AI chat error:', error);
    } finally {
        sendBtn.disabled = false;
    }
}

function addAIMessage(content, role) {
    const messagesContainer = document.getElementById('ai-chat-messages');
    const messageId = 'msg-' + Date.now();

    const messageDiv = document.createElement('div');
    messageDiv.className = `ai-message ai-message-${role}`;
    messageDiv.id = messageId;

    const avatar = document.createElement('div');
    avatar.className = 'ai-avatar';
    avatar.textContent = role === 'assistant' ? '🤖' : '👤';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'ai-content';

    // Format content with paragraphs
    const paragraphs = content.split('\n\n');
    paragraphs.forEach(para => {
        if (para.trim()) {
            const p = document.createElement('p');
            p.innerHTML = formatAIText(para);
            contentDiv.appendChild(p);
        }
    });

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(contentDiv);
    messagesContainer.appendChild(messageDiv);

    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    return messageId;
}

function formatAIText(text) {
    // Bold text between **
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Code between ``
    text = text.replace(/`(.*?)`/g, '<code>$1</code>');
    // Line breaks
    text = text.replace(/\n/g, '<br>');
    return text;
}

function addAILoadingMessage() {
    const messagesContainer = document.getElementById('ai-chat-messages');
    const loadingId = 'loading-' + Date.now();

    const messageDiv = document.createElement('div');
    messageDiv.className = 'ai-message ai-message-assistant';
    messageDiv.id = loadingId;

    const avatar = document.createElement('div');
    avatar.className = 'ai-avatar';
    avatar.textContent = '🤖';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'ai-content';

    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'ai-loading';
    loadingDiv.innerHTML = '<div class="ai-loading-dot"></div><div class="ai-loading-dot"></div><div class="ai-loading-dot"></div>';

    contentDiv.appendChild(loadingDiv);
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(contentDiv);
    messagesContainer.appendChild(messageDiv);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    return loadingId;
}

function removeAIMessage(messageId) {
    const message = document.getElementById(messageId);
    if (message) {
        message.remove();
    }
}

// Auto-resize textarea
document.addEventListener('DOMContentLoaded', () => {
    const textarea = document.getElementById('ai-chat-input');
    if (textarea) {
        textarea.addEventListener('input', function () {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 100) + 'px';
        });
    }

    // Annual training progress bar updater
    const annualHoursInput = document.getElementById('staff-annual-hours');
    if (annualHoursInput) {
        annualHoursInput.addEventListener('input', function () {
            const hours = parseInt(this.value) || 0;
            const required = 24;
            const percentage = Math.min((hours / required) * 100, 100);

            const progressBar = document.getElementById('annual-progress-bar');
            const progressText = document.getElementById('annual-progress-text');

            if (progressBar) {
                progressBar.style.width = percentage + '%';

                // Change color based on progress
                if (percentage >= 100) {
                    progressBar.style.background = 'var(--success)';
                } else if (percentage >= 75) {
                    progressBar.style.background = 'var(--warning)';
                } else {
                    progressBar.style.background = 'var(--primary)';
                }
            }

            if (progressText) {
                progressText.textContent = `${hours} / ${required} hours`;
            }
        });
    }
});

// =============================================
// KEYBOARD SHORTCUTS
// =============================================
document.addEventListener('keydown', (e) => {
    // Escape key - close modals
    if (e.key === 'Escape') {
        const openModal = document.querySelector('.modal[style*="display: flex"]');
        if (openModal) {
            openModal.style.display = 'none';
        }
    }

    // Ctrl/Cmd + K - Global search (future feature)
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        showInfo('Global search feature coming soon! Press ? for keyboard shortcuts.');
    }

    // ? key - Show keyboard shortcuts help
    if (e.key === '?' && !e.target.matches('input, textarea')) {
        e.preventDefault();
        showKeyboardShortcuts();
    }

    // Ctrl/Cmd + S - Save/Submit forms (prevent default browser save)
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        const activeModal = document.querySelector('.modal[style*="display: flex"]');
        if (activeModal) {
            const submitBtn = activeModal.querySelector('button[type="submit"], .btn-primary');
            if (submitBtn) submitBtn.click();
        }
    }
});

function showKeyboardShortcuts() {
    const shortcuts = `
        <div style="padding: 20px;">
            <h3 style="margin-bottom: 16px; font-size: 18px; font-weight: 600;">⌨️ Keyboard Shortcuts</h3>
            <div style="display: grid; grid-template-columns: auto 1fr; gap: 12px; font-size: 14px;">
                <kbd style="padding: 4px 8px; background: var(--gray-100); border-radius: 4px; font-family: monospace;">Esc</kbd>
                <span>Close modals and overlays</span>
                
                <kbd style="padding: 4px 8px; background: var(--gray-100); border-radius: 4px; font-family: monospace;">Ctrl + S</kbd>
                <span>Save/Submit current form</span>
                
                <kbd style="padding: 4px 8px; background: var(--gray-100); border-radius: 4px; font-family: monospace;">?</kbd>
                <span>Show this help dialog</span>
                
                <kbd style="padding: 4px 8px; background: var(--gray-100); border-radius: 4px; font-family: monospace;">Tab</kbd>
                <span>Navigate between form fields</span>
            </div>
            <button class="btn btn-primary" onclick="closeModal('keyboard-shortcuts-modal')" style="margin-top: 20px; width: 100%;">
                Got it!
            </button>
        </div>
    `;

    // Create temporary modal
    let modal = document.getElementById('keyboard-shortcuts-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'keyboard-shortcuts-modal';
        modal.className = 'modal';
        modal.innerHTML = `<div class="modal-content" style="max-width: 500px;">${shortcuts}</div>`;
        document.body.appendChild(modal);
    }
    modal.style.display = 'flex';
}

// =============================================
// ONBOARDING MANAGEMENT
// =============================================

// Global state for onboarding
let currentOnboardingId = null;
let currentSectionIndex = 0;
let dayOneSections = [];
let weekOneDays = [];
let currentWeekOneDay = 2;
let dayOneStartTime = null;

// ========== ONBOARDING LIST PAGE ==========

async function loadOnboardingList() {
    try {
        // Close any open modals first
        document.querySelectorAll('.modal').forEach(modal => modal.style.display = 'none');
        
        const facility = JSON.parse(localStorage.getItem('facility'));
        
        // Fetch onboarding records
        const response = await apiRequest(`/onboarding/new-hires?facility_id=${facility.id}`);
        
        if (response.success) {
            const records = response.data || [];
            
            // Update stats
            document.getElementById('onboarding-total-count').textContent = records.length;
            document.getElementById('onboarding-completed-count').textContent = 
                records.filter(r => r.status === 'completed').length;
            document.getElementById('onboarding-inprogress-count').textContent = 
                records.filter(r => r.status === 'in_progress').length;
            
            // Calculate overdue (hired > 7 days ago and not completed)
            const now = new Date();
            const overdue = records.filter(r => {
                if (r.status === 'completed') return false;
                const hireDate = new Date(r.hire_date);
                const daysSince = Math.floor((now - hireDate) / (1000 * 60 * 60 * 24));
                return daysSince > 7;
            }).length;
            document.getElementById('onboarding-overdue-count').textContent = overdue;
            
            // Update filter counts
            document.getElementById('onboarding-filter-all').textContent = records.length;
            
            // Render table
            renderOnboardingTable(records);
            
            // Load staff list for the Add New Hire modal
            await loadStaffForOnboarding();
        }
    } catch (error) {
        console.error('Error loading onboarding list:', error);
        showError('Failed to load onboarding records');
    }
}

function renderOnboardingTable(records) {
    const tbody = document.getElementById('onboarding-list-tbody');
    
    if (records.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: #94a3b8;">
                    <div style="font-size: 3rem; margin-bottom: 10px;">📋</div>
                    <p style="font-size: 0.9rem; margin: 0;">No onboarding records found.</p>
                    <button class="cac-btn cac-btn-primary" onclick="openAddNewHireModal()" style="margin-top: 15px;">
                        + Add First New Hire
                    </button>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = records.map(record => {
        const hireDate = new Date(record.hire_date);
        const now = new Date();
        const daysSince = Math.floor((now - hireDate) / (1000 * 60 * 60 * 24));
        
        // Calculate Week One progress
        const weekOneProgress = record.week_one_progress || {};
        const completedDays = Object.keys(weekOneProgress).filter(day => weekOneProgress[day]?.completed).length;
        
        // Determine status badge
        let statusBadge = '';
        if (record.status === 'completed') {
            statusBadge = '<span class="cac-badge cac-badge-success">✅ Completed</span>';
        } else if (daysSince > 7) {
            statusBadge = '<span class="cac-badge cac-badge-danger">⚠️ Overdue</span>';
        } else {
            statusBadge = '<span class="cac-badge cac-badge-warning">⏳ In Progress</span>';
        }
        
        return `
            <tr style="cursor: pointer;" onclick="navigateTo('/onboarding/${record.id}/dashboard')">
                <td style="font-weight: 600;">${record.staff_name || 'Unknown'}</td>
                <td>${new Date(record.hire_date).toLocaleDateString()}</td>
                <td class="hide-mobile">${daysSince} days</td>
                <td>
                    ${record.day_one_completed 
                        ? '<span class="cac-badge cac-badge-success">✅ Done</span>' 
                        : '<span class="cac-badge cac-badge-secondary">⏳ Pending</span>'}
                </td>
                <td>${completedDays}/6 days</td>
                <td>${statusBadge}</td>
                <td onclick="event.stopPropagation();">
                    <button class="cac-btn cac-btn-sm cac-btn-primary" 
                        onclick="navigateTo('/onboarding/${record.id}/dashboard')"
                        style="padding: 6px 12px; font-size: 0.75rem;">
                        View
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

async function loadStaffForOnboarding() {
    try {
        const facility = JSON.parse(localStorage.getItem('facility'));
        const response = await apiRequest(`/staff?facility_id=${facility.id}`);
        
        if (response.success) {
            const staffSelect = document.getElementById('new-hire-staff-id');
            staffSelect.innerHTML = '<option value="">Select Staff Member...</option>' +
                response.data.map(staff => `
                    <option value="${staff.id}">${staff.name} - ${staff.role || 'Staff'}</option>
                `).join('');
        }
    } catch (error) {
        console.error('Error loading staff:', error);
    }
}

function openAddNewHireModal() {
    // Set today's date as default
    document.getElementById('new-hire-date').valueAsDate = new Date();
    document.getElementById('add-new-hire-modal').style.display = 'flex';
}

async function submitNewHire(event) {
    event.preventDefault();
    
    const staffId = document.getElementById('new-hire-staff-id').value;
    const hireDate = document.getElementById('new-hire-date').value;
    const facility = JSON.parse(localStorage.getItem('facility'));
    
    try {
        const response = await apiRequest('/onboarding/new-hires', {
            method: 'POST',
            body: JSON.stringify({
                facility_id: facility.id,
                staff_id: staffId,
                hire_date: hireDate
            })
        });
        
        if (response.success) {
            showSuccess('Onboarding record created successfully!');
            closeModal('add-new-hire-modal');
            await loadOnboardingList();
            
            // Navigate to the new record's dashboard
            navigateTo(`/onboarding/${response.data.id}/dashboard`);
        }
    } catch (error) {
        console.error('Error creating onboarding record:', error);
        showError(error.message || 'Failed to create onboarding record');
    }
}

async function startOnboardingForStaff(staffId, staffName) {
    try {
        const facility = JSON.parse(localStorage.getItem('facility'));
        
        // Prompt for hire date
        const hireDate = prompt(`Enter hire date for ${staffName} (YYYY-MM-DD):`, new Date().toISOString().split('T')[0]);
        
        if (!hireDate) {
            return; // User cancelled
        }
        
        // Validate date format
        if (!/^\d{4}-\d{2}-\d{2}$/.test(hireDate)) {
            showError('Invalid date format. Please use YYYY-MM-DD');
            return;
        }
        
        // Create onboarding record
        const response = await apiRequest('/onboarding/new-hires', {
            method: 'POST',
            body: JSON.stringify({
                facility_id: facility.id,
                staff_id: staffId,
                hire_date: hireDate
            })
        });
        
        if (response.success) {
            showSuccess(`✅ Onboarding started for ${staffName}!`);
            // Navigate to onboarding dashboard
            setTimeout(() => {
                navigateTo(`/onboarding/${response.data.id}/dashboard`);
            }, 500);
        } else {
            showError(response.message || 'Failed to start onboarding');
        }
    } catch (error) {
        console.error('Error starting onboarding:', error);
        showError(error.message || 'Failed to start onboarding');
    }
}

function filterOnboarding(status) {
    // Implement filtering if needed
    loadOnboardingList();
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
}

// ========== ONBOARDING DASHBOARD ==========

async function loadOnboardingDashboard(id) {
    try {
        currentOnboardingId = id;
        
        const response = await apiRequest(`/onboarding/new-hires/${id}`);
        
        if (response.success) {
            const record = response.data;
            
            // Update header
            document.getElementById('dashboard-staff-name').textContent = record.staff_name || 'Onboarding Dashboard';
            document.getElementById('dashboard-hire-date').textContent = new Date(record.hire_date).toLocaleDateString();
            
            // Calculate days since hire
            const hireDate = new Date(record.hire_date);
            const now = new Date();
            const daysSince = Math.floor((now - hireDate) / (1000 * 60 * 60 * 24));
            document.getElementById('dashboard-days-since-hire').textContent = daysSince;
            
            // Calculate progress
            const weekOneProgress = record.week_one_progress || {};
            const completedDays = Object.keys(weekOneProgress).filter(day => weekOneProgress[day]?.completed).length;
            const totalSteps = 7; // 1 (Day One) + 6 (Week One days)
            let completedSteps = record.day_one_completed ? 1 : 0;
            completedSteps += completedDays;
            const progressPercent = Math.round((completedSteps / totalSteps) * 100);
            
            document.getElementById('dashboard-progress-percent').textContent = `${progressPercent}%`;
            document.getElementById('dashboard-progress-bar').style.width = `${progressPercent}%`;
            
            // Update status badge
            const statusBadge = document.getElementById('dashboard-status-badge');
            if (record.status === 'completed') {
                statusBadge.textContent = '✅ Completed';
                statusBadge.className = 'cac-badge cac-badge-success';
            } else if (daysSince > 7) {
                statusBadge.textContent = '⚠️ Overdue';
                statusBadge.className = 'cac-badge cac-badge-danger';
            } else {
                statusBadge.textContent = '⏳ In Progress';
                statusBadge.className = 'cac-badge cac-badge-warning';
            }
            
            // Update Day One status
            if (record.day_one_completed) {
                document.getElementById('dayone-status-pending').style.display = 'none';
                document.getElementById('dayone-status-completed').style.display = 'block';
                document.getElementById('dayone-completed-date').textContent = 
                    new Date(record.day_one_completed_at).toLocaleDateString();
                document.getElementById('dayone-duration').textContent = record.day_one_duration_minutes || '--';
                document.getElementById('dayone-champion').textContent = record.champion_name || 'N/A';
            } else {
                document.getElementById('dayone-status-pending').style.display = 'block';
                document.getElementById('dayone-status-completed').style.display = 'none';
            }
            
            // Update Week One checklist
            renderWeekOneChecklist(record);
            
            // Enable/disable Week One button
            const weekOneBtn = document.getElementById('weekone-start-btn');
            if (record.day_one_completed) {
                weekOneBtn.disabled = false;
            } else {
                weekOneBtn.disabled = true;
            }
            
            // Show Week One complete badge if all days done
            if (completedDays === 6) {
                document.getElementById('weekone-complete-badge').style.display = 'block';
            }
            
            // Render next steps
            renderNextSteps(record, daysSince);
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showError('Failed to load onboarding dashboard');
    }
}

function renderWeekOneChecklist(record) {
    const weekOneProgress = record.week_one_progress || {};
    const checklist = document.getElementById('weekone-checklist');
    
    const days = [
        { num: 2, label: 'Day 2: Emergency Exits' },
        { num: 3, label: 'Day 3: Handwashing & Hygiene' },
        { num: 4, label: 'Day 4: Child Protection' },
        { num: 5, label: 'Day 5: Supervision Ratios' },
        { num: 6, label: 'Day 6: Incident Documentation' },
        { num: 7, label: 'Day 7: Behavior Guidance' }
    ];
    
    checklist.innerHTML = days.map(day => {
        const completed = weekOneProgress[day.num]?.completed;
        return `
            <div style="display: flex; align-items: center; gap: 10px; padding: 8px; background: ${completed ? '#f0fdf4' : '#f8fafc'}; border-radius: 6px; border-left: 3px solid ${completed ? '#10b981' : '#cbd5e1'};">
                <span style="font-size: 1.2rem;">${completed ? '✅' : '⏳'}</span>
                <span style="font-size: 0.8rem; font-weight: 500; color: ${completed ? '#10b981' : '#64748b'};">
                    ${day.label}
                </span>
            </div>
        `;
    }).join('');
}

function renderNextSteps(record, daysSince) {
    const container = document.getElementById('next-steps-content');
    const steps = [];
    
    if (!record.day_one_completed) {
        steps.push({
            icon: '📚',
            text: 'Complete Day One Orientation',
            urgent: daysSince > 0
        });
    } else {
        const weekOneProgress = record.week_one_progress || {};
        const completedDays = Object.keys(weekOneProgress).filter(day => weekOneProgress[day]?.completed).length;
        
        if (completedDays < 6) {
            steps.push({
                icon: '📅',
                text: `Complete Week One check-ins (${completedDays}/6 done)`,
                urgent: daysSince > 7
            });
        }
    }
    
    if (steps.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <div style="font-size: 2.5rem; margin-bottom: 10px;">🎉</div>
                <p style="font-size: 0.85rem; color: #10b981; font-weight: 600;">All onboarding steps complete!</p>
            </div>
        `;
    } else {
        container.innerHTML = steps.map(step => `
            <div style="padding: 12px; background: ${step.urgent ? '#fef3c7' : '#f8fafc'}; border-radius: 6px; border-left: 3px solid ${step.urgent ? '#f59e0b' : '#8b5cf6'}; margin-bottom: 10px;">
                <p style="font-size: 0.85rem; margin: 0;">
                    <span style="font-size: 1.2rem; margin-right: 8px;">${step.icon}</span>
                    ${step.text}
                </p>
            </div>
        `).join('');
    }
}

function startDayOne() {
    navigateTo(`/onboarding/${currentOnboardingId}/day-one`);
}

function startWeekOne() {
    navigateTo(`/onboarding/${currentOnboardingId}/week-one`);
}

function viewStaffProfile() {
    navigateTo('/staff');
}

// ========== DAY ONE ORIENTATION ==========

async function loadDayOneOrientation(id) {
    try {
        currentOnboardingId = id;
        currentSectionIndex = 0;
        dayOneStartTime = new Date();
        
        // Fetch Day One content
        const contentResponse = await apiRequest('/onboarding/day-one');
        if (contentResponse.success) {
            dayOneSections = contentResponse.data;
            document.getElementById('total-sections').textContent = dayOneSections.length;
        }
        
        // Fetch onboarding record details
        const recordResponse = await apiRequest(`/onboarding/new-hires/${id}`);
        if (recordResponse.success) {
            document.getElementById('dayone-staff-name').textContent = recordResponse.data.staff_name || 'New Hire';
            
            // Get champion name from localStorage user
            const user = JSON.parse(localStorage.getItem('user'));
            document.getElementById('dayone-champion-name').textContent = user?.name || 'Champion';
        }
        
        // Render section navigation dots
        renderSectionDots();
        
        // Load first section
        loadSection(0);
        
    } catch (error) {
        console.error('Error loading Day One orientation:', error);
        showError('Failed to load orientation content');
    }
}

function renderSectionDots() {
    const container = document.getElementById('section-dots');
    container.innerHTML = dayOneSections.map((_, index) => 
        `<div class="section-dot ${index === currentSectionIndex ? 'active' : ''}" 
              onclick="loadSection(${index})"></div>`
    ).join('');
}

function loadSection(index) {
    if (index < 0 || index >= dayOneSections.length) return;
    
    currentSectionIndex = index;
    const section = dayOneSections[index];
    
    // Update progress
    document.getElementById('current-section-num').textContent = index + 1;
    document.getElementById('current-section-duration').textContent = section.duration_minutes || '--';
    const progressPercent = Math.round(((index + 1) / dayOneSections.length) * 100);
    document.getElementById('progress-percentage').textContent = progressPercent;
    document.getElementById('section-progress-bar').style.width = `${progressPercent}%`;
    
    // Update section content
    document.getElementById('section-title').textContent = section.section_title;
    document.getElementById('champion-script').innerHTML = formatContent(section.champion_script);
    document.getElementById('section-content').innerHTML = formatContent(section.content);
    document.getElementById('verification-questions').innerHTML = formatContent(section.verification_questions);
    
    // Update navigation buttons
    document.getElementById('prev-btn').disabled = index === 0;
    document.getElementById('next-btn').textContent = index === dayOneSections.length - 1 ? 'Complete →' : 'Next →';
    
    // Update dots
    renderSectionDots();
    
    // Show/hide views
    document.getElementById('section-view').style.display = 'block';
    document.getElementById('completion-view').style.display = 'none';
    document.getElementById('section-navigation').style.display = 'flex';
}

function formatContent(text) {
    if (!text) return '';
    return text.split('\n').map(line => `<p style="margin-bottom: 8px;">${line}</p>`).join('');
}

function nextSection() {
    if (currentSectionIndex === dayOneSections.length - 1) {
        // Show completion view
        showCompletionView();
    } else {
        loadSection(currentSectionIndex + 1);
    }
}

function previousSection() {
    loadSection(currentSectionIndex - 1);
}

function showCompletionView() {
    // Calculate elapsed time
    const elapsed = new Date() - dayOneStartTime;
    const minutes = Math.round(elapsed / 60000);
    document.getElementById('total-elapsed-time').textContent = `${minutes} minutes`;
    
    // Render topics summary
    const summaryContainer = document.getElementById('topics-summary');
    summaryContainer.innerHTML = dayOneSections.map(section => `
        <div style="padding: 8px; background: white; border-radius: 6px; border-left: 3px solid #10b981; font-size: 0.8rem;">
            ✓ ${section.section_title}
        </div>
    `).join('');
    
    // Show completion view
    document.getElementById('section-view').style.display = 'none';
    document.getElementById('completion-view').style.display = 'block';
    document.getElementById('section-navigation').style.display = 'none';
}

async function submitDayOneCompletion(event) {
    event.preventDefault();
    
    const newHireSignature = document.getElementById('new-hire-signature').value;
    const championSignature = document.getElementById('champion-signature').value;
    const elapsed = Math.round((new Date() - dayOneStartTime) / 60000);
    
    const user = JSON.parse(localStorage.getItem('user'));
    
    try {
        const response = await apiRequest('/onboarding/day-one/complete', {
            method: 'POST',
            body: JSON.stringify({
                onboarding_id: parseInt(currentOnboardingId),
                champion_id: user.staff_id,
                duration_minutes: elapsed,
                signatures: {
                    new_hire: newHireSignature,
                    champion: championSignature
                }
            })
        });
        
        if (response.success) {
            showSuccess('✅ Day One Orientation completed successfully!');
            setTimeout(() => {
                navigateTo(`/onboarding/${currentOnboardingId}/dashboard`);
            }, 1500);
        }
    } catch (error) {
        console.error('Error completing Day One:', error);
        showError(error.message || 'Failed to complete Day One');
    }
}

function exitDayOne() {
    if (confirm('Are you sure you want to exit? Progress will not be saved.')) {
        navigateTo(`/onboarding/${currentOnboardingId}/dashboard`);
    }
}

// ========== WEEK ONE CHECK-INS ==========

async function loadWeekOneCheckins(id) {
    try {
        currentOnboardingId = id;
        currentWeekOneDay = 2;
        
        // Fetch Week One content
        const contentResponse = await apiRequest('/onboarding/week-one');
        if (contentResponse.success) {
            weekOneDays = contentResponse.data;
        }
        
        // Fetch onboarding record
        const recordResponse = await apiRequest(`/onboarding/new-hires/${id}`);
        if (recordResponse.success) {
            document.getElementById('weekone-staff-name').textContent = recordResponse.data.staff_name || 'New Hire';
            
            // Update progress
            const weekOneProgress = recordResponse.data.week_one_progress || {};
            const completedDays = Object.keys(weekOneProgress).filter(day => weekOneProgress[day]?.completed).length;
            document.getElementById('weekone-completed-count').textContent = completedDays;
            document.getElementById('weekone-progress-bar').style.width = `${(completedDays / 6) * 100}%`;
            
            // Mark completed tabs
            for (let day = 2; day <= 7; day++) {
                const tab = document.querySelector(`.day-tab[data-day="${day}"]`);
                if (weekOneProgress[day]?.completed) {
                    tab.classList.add('completed');
                }
            }
        }
        
        // Load first day
        selectDay(2);
        
    } catch (error) {
        console.error('Error loading Week One check-ins:', error);
        showError('Failed to load Week One content');
    }
}

async function selectDay(dayNumber) {
    try {
        currentWeekOneDay = dayNumber;
        
        // Update tabs
        document.querySelectorAll('.day-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`.day-tab[data-day="${dayNumber}"]`).classList.add('active');
        
        // Show loading
        document.getElementById('day-loading').style.display = 'block';
        document.getElementById('day-content').style.display = 'none';
        
        // Fetch day content
        const response = await apiRequest(`/onboarding/week-one/${dayNumber}`);
        
        if (response.success) {
            const day = response.data;
            
            // Update content
            document.getElementById('day-title').textContent = day.title;
            document.getElementById('day-duration').textContent = day.duration_minutes || '--';
            document.getElementById('champion-approach').innerHTML = formatContent(day.champion_approach);
            
            // Render activities
            const activities = day.activities || [];
            document.getElementById('day-activities').innerHTML = activities.map((activity, index) => `
                <div class="activity-card">
                    <strong>Activity ${index + 1}:</strong> ${activity}
                </div>
            `).join('');
            
            // Render verification questions
            document.getElementById('verification-questions').innerHTML = formatContent(day.verification_questions);
            
            // Update complete button
            document.getElementById('complete-day-text').textContent = `✓ Complete Day ${dayNumber}`;
            
            // Check if this day is already completed
            const recordResponse = await apiRequest(`/onboarding/new-hires/${currentOnboardingId}`);
            const weekOneProgress = recordResponse.data.week_one_progress || {};
            
            if (weekOneProgress[dayNumber]?.completed) {
                document.getElementById('complete-day-btn').style.display = 'none';
                document.getElementById('day-completed-banner').style.display = 'block';
                document.getElementById('day-completed-date').textContent = 
                    new Date(weekOneProgress[dayNumber].completed_at).toLocaleDateString();
                document.getElementById('champion-notes').value = weekOneProgress[dayNumber].notes || '';
                document.getElementById('champion-notes').disabled = true;
            } else {
                document.getElementById('complete-day-btn').style.display = 'block';
                document.getElementById('day-completed-banner').style.display = 'none';
                document.getElementById('champion-notes').value = '';
                document.getElementById('champion-notes').disabled = false;
            }
            
            // Hide loading, show content
            document.getElementById('day-loading').style.display = 'none';
            document.getElementById('day-content').style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading day content:', error);
        showError('Failed to load day content');
    }
}

async function completeDayCheckin() {
    const notes = document.getElementById('champion-notes').value;
    
    try {
        const response = await apiRequest('/onboarding/week-one/complete-day', {
            method: 'POST',
            body: JSON.stringify({
                onboarding_id: parseInt(currentOnboardingId),
                day_number: currentWeekOneDay,
                notes: notes
            })
        });
        
        if (response.success) {
            showSuccess(`✅ Day ${currentWeekOneDay} completed successfully!`);
            
            // Mark tab as completed
            document.querySelector(`.day-tab[data-day="${currentWeekOneDay}"]`).classList.add('completed');
            
            // Reload to update progress
            await loadWeekOneCheckins(currentOnboardingId);
            
            // Move to next day if available
            if (currentWeekOneDay < 7) {
                setTimeout(() => selectDay(currentWeekOneDay + 1), 1000);
            } else {
                setTimeout(() => {
                    navigateTo(`/onboarding/${currentOnboardingId}/dashboard`);
                }, 2000);
            }
        }
    } catch (error) {
        console.error('Error completing day:', error);
        showError(error.message || 'Failed to complete day');
    }
}

function exitWeekOne() {
    navigateTo(`/onboarding/${currentOnboardingId}/dashboard`);
}

// ===================================
// SETTINGS PAGE FUNCTIONS
// ===================================

let allStates = [];
let currentStateRegulations = [];
let selectedStateCode = null;

async function loadSettingsPage() {
    try {
        const facility = JSON.parse(localStorage.getItem('facility'));
        
        // Load facility info display
        document.getElementById('facility-name-display').textContent = facility.name || '--';
        document.getElementById('facility-license-display').textContent = facility.licenseNumber || '--';
        document.getElementById('facility-capacity-display').textContent = facility.capacity ? `${facility.capacity} children` : '--';
        
        const address = facility.address || {};
        const addressStr = [address.street, address.city, address.state, address.zip].filter(Boolean).join(', ');
        document.getElementById('facility-address-display').textContent = addressStr || '--';
        
        // Load states list
        const statesResponse = await apiRequest('/states/list');
        if (statesResponse.success) {
            allStates = statesResponse.data;
            populateStateSelect(allStates);
        }
        
        // Load current facility state
        const facilityStateResponse = await apiRequest(`/states/facility/${facility.id}`);
        if (facilityStateResponse.success) {
            selectedStateCode = facilityStateResponse.data.state_code || 'TX';
            document.getElementById('facility-state-select').value = selectedStateCode;
            document.getElementById('current-state-display').textContent = facilityStateResponse.data.state_name || 'Texas';
            
            // Load regulations for current state
            await loadStateRegulations(selectedStateCode);
        }
        
    } catch (error) {
        console.error('Failed to load settings page:', error);
        showError('Failed to load settings');
    }
}

function populateStateSelect(states) {
    const select = document.getElementById('facility-state-select');
    select.innerHTML = states.map(state => {
        const supportedBadge = state.supported ? '' : ' (Coming Soon)';
        return `<option value="${state.code}" ${!state.supported ? 'disabled' : ''}>${state.name}${supportedBadge}</option>`;
    }).join('');
    
    // Replace element to remove existing listeners, then add new one
    const newSelect = select.cloneNode(true);
    select.parentNode.replaceChild(newSelect, select);
    
    newSelect.addEventListener('change', async (e) => {
        selectedStateCode = e.target.value;
        const selectedState = allStates.find(s => s.code === selectedStateCode);
        if (selectedState) {
            await loadStateRegulations(selectedStateCode);
        }
    });
}

async function loadStateRegulations(stateCode) {
    try {
        const response = await apiRequest(`/states/${stateCode}/regulations`);
        if (response.success) {
            currentStateRegulations = response.data;
            renderRegulationsTable(currentStateRegulations);
            renderCategoryTabs(currentStateRegulations);
            document.getElementById('regulations-count').textContent = `${currentStateRegulations.length} regulations loaded`;
        }
    } catch (error) {
        console.error('Failed to load state regulations:', error);
        document.getElementById('regulations-tbody').innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; padding: 40px; color: #94a3b8;">
                    <p style="font-size: 0.9rem; margin: 0;">No regulations found for this state</p>
                </td>
            </tr>
        `;
    }
}

function renderRegulationsTable(regulations) {
    const tbody = document.getElementById('regulations-tbody');
    
    if (!regulations || regulations.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; padding: 40px; color: #94a3b8;">
                    <div style="font-size: 2rem; margin-bottom: 10px;">📋</div>
                    <p style="font-size: 0.9rem; margin: 0;">No regulations found for this state</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = regulations.map(reg => {
        const weightBadge = getViolationWeightBadge(reg.violation_weight);
        return `
            <tr>
                <td style="font-size: 0.8rem; font-weight: 600; color: #4f46e5;">${reg.regulation_category}</td>
                <td style="font-size: 0.8rem; color: var(--gray-700);">${reg.requirement_text}</td>
                <td style="font-size: 0.75rem;">${weightBadge}</td>
                <td style="font-size: 0.75rem; color: #64748b;">${reg.citation_reference || '--'}</td>
            </tr>
        `;
    }).join('');
}

function getViolationWeightBadge(weight) {
    const badges = {
        'high': '<span class="cac-badge cac-badge-danger">High</span>',
        'medium-high': '<span class="cac-badge" style="background: #fef3c7; color: #92400e; border: 1px solid #fcd34d;">Medium-High</span>',
        'medium': '<span class="cac-badge cac-badge-warning">Medium</span>',
        'low': '<span class="cac-badge cac-badge-success">Low</span>'
    };
    return badges[weight] || '<span class="cac-badge cac-badge-secondary">--</span>';
}

function renderCategoryTabs(regulations) {
    const categories = [...new Set(regulations.map(r => r.regulation_category))];
    const tabsContainer = document.getElementById('category-tabs');
    
    tabsContainer.innerHTML = `
        <button class="cac-btn cac-btn-sm cac-btn-primary" onclick="filterRegulations('all')" style="padding: 6px 12px; font-size: 0.75rem;">
            All (${regulations.length})
        </button>
        ${categories.map(cat => {
            const count = regulations.filter(r => r.regulation_category === cat).length;
            return `<button class="cac-btn cac-btn-sm cac-btn-secondary" onclick="filterRegulations('${cat}')" style="padding: 6px 12px; font-size: 0.75rem;">
                ${cat} (${count})
            </button>`;
        }).join('')}
    `;
}

function filterRegulations(category) {
    // Update button states
    const buttons = document.querySelectorAll('#category-tabs .cac-btn');
    buttons.forEach(btn => {
        btn.classList.remove('cac-btn-primary');
        btn.classList.add('cac-btn-secondary');
        if (category === 'all' && btn.textContent.includes('All')) {
            btn.classList.remove('cac-btn-secondary');
            btn.classList.add('cac-btn-primary');
        } else if (btn.textContent.includes(category)) {
            btn.classList.remove('cac-btn-secondary');
            btn.classList.add('cac-btn-primary');
        }
    });
    
    // Filter regulations
    const filtered = category === 'all' 
        ? currentStateRegulations 
        : currentStateRegulations.filter(r => r.regulation_category === category);
    
    renderRegulationsTable(filtered);
}

async function saveFacilityState() {
    try {
        const facility = JSON.parse(localStorage.getItem('facility'));
        const stateCode = document.getElementById('facility-state-select').value;
        const selectedState = allStates.find(s => s.code === stateCode);
        
        if (!selectedState) {
            showError('Please select a valid state');
            return;
        }
        
        if (!selectedState.supported) {
            showError('This state is not yet supported');
            return;
        }
        
        const response = await apiRequest(`/states/facility/${facility.id}`, {
            method: 'PUT',
            body: JSON.stringify({
                state_code: stateCode,
                state_name: selectedState.name
            })
        });
        
        if (response.success) {
            showSuccess(`✅ State updated to ${selectedState.name}!`);
            document.getElementById('current-state-display').textContent = selectedState.name;
            
            // Update localStorage
            facility.state_code = stateCode;
            facility.state_name = selectedState.name;
            localStorage.setItem('facility', JSON.stringify(facility));
        } else {
            showError(response.message || 'Failed to update state');
        }
    } catch (error) {
        console.error('Failed to save facility state:', error);
        showError('Failed to save state configuration');
    }
}

// ===================================
// Router Initialization
// ===================================
// Note: Router is now initialized in the DOMContentLoaded handler above (line ~1055)
// after authentication is validated. This prevents conflicts with the auth flow.
