// Global variables
let trendChart, categoryChart, paymentChart;
let currentPage = 1;
const itemsPerPage = 10;
let currentFilters = {};

// Initialize all charts
function initCharts() {
    // Trend Chart - Responsive configuration
    trendChart = new ApexCharts(document.querySelector("#trendChart"), {
        series: [{
            name: 'Expenses',
            data: []
        }],
        chart: {
            height: '300',
            type: 'area',
            toolbar: { show: false },
            zoom: { enabled: false },
            animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 800
            },
            foreColor: '#6B7280'
        },
        colors: ['#8b5cf6'],
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.7,
                opacityTo: 0.2,
                stops: [0, 100]
            }
        },
        dataLabels: { enabled: false },
        stroke: { 
            curve: 'smooth', 
            width: 2,
            lineCap: 'round'
        },
        markers: {
            size: 4,
            strokeWidth: 0,
            hover: { size: 6 }
        },
        tooltip: {
            enabled: true,
            followCursor: true,
            fillSeriesColor: false,
            theme: 'dark',
            y: { 
                formatter: function(val) { 
                    return "₹" + val.toLocaleString('en-IN') 
                }
            }
        },
        xaxis: {
            type: 'category',
            labels: { 
                style: { 
                    colors: '#6B7280',
                    fontFamily: 'Inter, sans-serif'
                },
                hideOverlappingLabels: true,
                trim: true
            },
            tooltip: { enabled: false }
        },
        yaxis: {
            labels: {
                style: { 
                    colors: '#6B7280',
                    fontFamily: 'Inter, sans-serif'
                },
                formatter: function(val) { 
                    return "₹" + val.toLocaleString('en-IN') 
                }
            }
        },
        grid: {
            borderColor: '#E5E7EB',
            strokeDashArray: 4,
            padding: {
                top: 0,
                right: 10,
                bottom: 0,
                left: 10
            }
        },
        responsive: [{
            breakpoint: 640,
            options: {
                chart: {
                    height: 250
                },
                stroke: {
                    width: 1.5
                },
                markers: {
                    size: 3
                },
                xaxis: {
                    labels: {
                        style: {
                            fontSize: '10px'
                        }
                    }
                },
                yaxis: {
                    labels: {
                        style: {
                            fontSize: '10px'
                        }
                    }
                }
            }
        }]
    });
    trendChart.render();
    
    // Category Chart - Responsive configuration
    categoryChart = new ApexCharts(document.querySelector("#categoryChart"), {
        series: [],
        labels: [],
        chart: {
            type: 'donut',
            height: 250,
            animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 800
            },
            foreColor: '#6B7280'
        },
        colors: ['#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#3b82f6', '#6366f1', '#ec4899', '#14b8a6', '#f97316', '#64748b'],
        plotOptions: {
            pie: {
                donut: {
                    size: '65%',
                    labels: {
                        show: true,
                        total: {
                            show: true,
                            label: 'Total',
                            formatter: function (w) {
                                const total = w.globals.seriesTotals.reduce((a, b) => a + b, 0);
                                return "₹" + total.toLocaleString('en-IN');
                            }
                        }
                    }
                }
            }
        },
        legend: {
            position: 'right',
            horizontalAlign: 'center',
            fontFamily: 'Inter, sans-serif',
            labels: {
                colors: '#6B7280'
            },
            markers: {
                width: 6,
                height: 6,
                radius: 3
            }
        },
        tooltip: {
            enabled: true,
            theme: 'dark',
            y: {
                formatter: function (val) {
                    return "₹" + val.toLocaleString('en-IN');
                }
            }
        }
    });

    categoryChart.render();


    
    // Payment Method Chart - Responsive configuration
    paymentChart = new ApexCharts(document.querySelector("#paymentChart"), {
        series: [{
            name: 'Amount',
            data: []
        }],
        chart: {
            type: 'bar',
            height: '300',
            toolbar: { show: false },
            animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 800
            },
            foreColor: '#6B7280'
        },
        colors: ['#8b5cf6'],
        plotOptions: {
            bar: {
                borderRadius: 4,
                horizontal: false,
                columnWidth: '55%',
                endingShape: 'rounded'
            }
        },
        dataLabels: { enabled: false },
        stroke: {
            show: true,
            width: 1,
            colors: ['transparent']
        },
        xaxis: {
            categories: [],
            labels: { 
                style: { 
                    colors: '#6B7280',
                    fontFamily: 'Inter, sans-serif'
                }
            }
        },
        yaxis: {
            labels: {
                style: { 
                    colors: '#6B7280',
                    fontFamily: 'Inter, sans-serif'
                },
                formatter: function(val) { 
                    return "₹" + val.toLocaleString('en-IN') 
                }
            }
        },
        grid: {
            borderColor: '#E5E7EB',
            strokeDashArray: 3,
            padding: {
                top: 0,
                right: 10,
                bottom: 0,
                left: 10
            }
        },
        tooltip: {
            enabled: true,
            theme: 'dark',
            y: {
                formatter: function(val) {
                    return "₹" + val.toLocaleString('en-IN');
                }
            }
        },
        responsive: [{
            breakpoint: 640,
            options: {
                chart: {
                    height: 250
                },
                plotOptions: {
                    bar: {
                        columnWidth: '45%',
                        borderRadius: 3
                    }
                },
                xaxis: {
                    labels: {
                        style: {
                            fontSize: '10px'
                        }
                    }
                },
                yaxis: {
                    labels: {
                        style: {
                            fontSize: '10px'
                        }
                    }
                }
            }
        }]
    });
    paymentChart.render();
}

