// Avatar preview
document.getElementById('avatarUpload').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            document.getElementById('avatarPreview').src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// Toggle switches functionality
document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', function() {
        const settingName = this.closest('.flex.justify-between').querySelector('label').textContent.trim();
        if (this.checked) {
            showMessage('success', `${settingName} enabled successfully`);
        } else {
            showMessage('success', `${settingName} disabled successfully`);
        }
    });
});

// Global variables
let availableCategories = [];
let selectedCategoryIds = [];

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    fetchProfileData();
    initializeBudgetSection();
    fetchConnectedDevices();
    setupEventListeners();
});

function initializeBudgetSection() {
    fetchCategories().then(() => {
        fetchBudgetSettings();
    }).catch(() => {
        fetchBudgetSettings();
    });
}

function setupEventListeners() {
    // Budget inputs real-time validation
    document.getElementById('monthly_budget').addEventListener('input', validateBudget);
    document.getElementById('monthly_saving').addEventListener('input', validateBudget);
    
    // Category search functionality
    document.getElementById('category-search').addEventListener('input', searchCategories);
    document.getElementById('clear-search').addEventListener('click', clearSearch);
    
    // Clear all categories
    document.getElementById('clear-all-btn').addEventListener('click', clearAllCategories);
}

// Fetch current profile data
function fetchProfileData() {
    fetch('/profile_user/', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': document.querySelector("[name=csrfmiddlewaretoken]").value,
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        credentials: 'same-origin'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to fetch profile data');
        }
        return response.json();
    })
    .then(data => {
        
        document.getElementById('first_name').value = data.first_name || '';
        document.getElementById('last_name').value = data.last_name || '';
        document.getElementById('email').value = data.email || '';
        document.getElementById('phone_number').value = data.phone_number || '';

        if (data.profile_image) {
            const imageUrl = data.profile_image;
            console.log('Setting avatar to:', imageUrl);
            
            // Test image load
            const img = new Image();
            img.onload = () => {
                console.log('✅ Image loaded successfully');
                document.getElementById('avatarPreview').src = imageUrl;
            };
            img.onerror = (e) => {
                console.error('❌ Failed to load image:', imageUrl, e);
                showMessage('error', 'Failed to load profile image from S3');
                // Set default avatar as fallback
                document.getElementById('avatarPreview').src = '/static/default-avatar.png';
            };
            img.src = imageUrl;
        } else {
            document.getElementById('avatarPreview').src = '/static/default-avatar.png';
        }
    })
    .catch(error => {
        console.error('Error fetching profile data:', error);
        showMessage('error', 'Failed to load profile data. Please try again.');
    });
}

// Profile form submission
document.getElementById('profileForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Updating...';
    submitBtn.disabled = true;

    const accessToken = localStorage.getItem('access_token');
    const formData = new FormData();
    formData.append('first_name', document.getElementById('first_name').value);
    formData.append('last_name', document.getElementById('last_name').value);
    formData.append('email', document.getElementById('email').value);
    formData.append('phone_number', document.getElementById('phone_number').value);

    const avatarFile = document.getElementById('avatarUpload').files[0];
    if (avatarFile) {
        formData.append('profile_image', avatarFile);
    }

    fetch('/profile_user/', {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-CSRFToken': document.querySelector("[name=csrfmiddlewaretoken]").value
        },
        credentials: 'same-origin',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => { throw err; });
        }
        return response.json();
    })
    .then(data => {
        
        if (data.profile_image) {
            let imageUrl = data.profile_image;
            
            // Handle relative paths for local development
            if (imageUrl.startsWith('/media/')) {
                imageUrl = window.location.origin + imageUrl;
            }
            
            document.getElementById('avatarPreview').src = imageUrl;
            document.getElementById('avatarUpload').value = '';
        }
        showMessage('success', 'Profile updated successfully');
    })
    .catch(error => {
        console.error('Error updating profile:', error);
        const message = error.detail || error.message || 'Failed to update profile';
        showMessage('error', message);
    })
    .finally(() => {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    });
});

// Fetch available categories from API
function fetchCategories() {
    const token = localStorage.getItem('access_token');

    return fetch('/budgets/categories/', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        }
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to fetch categories');
        return response.json();
    })
    .then(data => {
        availableCategories = data;
        renderSelectableCategories();
        return data;
    })
    .catch(error => {
        console.error('Error fetching categories:', error);
        showMessage('error', 'Failed to load categories. Please try again.');
        throw error;
    });
}

