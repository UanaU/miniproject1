from django.urls import path

from . import views

urlpatterns = [
    path("summary", views.SummaryView.as_view(), name="managementfee-summary"),
    path("history", views.HistoryView.as_view(), name="managementfee-history"),
    path("register", views.RegisterView.as_view(), name="managementfee-register"),
]