// Get authentication headers
function getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    const headers = {
        'Content-Type': 'application/json'
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Add CSRF token for Django
    const csrfToken = getCSRFToken();
    if (csrfToken) {
        headers['X-CSRFToken'] = csrfToken;
    }
    
    return headers;
}

// Get CSRF token from cookies
function getCSRFToken() {
    const cookieValue = document.cookie.match('(^|;)\\s*csrftoken\\s*=\\s*([^;]+)');
    return cookieValue ? cookieValue.pop() : '';
}

// Show toast notifications
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 px-4 py-2 rounded-md text-white ${
        type === 'success' ? 'bg-green-500' : 
        type === 'error' ? 'bg-red-500' : 'bg-blue-500'
    } text-sm z-50`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Handle API errors
function handleAPIError(error) {
    console.error('API Error:', error);
    
    if (error.message.includes('401') || error.message.includes('403')) {
        showToast('Session expired. Please login again.', 'error');
        setTimeout(() => window.location.href = '/login/', 2000);
    } else {
        showToast('An error occurred. Please try again.', 'error');
    }
}

// // Show loading overlay
// function showLoading() {
//     const overlay = document.getElementById('loading-overlay');
//     overlay.classList.remove('opacity-0', 'pointer-events-none');
//     overlay.classList.add('opacity-100');
// }

// Hide loading overlay
function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    overlay.classList.remove('opacity-100');
    overlay.classList.add('opacity-0', 'pointer-events-none');
}

// Update summary cards with new data
function updateMonthSummary(data) {
    if (!data) return;
    
    // Total Expenses
    document.querySelector('[data-id="total-expenses"]').textContent = 
        `₹${(data.total_expenses || 0).toLocaleString('en-IN')}`;
    
    const progressWidth = Math.min(data.budget_used_percentage || 0, 100);
    document.querySelector('[data-id="total-expenses-progress"]').style.width = `${progressWidth}%`;
    
    const changeElement = document.querySelector('[data-id="total-expenses-change"]');
    const percentChange = data.percent_change || 0;
    changeElement.textContent = 
        `${percentChange >= 0 ? '+' : ''}${percentChange.toFixed(1)}% from last period`;
    changeElement.className = 
        `text-xs ${percentChange >= 0 ? 'text-red-500' : 'text-green-500'}`;
    
    // Budget Remaining
    document.querySelector('[data-id="budget-remaining"]').textContent = 
        `₹${(data.budget_remaining || 0).toLocaleString('en-IN')}`;
    document.querySelector('[data-id="budget-used-progress"]').style.width = 
        `${data.budget_used_percentage || 0}%`;
    document.querySelector('[data-id="budget-used-text"]').textContent = 
        `${(data.budget_used_percentage || 0).toFixed(1)}% of ₹${((data.total_expenses || 0) + (data.budget_remaining || 0)).toLocaleString('en-IN')} budget used`;
    
    // Daily Average
    document.querySelector('[data-id="daily-average"]').textContent = 
        `₹${(data.daily_average || 0).toLocaleString('en-IN')}`;
    
    // Transactions Count
    document.querySelector('[data-id="transactions-count"]').textContent = 
        data.transactions || '0';
    
    // Update period information
    if (data.period) {
        document.querySelector('[data-id="month-range"]').textContent = data.period;
        document.querySelector('[data-id="days-count"]').textContent = 
            `${data.days || 30} days`;
    }
}

// Update trend chart with new data
function updateTrendChart(data, granularity = 'monthly') {
    if (!data) return;
    
    let categories = [];
    let seriesData = [];
    
    if (granularity === 'monthly') {
        // Initialize all months with 0
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const amounts = Array(12).fill(0);
        
        data.forEach(item => {
            const monthIndex = new Date(`${item.month} 1, 2023`).getMonth();
            amounts[monthIndex] = item.amount || 0;
        });
        
        categories = months;
        seriesData = amounts;
        
        document.getElementById('trend-period').textContent = 'Jan 2023 - Dec 2023';
    } else if (granularity === 'weekly') {
        // Weekly data
        data.forEach(item => {
            categories.push(`Week ${item.week}`);
            seriesData.push(item.amount || 0);
        });
        
        if (data.length > 0) {
            document.getElementById('trend-period').textContent = 
                `Week ${data[0].week} - Week ${data[data.length-1].week}`;
        }
    } else {
        // Daily data
        data.forEach(item => {
            const date = new Date(item.date);
            categories.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            seriesData.push(item.amount || 0);
        });
        
        if (data.length > 0) {
            const firstDate = new Date(data[0].date);
            const lastDate = new Date(data[data.length-1].date);
            document.getElementById('trend-period').textContent = 
                `${firstDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - ${lastDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
        }
    }
    
    trendChart.updateOptions({
        series: [{
            name: 'Expenses',
            data: seriesData
        }],
        xaxis: {
            categories: categories
        }
    });
}

