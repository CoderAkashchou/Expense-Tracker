from rest_framework import serializers
from users.models import *
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.contrib.auth import authenticate



class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('id', 'email','first_name','last_name', 'phone_number','date_of_birth','gender', 'password')

    

    def validate(self, attrs):
        email = attrs.get('email', None)
        phone = attrs.get('phone_number', None)

        if not email and not phone:
            raise serializers.ValidationError("Either email or phone number must be provided.")

        return attrs
    
    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data.get('email'),
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            phone_number=validated_data.get('phone_number'),
            gender=validated_data['gender'],
            date_of_birth=validated_data['date_of_birth'],
        )
        return user
    


class UserAuthSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'phone_number', 'date_of_birth', 'gender']
        read_only_fields = ('__all__',)

            

class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=255)
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        email = data.get('email')
        password = data.get('password')
        if not email or not password:
            raise serializers.ValidationError("Email and Password are required")
        user = authenticate(email=email, password=password)
        if not user:
            raise serializers.ValidationError("Invalid email or password")
        
        return data
    



class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name', 'phone_number', 'profile_image']
        read_only_fields = ['email']
        


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'icon', 'color', 'text_color']




class BudgetSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = BudgetSettings
        fields = ['id', 'user', 'monthly_budget', 'monthly_saving', 'categories', 'budget_reset_date']
        read_only_fields = ['user']



class ConnectedDeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConnectedDevice
        fields = ['id', 'device_name', 'last_active', 'ip_address']