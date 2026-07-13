from django.contrib import admin

from apps.finance.models import ActivityLog, Expense, Payment

admin.site.register(Payment)
admin.site.register(Expense)
admin.site.register(ActivityLog)
