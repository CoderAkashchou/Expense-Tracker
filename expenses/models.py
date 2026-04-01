from django.db import models
from users.models import User


# 🔥 Dynamic upload path for receipts
def receipt_upload_path(instance, filename):
    return f"receipts/{instance.user.id}/{instance.date.year}/{instance.date.month:02}/{filename}"


class Expense(models.Model):
    TRANSACTION_TYPES = [
        ('expenses', 'Expenses'),
        ('income', 'Income')
    ]

    PAYMENT_METHODS = [
        ('cash', 'Cash'),
        ('upi', 'UPI'),
        ('debit', 'Debit Card'),
        ('credit', 'Credit Card'),
        ('bank', 'Bank Transfer')
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    type = models.CharField(max_length=10, choices=TRANSACTION_TYPES)
    date = models.DateField()
    amount = models.DecimalField(max_digits=10, decimal_places=2)

    category = models.ForeignKey(
        'users.Category',
        on_delete=models.CASCADE,
        related_name='expenses'
    )

    description = models.CharField(max_length=255, blank=True)

    payment_method = models.CharField(max_length=10, choices=PAYMENT_METHODS)

    # ✅ UPDATED RECEIPT FIELD
    receipt = models.FileField(
        upload_to=receipt_upload_path,
        blank=True,
        null=True
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date', '-created_at']
        indexes = [
            models.Index(fields=['user', 'date']),
            models.Index(fields=['user', 'category']),
            models.Index(fields=['user', 'type']),
            models.Index(fields=['user', 'payment_method']),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.type} - {self.category} - {self.amount}"