// Fetch budget settings from API
function fetchBudgetSettings() {
    const token = localStorage.getItem('access_token');

    fetch('/budget_settings/', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        }
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to fetch budget settings');
        return response.json();
    })
    .then(data => {
        console.log('Budget settings data:', data);

        // Update form fields
        if (data.monthly_budget) {
            document.getElementById('monthly_budget').value = data.monthly_budget;
        }
        if (data.monthly_saving) {
            document.getElementById('monthly_saving').value = data.monthly_saving;
        }
        if (data.budget_reset_date) {
            document.getElementById('budget_reset_date').value = data.budget_reset_date;
        }

        // Process categories
        if (data.categories && Array.isArray(data.categories)) {
            selectedCategoryIds = data.categories.map(cat => typeof cat === 'object' ? cat.id : cat);
            console.log('Selected category IDs:', selectedCategoryIds);

            // Update UI
            renderSelectableCategories();
            updateSelectedTags();
            updateSelectedCount();
            
            // Show selected tags section if categories exist
            if (selectedCategoryIds.length > 0) {
                document.getElementById('selected-tags-container').classList.remove('hidden');
            }
        }
        
        // Validate budget
        validateBudget();
    })
    .catch(error => {
        console.error('Error fetching budget settings:', error);
        showMessage('error', 'Failed to load budget settings. Please try again.');
    });
}

