from django.urls import path

from . import views

urlpatterns = [
    path("analysis", views.AnalysisView.as_view(), name="managementfee-analysis"),
]
