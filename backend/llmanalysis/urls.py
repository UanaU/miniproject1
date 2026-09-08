from django.urls import path

from . import views

urlpatterns = [
    path("ai-analysis", views.AnalysisView.as_view(), name="managementfee-ai-analysis"),
]