// Render selectable categories with search
function renderSelectableCategories(searchTerm = '') {
    const container = document.getElementById('categories-container');
    container.innerHTML = '';

    const filteredCategories = availableCategories.filter(category => 
        category.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filteredCategories.length === 0) {
        container.innerHTML = `
            <div class="col-span-1 sm:col-span-2 lg:col-span-3 text-center py-8">
                <i class="fas fa-search text-gray-400 text-2xl mb-3"></i>
                <p class="text-gray-500 dark:text-gray-400">No categories found</p>
                <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">Try a different search term</p>
            </div>
        `;
        return;
    }

    filteredCategories.forEach(category => {
        const isSelected = selectedCategoryIds.includes(category.id);
        const categoryElement = document.createElement('div');
        categoryElement.className = `cursor-pointer p-4 rounded-lg border-2 transition-all duration-200 ${
            isSelected
                ? 'bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-400 shadow-sm'
                : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-purple-300 hover:shadow'
        }`;
        categoryElement.onclick = () => toggleCategorySelection(category.id);
        categoryElement.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                    <div class="w-12 h-12 rounded-full flex items-center justify-center text-xl ${category.color}">
                        <span class="${category.text_color}">${category.icon}</span>
                    </div>
                    <div>
                        <span class="font-medium text-gray-800 dark:text-gray-200 block">${category.name}</span>
                        <span class="text-xs text-gray-500 dark:text-gray-400">Click to ${isSelected ? 'deselect' : 'select'}</span>
                    </div>
                </div>
                <div class="${isSelected ? 'text-purple-600' : 'text-gray-400'}">
                    <i class="fas ${isSelected ? 'fa-check-circle text-xl' : 'fa-plus-circle text-lg'}"></i>
                </div>
            </div>
        `;
        container.appendChild(categoryElement);
    });
}

// Toggle category selection
function toggleCategorySelection(categoryId) {
    const index = selectedCategoryIds.indexOf(categoryId);
    
    if (index > -1) {
        // Remove category
        selectedCategoryIds.splice(index, 1);
    } else {
        // Add category
        selectedCategoryIds.push(categoryId);
    }
    
    // Update UI
    renderSelectableCategories(document.getElementById('category-search').value);
    updateSelectedTags();
    updateSelectedCount();
    
    // Show/hide selected tags section
    if (selectedCategoryIds.length > 0) {
        document.getElementById('selected-tags-container').classList.remove('hidden');
    } else {
        document.getElementById('selected-tags-container').classList.add('hidden');
    }
}

// Update selected tags display
function updateSelectedTags() {
    const container = document.getElementById('selected-tags');
    container.innerHTML = '';

    if (selectedCategoryIds.length === 0) {
        container.innerHTML = '<p class="text-sm text-gray-500 dark:text-gray-400 m-auto">No categories selected yet. Click categories above to select.</p>';
        return;
    }

    selectedCategoryIds.forEach(categoryId => {
        const category = availableCategories.find(cat => cat.id === categoryId);
        if (category) {
            const tagElement = document.createElement('span');
            tagElement.className = 'inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-800 dark:from-purple-900/30 dark:to-indigo-900/30 dark:text-purple-200 border border-purple-200 dark:border-purple-800 hover:shadow-sm transition-shadow';
            tagElement.innerHTML = `
                <div class="w-6 h-6 rounded-full flex items-center justify-center mr-2 ${category.color}">
                    <span class="${category.text_color} text-sm">${category.icon}</span>
                </div>
                ${category.name}
                <button onclick="toggleCategorySelection(${categoryId})" 
                        class="ml-2 text-purple-600 hover:text-purple-800 dark:hover:text-purple-300 transition-colors"
                        title="Remove category">
                    <i class="fas fa-times"></i>
                </button>
            `;
            container.appendChild(tagElement);
        }
    });
}

// Update selected count display
function updateSelectedCount() {
    const countElement = document.getElementById('selected-count-number');
    if (countElement) {
        countElement.textContent = selectedCategoryIds.length;
    }
}

// Category search functionality
function searchCategories() {
    const searchTerm = document.getElementById('category-search').value;
    const clearSearchBtn = document.getElementById('clear-search');
    
    if (searchTerm) {
        clearSearchBtn.classList.remove('hidden');
    } else {
        clearSearchBtn.classList.add('hidden');
    }
    
    renderSelectableCategories(searchTerm);
}

function clearSearch() {
    document.getElementById('category-search').value = '';
    document.getElementById('clear-search').classList.add('hidden');
    renderSelectableCategories('');
}

function clearAllCategories() {
    if (selectedCategoryIds.length === 0) return;
    
    selectedCategoryIds = [];
    renderSelectableCategories(document.getElementById('category-search').value);
    updateSelectedTags();
    updateSelectedCount();
    document.getElementById('selected-tags-container').classList.add('hidden');
    
    showMessage('info', 'All categories cleared');
}

// Budget validation
function validateBudget() {
    const monthlyBudget = parseFloat(document.getElementById('monthly_budget').value) || 0;
    const monthlySaving = parseFloat(document.getElementById('monthly_saving').value) || 0;
    const alertElement = document.getElementById('budget-validation-alert');
    const alertMessage = document.getElementById('budget-alert-message');
    
    if (monthlySaving > monthlyBudget) {
        alertMessage.textContent = 'Savings goal cannot exceed your monthly budget. Please adjust your savings goal.';
        alertElement.classList.remove('hidden');
    } else if (monthlyBudget > 0) {
        alertElement.classList.add('hidden');
    }
}

// Save all budget settings
document.getElementById('save_budget_btn').addEventListener('click', function() {
    const saveBtn = this;
    const originalText = saveBtn.innerHTML;
    
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Saving...';
    saveBtn.disabled = true;

    const token = localStorage.getItem('access_token');

    // Prepare data
    const budgetData = {
        monthly_budget: parseFloat(document.getElementById('monthly_budget').value) || 0,
        monthly_saving: parseFloat(document.getElementById('monthly_saving').value) || 0,
        budget_reset_date: document.getElementById('budget_reset_date').value,
        categories: selectedCategoryIds
    };

    // Validation
    const monthlyBudget = budgetData.monthly_budget;
    const monthlySaving = budgetData.monthly_saving;
    
    if (monthlySaving > monthlyBudget) {
        showMessage('error', 'Savings goal cannot exceed monthly budget');
        saveBtn.innerHTML = originalText;
        saveBtn.disabled = false;
        return;
    }

    // Send to server
    fetch('/budget_settings/', {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(budgetData),
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to save budget settings');
        return response.json();
    })
    .then(data => {
        showMessage('success', 'Budget settings saved successfully');
    })
    .catch(error => {
        console.error('Error:', error);
        showMessage('error', 'Failed to save budget settings. Please try again.');
    })
    .finally(() => {
        saveBtn.innerHTML = originalText;
        saveBtn.disabled = false;
    });
});

function changePassword() {
    const currentPassword = document.getElementById('current_password').value;
    const newPassword = document.getElementById('new_password').value;
    const confirmPassword = document.getElementById('confirm_password').value;

    if (!currentPassword || !newPassword || !confirmPassword) {
        showMessage('error', 'Please fill in all password fields');
        return;
    }

    if (newPassword !== confirmPassword) {
        showMessage('error', 'New passwords do not match');
        return;
    }

    if (newPassword.length < 8) {
        showMessage('error', 'Password must be at least 8 characters long');
        return;
    }

    const token = localStorage.getItem('access_token');

    fetch('/change-password/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            current_password: currentPassword,
            new_password: newPassword,
            confirm_password: confirmPassword
        })
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => { throw err; });
        }
        return response.json();
    })
    .then(data => {
        showMessage('success', data.message || 'Password changed successfully');
        document.getElementById('current_password').value = '';
        document.getElementById('new_password').value = '';
        document.getElementById('confirm_password').value = '';
    })
    .catch(error => {
        console.error("Error changing password:", error);
        showMessage('error', error.detail || error.message || 'Failed to change password');
    });
}

// Utility function for time difference
function timeAgo(time) {
    const date = new Date(time);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hrs ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
}

// Fetch connected devices
function fetchConnectedDevices() {
    const token = localStorage.getItem('access_token');
    
    const list = document.getElementById('device-list');
    list.innerHTML = '<div class="text-center py-4"><i class="fas fa-spinner fa-spin text-purple-600"></i> Loading devices...</div>';
    
    fetch('/devices/', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to fetch devices');
        }
        return response.json();
    })
    .then(data => {
        list.innerHTML = '';
        
        if (data.length === 0) {
            list.innerHTML = '<div class="text-center py-4 text-gray-500 dark:text-gray-400">No devices connected</div>';
            return;
        }
        
        data.forEach(device => {
            const deviceElement = document.createElement('div');
            deviceElement.className = 'flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:shadow-sm transition-shadow';
            deviceElement.innerHTML = `
                <div class="flex items-center space-x-3">
                    <span class="text-2xl">
                        ${device.device_type === 'mobile' ? '📱' : '🖥️'}
                    </span>
                    <div>
                        <div class="font-medium text-gray-800 dark:text-gray-200">
                            ${device.device_name || 'Unknown Device'}
                        </div>
                        <div class="text-xs text-gray-500 dark:text-gray-400">
                            ${device.ip_address || 'Unknown IP'} • ${timeAgo(device.last_active)}
                        </div>
                    </div>
                </div>
                <button onclick="logoutDevice(${device.id})" 
                        class="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                    <i class="fas fa-sign-out-alt mr-1"></i> Logout
                </button>
            `;
            list.appendChild(deviceElement);
        });
    })
    .catch(error => {
        console.error("Error fetching devices:", error);
        list.innerHTML = `<div class="text-center py-4 text-red-500">Error loading devices</div>`;
    });
}

function logoutDevice(deviceId) {
    if (!confirm('Are you sure you want to logout this device?')) {
        return;
    }

    const token = localStorage.getItem('access_token');
    
    fetch(`/devices/${deviceId}/logout/`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) throw new Error('Logout failed');
        return response.json();
    })
    .then(data => {
        showMessage('success', 'Device logged out successfully');
        fetchConnectedDevices();
    })
    .catch(error => {
        console.error('Error logging out device:', error);
        showMessage('error', 'Failed to logout device');
    });
}

function logoutAllDevices() {
    if (!confirm('Are you sure you want to logout all other devices?')) {
        return;
    }

    const token = localStorage.getItem('access_token');
    
    fetch('/devices/logout-all/', {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) throw new Error('Logout all failed');
        return response.json();
    })
    .then(data => {
        showMessage('success', 'All other devices logged out successfully');
        fetchConnectedDevices();
    })
    .catch(error => {
        console.error('Error logging out all devices:', error);
        showMessage('error', 'Failed to logout all devices');
    });
}

function deactivateAccount() {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
        return;
    }

    const token = localStorage.getItem('access_token');

    fetch('/deactivate/', {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(res => {
        if (!res.ok) {
            return res.json().then(err => { throw err; });
        }
        return res.json();
    })
    .then(data => {
        showMessage('success', data.detail || 'Account deactivated successfully');
        localStorage.removeItem('access_token');
        setTimeout(() => {
            window.location.href = "/";
        }, 2000);
    })
    .catch(error => {
        console.error('Error deactivating account:', error);
        showMessage('error', error.detail || error.message || 'Failed to deactivate account');
    });
}

// Notification message function
function showMessage(type, message) {
    // Check if message container exists
    let messageContainer = document.getElementById('message-container');
    if (!messageContainer) {
        messageContainer = document.createElement('div');
        messageContainer.id = 'message-container';
        messageContainer.className = 'fixed top-4 right-4 z-50 space-y-2';
        document.body.appendChild(messageContainer);
    }

    const messageElement = document.createElement('div');
    const colors = {
        success: 'bg-green-50 border-green-400 text-green-800 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
        error: 'bg-red-50 border-red-400 text-red-800 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
        warning: 'bg-yellow-50 border-yellow-400 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800',
        info: 'bg-blue-50 border-blue-400 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
    };
    
    messageElement.className = `px-4 py-3 rounded-lg border shadow-lg transition-all duration-300 transform translate-x-full ${colors[type]}`;
    messageElement.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'} mr-3"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-auto text-gray-500 hover:text-gray-700">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    messageContainer.appendChild(messageElement);
    
    // Animate in
    setTimeout(() => {
        messageElement.classList.remove('translate-x-full');
    }, 10);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (messageElement.parentElement) {
            messageElement.classList.add('translate-x-full');
            setTimeout(() => {
                if (messageElement.parentElement) {
                    messageElement.remove();
                }
            }, 300);
        }
    }, 5000);
}