// Update category chart with new data
// Update category chart with new data
function updateCategoryChart(data) {
    console.log("📊 Category Data:", data);

    // If no data, show empty state
    if (!data || !Array.isArray(data) || data.length === 0) {
        const container = document.querySelector("#categoryChart");
        container.innerHTML = `
            <div class="h-full flex flex-col items-center justify-center p-6">
                <i class="fas fa-chart-pie text-4xl text-gray-300 dark:text-gray-600 mb-3"></i>
                <p class="text-gray-500 dark:text-gray-400">No category data available</p>
                <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">Try changing your filters</p>
            </div>
        `;
        return;
    }

    const container = document.querySelector("#categoryChart");

    // Destroy the old chart if it exists
    if (categoryChart) {
        categoryChart.destroy();
    }

    // Prepare data for the chart
    const categories = data.map(item => item.category);
    const totals = data.map(item => item.total);
    const colors = data.map(item => {
        // Extract color from Tailwind class
        if (item.color) {
            if (item.color.includes('purple')) return '#8b5cf6';
            if (item.color.includes('orange')) return '#f97316';
            if (item.color.includes('pink')) return '#ec4899';
            if (item.color.includes('blue')) return '#3b82f6';
            if (item.color.includes('red')) return '#ef4444';
            if (item.color.includes('amber')) return '#f59e0b';
        }
        return '#8b5cf6'; // Default purple
    });

    // Create chart
    categoryChart = new ApexCharts(container, {
        series: totals,
        labels: categories,
        chart: {
            type: 'donut',
            height: 250,
            toolbar: { show: false },
            animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 800
            },
            foreColor: '#6B7280'
        },
        colors: colors,
        plotOptions: {
            pie: {
                donut: {
                    size: '65%',
                    labels: {
                        show: true,
                        name: {
                            show: true,
                            fontSize: '13px',
                            fontFamily: 'Inter, sans-serif',
                            color: '#6B7280'
                        },
                        value: {
                            show: true,
                            fontSize: '18px',
                            fontFamily: 'Inter, sans-serif',
                            fontWeight: 600,
                            color: '#374151',
                            formatter: function (val) {
                                return "₹" + parseFloat(val).toLocaleString('en-IN');
                            }
                        },
                        total: {
                            show: true,
                            label: 'Total',
                            color: '#6B7280',
                            fontSize: '13px',
                            fontFamily: 'Inter, sans-serif',
                            formatter: function (w) {
                                const total = w.globals.seriesTotals.reduce((a, b) => a + b, 0);
                                return "₹" + total.toLocaleString('en-IN');
                            }
                        }
                    }
                }
            }
        },
        legend: {
            position: 'right',
            horizontalAlign: 'center',
            fontFamily: 'Inter, sans-serif',
            fontSize: '12px',
            fontWeight: 500,
            labels: {
                colors: '#6B7280',
                useSeriesColors: false
            },
            markers: {
                width: 8,
                height: 8,
                radius: 4,
                offsetX: -4
            },
            itemMargin: {
                horizontal: 8,
                vertical: 4
            }
        },
        tooltip: {
            enabled: true,
            fillSeriesColor: false,
            theme: 'dark',
            y: {
                formatter: function (val, { seriesIndex }) {
                    const percent = data[seriesIndex]?.percent || 0;
                    return `₹${val.toLocaleString('en-IN')} (${percent.toFixed(1)}%)`;
                }
            }
        },
        dataLabels: {
            enabled: true,
            style: {
                fontSize: '11px',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500
            },
            dropShadow: {
                enabled: false
            },
            formatter: function(val, opts) {
                return parseFloat(val).toFixed(1) + '%';
            }
        },
        stroke: {
            width: 1,
            colors: ['#fff']
        },
        responsive: [{
            breakpoint: 1024,
            options: {
                chart: {
                    height: 250
                },
                legend: {
                    position: 'right',
                    fontSize: '11px'
                }
            }
        }, {
            breakpoint: 768,
            options: {
                chart: {
                    height: 220
                },
                legend: {
                    position: 'bottom',
                    horizontalAlign: 'center',
                    fontSize: '10px'
                },
                plotOptions: {
                    pie: {
                        donut: {
                            size: '60%'
                        }
                    }
                }
            }
        }, {
            breakpoint: 640,
            options: {
                chart: {
                    height: 200
                },
                legend: {
                    position: 'bottom',
                    fontSize: '9px',
                    markers: {
                        width: 6,
                        height: 6
                    }
                },
                plotOptions: {
                    pie: {
                        donut: {
                            size: '55%'
                        }
                    }
                }
            }
        }]
    });

    categoryChart.render();
}


