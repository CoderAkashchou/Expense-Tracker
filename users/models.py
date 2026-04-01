from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils.translation import gettext_lazy as _

# Create your models here.


def profile_upload_path(instance, filename):
    return f"users/{instance.id}/profile/{filename}"

class UserManager(BaseUserManager):
    """Custom user model manager with email as main identifier"""

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError(_('The Email must be set'))
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)




class User(AbstractBaseUser, PermissionsMixin):
    gender_choices = [
        ('F', 'Female'),
        ('M', 'Male'),
        ('C', 'Custom'),
    ]
    email = models.EmailField(max_length=255, unique=True)
    first_name = models.CharField(max_length=30)
    last_name = models.CharField(max_length=30)
    gender = models.CharField(max_length=1, choices=gender_choices)
    phone_number = models.CharField(max_length=15, null=True, blank=True)
    date_of_birth = models.DateField()
    profile_image = models.ImageField(upload_to='profiles/', null=True, blank=True)
    is_verified = models.BooleanField(_('verified'), default=False)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


    #UserManager for creating and managing users 
    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name', 'date_of_birth']

    def __str__(self):
        return self.email

    


# Notification Settings Model
class NotificationSettings(models.Model):
    BUDGET_ALERT_CHOICES = [
        ('80', 'When I exceed 80% of budget'),
        ('50', 'When I exceed 50% of budget'),
        ('100', 'When I exceed budget'),
        ('never', 'Never'),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='notification_settings')
    email_notifications = models.BooleanField(default=False)
    push_notifications = models.BooleanField(default=False)
    budget_alerts = models.CharField(max_length=10, choices=BUDGET_ALERT_CHOICES, default='50')
    large_expense_alerts = models.PositiveIntegerField(default=2000)




class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(unique=True)
    icon = models.CharField(max_length=10)
    color = models.CharField(max_length=50)
    text_color = models.CharField(max_length=50)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name



# Budgets Settings Model
class BudgetSettings(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='budget_settings')
    monthly_budget = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    monthly_saving = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    categories = models.ManyToManyField(Category, blank=True)
    budget_reset_date = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"Budget settings for {self.user.email}"
    


# Connected Devices Model
class ConnectedDevice(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='connected_devices')
    device_name = models.CharField(max_length=255)
    last_active = models.DateTimeField(auto_now=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    def __str__(self):
        return f"{self.device_name} - {self.user.email}"
