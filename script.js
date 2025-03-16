// Modal functionality
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function switchModal(fromModalId, toModalId) {
    closeModal(fromModalId);
    openModal(toModalId);
}

// Handle form submissions
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Store user data
            localStorage.setItem('token', data.token);
            localStorage.setItem('userId', data.user_id);
            localStorage.setItem('userName', data.name);
            
            // Close login modal
            closeModal('loginModal');
            
            // Redirect to dashboard overview
            window.location.href = '/dashboard.html';
            
            // This ensures the overview tab is shown after page load
            localStorage.setItem('activeSection', 'overview');
        } else {
            alert(data.message || 'Login failed. Please check your credentials.');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('An error occurred during login. Please try again.');
    }
}

async function handleSignup(event) {
    event.preventDefault();
    
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;

    try {
        const response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Account created successfully! Please login.');
            switchModal('signupModal', 'loginModal');
        } else {
            alert(data.message || 'Signup failed. Please try again.');
        }
    } catch (error) {
        console.error('Signup error:', error);
        alert('An error occurred during signup. Please try again.');
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}

// Mobile menu toggle
function toggleMobileMenu() {
    const navLinks = document.querySelector('.nav-links');
    const menuToggle = document.querySelector('.menu-toggle');
    
    navLinks.classList.toggle('active');
    menuToggle.classList.toggle('active');
    
    // Update icon
    const icon = menuToggle.querySelector('i');
    if (navLinks.classList.contains('active')) {
        icon.classList.remove('fa-bars');
        icon.classList.add('fa-times');
    } else {
        icon.classList.remove('fa-times');
        icon.classList.add('fa-bars');
    }
}

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    const navLinks = document.querySelector('.nav-links');
    const menuToggle = document.querySelector('.menu-toggle');
    
    if (navLinks?.classList.contains('active') && 
        !e.target.closest('.nav-links') && 
        !e.target.closest('.menu-toggle')) {
        navLinks.classList.remove('active');
        menuToggle.classList.remove('active');
        
        // Reset icon
        const icon = menuToggle.querySelector('i');
        icon.classList.remove('fa-times');
        icon.classList.add('fa-bars');
    }
});

// Close mobile menu after clicking a link
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        const navLinks = document.querySelector('.nav-links');
        const menuToggle = document.querySelector('.menu-toggle');
        
        if (window.innerWidth <= 768) {
            navLinks.classList.remove('active');
            menuToggle.classList.remove('active');
            
            // Reset icon
            const icon = menuToggle.querySelector('i');
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    });
});

// Update active nav link based on current section
function updateActiveNavLink(sectionId) {
    document.querySelectorAll('.nav-links .nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
        }
    });
}

// Modified showSection function to update nav link
function showSection(sectionId) {
    // Remove active class from all sections
    document.querySelectorAll('.dashboard-section').forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none';
    });

    // Add active class to selected section
    const selectedSection = document.getElementById(sectionId);
    if (selectedSection) {
        selectedSection.classList.add('active');
        selectedSection.style.display = 'block';
        
        // Update active nav link
        updateActiveNavLink(sectionId);
        
        // Store active section
        localStorage.setItem('activeSection', sectionId);
    }
}

// Authentication and API handling
const API_URL = 'http://localhost:5000/api';

// Store the auth token
let authToken = localStorage.getItem('token');

// Authentication Functions
async function handleLogout() {
    localStorage.removeItem('token');
    window.location.href = 'index.html';
}

// Dashboard Functions
async function loadDashboard() {
    if (!authToken) {
        window.location.href = 'index.html';
        return;
    }

    // Load user profile
    await loadUserProfile();
    // Load user videos
    await loadUserVideos();
}