// Update payment methods chart with new data
function updatePaymentChart(data) {
    if (!data || !Array.isArray(data)) {
        console.error('Invalid payment data:', data);
        return;
    }
    
    const methods = data.map(item => {
        // Format payment method names
        if (item.payment_method === 'credit') return 'Credit Card';
        if (item.payment_method === 'debit') return 'Debit Card';
        if (item.payment_method === 'cash') return 'Cash';
        if (item.payment_method === 'upi') return 'UPI';
        if (item.payment_method === 'bank') return 'Bank Transfer';
        return item.payment_method || 'Unknown';
    });
    
    const amounts = data.map(item => item.total || 0);
    
    paymentChart.updateOptions({
        series: [{
            name: 'Amount',
            data: amounts
        }],
        xaxis: {
            categories: methods
        }
    });
}

// Update top expenses table with pagination
function updateTopExpensesTable(data, page = 1) {
    const tableBody = document.querySelector('#top-expenses-table tbody');
    tableBody.innerHTML = '';
    
    if (!data || !Array.isArray(data)) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="py-6 sm:py-8 text-center">
                    <div class="flex flex-col items-center justify-center">
                        <i class="fas fa-exclamation-triangle text-xl sm:text-2xl text-yellow-500 mb-1 sm:mb-2"></i>
                        <span class="text-xs sm:text-sm text-gray-500 dark:text-gray-400">No transaction data available</span>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    if (data.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="py-6 sm:py-8 text-center">
                    <div class="flex flex-col items-center justify-center">
                        <i class="fas fa-inbox text-xl sm:text-2xl text-gray-400 mb-1 sm:mb-2"></i>
                        <span class="text-xs sm:text-sm text-gray-500 dark:text-gray-400">No transactions found</span>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    // Populate table rows
    data.forEach(expense => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors';
        
        // Format date
        const date = new Date(expense.date || expense.created_at);
        const formattedDate = date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
        });
        
        // Format amount
        const amount = parseFloat(expense.amount) || 0;
        const amountClass = amount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
        const amountPrefix = amount >= 0 ? '+' : '';
        
        row.innerHTML = `
            <td class="py-2 sm:py-3 dark:text-gray-300 text-xs sm:text-sm">${formattedDate}</td>
            <td class="py-2 sm:py-3 dark:text-white font-medium text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">
                ${expense.description || expense.name || 'No description'}
            </td>
            <td class="py-2 sm:py-3">
                <span class="px-2 py-1 rounded-full text-xs ${
                    expense.category === 'Food' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    expense.category === 'Transportation' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                    expense.category === 'Housing' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                }">
                    ${expense.category || 'Uncategorized'}
                </span>
            </td>
            <td class="py-2 sm:py-3 dark:text-gray-300 text-xs sm:text-sm">
                <div class="flex items-center">
                    ${getPaymentMethodIcon(expense.payment_method)}
                    <span class="truncate max-w-[60px] sm:max-w-none">
                        ${formatPaymentMethod(expense.payment_method)}
                    </span>
                </div>
            </td>
            <td class="py-2 sm:py-3 text-right ${amountClass} font-medium text-xs sm:text-sm">
                ${amountPrefix}₹${Math.abs(amount).toLocaleString('en-IN')}
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    // Update pagination info
    document.getElementById('table-summary').textContent = `Showing ${data.length} transactions`;
}

// Helper functions
function getPaymentMethodIcon(method) {
    switch(method) {
        case 'credit': return '<i class="far fa-credit-card mr-1 sm:mr-2 text-gray-500 text-xs sm:text-sm"></i>';
        case 'debit': return '<i class="far fa-credit-card mr-1 sm:mr-2 text-blue-500 text-xs sm:text-sm"></i>';
        case 'cash': return '<i class="fas fa-money-bill-wave mr-1 sm:mr-2 text-green-500 text-xs sm:text-sm"></i>';
        case 'upi': return '<i class="fas fa-mobile-alt mr-1 sm:mr-2 text-purple-500 text-xs sm:text-sm"></i>';
        case 'bank': return '<i class="fas fa-university mr-1 sm:mr-2 text-indigo-500 text-xs sm:text-sm"></i>';
        default: return '<i class="far fa-question-circle mr-1 sm:mr-2 text-gray-500 text-xs sm:text-sm"></i>';
    }
}

function formatPaymentMethod(method) {
    switch(method) {
        case 'credit': return 'Credit Card';
        case 'debit': return 'Debit Card';
        case 'cash': return 'Cash';
        case 'upi': return 'UPI';
        case 'bank': return 'Bank Transfer';
        default: return method || 'Unknown';
    }
}
// Handle pagination
function setupPagination() {
    document.getElementById('prev-page').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            fetchTopExpenses(currentFilters, currentPage);
        }
    });
    
    document.getElementById('next-page').addEventListener('click', () => {
        currentPage++;
        fetchTopExpenses(currentFilters, currentPage);
    });
    
    document.getElementById('refresh-transactions').addEventListener('click', () => {
        currentPage = 1;
        fetchTopExpenses(currentFilters, currentPage);
    });
}

async function fetchTopExpenses(filters = {}, page = 1) {
    try {
        const tableBody = document.querySelector('#top-expenses-table tbody');
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
        const currentPageSpan = document.getElementById('current-page');
        const tableSummary = document.getElementById('table-summary');

        // Show loading state
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-8">
                    <div class="flex flex-col items-center justify-center">
                        <i class="fas fa-spinner fa-spin text-2xl text-purple-600 mb-2"></i>
                        <span class="text-sm text-gray-500 dark:text-gray-400">Loading transactions...</span>
                    </div>
                </td>
            </tr>
        `;

        // Disable pagination buttons during loading
        prevBtn.disabled = true;
        nextBtn.disabled = true;

        const params = new URLSearchParams(filters);
        params.append("page", page);

        const response = await fetch(`/expenses/top_expenses/?${params}`, {
            headers: getAuthHeaders()
        });

        const data = await response.json();
        tableBody.innerHTML = "";

        if (!data || data.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-8">
                        <div class="flex flex-col items-center justify-center">
                            <i class="fas fa-receipt text-3xl text-gray-300 dark:text-gray-600 mb-3"></i>
                            <p class="text-gray-500 dark:text-gray-400">No transactions found</p>
                            <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">Try changing your filters</p>
                        </div>
                    </td>
                </tr>
            `;
            
            tableSummary.textContent = "Showing 0 transactions";
            prevBtn.disabled = true;
            nextBtn.disabled = true;
            return;
        }

        // Render each transaction
        data.forEach(item => {
            const paymentIcons = {
                'cash': '💵',
                'upi': '📱',
                'debit': '💳',
                'credit': '💳',
                'bank': '🏦',
                'wallet': '👛'
            };

            const paymentLabels = {
                'cash': 'Cash',
                'upi': 'UPI',
                'debit': 'Debit Card',
                'credit': 'Credit Card',
                'bank': 'Bank Transfer',
                'wallet': 'Digital Wallet'
            };

            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b dark:border-gray-700';
            
            row.innerHTML = `
                <td class="py-4 px-3 sm:px-4">
                    <div class="flex flex-col">
                        <span class="text-sm font-medium dark:text-gray-200">${new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                        <span class="text-xs text-gray-500 dark:text-gray-400">${new Date(item.date).toLocaleDateString('en-IN', { year: 'numeric' })}</span>
                    </div>
                </td>

                <td class="py-4 px-3 sm:px-4">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 sm:w-11 sm:h-11 flex-shrink-0 flex items-center justify-center rounded-full ${item.color}">
                            <span class="text-lg sm:text-xl">${item.icon}</span>
                        </div>
                        <div class="min-w-0">
                            <div class="font-medium dark:text-gray-200 truncate max-w-[150px] sm:max-w-[200px]">${item.description}</div>
                            <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">${item.date}</div>
                        </div>
                    </div>
                </td>

                <td class="py-4 px-3 sm:px-4">
                    <div class="flex items-center">
                        <span class="px-3 py-1 text-xs font-medium rounded-full ${item.text_color} ${item.color.replace('100', '200')} border border-transparent">
                            ${item.category}
                        </span>
                    </div>
                </td>

                <td class="py-4 px-3 sm:px-4">
                    <div class="flex items-center gap-2">
                        <span class="text-lg">${paymentIcons[item.payment_method] || '💳'}</span>
                        <span class="text-sm font-medium dark:text-gray-200">${paymentLabels[item.payment_method] || item.payment_method.toUpperCase()}</span>
                    </div>
                </td>

                <td class="py-4 px-3 sm:px-4 text-right">
                    <div class="font-semibold text-red-600 dark:text-red-400 text-base sm:text-lg">
                        ₹${item.amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        ${item.payment_method.toUpperCase()}
                    </div>
                </td>
            `;

            tableBody.appendChild(row);
        });


        
        // Update table summary
        const startItem = (page - 1) * 10 + 1;
        const endItem = startItem + data.length - 1;
        tableSummary.textContent = `Showing ${startItem}-${endItem} of recent transactions`;

        // Add click handlers for pagination
        prevBtn.onclick = () => {
            if (page > 1) fetchTopExpenses(filters, page - 1);
        };
        
        nextBtn.onclick = () => {
            if (data.length === 10) fetchTopExpenses(filters, page + 1); // Only if full page
        };

    } catch (error) {
        console.error("Top expenses fetch error:", error);
        const tableBody = document.querySelector('#top-expenses-table tbody');
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-8">
                    <div class="flex flex-col items-center justify-center">
                        <i class="fas fa-exclamation-triangle text-2xl text-red-500 mb-2"></i>
                        <p class="text-gray-600 dark:text-gray-400">Failed to load transactions</p>
                        <p class="text-sm text-gray-500 dark:text-gray-500 mt-1">Please try again</p>
                    </div>
                </td>
            </tr>
        `;
    }
}

// Initialize the table on page load
document.addEventListener('DOMContentLoaded', function() {
    fetchTopExpenses({}, 1);
    
    // Add refresh button functionality
    const refreshBtn = document.getElementById('refresh-transactions');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            this.innerHTML = '<i class="fas fa-spinner fa-spin mr-1.5"></i> Refreshing';
            this.disabled = true;
            
            fetchTopExpenses({}, 1).finally(() => {
                setTimeout(() => {
                    this.innerHTML = '<i class="fas fa-sync-alt mr-1.5"></i> Refresh';
                    this.disabled = false;
                }, 500);
            });
        });
    }
});

