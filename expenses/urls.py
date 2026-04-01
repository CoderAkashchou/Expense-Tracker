from django.urls import path
from .views.expenses import *
from .views.analytics import *

urlpatterns = [
    # Add your expense-related URLs here 
    path('user_expenses/', ExpenseAPIView.as_view(), name='expenses'),
    path('expense_detail/<int:pk>/', ExpenseDetailAPIView.as_view(), name='expense detail'),

    # APIs for Dashboard page
    path('balance/', CurrentBalanceAPIView.as_view(), name='balance'),
    path('budget_summary/', BudgetSummaryAPIView.as_view(), name='budget-summary'),
    path('expense-breakdown/', ExpenseBreakdownAPIView.as_view(), name='expense-breakdown'),
    path('recent-transactions/', RecentTransactionsAPIView.as_view(), name='recent-transactions'),
    path('calendar-data/', CalendarDataAPIView.as_view(), name='calendar-data'),
    path('daily-expenses/', DailyExpensesAPIView.as_view(), name='daily-expenses'),



    # Add your Analytics-related URLs here 
    path('this_month/', MonthAPIView.as_view(), name='this_month'),
    path('monthly_spending/', MonthlySpendingTrendAPIView.as_view(), name='monthly_spending'),
    path('spending_category/', SpendingByCategoryAPIView.as_view(), name='spending_category'),
    path('spending_payments/', SpendingByPaymentMethodAPIView.as_view(), name='spending_payments'),
    path('top_expenses/', TopExpensesAPIView.as_view(), name='top_expenses'),
    


]