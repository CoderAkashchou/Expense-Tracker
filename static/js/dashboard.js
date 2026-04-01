document.addEventListener('DOMContentLoaded', function () {
    // Function to fetch all dashboard data
    function fetchDashboardData() {
        // Current Balance API
        fetch('/expenses/balance/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': '{{ csrf_token }}',
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            },
            credentials: 'include'
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Balance API failed');
                }
                return response.json();
            })
            .then(data => {
                document.querySelector('.current-balance-amount').textContent = '₹' + (data.remaining_budget || 0).toLocaleString('en-IN');
                document.querySelector('.income-amount').textContent = '₹' + (data.total_income || 0).toLocaleString('en-IN');
                document.querySelector('.expense-amount').textContent = '₹' + (data.total_expenses || 0).toLocaleString('en-IN');
                document.querySelector('.saving-amount').textContent = data.monthly_saving.toLocaleString('en-IN');

            })
            .catch(error => {
                console.error('Error fetching balance:', error);
            });

        // Budget Summary API
        fetch('/expenses/budget_summary/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': '{{ csrf_token }}',
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            },
            credentials: 'include'
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Budget summary API failed');
                }
                return response.json();
            })
            .then(data => {
                updateBudgetSummaryUI(data);
            })
            .catch(error => {
                console.error('Error fetching budget summary:', error);
            });

            // Expense Breakdown API - WITH COMPACT DESIGN
            fetch('/expenses/expense-breakdown/', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': '{{ csrf_token }}',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                },
                credentials: 'include'
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Expense breakdown API failed');
                }
                return response.json();
            })
            .then(data => {
                const container = document.getElementById("expense-breakdown-container");
                const totalSpentElem = document.getElementById("total-spent");

                container.innerHTML = "";

                if (data.breakdown.length === 0) {
                    container.innerHTML = `
                        <div class="text-center py-4">
                            <div class="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-2">
                                <i class="fas fa-chart-pie text-gray-400 text-sm"></i>
                            </div>
                            <p class="text-gray-500 dark:text-gray-400 text-sm">No expenses yet</p>
                        </div>
                    `;
                    totalSpentElem.textContent = '₹0';
                    return;
                }

                data.breakdown.forEach((item) => {
                    // Calculate percentage
                    const percentage = data.total_spent > 0 ? 
                        Math.round((item.total / data.total_spent) * 100) : 0;
                    
                    const breakdownItem = `
                        <div class="expense-category-item">
                            <div class="expense-category-icon ${item.color || 'bg-purple-500'} ${item.text_color || 'text-white'}">
                                ${item.icon || '📊'}
                            </div>
                            <div class="expense-category-info">
                                <div class="flex justify-between items-center">
                                    <div class="expense-category-name">${item.category}</div>
                                    <div class="expense-category-amount">₹${item.total.toLocaleString('en-IN')}</div>
                                </div>
                                <div class="expense-category-percentage">${percentage}% of total</div>
                            </div>
                        </div>
                    `;

                    container.innerHTML += breakdownItem;
                });

                totalSpentElem.textContent = `₹${(data.total_spent || 0).toLocaleString('en-IN')}`;
            })
            .catch(error => {
                console.error("Error fetching expense breakdown:", error);
                const container = document.getElementById("expense-breakdown-container");
                container.innerHTML = `
                    <div class="text-center py-4">
                        <div class="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-2">
                            <i class="fas fa-exclamation-triangle text-red-500 text-sm"></i>
                        </div>
                        <p class="text-gray-500 dark:text-gray-400 text-sm">Failed to load data</p>
                    </div>
                `;
            });

        fetch("/expenses/recent-transactions/", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": "{{ csrf_token }}",
                "Authorization": "Bearer " + localStorage.getItem("access_token")
            },
            credentials: "include"
        })
        .then(response => {
            if (!response.ok) throw new Error("Failed to load transactions");
            return response.json();
        })
        .then(data => {
            const container = document.getElementById("recent-transactions-container");
            container.innerHTML = "";

            if (!data.length) {
                container.innerHTML = `
                    <p class="text-gray-500 text-center py-4">
                        No recent transactions
                    </p>`;
                return;
            }

            data.forEach(tx => {
                const sign = tx.type === "income" ? "+" : "-";
                const amountColor = tx.type === "income" ? "text-green-600" : "text-red-600";

                const itemHTML = `
                <div class="flex justify-between items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 rounded-full ${tx.color} flex items-center justify-center text-lg">
                            ${tx.icon}
                        </div>
                        <div>
                            <div class="font-medium dark:text-white">
                                ${tx.description || "Transaction"}
                            </div>
                            <div class="text-sm text-gray-500">
                                ${new Date(tx.created_at).toLocaleString()} • ${tx.payment_method.toUpperCase()}
                            </div>
                        </div>
                    </div>

                    <div class="${amountColor} font-semibold">
                        ${sign} ₹${Math.abs(tx.amount).toLocaleString("en-IN")}
                    </div>
                </div>
                `;

                container.innerHTML += itemHTML;
            });
        })
        .catch(err => {
            console.error("Error loading recent transactions:", err);
        });

    }

    // Initialize modal functionality
    window.showDayExpenses = function (date) {
        fetch(`/expenses/daily-expenses/?date=${date}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': '{{ csrf_token }}',
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            }
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                document.getElementById('modal-date').textContent = `Expenses for ${data.date}`;
                const container = document.getElementById('modal-expenses-list');
                container.innerHTML = '';

                if (data.expenses && data.expenses.length > 0) {
                    data.expenses.forEach(expense => {
                        const element = document.createElement('div');
                        element.className = 'flex justify-between items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg';
                        element.innerHTML = `
                        <div class="flex items-center space-x-3">
                            <div class="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                                <i class="fas ${getCategoryIcon(expense.category)} text-purple-500 dark:text-purple-300"></i>
                            </div>
                            <div>
                                <div class="font-medium dark:text-white">${expense.category}</div>
                                <div class="text-xs text-gray-500">${expense.description || 'No description'}</div>
                            </div>
                        </div>
                        <div class="text-red-500 font-bold">₹${expense.amount.toLocaleString('en-IN')}</div>
                    `;
                        container.appendChild(element);
                    });
                    document.getElementById('modal-total').textContent = `₹${data.total.toLocaleString('en-IN')}`;
                } else {
                    container.innerHTML = `
                    <div class="text-center py-6 text-gray-500">
                        <i class="fas fa-box-open text-2xl mb-2"></i>
                        <p>No expenses recorded for this day</p>
                    </div>
                `;
                    document.getElementById('modal-total').textContent = '₹0';
                }

                document.getElementById('day-expenses-modal').classList.remove('hidden');
            })
            .catch(error => {
                console.error('Error fetching daily expenses:', error);
                alert('Failed to load daily expenses. Please try again.');
            });
    };

    window.closeModal = function () {
        document.getElementById('day-expenses-modal').classList.add('hidden');
    };

    // Month navigation
    let currentDate = new Date();

    document.getElementById('prev-month').addEventListener('click', function () {
        currentDate.setMonth(currentDate.getMonth() - 1);
        updateCalendar(currentDate);
    });

    document.getElementById('next-month').addEventListener('click', function () {
        currentDate.setMonth(currentDate.getMonth() + 1);
        updateCalendar(currentDate);
    });

    function updateCalendar(date) {
        const month = date.getMonth() + 1;
        const year = date.getFullYear();

        fetch(`/expenses/calendar-data/?month=${month}&year=${year}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': '{{ csrf_token }}',
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            }
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                document.getElementById('current-month').textContent =
                    new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

                const calendarDays = document.getElementById('calendar-days');
                calendarDays.innerHTML = '';

                data.calendar_data.forEach(day => {
                    const dayElement = document.createElement('div');
                    dayElement.className = 'aspect-square p-1';

                    if (day.day === 0) {
                        dayElement.innerHTML = '<div class="h-full"></div>';
                    } else {
                        dayElement.innerHTML = `
                        <div class="h-full rounded-lg flex flex-col items-center justify-center p-1 cursor-pointer hover:bg-opacity-80 transition-all
                                    ${day.status === 'green' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                                day.status === 'yellow' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
                                    'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'}"
                             onclick="showDayExpenses('${day.date}')">
                            <span class="font-medium">${day.day}</span>
                            <span class="text-xs">₹${day.amount || '0'}</span>
                        </div>
                    `;
                    }

                    calendarDays.appendChild(dayElement);
                });

                document.getElementById('daily-budget-display').textContent = `₹${data.daily_budget}`;
                document.getElementById('days-completed').textContent = data.days_completed;
                document.getElementById('total-days').textContent = data.total_days;
            })
            .catch(error => {
                console.error('Error fetching calendar data:', error);
            });
    }

    // Helper function to get category icons
    function getCategoryIcon(category) {
        const icons = {
            'Shopping': 'fa-shopping-bag',
            'Food & Drink': 'fa-utensils',
            'Transport': 'fa-car',
            'Bills': 'fa-file-invoice-dollar',
            'Entertainment': 'fa-film',
            'Other': 'fa-tag'
        };
        return icons[category] || 'fa-tag';
    }

    

    // Function to update the budget summary UI
    function updateBudgetSummaryUI(data) {
        // Calculate percentages
        const spentPercentage = (data.spent / data.monthly_budget) * 100;
        const remainingPercentage = 100 - spentPercentage;

        // Update progress bar
        const progressBar = document.querySelector('.budget-progress-bar');
        if (progressBar) {
            progressBar.style.width = `${spentPercentage}%`;
            progressBar.style.backgroundColor = spentPercentage > 80 ? '#EF4444' : '#6366F1';
        }

        // Update all text elements
        updateElementText('.monthly-budget-amount', formatCurrency(data.monthly_budget));
        updateElementText('.remaining-amount', formatCurrency(data.remaining));
        updateElementText('.days-left-amount', data.days_left);
        updateElementText('.daily-budget-amount', formatCurrency(data.daily_budget));
        updateElementText('.spent-percentage', `${Math.round(spentPercentage)}% spent`);
        updateElementText('.remaining-percentage', `${Math.round(remainingPercentage)}% remaining`);

        // Update reset date
        if (data.next_reset) {
            const resetDate = new Date(data.next_reset);
            updateElementText('.next-reset-date',
                resetDate.toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                })
            );
        }
    }

    // Helper functions
    function updateElementText(selector, text) {
        const element = document.querySelector(selector);
        if (element) element.textContent = text;
    }

    function formatCurrency(amount) {
        return '₹' + (parseFloat(amount) || 0).toLocaleString('en-IN', {
            maximumFractionDigits: 2,
            minimumFractionDigits: 0
        });
    }

    function getIconByCategory(category) {
        const icons = {
            'shopping': 'fa-shopping-bag',
            'food': 'fa-utensils',
            'transport': 'fa-car',
            'bills': 'fa-file-invoice',
            'entertainment': 'fa-film',
            'salary': 'fa-money-bill-wave',
            'other': 'fa-tag'
        };
        return 'fas ' + (icons[(category || '').toLowerCase()] || 'fa-tag');
    }
    
    function formatDateTime(dateStr) {
        try {
            const date = new Date(dateStr);
            return date.toLocaleString('en-IN', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch (e) {
            return dateStr;
        }
    }

    // Initialize everything
    fetchDashboardData();
    updateCalendar(currentDate);
});


function formatDateTime(isoDateStr) {
    const date = new Date(isoDateStr);
    return date.toLocaleString('en-IN', {
        timeZone: 'UTC',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    });
}