from django.core.management.base import BaseCommand
from users.models import Category
from django.utils.text import slugify

class Command(BaseCommand):
    help = "Seed default expense categories"

    def handle(self, *args, **kwargs):
        categories = [
            {"name": "Food & Dining", "icon": "🍽️", "color": "bg-red-100", "text_color": "text-red-800"},
            {"name": "Transportation", "icon": "🚗", "color": "bg-blue-100", "text_color": "text-blue-800"},
            {"name": "Shopping", "icon": "🛍️", "color": "bg-purple-100", "text_color": "text-purple-800"},
            {"name": "Entertainment", "icon": "🎬", "color": "bg-yellow-100", "text_color": "text-yellow-800"},
            {"name": "Bills & Utilities", "icon": "💡", "color": "bg-green-100", "text_color": "text-green-800"},
            {"name": "Health & Fitness", "icon": "💊", "color": "bg-pink-100", "text_color": "text-pink-800"},
            {"name": "Education", "icon": "📚", "color": "bg-indigo-100", "text_color": "text-indigo-800"},
            {"name": "Travel", "icon": "✈️", "color": "bg-cyan-100", "text_color": "text-cyan-800"},
            {"name": "Investment", "icon": "📈", "color": "bg-emerald-100", "text_color": "text-emerald-800"},
            {"name": "Miscellaneous", "icon": "🎯", "color": "bg-gray-100", "text_color": "text-gray-800"},
            {"name": "Groceries", "icon": "🛒", "color": "bg-orange-100", "text_color": "text-orange-800"},
            {"name": "Rent/Mortgage", "icon": "🏠", "color": "bg-teal-100", "text_color": "text-teal-800"},
            {"name": "Clothing", "icon": "👕", "color": "bg-fuchsia-100", "text_color": "text-fuchsia-800"},
            {"name": "Personal Care", "icon": "💅", "color": "bg-rose-100", "text_color": "text-rose-800"},
            {"name": "Gifts & Donations", "icon": "🎁", "color": "bg-amber-100", "text_color": "text-amber-800"},
        ]

        for cat in categories:
            Category.objects.get_or_create(
                name=cat["name"],
                defaults={
                    "slug": slugify(cat["name"]),
                    "icon": cat["icon"],
                    "color": cat["color"],
                    "text_color": cat["text_color"]
                }
            )

        self.stdout.write(self.style.SUCCESS("✅ Categories inserted successfully"))
