from django.contrib import admin
from .models import Expense

@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ('user', 'type', 'amount', 'category', 'created_at_with_time')

    def created_at_with_time(self, obj):
        return obj.created_at.strftime("%Y-%m-%d %H:%M:%S")
    
    created_at_with_time.short_description = 'Created At'
