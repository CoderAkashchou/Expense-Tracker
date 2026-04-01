from django.urls import path
from .views import *

urlpatterns = [

    # UI pages User  Authentication
    path('', login_page, name="login-page"),
    path('register-page/', register_page, name="signup-page"),
    path('dashboard/', dashboard_page, name="dashboard-page"),         
    path('analytics/', analytics_page, name="analytics-page"),    
    path('transactions/', transactions_page, name="transactions-page"),    
    path('profile/', profile_page, name="profile-page"),



    # APIs  User Authentication
    path('register/', UserRegistrationAPIView.as_view(), name="register"),
    path('login/', UserLoginAPIView.as_view(), name="login"), 
    path('logout/', UserLogoutAPIView.as_view(), name="logout"),
    path('change-password/', ChangePasswordAPIView.as_view(), name='change-password'),
    path('deactivate/', DeactivateAccountAPIView.as_view(), name='deactivate-account'),




    # User Profile
    path('profile_user/', ProfileAPIView.as_view(), name="user-profile"),


    # User BudgetSettings API 
    path('budget_settings/', BudgetSettingsAPIView.as_view(), name='budget-settings'),
    path('budgets/categories/', CategoryListAPIView.as_view(), name='budget-category-list'),
    path('user_categories/', UserBudgetCategoriesListAPIView.as_view(), name='user-budget-category-list'),




    # User Connected Devices APIs
    path('devices/', ListConnectedDevicesAPIView.as_view(), name='list-connected-devices'),
    path('devices/<int:device_id>/logout/', LogoutDeviceAPIView.as_view(), name='logout-device'),
    path('devices/logout-all/', LogoutAllDevicesAPIView.as_view(), name='logout-all-devices'),

]