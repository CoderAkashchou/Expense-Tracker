from django.contrib import admin
from users.models import *
# Register your models here.

admin.site.register(User)
admin.site.register(NotificationSettings)
admin.site.register(BudgetSettings)
admin.site.register(ConnectedDevice)
admin.site.register(Category)
