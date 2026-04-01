from rest_framework import serializers
from .models import Expense
from users.models import BudgetSettings, Category


class ExpenseSerializer(serializers.ModelSerializer):

    # WRITE (POST / PUT)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source='category',
        write_only=True
    )

    # READ (GET)
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_icon = serializers.CharField(source='category.icon', read_only=True)
    category_color = serializers.CharField(source='category.color', read_only=True)
    category_text_color = serializers.CharField(source='category.text_color', read_only=True)

    # ✅ Explicit receipt field
    receipt = serializers.FileField(required=False, allow_null=True)

    class Meta:
        model = Expense
        fields = [
            'id',
            'type',
            'date',
            'amount',

            # category
            'category_id',
            'category_name',
            'category_icon',
            'category_color',
            'category_text_color',

            'description',
            'payment_method',
            'receipt',
            'created_at',
        ]

        read_only_fields = [
            'id',
            'created_at',
            'category_name',
            'category_icon',
            'category_color',
            'category_text_color',
        ]

    def validate(self, attrs):
        user = self.context['request'].user
        category = attrs.get('category')

        budget = BudgetSettings.objects.filter(user=user).first()
        if not budget:
            raise serializers.ValidationError("Please setup budget first.")

        if not budget.categories.filter(id=category.id).exists():
            raise serializers.ValidationError("Selected category not allowed.")

        return attrs
