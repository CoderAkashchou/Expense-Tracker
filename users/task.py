from celery import shared_task
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings

@shared_task
def send_congratulations_email(user_email, user_name=None):
    """
    Send a beautiful welcome email to new users using the HTML template
    """
    try:
        # Set default name if not provided
        if not user_name:
            user_name = "there"
        
        # Context for the email template
        context = {
            'name': user_name,
            'login_url': 'http://localhost:8000/accounts/login/',  # Update with your actual login URL
            'help_center_url': 'http://localhost:8000/help/',      # Update with your actual help URL
            'contact_url': 'http://localhost:8000/contact/',       # Update with your actual contact URL
        }
        
        # Render HTML content from your template
        html_content = render_to_string('emails/welcome_email.html', context)
        
        # Create plain text version (fallback for email clients that don't support HTML)
        text_content = f"""
        Welcome to FinDash!
        
        Congratulations, {user_name}!
        
        Thank you for joining FinDash. We're excited to help you take control of your finances and achieve your financial goals.
        
        Features:
        • Expense Tracking - Track your spending with powerful analytics and insights
        • Budget Management - Create and manage budgets to achieve your financial goals
        • Multi-Device Sync - Access your financial data anywhere, anytime
        
        Get started now: {context['login_url']}
        
        Need help getting started? Check out our Help Center: {context['help_center_url']}
        or contact our support team: {context['contact_url']}
        
        Follow us on social media for tips and updates!
        
        © 2023 FinDash. All rights reserved.
        You're receiving this email because you created an account with FinDash.
        """
        
        # Create email
        subject = "🎉 Welcome to FinDash! Your Financial Journey Begins"
        
        email = EmailMultiAlternatives(
            subject=subject,
            body=text_content,  # Plain text version
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[user_email],
        )
        
        # Attach HTML version
        email.attach_alternative(html_content, "text/html")
        
        # Send email
        email.send()
        
        return f"Beautiful welcome email sent successfully to {user_email}"
        
    except Exception as e:
        print(f"Error sending welcome email: {str(e)}")
        return f"Failed to send welcome email to {user_email}: {str(e)}"