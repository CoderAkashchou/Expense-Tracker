from datetime import date, timedelta
from django.shortcuts import render, get_object_or_404
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from users.models import User
from users.utils import log_device
from users.serializers import *
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken, TokenError 
from django.contrib.auth import authenticate
from rest_framework.permissions import IsAuthenticated, AllowAny


# Create your views here.

def register_page(request):
    return render(request, 'signup.html')

def login_page(request):
    return render(request, 'login.html')

def dashboard_page(request):
    return render(request, 'dashboard.html')

def analytics_page(request):
    return render(request, 'analytics.html')

def transactions_page(request):
    return render(request, 'transactions.html')

def profile_page(request):
    return render(request, 'profile.html')



class UserRegistrationAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid(raise_exception=True):
            try:
                user = serializer.save()
                log_device(request, user)
                token = self.get_tokens_for_user(user)
                user_serializer = UserAuthSerializer(user)
                response_data = {
                    'user': user_serializer.data,
                    'token': token
                }
                return Response(response_data, status=status.HTTP_201_CREATED)
            except Exception as e:
                return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



    def get_tokens_for_user(self, user):
        """
        Generates JWT tokens (access and refresh) for the user.
        """
        refresh = RefreshToken.for_user(user)
        return {
            'access': str(refresh.access_token),
            'refresh': str(refresh)
        }
    

class UserLoginAPIView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)

        # Validate the serializer data
        if serializer.is_valid(raise_exception=True):
            email = serializer.validated_data['email']
            password = serializer.validated_data['password']

            # Try to authenticate the user
            user = authenticate(email=email, password=password)
            if user is not None and not user.is_active:
                return Response({'detail': 'Your account is deactivated. Please contact support.'},status=status.HTTP_403_FORBIDDEN)

            if user:
                log_device(request, user)
                # If authentication is successful, generate tokens
                token = self.get_tokens_for_user(user)

                # Serialize user data
                user_serializer = UserAuthSerializer(user)
                response_data = {
                    'user': user_serializer.data,
                    'token': token
                }

                return Response(response_data, status=status.HTTP_200_OK)

            # If user is not authenticated or inactive, return error
            return Response({'detail': 'Invalid credentials or user inactive.'}, status=status.HTTP_401_UNAUTHORIZED)

        # If the serializer data is not valid, return errors
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def get_tokens_for_user(self, user):
        """
        Generates JWT tokens (access and refresh) for the user.
        """
        refresh = RefreshToken.for_user(user)
        return {
            'access': str(refresh.access_token),
            'refresh': str(refresh)
        }
    

class UserLogoutAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if not refresh_token:
                return Response({"detail": "Refresh token required."}, status=status.HTTP_400_BAD_REQUEST)
            
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"detail": "Logout successful. Redirecting to login page."}, status=status.HTTP_200_OK)
        
        except TokenError as e:
            return Response({"detail": "Invalid or expired token."}, status=status.HTTP_400_BAD_REQUEST)



class ChangePasswordAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        current_password = request.data.get("current_password")
        new_password = request.data.get("new_password")
        confirm_password = request.data.get("confirm_password")

        if not user.check_password(current_password):
            return Response({"error": "Current password is incorrect."}, status=status.HTTP_400_BAD_REQUEST)
        
        if new_password != confirm_password:
            return Response({"error": "New passwords do not match."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            validate_password(new_password, user=user)
        except ValidationError as e:
            return Response({"errors": e.messages}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()
        return Response({"message": "Password updated successfully."}, status=status.HTTP_200_OK)




class DeactivateAccountAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        user = request.user
        user.is_active = False
        user.save()
        return Response({"detail": "Account deactivated successfully."}, status=status.HTTP_200_OK)



class ProfileAPIView(APIView):
    permission_classes = [IsAuthenticated]


    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)
    
    def put(self, request):
        serializer = UserProfileSerializer(request.user, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def patch(self, request):
        serializer = UserProfileSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    


class BudgetSettingsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        budget_settings, created = BudgetSettings.objects.get_or_create(user=request.user)
        serializer = BudgetSettingsSerializer(budget_settings)
        return Response(serializer.data)

    def post(self, request):
        data = request.data.copy()
        category_ids = data.pop('categrories', [])

    
        monthly_budget = data.get('monthly_budget')
        monthly_saving = data.get('monthly_saving')

        if monthly_budget and monthly_saving:
            try:
                monthly_budget = float(monthly_budget)
                monthly_saving = float(monthly_saving)

                if monthly_saving > monthly_budget:
                    return Response({'detail': 'Monthly saving cannot exceed monthly budget.'}, status=status.HTTP_400_BAD_REQUEST)
            except ValueError:
                return Response({'detail': 'Invalid budget or saving value.'}, status=status.HTTP_400_BAD_REQUEST)

        if BudgetSettings.objects.filter(user=request.user).exists():
            return Response({"detail": "Budget settings already exist."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = BudgetSettingsSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request):
        budget_settings = get_object_or_404(BudgetSettings, user=request.user)
        data = request.data.copy()

        category_ids = data.pop('categories', None)

        monthly_budget = data.get('monthly_budget')
        monthly_saving = data.get('monthly_saving')

        if monthly_budget and monthly_saving:
            try:
                monthly_budget = float(monthly_budget)
                monthly_saving = float(monthly_saving)
                if monthly_saving > monthly_budget:
                    return Response({'detail': 'Monthly saving cannot exceed monthly budget.'}, status=status.HTTP_400_BAD_REQUEST)
            except ValueError:
                return Response({'detail': 'Invalid budget or saving value.'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = BudgetSettingsSerializer(budget_settings, data=data, partial=True)
        if serializer.is_valid():
            budget = serializer.save()

            if category_ids is not None:
                budget.categories.set(category_ids)
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request):
        category_id = request.query_params.get('category_id')
        if not category_id:
            return Response({'detail': 'Category name is required.'}, status=status.HTTP_400_BAD_REQUEST)

        budget_settings = get_object_or_404(BudgetSettings, user=request.user)

        try:
            category = Category.objects.get(id=category_id)
        except Category.DoesNotExist:
            return Response(
                {'detail': 'Category not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        budget_settings.categories.remove(category)

        return Response(
            {'detail': f'Category "{category.name}" removed successfully'},
            status=status.HTTP_200_OK
        )

class CategoryListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        categories = Category.objects.filter(is_active=True)
        serializer = CategorySerializer(categories, many=True)
        return Response(serializer.data)



class UserBudgetCategoriesListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        budget = BudgetSettings.objects.filter(user=request.user).first()

        if not budget:
            return Response({"categories": []})
        
        serializer = CategorySerializer(budget.categories.all(), many=True)
        return Response(serializer.data)


class ListConnectedDevicesAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        devices = ConnectedDevice.objects.filter(user=request.user).order_by('-last_active')
        serializer = ConnectedDeviceSerializer(devices, many=True)
        return Response(serializer.data)
    
    
class LogoutDeviceAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, device_id):
        try:
            device = ConnectedDevice.objects.get(id=device_id, user=request.user)
            device.delete()
            return Response({"detail": "Device logged out successfully."}, status=status.HTTP_200_OK)
        except ConnectedDevice.DoesNotExist:
            return Response({"detail": "Device not found."}, status=status.HTTP_404_NOT_FOUND)


class LogoutAllDevicesAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        current_ip = request.META.get('REMOTE_ADDR')
        ConnectedDevice.objects.filter(user=request.user).exclude(ip_address=current_ip).delete()
        return Response({"detail": "All other devices logged out successfully."}, status=status.HTTP_200_OK)
