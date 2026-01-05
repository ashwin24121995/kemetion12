// KEMETION Fantasy Cricket - Main JavaScript

// ===== MOBILE MENU TOGGLE =====
document.addEventListener('DOMContentLoaded', function() {
  const hamburger = document.querySelector('.hamburger');
  const nav = document.querySelector('nav');

  if (hamburger) {
    hamburger.addEventListener('click', function() {
      nav.classList.toggle('active');
    });

    // Close menu when a link is clicked
    const navLinks = nav.querySelectorAll('a');
    navLinks.forEach(link => {
      link.addEventListener('click', function() {
        nav.classList.remove('active');
      });
    });
  }
});

// ===== MODAL FUNCTIONALITY =====
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
  }
}

// Close modal when clicking outside
document.addEventListener('click', function(event) {
  if (event.target.classList.contains('modal')) {
    event.target.classList.remove('active');
  }
});

// ===== FORM VALIDATION =====
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePassword(password) {
  return password.length >= 6;
}

function showAlert(message, type = 'info') {
  const alertContainer = document.getElementById('alert-container');
  if (!alertContainer) {
    console.warn('Alert container not found');
    return;
  }

  const alert = document.createElement('div');
  alert.className = `alert alert-${type}`;
  alert.innerHTML = `
    <strong>${type.charAt(0).toUpperCase() + type.slice(1)}:</strong> ${message}
  `;

  alertContainer.appendChild(alert);

  // Auto-remove alert after 5 seconds
  setTimeout(() => {
    alert.remove();
  }, 5000);
}

// ===== LOCAL STORAGE HELPERS =====
function setToken(token) {
  localStorage.setItem('authToken', token);
}

function getToken() {
  return localStorage.getItem('authToken');
}

function removeToken() {
  localStorage.removeItem('authToken');
}

function isLoggedIn() {
  return !!getToken();
}

function setUserData(userData) {
  localStorage.setItem('userData', JSON.stringify(userData));
}

function getUserData() {
  const data = localStorage.getItem('userData');
  return data ? JSON.parse(data) : null;
}

// ===== API HELPERS =====
async function apiCall(endpoint, method = 'GET', data = null) {
  const options = {
    method: method,
    headers: {
      'Content-Type': 'application/json',
    }
  };

  const token = getToken();
  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  if (data && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(endpoint, options);
    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.error || 'API Error');
    }

    return responseData;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// ===== REDIRECT HELPERS =====
function redirectToLogin() {
  window.location.href = '/pages/login.html';
}

function redirectToHome() {
  window.location.href = '/index.html';
}

function redirectToProfile() {
  window.location.href = '/pages/profile.html';
}

// ===== CHECK AUTH ON PAGE LOAD =====
function checkAuthStatus() {
  const protectedPages = [
    '/pages/profile.html',
    '/pages/match.html',
    '/pages/team.html'
  ];

  const currentPage = window.location.pathname;
  const isProtected = protectedPages.some(page => currentPage.includes(page));

  if (isProtected && !isLoggedIn()) {
    redirectToLogin();
  }
}

// ===== LOGOUT FUNCTIONALITY =====
function logout() {
  removeToken();
  localStorage.removeItem('userData');
  redirectToHome();
}

// ===== UTILITY FUNCTIONS =====
function formatDate(date) {
  const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return new Date(date).toLocaleDateString('en-IN', options);
}

function formatTime(date) {
  const options = { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' };
  return new Date(date).toLocaleTimeString('en-IN', options);
}

function showLoading(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.innerHTML = '<div class="spinner"></div>';
  }
}

function hideLoading(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.innerHTML = '';
  }
}

// ===== INITIALIZE ON PAGE LOAD =====
document.addEventListener('DOMContentLoaded', function() {
  checkAuthStatus();
  
  // Update header based on login status
  updateHeaderButtons();
});

function updateHeaderButtons() {
  const navButtons = document.querySelector('.nav-buttons');
  if (!navButtons) return;

  if (isLoggedIn()) {
    const userData = getUserData();
    navButtons.innerHTML = `
      <span style="color: white;">Welcome, ${userData?.username || 'User'}</span>
      <button onclick="logout()" class="btn btn-small" style="background: var(--error-red); color: white;">Logout</button>
    `;
  } else {
    navButtons.innerHTML = `
      <a href="/pages/login.html" class="btn-login">Login</a>
      <a href="/pages/signup.html" class="btn-signup">Sign Up</a>
    `;
  }
}