// Setup filters
function setupFilters() {
    document.getElementById('apply-filters').addEventListener('click', () => {
        const filters = {
            days: document.getElementById('date-range').value,
            category: document.getElementById('category-filter').value,
            payment_method: document.getElementById('payment-filter').value
        };
        
        // Handle custom date range
        if (filters.days === 'custom') {
            const fromDate = document.getElementById('date-from').value;
            const toDate = document.getElementById('date-to').value;
            
            if (!fromDate || !toDate) {
                showToast('Please select both start and end dates', 'error');
                return;
            }
            
            filters.date_from = fromDate;
            filters.date_to = toDate;
            delete filters.days;
        }
        
        fetchAnalyticsData(filters);
    });
}

// Fetch all analytics data with filters
async function fetchAnalyticsData(filters = {}) {
    try {
        // showLoading();
        currentFilters = filters;
        currentPage = 1;
        
        // Build query parameters
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(filters)) {
            if (value) params.append(key, value);
        }
        
        // Get granularity for trend chart
        const granularity = document.getElementById('trend-granularity').value;
        params.append('granularity', granularity);
        
        // Show loading state on apply button
        const applyBtn = document.getElementById('apply-filters');
        const filterText = document.getElementById('filter-text');
        const filterLoading = document.getElementById('filter-loading');
        
        filterText.classList.add('hidden');
        filterLoading.classList.remove('hidden');
        applyBtn.disabled = true;
        
        // Fetch all data in parallel
        const [monthData, trendData, categoryData, paymentData] = await Promise.all([
            fetch(`/expenses/this_month/?${params}`, { headers: getAuthHeaders() }).then(res => res.json()),
            fetch(`/expenses/monthly_spending/?${params}`, { headers: getAuthHeaders() }).then(res => res.json()),
            fetch(`/expenses/spending_category/?${params}`, { headers: getAuthHeaders() }).then(res => res.json()),
            fetch(`/expenses/spending_payments/?${params}`, { headers: getAuthHeaders() }).then(res => res.json())
        ]);
        
        // Update all components with new data
        updateMonthSummary(monthData);
        updateTrendChart(trendData, granularity);
        updateCategoryChart(categoryData);
        updatePaymentChart(paymentData);
        
        // Also fetch top expenses
        await fetchTopExpenses(filters, currentPage);
        
    } catch (error) {
        console.error('Error fetching analytics data:', error);
        handleAPIError(error);
    } finally {
        hideLoading();
        
        // Restore apply button state
        const filterText = document.getElementById('filter-text');
        const filterLoading = document.getElementById('filter-loading');
        
        filterText.classList.remove('hidden');
        filterLoading.classList.add('hidden');
        document.getElementById('apply-filters').disabled = false;
    }
}

