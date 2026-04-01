from datetime import date, timedelta
from calendar import monthrange
from django.shortcuts import render, get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from django.db.models import Sum
from django.db.models.functions import TruncMonth
from django.utils.timezone import now
from decimal import Decimal

from rest_framework.permissions import IsAuthenticated
from expenses.models import Expense
from users.models import BudgetSettings
from expenses.serializers import ExpenseSerializer


class MonthAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        today = date.today()

        start_date = today.replace(day=1)
        end_date = today

        this_month_qs = Expense.objects.filter(
            user=user, type='expenses', date__range=(start_date, end_date)
        )

        total_expenses = this_month_qs.aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        transactions_count = this_month_qs.count()

        # Determine last month start and end robustly
        last_month_end = start_date - timedelta(days=1)
        last_month_start = last_month_end.replace(day=1)

        last_month_total = Expense.objects.filter(
            user=user, type='expenses', date__range=(last_month_start, last_month_end)
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

        # Budget settings safe
        budget_setting = getattr(user, 'budget_settings', None)
        monthly_budget = (getattr(budget_setting, 'monthly_budget', Decimal('0.00')) or Decimal('0.00'))

        budget_remaining = monthly_budget - total_expenses
        budget_used_percentage = (total_expenses / monthly_budget * 100) if monthly_budget and monthly_budget != Decimal('0.00') else Decimal('0.00')

        daily_average = (total_expenses / Decimal(today.day)) if today.day else Decimal('0.00')

        # percent change safe
        if last_month_total and last_month_total != Decimal('0.00'):
            percent_change = ((total_expenses - last_month_total) / last_month_total) * Decimal('100.0')
        else:
            # if last month was zero, percent change not computable — return 0 or None as you prefer
            percent_change = Decimal('0.00')

        return Response({
            "total_expenses": float(round(total_expenses, 2)),
            "transactions": transactions_count,
            "daily_average": float(round(daily_average, 2)),
            "budget_remaining": float(round(budget_remaining, 2)),
            "budget_used_percentage": float(round(budget_used_percentage, 2)),
            "percent_change": float(round(percent_change, 2))
        })

class MonthlySpendingTrendAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        today = date.today()

        # Aggregate in a single query grouped by month for the current year
        queryset = (
            Expense.objects
            .filter(
                user=user,
                type='expenses',
                date__year=today.year,
                date__lte=today,
            )
            .annotate(month=TruncMonth('date'))
            .values('month')
            .annotate(total=Sum('amount'))
        )

        totals_by_month = {
            item['month'].month: item['total'] or 0 for item in queryset
        }

        data = []
        for month in range(1, 13):
            total = totals_by_month.get(month, 0)
            month_start = date(today.year, month, 1)

            data.append({
                "month": month_start.strftime("%b"),
                "amount": round(float(total), 2),
            })

        return Response(data)

    


class SpendingByCategoryAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        today = date.today()
        start_date = today.replace(day=1)

        expenses_by_category = (
            Expense.objects
            .filter(
                user=user,
                type='expenses',
                date__gte=start_date
            )
            .values(
                'category__id',
                'category__name',
                'category__icon',
                'category__color',
                'category__text_color'
            )
            .annotate(total=Sum('amount'))
            .order_by('-total')
        )

        total_spent = sum(item['total'] for item in expenses_by_category) or 0

        result = []
        for item in expenses_by_category:
            percent = (item['total'] / total_spent) * 100 if total_spent else 0

            result.append({
                "category_id": item['category__id'],
                "category": item['category__name'],
                "icon": item['category__icon'],
                "color": item['category__color'],
                "text_color": item['category__text_color'],
                "total": round(float(item['total']), 2),
                "percent": round(percent, 1),
            })

        return Response(result)


class SpendingByPaymentMethodAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        today = date.today()
        start_date = today.replace(day=1)

        expenses_by_payment = (Expense.objects.filter(user=user, type='expenses', date__gte=start_date).values('payment_method').annotate(total=Sum('amount')))
        payment_method_map = dict(Expense.PAYMENT_METHODS)

        result = []
        for item in expenses_by_payment:
            result.append({
                'payment_method': payment_method_map.get(item['payment_method'], item['payment_method']),
                'total': round(item['total'], 2)
            })

        return Response(result)



class TopExpensesAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        today = date.today()
        start_date = today.replace(day=1)

        top_expenses = (
            Expense.objects
            .filter(user=user, type='expenses', date__gte=start_date)
            .select_related('category')
            .order_by('-amount')[:5]
        )

        data = []
        for exp in top_expenses:
            data.append({
                "id": exp.id,
                "date": exp.date,
                "amount": float(exp.amount),
                "description": exp.description,
                "payment_method": exp.payment_method,
                "icon": exp.category.icon if exp.category else None,
                "color": exp.category.color if exp.category else None,
                "text_color": exp.category.text_color if exp.category else None,
                "category": exp.category.name if exp.category else None,
            })

        return Response(data)