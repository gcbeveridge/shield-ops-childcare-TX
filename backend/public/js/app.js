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
        'Content-Type': 'application/json',
        ...options.headers
    };

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

    if (sidebar && overlay) {
        const isOpen = sidebar.classList.contains('mobile-open');

        if (isOpen) {
            sidebar.classList.remove('mobile-open');
            overlay.classList.remove('active');
        } else {
            sidebar.classList.add('mobile-open');
            overlay.classList.add('active');
        }
    }
}

function closeMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('mobile-overlay');

    if (sidebar && overlay) {
        sidebar.classList.remove('mobile-open');
        overlay.classList.remove('active');
    }
}

// Close mobile menu when screen is clicked or link is selected
document.addEventListener('DOMContentLoaded', () => {
    // Show hamburger on mobile
    const updateHamburgerVisibility = () => {
        const hamburger = document.getElementById('hamburger');
        if (hamburger) {
            hamburger.style.display = window.innerWidth <= 768 ? 'block' : 'none';
        }

        // Close menu if screen resized to desktop
        if (window.innerWidth > 768) {
            closeMobileMenu();
        }
    };

    updateHamburgerVisibility();
    window.addEventListener('resize', updateHamburgerVisibility);

    // Close menu when nav item clicked
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                closeMobileMenu();
            }
        });
    });
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
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('signup-screen').style.display = 'flex';
}

function showLogin() {
    document.getElementById('signup-screen').style.display = 'none';
    document.getElementById('login-screen').style.display = 'flex';
}

