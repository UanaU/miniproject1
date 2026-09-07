from rest_framework.permissions import BasePermission


class IsMemberAuthenticated(BasePermission):
    """세션에 member_id 가 있는 경우에만 허용."""

    def has_permission(self, request, view):
        return bool(request.session.get("member_id"))