// Setup date range selector
function setupDateRangeSelector() {
    const dateRangeSelect = document.getElementById('date-range');
    const customDateRange = document.getElementById('custom-date-range');
    
    dateRangeSelect.addEventListener('change', function() {
        if (this.value === 'custom') {
            customDateRange.classList.remove('hidden');
            
            // Set default dates (last 30 days)
            const today = new Date();
            const lastMonth = new Date();
            lastMonth.setDate(today.getDate() - 30);
            
            document.getElementById('date-to').valueAsDate = today;
            document.getElementById('date-from').valueAsDate = lastMonth;
        } else {
            customDateRange.classList.add('hidden');
        }
    });
}

// Setup export button
function setupExportButton() {
    document.getElementById('export-trend').addEventListener('click', () => {
        trendChart.dataURI({
            scale: 2,
            quality: 1
        }).then((uri) => {
            const link = document.createElement('a');
            link.download = 'spending-trend-' + new Date().toISOString().slice(0, 10) + '.png';
            link.href = uri;
            link.click();
        });
    });
}

// Setup granularity selector
function setupGranularitySelector() {
    document.getElementById('trend-granularity').addEventListener('change', function() {
        fetchAnalyticsData(currentFilters);
    });
}

// Check authentication status
function checkAuth() {
    const token = localStorage.getItem('access_token');
    if (!token) {
        window.location.href = '/login/';
        return false;
    }
    return true;
}

// Initialize everything when DOM is loaded
window.addEventListener('load', () => {
    if (!checkAuth()) return;

    initCharts();
    setupDateRangeSelector();
    setupFilters();
    setupPagination();
    setupExportButton();
    setupGranularitySelector();

    fetchAnalyticsData();
});


// Handle window resize for better mobile experience
window.addEventListener('resize', () => {
    if (trendChart) {
        trendChart.updateOptions({
            chart: {
                height: window.innerWidth < 640 ? 250 : 300
            }
        });
    }
    if (categoryChart) {
        categoryChart.updateOptions({
            chart: {
                height: window.innerWidth < 640 ? 250 : 300
            }
        });
    }
    if (paymentChart) {
        paymentChart.updateOptions({
            chart: {
                height: window.innerWidth < 640 ? 250 : 300
            }
        });
    }
});