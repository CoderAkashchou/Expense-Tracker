from datetime import date, timedelta
from calendar import monthrange
from django.shortcuts import render, get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from django.db.models import Sum, Q
from django.utils.timezone import now
from rest_framework import status as drf_status
from django.utils.dateparse import parse_date


from decimal import Decimal, InvalidOperation

from rest_framework.permissions import IsAuthenticated
from expenses.models import Expense
from users.models import BudgetSettings, Category
from expenses.serializers import ExpenseSerializer

# Create your views here.


class ExpenseAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        paginator = PageNumberPagination()
        paginator.page_size = 10

        expenses = Expense.objects.filter(user=request.user)

        # Filters
        category = request.query_params.get('category')
        payment_method = request.query_params.get('payment_method')
        description = request.query_params.get('description')

        date_str = request.query_params.get('date')
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')

        min_amount_str = request.query_params.get('min_amount')
        max_amount_str = request.query_params.get('max_amount')

        if category:
            expenses = expenses.filter(category__name__icontains=category)
        if payment_method:
            expenses = expenses.filter(payment_method=payment_method)
        if description:
            expenses = expenses.filter(description__icontains=description)

        # Single-date filter
        if date_str:
            parsed_date = parse_date(date_str)
            if not parsed_date:
                return Response(
                    {'detail': 'Invalid date format. Expected YYYY-MM-DD.'},
                    status=drf_status.HTTP_400_BAD_REQUEST,
                )
            expenses = expenses.filter(date=parsed_date)

        # Date range filter
        if start_date_str and end_date_str:
            start_date = parse_date(start_date_str)
            end_date = parse_date(end_date_str)
            if not start_date or not end_date:
                return Response(
                    {'detail': 'Invalid start_date or end_date format. Expected YYYY-MM-DD.'},
                    status=drf_status.HTTP_400_BAD_REQUEST,
                )
            if start_date > end_date:
                return Response(
                    {'detail': 'start_date cannot be after end_date.'},
                    status=drf_status.HTTP_400_BAD_REQUEST,
                )
            expenses = expenses.filter(date__range=[start_date, end_date])
        elif start_date_str:
            start_date = parse_date(start_date_str)
            if not start_date:
                return Response(
                    {'detail': 'Invalid start_date format. Expected YYYY-MM-DD.'},
                    status=drf_status.HTTP_400_BAD_REQUEST,
                )
            expenses = expenses.filter(date__gte=start_date)
        elif end_date_str:
            end_date = parse_date(end_date_str)
            if not end_date:
                return Response(
                    {'detail': 'Invalid end_date format. Expected YYYY-MM-DD.'},
                    status=drf_status.HTTP_400_BAD_REQUEST,
                )
            expenses = expenses.filter(date__lte=end_date)

        # Amount range filter
        min_amount = max_amount = None
        try:
            if min_amount_str:
                min_amount = Decimal(min_amount_str)
            if max_amount_str:
                max_amount = Decimal(max_amount_str)
        except (InvalidOperation, ValueError):
            return Response(
                {'detail': 'min_amount and max_amount must be valid numbers.'},
                status=drf_status.HTTP_400_BAD_REQUEST,
            )

        if min_amount is not None and max_amount is not None and min_amount > max_amount:
            return Response(
                {'detail': 'min_amount cannot be greater than max_amount.'},
                status=drf_status.HTTP_400_BAD_REQUEST,
            )

        if min_amount is not None:
            expenses = expenses.filter(amount__gte=min_amount)
        if max_amount is not None:
            expenses = expenses.filter(amount__lte=max_amount)

        expenses = expenses.order_by('-id')

        page = paginator.paginate_queryset(expenses, request)
        serializer = ExpenseSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    
    def post(self, request):
        data = request.data.copy()
        serializer = ExpenseSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ExpenseDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk, user):
        return get_object_or_404(Expense, pk=pk, user=user)

    def get(self, request, pk):
        expense = self.get_object(pk, request.user)
        return Response(ExpenseSerializer(expense).data)

    def patch(self, request, pk):
        expense = self.get_object(pk, request.user)
        serializer = ExpenseSerializer(
            expense,
            data=request.data,
            partial=True,
            context={"request": request}
        )
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        expense = self.get_object(pk, request.user)
        expense.delete()
        return Response({'detail': 'Deleted'}, status=200)





class CurrentBalanceAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        today = date.today()

        # Use conditional aggregation so we hit DB only once
        agg = Expense.objects.filter(
            user=user,
            date__month=today.month,
            date__year=today.year
        ).aggregate(
            total_expenses=Sum('amount', filter=Q(type='expenses')),
            total_income=Sum('amount', filter=Q(type='income'))
        )

        expenses = agg.get('total_expenses') or Decimal('0.00')
        income = agg.get('total_income') or Decimal('0.00')

        # Get budget safely
        budget_settings = getattr(user, 'budget_settings', None)
        monthly_budget = getattr(budget_settings, 'monthly_budget', Decimal('0.00')) or Decimal('0.00')
        monthly_saving = getattr(budget_settings, 'monthly_saving', Decimal('0.00')) or Decimal('0.00')

        # remaining budget = budget + income - expenses  (kept Decimal)
        remaining_budget = (monthly_budget + income - expenses)

        # Return floats (frontend-friendly), but keep rounding consistent
        return Response({
            "monthly_budget": float(round(monthly_budget, 2)),
            "monthly_saving": float(round(monthly_saving, 2)),
            "total_income": float(round(income, 2)),
            "total_expenses": float(round(expenses, 2)),
            "remaining_budget": float(round(remaining_budget, 2))
        })
    


class BudgetSummaryAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        budget = getattr(user, 'budget_settings', None)
        if not budget:
            return Response({"detail": "Budget settings not found."}, status=404)

        today = now().astimezone().date()

        if not budget.budget_reset_date:
            return Response({"detail": "Budget reset date not set."}, status=400)

        reset_day = budget.budget_reset_date.day

        # Determine current budget cycle start_date
        # If today's day >= reset_day -> current cycle started this month on reset_day
        # Else -> cycle started on previous month at reset_day (cap to last day)
        if today.day >= reset_day:
            start_date = today.replace(day=reset_day)
        else:
            # get last day of previous month safely
            first_of_this_month = today.replace(day=1)
            prev_month_last_day = first_of_this_month - timedelta(days=1)
            # build start_date in prev month with min(reset_day, last_day_prev_month)
            last_day_prev_month = prev_month_last_day.day
            start_date = prev_month_last_day.replace(day=min(reset_day, last_day_prev_month))

        # compute next reset date
        # start_date may be in any month; next reset is month after start_date on reset_day (cap to that month's last day)
        next_month = (start_date.replace(day=28) + timedelta(days=4)).replace(day=1)  # reliable next month first day
        year = next_month.year
        month = next_month.month
        days_in_month = monthrange(year, month)[1]
        next_reset = date(year, month, min(reset_day, days_in_month))

        days_left = (next_reset - today).days
        if days_left <= 0:
            days_left = 1  # avoid division by zero

        spent_agg = Expense.objects.filter(
            user=user,
            type='expenses',
            date__gte=start_date,
            date__lte=today
        ).aggregate(total_spent=Sum('amount'))

        spent = spent_agg.get('total_spent') or Decimal('0.00')
        monthly_budget = (budget.monthly_budget or Decimal('0.00')) or Decimal('0.00')
        remaining = monthly_budget - spent
        # daily budget left = remaining / days_left, ensure Decimal arithmetic
        daily_budget = (remaining / days_left) if days_left > 0 else Decimal('0.00')

        return Response({
            "monthly_budget": float(round(monthly_budget, 2)),
            "spent": float(round(spent, 2)),
            "remaining": float(round(remaining, 2)),
            "days_left": int(days_left),
            "daily_budget": float(round(daily_budget, 2)),
            "next_reset": next_reset.isoformat(),
            "start_date": start_date.isoformat()
        })


class ExpenseBreakdownAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        
        # Get expenses grouped by category with category details
        expenses_by_category = Expense.objects.filter(
            user=user, 
            type='expenses'
        ).values('category_id').annotate(
            total=Sum('amount')
        ).order_by('-total')
        
        breakdown = []
        total_spent = 0
        
        for item in expenses_by_category:
            try:
                category = Category.objects.get(id=item['category_id'])
                breakdown.append({
                    "category_id": category.id,
                    "category": category.name,
                    "icon": category.icon,
                    "color": category.color,
                    "text_color": category.text_color,
                    "total": float(item['total'])
                })
                total_spent += float(item['total'])
            except Category.DoesNotExist:
                continue
        
        return Response({
            "breakdown": breakdown,
            "total_spent": float(total_spent)
        })
    



class RecentTransactionsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        limit_param = request.GET.get('limit', 5)
        try:
            limit = int(limit_param)
        except (TypeError, ValueError):
            return Response(
                {'detail': 'limit must be a positive integer.'},
                status=drf_status.HTTP_400_BAD_REQUEST,
            )

        if limit <= 0:
            return Response(
                {'detail': 'limit must be a positive integer.'},
                status=drf_status.HTTP_400_BAD_REQUEST,
            )

        transactions = Expense.objects.filter(
            user=request.user
        ).select_related('category').order_by('-created_at')[:limit]

        data = []
        for tx in transactions:
            data.append({
                "id": tx.id,
                "type": tx.type,
                "date": tx.date,
                "amount": float(tx.amount),
                "icon": tx.category.icon if tx.category else None,
                "color": tx.category.color if tx.category else None,
                "text_color": tx.category.text_color if tx.category else None,
                "description": tx.description[:35],
                "payment_method": tx.payment_method,
                "created_at": tx.created_at,
            })

        return Response(data)

    permission_classes = [IsAuthenticated]

    

class CalendarDataAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            month = int(request.query_params.get('month', date.today().month))
            year = int(request.query_params.get('year', date.today().year))
        except ValueError:
            return Response({'error': 'Invalid month/year'}, status=drf_status.HTTP_400_BAD_REQUEST)

        first_day = date(year, month, 1)
        last_day = date(year, month, monthrange(year, month)[1])

        budget = getattr(request.user, 'budget_settings', None)

        if not budget or not budget.budget_reset_date:
            daily_budget = Decimal('0.00')
        else:
            today = date.today()
            reset_day = budget.budget_reset_date.day

            if today.day >= reset_day:
                start_date = today.replace(day=reset_day)
            else:
                prev_month_last_day = today.replace(day=1) - timedelta(days=1)
                start_date = prev_month_last_day.replace(
                    day=min(reset_day, prev_month_last_day.day)
                )

            next_month = (start_date.replace(day=28) + timedelta(days=4)).replace(day=1)
            days_in_next_month = monthrange(next_month.year, next_month.month)[1]
            next_reset = date(
                next_month.year,
                next_month.month,
                min(reset_day, days_in_next_month)
            )

            days_left = max((next_reset - today).days, 1)

            spent = Expense.objects.filter(
                user=request.user,
                type='expenses',
                date__gte=start_date,
                date__lte=today
            ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

            remaining = budget.monthly_budget - spent
            daily_budget = remaining / Decimal(days_left)

        expenses_qs = Expense.objects.filter(
            user=request.user,
            type='expenses',
            date__range=(first_day, last_day)
        ).values('date').annotate(total=Sum('amount'))

        expenses_dict = {e['date'].day: Decimal(e['total'] or 0) for e in expenses_qs}

        start_index = (first_day.weekday() + 1) % 7
        calendar_data = []

        for _ in range(start_index):
            calendar_data.append({
                'day': 0,
                'date': '',
                'amount': 0,
                'status': ''
            })

        for day in range(1, last_day.day + 1):
            amount = expenses_dict.get(day, Decimal('0.00'))

            if amount == 0:
                day_status = 'green'
            elif amount < daily_budget * Decimal('0.8'):
                day_status = 'green'
            elif amount < daily_budget:
                day_status = 'yellow'
            else:
                day_status = 'red'

            calendar_data.append({
                'day': day,
                'date': date(year, month, day).isoformat(),
                'amount': float(amount),
                'status': day_status
            })

        today_dt = date.today()
        days_completed = 0
        if year == today_dt.year and month == today_dt.month:
            days_completed = min((today_dt - first_day).days + 1, last_day.day)

        return Response({
            'calendar_data': calendar_data,
            'daily_budget': round(float(daily_budget), 2),
            'days_completed': days_completed,
            'total_days': last_day.day,
            'weekday': ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
            'current_month': first_day.strftime('%B %Y')
        }, status=drf_status.HTTP_200_OK)


class DailyExpensesAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            date_str = request.query_params.get('date')
            if not date_str:
                return Response({'error': 'Date parameter required'}, status=status.HTTP_400_BAD_REQUEST)
            
            selected_date = date.fromisoformat(date_str)
            expenses = Expense.objects.filter(
                user = request.user,
                date = selected_date,
                type = 'expenses'
            ).order_by('-amount')

            total = expenses.aggregate(total=Sum('amount'))['total'] or 0

            return Response({
                'date': selected_date.strftime('%d %b %Y'),
                'expenses': [{
                    'id': e.id,
                    'category': e.category.name,
                    'description': e.description,
                    'amount': float(e.amount),
                    'payment_method': e.get_payment_method_display(),
                    'receipt': request.build_absolute_uri(e.receipt.url) if e.receipt else None
                } for e in expenses
                ],
                'total': float(total)
            }, status=status.HTTP_200_OK)
        
        except ValueError:
            return Response({'error': 'Invalid date format. Use YYYY-MM-DD'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception:
            # Avoid leaking internal error details
            return Response({'error': 'Something went wrong while fetching daily expenses.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
