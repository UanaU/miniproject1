from django.urls import path

from . import views

urlpatterns = [
    path("summary", views.SummaryView.as_view(), name="managementfee-summary"),
]