async function loadUserProfile() {
    try {
        const response = await fetch(`${API_URL}/user/profile`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const profile = await response.json();
            document.getElementById('profileName').value = profile.name;
            document.getElementById('profileEmail').value = profile.email;
            document.getElementById('profileBio').value = profile.bio || '';
            if (profile.profile_picture) {
                document.getElementById('profilePic').src = profile.profile_picture;
            }
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

async function updateProfile(event) {
    event.preventDefault();
    
    const name = document.getElementById('profileName').value;
    const bio = document.getElementById('profileBio').value;
    const notifications = Array.from(document.querySelectorAll('.notification-preferences input[type="checkbox"]'))
        .map(checkbox => ({ name: checkbox.nextSibling.textContent.trim(), enabled: checkbox.checked }));

    try {
        const response = await fetch(`${API_URL}/user/profile`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, bio, notifications })
        });

        if (response.ok) {
            alert('Profile updated successfully');
            document.getElementById('userName').textContent = name;
        } else {
            const data = await response.json();
            alert(data.message || 'Failed to update profile');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
    }
}

async function handleVideoUpload(event) {
    const file = event.target.files[0];
    if (file) {
        // Create a preview
        const video = document.createElement('video');
        video.src = URL.createObjectURL(file);
        video.controls = true;
        document.getElementById('videoPreview').innerHTML = '';
        document.getElementById('videoPreview').appendChild(video);
        
        // Show upload options
        document.getElementById('uploadOptions').style.display = 'block';
    }
}

async function submitVideoUpload(event) {
    event.preventDefault();
    const file = document.getElementById('videoFile').files[0];
    const title = document.getElementById('videoTitle').value;
    const targetLanguage = document.getElementById('targetLanguage').value;
    const voiceGender = document.getElementById('voiceGender').value;

    if (!file || !title || !targetLanguage || !voiceGender) {
        alert('Please fill all required fields');
        return;
    }

    const formData = new FormData();
    formData.append('video', file);
    formData.append('title', title);
    formData.append('target_language', targetLanguage);
    formData.append('voice_gender', voiceGender);

    try {
        const response = await fetch(`${API_URL}/videos/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            body: formData
        });

        if (response.ok) {
            alert('Video uploaded successfully');
            document.getElementById('uploadForm').reset();
            document.getElementById('videoPreview').innerHTML = '';
            document.getElementById('uploadOptions').style.display = 'none';
            await loadUserVideos();
        } else {
            const data = await response.json();
            alert(data.message || 'Upload failed');
        }
    } catch (error) {
        console.error('Error uploading video:', error);
    }
}

async function loadUserVideos() {
    try {
        const response = await fetch(`${API_URL}/videos`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const videos = await response.json();
            const uploadsList = document.querySelector('.uploads-list');
            
            if (videos.length === 0) {
                uploadsList.innerHTML = '<p class="no-uploads">No videos uploaded yet</p>';
                return;
            }

            uploadsList.innerHTML = videos.map(video => `
                <div class="video-item">
                    <div class="video-info">
                        <h4>${video.title}</h4>
                        <p>Language: ${video.target_language}</p>
                        <p>Status: <span class="status ${video.status}">${video.status}</span></p>
                        <p>Uploaded: ${new Date(video.created_at).toLocaleDateString()}</p>
                    </div>
                    <div class="video-actions">
                        <button onclick="downloadVideo(${video.id})" ${video.status !== 'completed' ? 'disabled' : ''}>
                            <i class="fas fa-download"></i> Download
                        </button>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading videos:', error);
    }
}

// Video filtering functionality
function filterVideos() {
    const searchQuery = document.getElementById('videoSearch').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const videosGrid = document.getElementById('videosGrid');
    const noVideos = document.getElementById('noVideos');
    const videoCards = videosGrid.getElementsByClassName('video-card');
    
    let visibleCount = 0;

    for (const card of videoCards) {
        const title = card.querySelector('.video-title').textContent.toLowerCase();
        const status = card.querySelector('.video-status').textContent.toLowerCase();
        
        const matchesSearch = title.includes(searchQuery);
        const matchesStatus = statusFilter === 'all' || status === statusFilter.toLowerCase();
        
        if (matchesSearch && matchesStatus) {
            card.style.display = 'block';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    }

    // Show/hide empty state
    if (videoCards.length === 0 || visibleCount === 0) {
        noVideos.style.display = 'block';
    } else {
        noVideos.style.display = 'none';
    }
}

// Function to create a video card
function createVideoCard(video) {
    const card = document.createElement('div');
    card.className = 'video-card';
    
    card.innerHTML = `
        <div class="video-thumbnail">
            <img src="${video.thumbnail || 'https://via.placeholder.com/300x169'}" alt="Video Thumbnail">
            <span class="video-status">${video.status}</span>
        </div>
        <div class="video-info">
            <h3 class="video-title">${video.title}</h3>
            <div class="video-meta">
                <div class="video-languages">
                    <i class="fas fa-language"></i>
                    <span>${video.sourceLanguage} → ${video.targetLanguage}</span>
                </div>
                <div class="video-date">
                    <i class="far fa-clock"></i>
                    <span>${formatTimeAgo(video.uploadDate)}</span>
                </div>
            </div>
            <div class="video-actions">
                <button class="video-action-btn btn-preview" onclick="previewVideo('${video.id}')">
                    <i class="fas fa-play"></i>
                    Preview
                </button>
                <button class="video-action-btn btn-download" onclick="downloadVideo('${video.id}')" ${video.status !== 'completed' ? 'disabled' : ''}>
                    <i class="fas fa-download"></i>
                    Download
                </button>
            </div>
        </div>
    `;
    
    return card;
}

// Helper function to format time ago
function formatTimeAgo(date) {
    const now = new Date();
    const diff = now - new Date(date);
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
}

// Function to show different sections
function showSection(sectionId) {
    document.querySelectorAll('.dashboard-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
    
    // Update navigation active state
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector(`[onclick="showSection('${sectionId}')"]`).classList.add('active');
}

// Function to handle successful login
function handleLoginSuccess(response) {
    localStorage.setItem('token', response.token);
    localStorage.setItem('userId', response.user_id);
    localStorage.setItem('userName', response.name);
    closeModal('loginModal');
    window.location.href = '/dashboard.html#overview';
}

// Function to show different sections in dashboard
function showSection(sectionId) {
    // Remove active class from all sections and nav links
    document.querySelectorAll('.dashboard-section').forEach(section => {
        section.classList.remove('active');
    });
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.classList.remove('active');
    });

    // Add active class to selected section and nav link
    document.getElementById(sectionId).classList.add('active');
    document.querySelector(`.nav-links a[onclick="showSection('${sectionId}')"]`).classList.add('active');

    // Update URL hash
    window.location.hash = sectionId;
}

// Function to handle page load and hash changes
function handleDashboardNavigation() {
    if (window.location.pathname === '/dashboard.html') {
        const hash = window.location.hash.slice(1) || 'overview';
        showSection(hash);
    }
}

// Add event listeners for dashboard navigation
document.addEventListener('DOMContentLoaded', () => {
    handleDashboardNavigation();
    window.addEventListener('hashchange', handleDashboardNavigation);
});

// Handle form submission
document.getElementById('uploadForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    try {
        const response = await fetch('/api/videos/upload', {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            const result = await response.json();
            showSection('videos');
            // Refresh videos list
            loadVideos();
        } else {
            throw new Error('Upload failed');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to upload video. Please try again.');
    }
});

// Load videos on page load
async function loadVideos() {
    try {
        const response = await fetch('/api/videos');
        if (response.ok) {
            const videos = await response.json();
            const videosGrid = document.getElementById('videosGrid');
            videosGrid.innerHTML = '';
            
            if (videos.length === 0) {
                document.getElementById('noVideos').style.display = 'block';
            } else {
                document.getElementById('noVideos').style.display = 'none';
                videos.forEach(video => {
                    videosGrid.appendChild(createVideoCard(video));
                });
            }
        }
    } catch (error) {
        console.error('Error loading videos:', error);
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadVideos();
    // Show videos section by default
    showSection('videos');
});

// Logout functionality
function logout() {
    // Clear token
    localStorage.removeItem('token');
    // Redirect to home page
    window.location.href = '/';
}

// Utility Functions
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Section Navigation
function showSection(sectionId) {
    document.querySelectorAll('.dashboard-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
    
    // Update navigation active state
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector(`[onclick="showSection('${sectionId}')"]`).classList.add('active');
}

// Check Authentication Status
function checkAuth() {
    const isLoggedIn = localStorage.getItem('token');
    if (!isLoggedIn && !window.location.href.includes('index.html')) {
        window.location.href = 'index.html';
    }
}

// Initialize dashboard if on dashboard page
if (window.location.pathname.includes('dashboard.html')) {
    document.addEventListener('DOMContentLoaded', loadDashboard);
} else {
    document.addEventListener('DOMContentLoaded', checkAuth);
}

// Function to handle login
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Store user data
            localStorage.setItem('token', data.token);
            localStorage.setItem('userId', data.user_id);
            localStorage.setItem('userName', data.name);
            localStorage.setItem('activeSection', 'overview'); // Set active section before redirect
            
            // Close login modal and redirect
            closeModal('loginModal');
            window.location.href = '/dashboard.html';
        } else {
            alert(data.message || 'Login failed. Please check your credentials.');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('An error occurred during login. Please try again.');
    }
}

// Function to initialize dashboard
function initDashboard() {
    const activeSection = localStorage.getItem('activeSection') || 'overview';
    showSection(activeSection);
    
    // Set user name if available
    const userName = localStorage.getItem('userName');
    if (userName) {
        const userNameElement = document.getElementById('userName');
        if (userNameElement) {
            userNameElement.textContent = userName;
        }
    }
}

// Function to show different sections in dashboard
function showSection(sectionId) {
    // Remove active class from all sections and nav links
    document.querySelectorAll('.dashboard-section').forEach(section => {
        section.classList.remove('active');
    });
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.classList.remove('active');
    });

    // Add active class to selected section and nav link
    document.getElementById(sectionId).classList.add('active');
    document.querySelector(`.nav-links a[onclick="showSection('${sectionId}')"]`).classList.add('active');

    // Update URL hash
    window.location.hash = sectionId;
}

