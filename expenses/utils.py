from datetime import date, timedelta
from calendar import monthrange

def get_next_reset_date(today, reset_day_str, salary_day=None):
    if reset_day_str == '1st':
        return (today.replace(day=1) + timedelta(days=32)).replace(day=1)
    
    elif reset_day_str == '15th':
        if today.day < 15:
            return today.replace(day=15)
        else:
            next_month = (today.replace(day=1) + timedelta(days=32)).replace(day=1)
            return next_month.replace(day=15)

    elif reset_day_str == 'salary' and salary_day:
        if today.day < salary_day:
            return today.replace(day=salary_day)
        else:
            next_month = (today.replace(day=1) + timedelta(days=32)).replace(day=1)
            last_day_next_month = monthrange(next_month.year, next_month.month)[1]
            safe_day = min(salary_day, last_day_next_month)
            return next_month.replace(day=safe_day)

    return (today.replace(day=1) + timedelta(days=32)).replace(day=1)
