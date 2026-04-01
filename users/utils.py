import re
from django.utils.timezone import now
from users.models import ConnectedDevice

def get_device_name(user_agent):
    user_agent = user_agent.lower()

    # 📱 Mobile detection
    if 'android' in user_agent:
        match = re.search(r'android.+;\s*(.+?)\s*build', user_agent)
        if match:
            return f"Android - {match.group(1).strip()}"

    if 'iphone' in user_agent:
        return "iPhone"

    if 'ipad' in user_agent:
        return "iPad"

    # 💻 Desktop/Laptop detection
    if 'windows' in user_agent:
        return "Windows (Chrome)" if 'chrome' in user_agent else "Windows (Edge)" if 'edg' in user_agent else "Windows"

    if 'macintosh' in user_agent:
        return "macOS"

    if 'linux' in user_agent:
        return "Linux"

    return "Unknown Device"

def log_device(request, user):
    user_agent = request.META.get('HTTP_USER_AGENT', 'Unknown Device')
    ip_address = request.META.get('REMOTE_ADDR', '')

    device_name = get_device_name(user_agent)

    device, created = ConnectedDevice.objects.get_or_create(
        user=user,
        ip_address=ip_address,
        device_name=device_name
    )
    device.last_active = now()
    device.save()