// Initialize dashboard when the page loads
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname === '/dashboard.html') {
        initDashboard();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on the dashboard page
    if (window.location.pathname.includes('dashboard.html')) {
        // Initialize dashboard
        const activeSection = localStorage.getItem('activeSection') || 'overview';
        showSection(activeSection);
        
        // Set user name if available
        const userName = localStorage.getItem('userName');
        if (userName) {
            const userNameElement = document.getElementById('userName');
            if (userNameElement) {
                userNameElement.textContent = userName;
            }
        }

        // Add event listeners for navigation
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.target.getAttribute('onclick').match(/'(.*?)'/)[1];
                showSection(section);
            });
        });

        // Load initial data
        loadDashboardData();
    }
});

// Function to show different sections
function showSection(sectionId) {
    // Remove active class from all sections and nav links
    document.querySelectorAll('.dashboard-section').forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none';
    });
    
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.classList.remove('active');
    });

    // Add active class to selected section and nav link
    const selectedSection = document.getElementById(sectionId);
    const selectedLink = document.querySelector(`.nav-links a[onclick="showSection('${sectionId}')"]`);
    
    if (selectedSection && selectedLink) {
        selectedSection.classList.add('active');
        selectedSection.style.display = 'block';
        selectedLink.classList.add('active');
        localStorage.setItem('activeSection', sectionId);
    }
}