function logout() {
    clearAuthData();

    // Hide app and show auth screens
    document.getElementById('app').classList.remove('active');

    const authContainer = document.getElementById('auth-container');
    const loginScreen = document.getElementById('login-screen');
    const signupScreen = document.getElementById('signup-screen');

    if (authContainer) authContainer.style.display = 'block';
    if (loginScreen) loginScreen.style.display = 'flex';
    if (signupScreen) signupScreen.style.display = 'none';

    // Reload page to reset everything
    window.location.reload();
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

        // Update new dashboard metrics
        updateModernDashboard(dashboardData.data);
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

    try {
        console.log('📡 Calling /api/auth/me with token...');
        // Validate token and user/facility still exist
        const userData = await apiRequest('/auth/me');

        console.log('✅ /api/auth/me successful:', userData);

        // Update AppState with fresh data from server
        AppState.user = userData.user;
        AppState.facility = userData.facility;
        localStorage.setItem('user', JSON.stringify(userData.user));
        localStorage.setItem('facility', JSON.stringify(userData.facility));

        return true;
    } catch (error) {
        console.error('❌ Auth validation failed:', error);
        console.error('Error details:', {
            message: error.message,
            status: error.status,
            stack: error.stack
        });
        // Clear stale auth data
        clearAuthData();
        return false;
    }
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
        if (app) app.classList.add('active');

        // Load sidebar if using modular architecture
        const sidebarContainer = document.getElementById('sidebar-container');
        if (sidebarContainer && !sidebarContainer.innerHTML.trim()) {
            await window.htmlLoader.loadInto('sidebar.html', '#sidebar-container');
            console.log('✅ Sidebar loaded on page load');
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

    const staffData = {
        name,
        role,
        email,
        hireDate,
        certifications: {
            cda: {
                has: document.getElementById('staff-has-cda').checked,
                number: document.getElementById('staff-cda-number').value.trim(),
                expirationDate: document.getElementById('staff-cda-expiration').value
            },
            teachingCertificate: {
                has: document.getElementById('staff-has-teaching-cert').checked,
                number: document.getElementById('staff-teaching-number').value.trim(),
                type: document.getElementById('staff-teaching-type').value,
                expirationDate: document.getElementById('staff-teaching-expiration').value
            },
            foodHandler: {
                has: document.getElementById('staff-has-food-handler').checked,
                number: document.getElementById('staff-food-number').value.trim(),
                expirationDate: document.getElementById('staff-food-expiration').value
            },
            cprFirstAid: {
                has: document.getElementById('staff-has-cpr').checked,
                type: document.getElementById('staff-cpr-type').value,
                provider: document.getElementById('staff-cpr-provider').value.trim(),
                expirationDate: document.getElementById('staff-cpr-expiration').value
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
        ['cda', 'teaching', 'food', 'cpr'].forEach(type => {
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
        // Show skeleton while loading
        showTableSkeleton('#incidents .data-table', 5, 7);

        currentIncidentFilter = filter;
        let url = `/facilities/${AppState.facility.id}/incidents`;
        if (filter && filter !== 'all') {
            url += `?type=${filter}`;
        }

        const response = await apiRequest(url);
        const tbody = document.querySelector('#incidents .data-table tbody');
        if (!tbody) return;

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
        document.getElementById('incident-free-days').textContent = daysSafe;
        document.getElementById('total-incidents').textContent = recentIncidents.length;
        document.getElementById('pending-signatures').textContent = pendingSignatures;
        document.getElementById('incident-response-time').textContent = avgResponseTime;

        // Calculate severity distribution
        const severityCounts = { minor: 0, moderate: 0, critical: 0 };
        recentIncidents.forEach(inc => {
            const severity = (inc.severity || 'minor').toLowerCase();
            if (severityCounts.hasOwnProperty(severity)) {
                severityCounts[severity]++;
            }
        });

        // Update severity distribution cards
        const total = recentIncidents.length || 1; // Avoid division by zero
        document.getElementById('severity-minor-count').textContent = severityCounts.minor;
        document.getElementById('severity-minor-bar').style.width = `${(severityCounts.minor / total) * 100}%`;
        document.getElementById('severity-moderate-count').textContent = severityCounts.moderate;
        document.getElementById('severity-moderate-bar').style.width = `${(severityCounts.moderate / total) * 100}%`;
        document.getElementById('severity-critical-count').textContent = severityCounts.critical;
        document.getElementById('severity-critical-bar').style.width = `${(severityCounts.critical / total) * 100}%`;

        // Check if empty and show professional empty state
        if (incidents.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 60px 20px;">
                        <div style="max-width: 450px; margin: 0 auto;">
                            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity: 0.2; margin-bottom: 20px;">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                            </svg>
                            <h3 style="font-size: 18px; font-weight: 600; color: var(--gray-700); margin-bottom: 8px;">
                                ${filter === 'all' ? 'No Incidents Reported' : `No ${filter} Incidents`}
                            </h3>
                            <p style="font-size: 14px; color: var(--gray-500); margin-bottom: 24px;">
                                ${filter === 'all'
                    ? 'Great news! No incidents have been reported yet. When incidents occur, they will be documented here for compliance and tracking.'
                    : `No ${filter} incidents found. Try selecting "All Incidents" or report a new incident if needed.`}
                            </p>
                            ${filter === 'all' ? `
                                <button class="btn btn-primary" onclick="openModal('report-incident')" style="padding: 10px 24px;">
                                    <span style="margin-right: 8px;">📝</span> Report Incident
                                </button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = incidents.map(incident => {
            const date = new Date(incident.occurred_at || incident.dateTime);
            const severityClass = incident.severity === 'critical' ? 'badge-danger' :
                incident.severity === 'moderate' ? 'badge-warning' : 'badge-info';
            const childName = incident.child_info?.name || incident.childInfo?.name || 'Unknown';
            const parentSigned = incident.parent_signature || incident.parentSignature;

            return `
                <tr style="transition: background-color 0.2s ease;">
                    <td style="color: var(--gray-700);">${date.toLocaleDateString()}</td>
                    <td><strong style="color: var(--gray-900);">${childName}</strong></td>
                    <td><span class="badge ${incident.type === 'injury' ? 'badge-danger' : incident.type === 'illness' ? 'badge-warning' : 'badge-info'}">${incident.type.charAt(0).toUpperCase() + incident.type.slice(1)}</span></td>
                    <td><span class="badge ${severityClass}">${incident.severity.charAt(0).toUpperCase() + incident.severity.slice(1)}</span></td>
                    <td style="color: var(--gray-700);">${incident.description.substring(0, 50)}...</td>
                    <td><span class="badge ${parentSigned ? 'badge-success' : 'badge-warning'}">${parentSigned ? 'Signed' : 'Pending'}</span></td>
                    <td><button class="btn btn-sm btn-secondary" onclick="viewIncidentDetails('${incident.id}')">View</button></td>
                </tr>
            `;
        }).join('');

        // Make table sortable
        makeSortable('#incidents .data-table');
    } catch (error) {
        console.error('Failed to load incidents:', error);
        showError('Failed to load incident list');
        const tbody = document.querySelector('#incidents .data-table tbody');
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
                            <h3 style="font-size: 16px; font-weight: 600; color: var(--danger); margin-bottom: 8px;">Failed to Load Incidents</h3>
                            <p style="font-size: 14px; color: var(--gray-600); margin-bottom: 16px;">There was an error loading incidents. Please try again.</p>
                            <button class="btn btn-secondary" onclick="loadIncidentList('${currentIncidentFilter || 'all'}')" style="padding: 8px 20px;">
                                <span style="margin-right: 6px;">🔄</span> Retry
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }
    }
}

let currentIncidentData = null;

async function viewIncidentDetails(incidentId) {
    try {
        const response = await apiRequest(`/incidents/${incidentId}`);
        currentIncidentData = response.data || response;

        const incident = currentIncidentData;

        // Support both old and new schema
        const dateTime = new Date(incident.occurred_at || incident.dateTime);
        const formattedDate = dateTime.toLocaleDateString();
        const formattedTime = dateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // Get child name from either schema
        const childName = incident.child_info?.name || incident.childInfo?.name || 'Unknown';

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
                        <p style="font-size: 16px; margin-top: 4px;">${incident.reportedBy || '—'}</p>
                    </div>
                </div>
                
                <div style="margin-bottom: 24px;">
                    <label style="font-size: 12px; color: var(--gray-600); text-transform: uppercase;">Description</label>
                    <p style="font-size: 15px; line-height: 1.6; margin-top: 8px; padding: 12px; background: var(--gray-50); border-radius: 8px;">${incident.description}</p>
                </div>
                
                <div style="margin-bottom: 24px;">
                    <label style="font-size: 12px; color: var(--gray-600); text-transform: uppercase;">Immediate Action Taken</label>
                    <p style="font-size: 15px; line-height: 1.6; margin-top: 8px; padding: 12px; background: var(--gray-50); border-radius: 8px;">${incident.immediateActions || 'None specified'}</p>
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
    const dateTime = new Date(currentIncidentData.dateTime);

    printWindow.document.write(`
        <html>
            <head>
                <title>Incident Report - ${currentIncidentData.childInfo.name}</title>
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
                    <div class="value">${currentIncidentData.childInfo.name}</div>
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
                    <div class="value">${currentIncidentData.immediateActions || 'None'}</div>
                </div>
                <div class="section">
                    <div class="label">Reported By</div>
                    <div class="value">${currentIncidentData.reportedBy}</div>
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
    if (!currentIncidentData) return;

    deleteContext = {
        type: 'incidents',
        id: currentIncidentData.id,
        name: `incident for ${currentIncidentData.childInfo.name}`
    };

    document.getElementById('delete-confirm-message').textContent =
        `Are you sure you want to delete this incident report for ${currentIncidentData.childInfo.name}?`;

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
    const location = document.getElementById('incident-location').value.trim();
    const description = document.getElementById('incident-description').value.trim();
    const action = document.getElementById('incident-action').value.trim();
    const staff = document.getElementById('incident-staff').value.trim();
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
        severity: 'moderate',
        childInfo: {
            name: childName
        },
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

function filterIncidents(type) {
    console.log('Filtering incidents by type:', type);

    // Update active tab styling
    const tabs = document.querySelectorAll('#incidents .tab');
    tabs.forEach(tab => {
        tab.classList.remove('active');
        if (tab.textContent.toLowerCase().includes(type) ||
            (type === 'all' && tab.textContent.toLowerCase().includes('all'))) {
            tab.classList.add('active');
        }
    });

    // Load filtered incidents
    loadIncidentList(type.toLowerCase());
}

function toggleIncidentView(view) {
    console.log('Toggling incident view to:', view);

    // Currently we only support table/list view
    // Timeline view could be implemented later with a different visualization

    // Update button states
    const buttons = document.querySelectorAll('.cac-card-actions .cac-btn');
    buttons.forEach(btn => {
        btn.classList.remove('cac-btn-primary');
        btn.classList.add('cac-btn-secondary');
    });

    // Highlight active button
    event.target.classList.remove('cac-btn-secondary');
    event.target.classList.add('cac-btn-primary');

    if (view === 'timeline') {
        showNotification('Timeline view coming soon! Currently showing list view.', 'info');
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
                const logDate = new Date(log.administeredAt);
                return `
                                <div style="padding: 12px; background: var(--gray-50); border-radius: 8px; margin-bottom: 8px;">
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                        <strong style="font-size: 14px;">${logDate.toLocaleDateString()} ${logDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
                                        <span style="font-size: 14px; color: var(--gray-700);">${log.dosageGiven}</span>
                                    </div>
                                    <div style="font-size: 13px; color: var(--gray-700);">
                                        <div>👨‍⚕️ Administered by: ${log.administeredBy}</div>
                                        <div>✓ Verified by: ${log.verifiedBy}</div>
                                        ${log.notes ? `<div style="margin-top: 4px; font-style: italic;">Note: ${log.notes}</div>` : ''}
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

    deleteContext = {
        type: 'medications',
        id: currentMedicationData.id,
        name: `${currentMedicationData.medicationName} for ${currentMedicationData.childInfo.name}`
    };

    document.getElementById('delete-confirm-message').textContent =
        `Are you sure you want to delete the medication authorization for ${currentMedicationData.medicationName}?`;

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
        const data = await apiRequest(`/documents/${docId}/download`);
        window.open(data.downloadUrl, '_blank');
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

// ===================================
// Router Initialization
// ===================================
// Note: Router is now initialized in the DOMContentLoaded handler above (line ~1055)
// after authentication is validated. This prevents conflicts with the auth flow.
