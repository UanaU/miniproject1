from unittest.mock import patch

from django.test import SimpleTestCase
from rest_framework.test import APIRequestFactory

from . import services
from .views import AnalysisView


class BuildUserPayloadTests(SimpleTestCase):
    def test_excludes_no_data_keys(self):
        body = {
            "이번달": {"청구년월": "20260901", "합계금액": 187000},
            "전월": {"데이터없음": True, "메시지": "비교 데이터 없음"},
            "같은평수평균": {"합계금액": 172000},
            "같은평수_가구원수평균": None,
        }

        payload = services.build_user_payload(body)

        self.assertIn("이번달", payload)
        self.assertIn("같은평수평균", payload)
        self.assertNotIn("전월", payload)
        self.assertNotIn("같은평수_가구원수평균", payload)


class AnalyzeFallbackTests(SimpleTestCase):
    def test_returns_fallback_shape_without_api_key(self):
        with patch("llmanalysis.services.settings.GEMINI_API_KEY", ""):
            result = services.analyze({"이번달": {"합계금액": 187000}})

        self.assertIsNone(result["분석결과"])
        self.assertTrue(result["폴백여부"])
        self.assertEqual(result["폴백메시지"], services.FALLBACK_MESSAGE)


class AnalysisViewTests(SimpleTestCase):
    def test_rejects_body_without_this_month(self):
        factory = APIRequestFactory()
        request = factory.post("/api/managementfee/ai-analysis", {}, format="json")

        with patch(
            "accounts.permissions.IsMemberAuthenticated.has_permission", return_value=True
        ):
            response = AnalysisView.as_view()(request)

        self.assertEqual(response.status_code, 400)