// Handle login form submission
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Store user data
            localStorage.setItem('token', data.token);
            localStorage.setItem('userId', data.user_id);
            localStorage.setItem('userName', data.name);
            localStorage.setItem('activeSection', 'overview'); // Set active section before redirect
            
            // Close login modal and redirect
            closeModal('loginModal');
            window.location.href = '/dashboard.html';
        } else {
            alert(data.message || 'Login failed. Please check your credentials.');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('An error occurred during login. Please try again.');
    }
});

// Function to load dashboard data
async function loadDashboardData() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        // Load user profile
        const profileResponse = await fetch('/api/user/profile', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            document.getElementById('userName').textContent = profileData.name;
        }

        // Load video statistics
        const statsResponse = await fetch('/api/videos/stats', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (statsResponse.ok) {
            const statsData = await statsResponse.json();
            document.getElementById('dubbedCount').textContent = statsData.dubbed || 0;
            document.getElementById('processingCount').textContent = statsData.processing || 0;
            document.getElementById('languageCount').textContent = statsData.languages || 0;
            document.getElementById('hoursSaved').textContent = statsData.hoursSaved || 0;
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// Check authentication status on page load
function checkAuthStatus() {
    const token = localStorage.getItem('token');
    const userName = localStorage.getItem('userName');
    
    if (token) {
        // Update UI for logged-in state
        updateUIForLoggedInUser(userName);
        return true;
    } else {
        // Update UI for logged-out state
        updateUIForLoggedOutUser();
        return false;
    }
}

// Update UI for logged-in user
function updateUIForLoggedInUser(userName) {
    // Hide login/signup buttons
    document.querySelectorAll('.auth-btn').forEach(btn => {
        btn.style.display = 'none';
    });

    // Show user menu
    const userMenu = document.createElement('div');
    userMenu.className = 'user-menu';
    userMenu.innerHTML = `
        <span class="user-name">
            <i class="fas fa-user-circle"></i>
            ${userName || 'User'}
        </span>
        <div class="user-dropdown">
            <a href="/dashboard.html">
                <i class="fas fa-tachometer-alt"></i>
                Dashboard
            </a>
            <button onclick="handleLogout()">
                <i class="fas fa-sign-out-alt"></i>
                Logout
            </button>
        </div>
    `;

    // Add user menu to navigation
    const navLinks = document.querySelector('.nav-links');
    if (navLinks) {
        navLinks.appendChild(userMenu);
    }
}

// Update UI for logged-out user
function updateUIForLoggedOutUser() {
    // Show login/signup buttons
    document.querySelectorAll('.auth-btn').forEach(btn => {
        btn.style.display = 'inline-block';
    });

    // Remove user menu if exists
    const userMenu = document.querySelector('.user-menu');
    if (userMenu) {
        userMenu.remove();
    }
}

// Handle logout
function handleLogout() {
    // Clear local storage
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('activeSection');
    
    // Redirect to home page
    window.location.href = '/';
}

// Add authentication check on page load
document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
});

