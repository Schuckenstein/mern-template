// debug-dashboard/app.js
/**
 * Debug Dashboard JavaScript
 * Separated from the main HTML file for better organization
 */

// Global state
let currentTab = 'overview';
let authToken = localStorage.getItem('debugToken');
let autoRefreshInterval;
let wsConnection;

// API Configuration
const API_BASE = 'http://localhost:5000/api';
const WS_URL = 'http://localhost:5000';

// =============================================
// Utility Functions
// =============================================

function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${days}d ${hours}h ${minutes}m`;
}

function formatBytes(bytes) {
  const sizes = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// =============================================
// API Functions
// =============================================

async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
      ...(options.headers || {})
    },
    ...options
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    return { success: response.ok, data, status: response.status };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// =============================================
// Tab Management
// =============================================

function switchTab(tabName) {
  // Hide all tab contents
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });
  
  // Remove active class from all tabs
  document.querySelectorAll('.tab').forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Show selected tab content
  document.getElementById(tabName).classList.add('active');
  
  // Add active class to selected tab
  event.target.classList.add('active');
  
  currentTab = tabName;
  
  // Load tab-specific data
  loadTabData(tabName);
}

function loadTabData(tabName) {
  switch(tabName) {
    case 'overview':
      loadOverviewData();
      break;
    case 'api-tester':
      loadApiEndpoints();
      break;
    case 'database':
      loadDatabaseInfo();
      break;
    case 'files':
      loadStorageStats();
      break;
    case 'email':
      loadEmailStats();
      break;
    case 'logs':
      refreshLogs();
      break;
    case 'performance':
      loadPerformanceData();
      break;
    case 'websocket':
      updateWebSocketStatus();
      break;
  }
}

// =============================================
// Data Loading Functions
// =============================================

async function loadOverviewData() {
  try {
    const result = await apiRequest('/debug/info');
    if (result.success) {
      const data = result.data;
      
      // Update server info
      document.getElementById('uptime').textContent = formatUptime(data.server.uptime);
      document.getElementById('environment').textContent = data.server.environment;
      document.getElementById('nodeVersion').textContent = data.server.nodeVersion;
      document.getElementById('memoryUsage').textContent = formatBytes(data.server.memoryUsage.used);
      
      // Update user stats
      document.getElementById('totalUsers').textContent = data.auth.totalUsers;
      document.getElementById('activeUsers').textContent = data.auth.activeUsers;
      document.getElementById('verifiedUsers').textContent = data.auth.verifiedUsers;
      document.getElementById('adminUsers').textContent = data.auth.adminUsers || 0;
      
      // Update performance
      document.getElementById('requestsToday').textContent = data.performance.requestCount;
      document.getElementById('avgResponseTime').textContent = `${data.performance.averageResponseTime}ms`;
      document.getElementById('errorRate').textContent = `${data.performance.errorRate}%`;
      document.getElementById('activeConnections').textContent = data.performance.activeConnections || 0;
    }
  } catch (error) {
    console.error('Failed to load overview data:', error);
  }
}

function loadApiEndpoints() {
  const endpoints = [
    { method: 'GET', path: '/auth/me', description: 'Get current user' },
    { method: 'POST', path: '/auth/login', description: 'User login' },
    { method: 'POST', path: '/auth/register', description: 'User registration' },
    { method: 'POST', path: '/auth/logout', description: 'User logout' },
    { method: 'GET', path: '/users/profile', description: 'Get user profile' },
    { method: 'PUT', path: '/users/profile', description: 'Update user profile' },
    { method: 'POST', path: '/files/upload', description: 'Upload file' },
    { method: 'GET', path: '/files', description: 'List files' },
    { method: 'DELETE', path: '/files/:id', description: 'Delete file' },
    { method: 'GET', path: '/debug/health', description: 'Health check' },
    { method: 'GET', path: '/debug/info', description: 'System info' }
  ];

  const container = document.getElementById('endpointList');
  container.innerHTML = endpoints.map(endpoint => `
    <div class="endpoint-item" onclick="selectEndpoint('${endpoint.method}', '${endpoint.path}')">
      <span class="method-badge method-${endpoint.method.toLowerCase()}">${endpoint.method}</span>
      <strong>${endpoint.path}</strong><br>
      <small>${endpoint.description}</small>
    </div>
  `).join('');
}

// Continue with other functions...
// (The rest of the functions from the original debug dashboard would go here)

// =============================================
// Initialization
// =============================================

document.addEventListener('DOMContentLoaded', async function() {
  await initDashboard();
});

async function initDashboard() {
  // Check server status
  try {
    const healthResult = await apiRequest('/debug/health');
    const serverStatus = document.getElementById('serverStatus');
    const serverStatusText = document.getElementById('serverStatusText');
    const dbStatus = document.getElementById('dbStatus');
    const dbStatusText = document.getElementById('dbStatusText');

    if (healthResult.success) {
      serverStatus.className = 'status-indicator status-online';
      serverStatusText.textContent = 'Online';
      
      if (healthResult.data.database) {
        dbStatus.className = 'status-indicator status-online';
        dbStatusText.textContent = 'Connected';
      } else {
        dbStatus.className = 'status-indicator status-error';
        dbStatusText.textContent = 'Disconnected';
      }
    } else {
      serverStatus.className = 'status-indicator status-offline';
      serverStatusText.textContent = 'Offline';
      dbStatus.className = 'status-indicator status-offline';
      dbStatusText.textContent = 'Unknown';
    }
  } catch (error) {
    document.getElementById('serverStatus').className = 'status-indicator status-offline';
    document.getElementById('serverStatusText').textContent = 'Offline';
    document.getElementById('dbStatus').className = 'status-indicator status-offline';
    document.getElementById('dbStatusText').textContent = 'Unknown';
  }

  // Load initial data
  loadTabData(currentTab);

  // Set auth token if available
  if (authToken) {
    document.getElementById('currentToken').value = authToken;
  }
}

// =============================================
