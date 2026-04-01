// ============================
    // GLOBAL UTILITY FUNCTIONS
    // ============================

    // Show notification message
    function showMessage(type, message) {
        const existingMessages = document.querySelectorAll('.message-container');
        if (existingMessages.length > 2) {
            existingMessages[0].remove();
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = `message-container fixed top-[80px] right-4 z-[9999] p-4 rounded-lg shadow-lg max-w-md transition-all duration-300 ${
            type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 
            type === 'error' ? 'bg-red-100 text-red-800 border border-red-200' :
            type === 'warning' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
            'bg-blue-100 text-blue-800 border border-blue-200'
        }`;

        messageDiv.innerHTML = `
            <div class="flex items-start">
                <i class="fas ${
                    type === 'success' ? 'fa-check-circle' : 
                    type === 'error' ? 'fa-exclamation-circle' : 
                    type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'
                } mr-2 mt-0.5"></i>
                <div>${message}</div>
                <button onclick="this.parentElement.parentElement.remove()" 
                    class="ml-4 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        document.body.appendChild(messageDiv);

        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.style.opacity = '0';
                setTimeout(() => {
                    if (messageDiv.parentNode) {
                        messageDiv.remove();
                    }
                }, 300);
            }
        }, 5000);
    }

    // Get CSRF token
    function getCSRFToken() {
        return document.querySelector('[name=csrfmiddlewaretoken]')?.value || '';
    }

    // Escape HTML special characters
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ============================
    // MOBILE MENU & NAVIGATION
    // ============================

    // Mobile Menu Toggle
    function setupMobileMenu() {
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const sidebar = document.querySelector('.sidebar');
        const sidebarOverlay = document.getElementById('sidebarOverlay');
        const closeSidebarBtn = document.getElementById('closeSidebar');

        function toggleSidebar() {
            sidebar.classList.toggle('active');
            sidebarOverlay.classList.toggle('active');
            
            if (sidebar.classList.contains('active')) {
                document.body.style.overflow = 'hidden';
                sidebarOverlay.style.opacity = '1';
                sidebarOverlay.style.visibility = 'visible';
            } else {
                document.body.style.overflow = '';
                sidebarOverlay.style.opacity = '0';
                sidebarOverlay.style.visibility = 'hidden';
            }
        }

        if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', toggleSidebar);
        if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', toggleSidebar);
        if (sidebarOverlay) sidebarOverlay.addEventListener('click', toggleSidebar);

        // Close sidebar when clicking on nav items (mobile)
        document.querySelectorAll('.nav-item a').forEach(item => {
            item.addEventListener('click', function() {
                if (window.innerWidth < 1024) {
                    toggleSidebar();
                }
            });
        });

        // Handle window resize
        window.addEventListener('resize', function() {
            if (window.innerWidth >= 1024) {
                sidebar.classList.remove('active');
                sidebarOverlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }

    // Navigation Highlighting
    function setupNavigation() {
        const currentPath = window.location.pathname;
        const navItems = document.querySelectorAll('.nav-item');
        
        navItems.forEach(item => {
            item.classList.remove('active');
        });

        if (currentPath.startsWith('/dashboard')) {
            document.querySelector('a[href="/dashboard"]')?.parentElement?.classList.add('active');
        } else if (currentPath.startsWith('/analytics')) {
            document.querySelector('a[href="/analytics"]')?.parentElement?.classList.add('active');
        } else if (currentPath.startsWith('/transactions')) {
            document.querySelector('a[href="/transactions"]')?.parentElement?.classList.add('active');
        } else if (currentPath.startsWith('/profile')) {
            document.querySelector('a[href="/profile"]')?.parentElement?.classList.add('active');
        }
    }

    // ============================
    // USER PROFILE FUNCTIONS
    // ============================

function fetchUserProfile() {
    const accessToken = localStorage.getItem('access_token');
    
    if (!accessToken) {
        console.error('No access token found');
        return;
    }

    fetch('/profile_user/', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken(),
            'Authorization': `Bearer ${accessToken}`
        },
        credentials: 'same-origin'
    })
    .then(response => {
        if (response.status === 401) {
            window.location.href = '/';
        }
        if (!response.ok) throw new Error('Failed to fetch user profile');
        return response.json();
    })
    .then(data => {
        
        // Update user name
        document.getElementById('userName').textContent = `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'User';
        document.getElementById('userEmail').textContent = data.email || '';
        
        // Update avatar - FIXED HERE
        if (data.profile_image) {
            const avatarImg = document.getElementById('userAvatar');
            
            // Check if it's a full URL or relative path
            let imageUrl = data.profile_image;
            
            // If it's a relative path (starts with /media/), add origin
            if (imageUrl.startsWith('/media/')) {
                imageUrl = window.location.origin + imageUrl;
            }
            
            console.log('Setting avatar to:', imageUrl); // Debug log
            avatarImg.src = imageUrl;
            
            // Add error handling for avatar
            avatarImg.onerror = function() {
                console.error('Failed to load avatar image:', imageUrl);
                // Fallback to UI Avatars on error
                const name = data.first_name || 'U';
                this.src = `https://ui-avatars.com/api/?name=${name}&background=6c5ce7&color=fff`;
            };
        } else {
            // No profile image - use UI Avatars
            const name = data.first_name || 'U';
            document.getElementById('userAvatar').src = `https://ui-avatars.com/api/?name=${name}&background=6c5ce7&color=fff`;
        }
        
        // Update greeting
        const greetingName = document.getElementById('greetingName');
        if (greetingName) {
            greetingName.textContent = data.first_name || 'User';
        }
    })
    .catch(error => {
        console.error('Profile fetch error:', error);
        // Fallback avatar on error
        document.getElementById('userAvatar').src = 'https://ui-avatars.com/api/?name=U&background=6c5ce7&color=fff';
    });
}


    // Logout Functionality
    function setupLogout() {
        const logoutForm = document.getElementById("logoutForm");
        if (!logoutForm) return;

        logoutForm.addEventListener("submit", function(e) {
            e.preventDefault();

            const accessToken = localStorage.getItem("access_token");
            const refreshToken = localStorage.getItem("refresh_token");
            const csrfToken = getCSRFToken();
            const loginUrl = "/";
            
            if (!accessToken || !refreshToken) {
                window.location.href = loginUrl;
                return;
            }

            const logoutBtn = this.querySelector('button');
            const originalHtml = logoutBtn.innerHTML;
            logoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            logoutBtn.disabled = true;

            fetch("/logout/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`,
                    "X-CSRFToken": csrfToken
                },
                body: JSON.stringify({ refresh: refreshToken })
            })
            .then(async response => {
                if (!response.ok) {
                    const error = await response.json().catch(() => ({ detail: "Logout failed" }));
                    throw new Error(error.detail || "Logout failed");
                }
                return response.json();
            })
            .then(() => {
                localStorage.removeItem("access_token");
                localStorage.removeItem("refresh_token");
                window.location.href = loginUrl;
            })
            .catch(error => {
                console.error("Logout error:", error);
                logoutBtn.innerHTML = originalHtml;
                logoutBtn.disabled = false;
                showMessage('error', error.message || "Logout failed. Please try again.");
            });
        });
    }

    // Time-based Greeting
    function updateGreeting() {
        const hour = new Date().getHours();
        let greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
        const greetingEl = document.querySelector('#greetingText');
        if (greetingEl) greetingEl.textContent = greeting + ' ';
    }

    // ============================
    // TRANSACTION MODAL FUNCTIONS
    // ============================

    // Global variables for categories
    let userCategories = [];
    let filteredCategories = [];

    // Setup transaction modal
    function setupTransactionModal() {
        // Transaction type change handler
        const typeRadios = document.querySelectorAll('input[name="type"]');
        if (typeRadios.length > 0) {
            typeRadios.forEach(radio => {
                radio.addEventListener('change', function() {
                    updateSaveButton();
                });
            });
        }

        // Amount validation
        const amountInput = document.querySelector('input[name="amount"]');
        if (amountInput) {
            amountInput.addEventListener('input', function() {
                validateAmount(this);
            });
        }

        // Setup category search
        setupCategorySearch();

        // Setup payment method
        const paymentSelect = document.querySelector('select[name="payment_method"]');
        if (paymentSelect) {
            paymentSelect.addEventListener('change', updateSaveButton);
        }

        // Form validation
        setupFormValidation();

        // Modal show event
        const modal = document.getElementById('addTransactionModal');
        if (modal) {
            modal.addEventListener('show.bs.modal', function() {
                console.log('Modal opening...');
                loadUserCategories();
                resetTransactionForm();
                
                // Reset form validation
                const form = document.getElementById('transactionForm');
                if (form) {
                    form.classList.remove('was-validated');
                }
                
                // Focus first input
                setTimeout(() => {
                    const firstInput = form.querySelector('input[name="amount"]');
                    if (firstInput) firstInput.focus();
                }, 300);
            });
            
            // Modal hidden event
            modal.addEventListener('hidden.bs.modal', function() {
                console.log('Modal closed');
            });
        }
    }

    // Load user categories for modal
    function loadUserCategories() {
        const accessToken = localStorage.getItem("access_token");
        if (!accessToken) {
            console.error("No access token found");
            return;
        }

        // Show loading state
        const categoriesGrid = document.getElementById('categoriesGrid');
        if (categoriesGrid) {
            categoriesGrid.innerHTML = `
                <div class="col-span-2 sm:col-span-3 lg:col-span-4 text-center py-8">
                    <div class="inline-flex items-center justify-center space-x-3">
                        <div class="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent"></div>
                        <span class="text-sm text-gray-600 dark:text-gray-400">Loading your categories...</span>
                    </div>
                </div>
            `;
        }

        // First try to get user's selected categories from budget settings
        fetch('/budget_settings/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
        })
        .then(response => {
            if (!response.ok) throw new Error('Failed to fetch budget settings');
            return response.json();
        })
        .then(budgetData => {
            const selectedCategoryIds = budgetData.categories || [];
            console.log('Selected category IDs from budget:', selectedCategoryIds);
            
            // Now fetch all categories
            return fetch('/budgets/categories/', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
            })
            .then(response => {
                if (!response.ok) throw new Error('Failed to fetch all categories');
                return response.json();
            })
            .then(allCategories => {
                // Filter to only show categories selected in budget settings
                const filtered = allCategories.filter(category => 
                    selectedCategoryIds.includes(category.id)
                );
                
                console.log('Filtered categories for modal:', filtered);
                userCategories = filtered;
                filteredCategories = [...filtered];
                
                if (filtered.length === 0) {
                    showNoCategoriesMessage();
                } else {
                    populateCategoriesGrid();
                    updateCategoryCount();
                }
            });
        })
        .catch(error => {
            console.error('Error loading categories:', error);
            showCategoriesErrorState();
            showMessage('error', 'Failed to load categories. Please try again.');
        });
    }

    // Populate categories grid in modal
    function populateCategoriesGrid() {
        const categoriesGrid = document.getElementById('categoriesGrid');
        if (!categoriesGrid) return;

        if (filteredCategories.length === 0) {
            categoriesGrid.innerHTML = `
                <div class="col-span-2 sm:col-span-3 lg:col-span-4 text-center py-6">
                    <div class="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
                        <i class="fas fa-search text-gray-400"></i>
                    </div>
                    <p class="text-sm font-medium text-gray-700 dark:text-gray-300">No matching categories</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Try different search terms</p>
                </div>
            `;
            return;
        }

        let categoriesHTML = '';
        
        filteredCategories.forEach(category => {
            const iconColor = category.color || 'bg-purple-100';
            const textColor = category.text_color || 'text-purple-800';
            
            categoriesHTML += `
                <div class="category-card">
                    <button type="button"
                            data-category-id="${category.id}"
                            data-category-name="${category.name}"
                            onclick="selectCategory(${category.id}, '${escapeHtml(category.name)}', '${category.icon}', '${iconColor}', '${textColor}')"
                            class="w-full h-full p-3 rounded-xl border transition-all duration-200 flex flex-col items-center justify-center
                                   bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700
                                   hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-md
                                   focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2">
                        <div class="w-12 h-12 rounded-xl ${iconColor} flex items-center justify-center mb-2 shadow-sm">
                            <span class="text-xl">${category.icon}</span>
                        </div>
                        <span class="text-xs font-medium text-gray-800 dark:text-gray-200 text-center truncate w-full">
                            ${category.name}
                        </span>
                    </button>
                </div>
            `;
        });

        categoriesGrid.innerHTML = categoriesHTML;
    }

    // Setup category search in modal
    function setupCategorySearch() {
        const searchInput = document.getElementById('categorySearch');
        const clearButton = document.getElementById('clearCategorySearch');

        if (searchInput) {
            searchInput.addEventListener('input', function() {
                const searchTerm = this.value.toLowerCase().trim();
                
                // Filter categories
                filteredCategories = userCategories.filter(category => 
                    category.name.toLowerCase().includes(searchTerm)
                );

                // Repopulate grid
                populateCategoriesGrid();
                updateCategoryCount();
            });
        }
    }

    // Select a category in modal
    function selectCategory(id, name, icon, color, textColor) {
        document.getElementById('selectedCategoryId').value = id;
        document.getElementById('selectedCategory').value = name;

        const preview = document.getElementById('selectedCategoryPreview');
        const iconDiv = document.getElementById('selectedCategoryIcon');
        const nameSpan = document.getElementById('selectedCategoryName');

        if (preview && iconDiv && nameSpan) {
            iconDiv.innerHTML = `<span class="text-2xl">${icon}</span>`;
            iconDiv.className = `w-12 h-12 rounded-xl ${color} flex items-center justify-center`;
            nameSpan.textContent = name;
            preview.classList.remove('hidden');
        }

        updateSaveButton();
        updateCategoryCount();
    }

    // Clear category selection in modal
    function clearCategorySelection() {
        document.getElementById('selectedCategory').value = '';
        document.getElementById('selectedCategoryId').value = '';

        const preview = document.getElementById('selectedCategoryPreview');
        if (preview) {
            preview.classList.add('hidden');
        }

        // Remove visual feedback
        document.querySelectorAll('.category-card button').forEach(btn => {
            btn.classList.remove('border-purple-500', 'bg-purple-50', 'dark:bg-purple-900/20');
        });

        // Update save button state
        updateSaveButton();
        updateCategoryCount();
    }

    // Update category count display
    function updateCategoryCount() {
        const selectedCount = document.getElementById('selectedCount');
        const totalCount = document.getElementById('totalCount');
        
        if (selectedCount) {
            selectedCount.textContent = document.getElementById('selectedCategoryId').value ? '1' : '0';
        }
    }

    // Show no categories message
    function showNoCategoriesMessage() {
        const categoriesGrid = document.getElementById('categoriesGrid');
        if (categoriesGrid) {
            categoriesGrid.innerHTML = `
                <div class="col-span-2 sm:col-span-3 lg:col-span-4 text-center py-8">
                    <div class="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center mx-auto mb-3">
                        <i class="fas fa-exclamation-triangle text-yellow-600 dark:text-yellow-400"></i>
                    </div>
                    <p class="text-sm font-medium text-gray-700 dark:text-gray-300">No categories available</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Please set up categories in budget settings first</p>
                </div>
            `;
        }
    }

    // Show error state for categories
    function showCategoriesErrorState() {
        const categoriesGrid = document.getElementById('categoriesGrid');
        if (categoriesGrid) {
            categoriesGrid.innerHTML = `
                <div class="col-span-2 sm:col-span-3 lg:col-span-4 text-center py-6">
                    <div class="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-3">
                        <i class="fas fa-exclamation-triangle text-red-500 dark:text-red-400"></i>
                    </div>
                    <p class="text-sm font-medium text-gray-700 dark:text-gray-300">Failed to load categories</p>
                    <button onclick="loadUserCategories()" 
                            class="mt-3 px-4 py-2 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors">
                        <i class="fas fa-redo mr-1"></i> Retry
                    </button>
                </div>
            `;
        }
    }

    // Validate amount input
    function validateAmount(input) {
        const value = parseFloat(input.value);
        if (isNaN(value) || value < 0) {
            input.classList.add('border-red-500');
            input.classList.remove('border-gray-300');
        } else {
            input.classList.remove('border-red-500');
            input.classList.add('border-gray-300');
        }
        updateSaveButton();
    }

    // Setup form validation
    function setupFormValidation() {
        const form = document.getElementById('transactionForm');
        if (form) {
            const inputs = form.querySelectorAll('input[required], select[required]');
            inputs.forEach(input => {
                input.addEventListener('input', updateSaveButton);
                input.addEventListener('change', updateSaveButton);
            });
        }
    }

    // Update save button state
    function updateSaveButton() {
        const saveButton = document.getElementById('saveTransaction');
        if (!saveButton) return;

        const amount = document.querySelector('input[name="amount"]')?.value;
        const categoryId = document.getElementById('selectedCategoryId')?.value;
        const paymentMethod = document.querySelector('select[name="payment_method"]')?.value;

        const isValid = amount && parseFloat(amount) > 0 && categoryId && paymentMethod;
        
        saveButton.disabled = !isValid;
        saveButton.classList.toggle('opacity-50', !isValid);
        saveButton.classList.toggle('cursor-not-allowed', !isValid);
    }

    // Reset transaction form
    function resetTransactionForm() {
        const form = document.getElementById('transactionForm');
        if (form) {
            form.reset();
            clearCategorySelection();
            updateSaveButton();
        }
        
        // Hide receipt file name
        const fileNameDiv = document.getElementById('receiptFileName');
        if (fileNameDiv) {
            fileNameDiv.classList.add('hidden');
        }
    }

    // Preview receipt file name
    function previewReceiptName(input) {
        const fileNameDiv = document.getElementById('receiptFileName');
        if (fileNameDiv && input.files.length > 0) {
            const file = input.files[0];
            fileNameDiv.textContent = `📄 ${file.name} (${(file.size / 1024).toFixed(2)} KB)`;
            fileNameDiv.classList.remove('hidden');
        } else if (fileNameDiv) {
            fileNameDiv.classList.add('hidden');
        }
    }

    // ============================
    // TRANSACTION FORM SUBMISSION
    // ============================

    // Initialize transaction form submission
    function initializeTransactionForm() {
        const form = document.getElementById('transactionForm');
        
        if (!form) {
            console.error('Transaction form not found');
            return;
        }
        
        console.log('Initializing transaction form...');
        
        // Form submit event
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('Form submitted');
            saveTransaction(this);
        });
    }

    // Main save transaction function
    function saveTransaction(form) {
        console.log('Saving transaction...');
        
        // Show loading state
        const saveButton = form.querySelector('#saveTransaction');
        const originalText = saveButton.innerHTML;
        saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        saveButton.disabled = true;
        
        // Get form data
        const formData = new FormData(form);
        
        // Validation
        const amount = formData.get('amount');
        const categoryId = formData.get('category_id');
        const paymentMethod = formData.get('payment_method');
        
        if (!amount || parseFloat(amount) <= 0) {
            showMessage('error', 'Please enter a valid amount');
            resetSaveButton(saveButton, originalText);
            return;
        }
        
        if (!categoryId) {
            showMessage('error', 'Please select a category');
            resetSaveButton(saveButton, originalText);
            return;
        }
        
        if (!paymentMethod) {
            showMessage('error', 'Please select a payment method');
            resetSaveButton(saveButton, originalText);
            return;
        }
        
        // Get access token
        const accessToken = localStorage.getItem('access_token');
        if (!accessToken) {
            showMessage('error', 'Session expired. Please login again.');
            resetSaveButton(saveButton, originalText);
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);
            return;
        }
        
        console.log('Transaction data:', {
            amount: formData.get('amount'),
            category_id: formData.get('category_id'),
            payment_method: formData.get('payment_method'),
            type: formData.get('type'),
            date: formData.get('date'),
            description: formData.get('description'),
            hasReceipt: formData.get('receipt') ? 'Yes' : 'No'
        });
        
        // Send request
        fetch('/expenses/user_expenses/', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'X-CSRFToken': getCSRFToken()
            },
            body: formData
        })
        .then(async response => {
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || data.detail || 'Failed to save transaction');
            }
            
            return data;
        })
        .then(data => {
            console.log('Transaction saved successfully:', data);
            showMessage('success', 'Transaction saved successfully!');
            
            // Reset form and close modal
            form.reset();
            clearCategorySelection();
            
            // Close modal
            const modalElement = document.getElementById('addTransactionModal');
            const modal = bootstrap.Modal.getInstance(modalElement);
            if (modal) {
                modal.hide();
            }
            
            // Reset button
            resetSaveButton(saveButton, originalText);
            
            // Reload transactions if on transactions page
            if (window.location.pathname.includes('/transactions') && typeof loadTransactions === 'function') {
                loadTransactions();
            }
        })
        .catch(error => {
            console.error('Save transaction error:', error);
            showMessage('error', error.message || 'Failed to save transaction');
            resetSaveButton(saveButton, originalText);
        });
    }

    // Helper function to reset save button
    function resetSaveButton(button, originalHtml) {
        button.innerHTML = originalHtml;
        button.disabled = false;
    }

    // ============================
    // MAIN INITIALIZATION
    // ============================

    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOM Content Loaded - Initializing...');
        
        // Core functionality
        setupMobileMenu();
        setupNavigation();
        fetchUserProfile();
        setupLogout();
        updateGreeting();
        
        // Transaction modal
        setupTransactionModal();
        initializeTransactionForm();
        
        // Debug logging
        console.log('Form exists:', !!document.getElementById('transactionForm'));
        console.log('Save button exists:', !!document.getElementById('saveTransaction'));
        
        // Set global debug function
        window.debugForm = function() {
            console.log('=== FORM DEBUG ===');
            console.log('Form:', document.getElementById('transactionForm'));
            console.log('Save Button:', document.getElementById('saveTransaction'));
            console.log('Amount Input:', document.querySelector('input[name="amount"]'));
            console.log('Category ID Input:', document.getElementById('selectedCategoryId'));
            console.log('Selected Category:', document.getElementById('selectedCategoryId')?.value);
            console.log('==================');
        };
    });

    // Fix Tailwind CSS warning
    function fixTailwindWarning() {
        // Remove CDN tailwind if exists in production
        if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
            const tailwindScript = document.querySelector('script[src*="cdn.tailwindcss.com"]');
            if (tailwindScript) {
                console.warn('Tailwind CSS CDN detected in production. Consider installing Tailwind properly.');
            }
        }
    }