// Intercept API calls to handle authentication
async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem('token');
    
    if (token) {
        options.headers = {
            ...options.headers,
            'Authorization': `Bearer ${token}`
        };
    }
    
    try {
        const response = await fetch(url, options);
        
        // If we get a 401 (Unauthorized), clear token and redirect to login
        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('userId');
            localStorage.removeItem('userName');
            localStorage.removeItem('activeSection');
            
            // Only redirect if not already on home page
            if (!window.location.pathname.endsWith('/')) {
                window.location.href = '/';
            }
            return null;
        }
        
        return response;
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}

// Add styles for user menu
const style = document.createElement('style');
style.textContent = `
    .user-menu {
        position: relative;
        display: flex;
        align-items: center;
        margin-left: 1rem;
    }

    .user-name {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease;
    }

    .user-name:hover {
        background: rgba(74, 144, 226, 0.1);
    }

    .user-dropdown {
        position: absolute;
        top: 100%;
        right: 0;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        padding: 0.5rem;
        min-width: 200px;
        display: none;
        z-index: 1000;
    }

    .user-menu:hover .user-dropdown {
        display: block;
    }

    .user-dropdown a,
    .user-dropdown button {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1rem;
        width: 100%;
        text-align: left;
        border: none;
        background: none;
        color: var(--text-color);
        font-size: 1rem;
        text-decoration: none;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.3s ease;
    }

    .user-dropdown a:hover,
    .user-dropdown button:hover {
        background: rgba(74, 144, 226, 0.1);
        color: var(--primary-color);
    }

    @media (max-width: 768px) {
        .user-menu {
            width: 100%;
            margin: 0.5rem 0 0;
        }

        .user-name {
            justify-content: center;
            width: 100%;
        }

        .user-dropdown {
            position: static;
            display: block;
            box-shadow: none;
            margin-top: 0.5rem;
            width: 100%;
        }
    }
`;
document.head.appendChild(style);

// Toggle mobile menu for homepage
function toggleMobileMenu() {
    const navLinks = document.querySelector('.nav-links');
    const menuToggle = document.querySelector('.menu-toggle');
    
    if (!navLinks || !menuToggle) return;
    
    navLinks.classList.toggle('active');
    menuToggle.classList.toggle('active');
    
    // Update icon
    const icon = menuToggle.querySelector('i');
    if (icon) {
        if (navLinks.classList.contains('active')) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-times');
        } else {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    }
}

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    const navLinks = document.querySelector('.nav-links');
    const menuToggle = document.querySelector('.menu-toggle');
    
    if (!navLinks || !menuToggle) return;
    
    if (navLinks.classList.contains('active') && 
        !e.target.closest('.nav-links') && 
        !e.target.closest('.menu-toggle')) {
        navLinks.classList.remove('active');
        menuToggle.classList.remove('active');
        
        // Reset icon
        const icon = menuToggle.querySelector('i');
        if (icon) {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    }
});

// Close mobile menu when resizing window
window.addEventListener('resize', () => {
    const navLinks = document.querySelector('.nav-links');
    const menuToggle = document.querySelector('.menu-toggle');
    
    if (!navLinks || !menuToggle) return;
    
    if (window.innerWidth > 768 && navLinks.classList.contains('active')) {
        navLinks.classList.remove('active');
        menuToggle.classList.remove('active');
        
        // Reset icon
        const icon = menuToggle.querySelector('i');
        if (icon) {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    }
});

// Close mobile menu after clicking a link
document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('.nav-links a');
    
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            const navLinksContainer = document.querySelector('.nav-links');
            const menuToggle = document.querySelector('.menu-toggle');
            
            if (!navLinksContainer || !menuToggle) return;
            
            if (window.innerWidth <= 768) {
                navLinksContainer.classList.remove('active');
                menuToggle.classList.remove('active');
                
                // Reset icon
                const icon = menuToggle.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            }
        });
    });
});

// Filter videos by type
function filterVideos(type) {
    // Update active filter button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.toLowerCase() === type) {
            btn.classList.add('active');
        }
    });

    // Filter video cards
    const videoCards = document.querySelectorAll('.video-card');
    videoCards.forEach(card => {
        if (type === 'all' || card.dataset.type === type) {
            card.style.display = 'block';
            // Add fade-in animation
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 50);
        } else {
            card.style.display = 'none';
        }
    });
}

// Handle video actions
document.addEventListener('DOMContentLoaded', () => {
    // Play button click
    document.querySelectorAll('.play-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const videoCard = btn.closest('.video-card');
            const videoTitle = videoCard.querySelector('h3').textContent;
            alert(`Playing: ${videoTitle}`);
        });
    });

    // Edit button click
    document.querySelectorAll('.action-btn').forEach(btn => {
        if (btn.innerHTML.includes('Edit')) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const videoCard = btn.closest('.video-card');
                const videoTitle = videoCard.querySelector('h3').textContent;
                alert(`Edit video: ${videoTitle}`);
            });
        }
    });

    // Download button click
    document.querySelectorAll('.action-btn').forEach(btn => {
        if (btn.innerHTML.includes('Download')) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const videoCard = btn.closest('.video-card');
                const videoTitle = videoCard.querySelector('h3').textContent;
                alert(`Downloading: ${videoTitle}`);
            });
        }
    });

    // Delete button click
    document.querySelectorAll('.action-btn.delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const videoCard = btn.closest('.video-card');
            const videoTitle = videoCard.querySelector('h3').textContent;
            if (confirm(`Are you sure you want to delete "${videoTitle}"?`)) {
                videoCard.style.opacity = '0';
                videoCard.style.transform = 'scale(0.9)';
                setTimeout(() => {
                    videoCard.remove();
                }, 300);
            }
        });
    });
});

// Profile Management
function updateProfile(event) {
    event.preventDefault();
    
    const name = document.getElementById('profileName').value;
    const bio = document.getElementById('profileBio').value;
    const notifications = Array.from(document.querySelectorAll('.notification-preferences input[type="checkbox"]'))
        .map(checkbox => ({ name: checkbox.nextSibling.textContent.trim(), enabled: checkbox.checked }));

    // For demo, just show a success message
    showNotification('Profile updated successfully!', 'success');
}

function resetPassword() {
    if (confirm('Are you sure you want to reset your password? You will receive an email with instructions.')) {
        // For demo, just show a success message
        showNotification('Password reset instructions sent to your email!', 'success');
    }
}

function deleteAccount() {
    if (confirm('Are you absolutely sure you want to delete your account? This action cannot be undone!')) {
        if (confirm('Last chance! All your data will be permanently deleted. Continue?')) {
            // For demo, just show a success message and redirect to login
            showNotification('Account deleted successfully!', 'success');
            setTimeout(() => {
                handleLogout();
            }, 2000);
        }
    }
}

// Initialize profile data
document.addEventListener('DOMContentLoaded', () => {
    // For demo, set some sample data
    const userData = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        bio: 'Video dubbing enthusiast and content creator.',
        memberSince: 'March 2025',
        totalVideos: '5'
    };

    // Populate profile form
    document.getElementById('profileName').value = userData.name;
    document.getElementById('profileEmail').value = userData.email;
    document.getElementById('profileBio').value = userData.bio;
    document.getElementById('memberSince').textContent = userData.memberSince;
    document.getElementById('totalVideos').textContent = userData.totalVideos;

    // Handle profile picture change
    const changePicBtn = document.querySelector('.change-pic-btn');
    if (changePicBtn) {
        changePicBtn.addEventListener('click', () => {
            // For demo, just show a success message
            showNotification('Profile picture updated!', 'success');
        });
    }
});

// Notification System
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Fade in
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
