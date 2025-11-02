"""
결제 및 구독 관련 스키마

Stripe 결제, 구독 관리를 위한 요청/응답 스키마를 정의합니다.
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class PlanType(str, Enum):
    """플랜 타입"""
    FREE = "free"
    PRO = "pro"
    AGENCY = "agency"


class SubscriptionStatus(str, Enum):
    """구독 상태"""
    ACTIVE = "active"
    CANCELED = "canceled"
    PAST_DUE = "past_due"
    TRIALING = "trialing"
    INCOMPLETE = "incomplete"
    INCOMPLETE_EXPIRED = "incomplete_expired"


class CheckoutRequest(BaseModel):
    """
    Stripe Checkout Session 생성 요청

    FR-009: 플랜 업그레이드 기능
    FR-017: Stripe를 통한 결제 처리
    """
    plan: PlanType = Field(..., description="업그레이드할 플랜 (pro, agency)")
    success_url: Optional[str] = Field(
        None,
        description="결제 성공 후 리디렉션 URL (기본값: /dashboard/settings/billing?success=true)"
    )
    cancel_url: Optional[str] = Field(
        None,
        description="결제 취소 후 리디렉션 URL (기본값: /dashboard/settings/billing?canceled=true)"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "plan": "pro",
                "success_url": "https://clippilot.com/dashboard/settings/billing?success=true",
                "cancel_url": "https://clippilot.com/dashboard/settings/billing?canceled=true"
            }
        }


class CheckoutResponse(BaseModel):
    """Stripe Checkout Session 생성 응답"""
    checkout_url: str = Field(..., description="Stripe Checkout 페이지 URL")
    session_id: str = Field(..., description="Stripe Checkout Session ID")


class PortalRequest(BaseModel):
    """
    Stripe Customer Portal 접근 요청

    사용자가 구독 관리, 결제 수단 변경, 인보이스 확인 등을 할 수 있습니다.
    """
    return_url: Optional[str] = Field(
        None,
        description="포털 종료 후 리디렉션 URL (기본값: /dashboard/settings/billing)"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "return_url": "https://clippilot.com/dashboard/settings/billing"
            }
        }


class PortalResponse(BaseModel):
    """Stripe Customer Portal 접근 응답"""
    portal_url: str = Field(..., description="Stripe Customer Portal URL")


class SubscriptionResponse(BaseModel):
    """
    구독 정보 응답

    현재 사용자의 구독 상태, 플랜, 사용량 정보를 제공합니다.
    """
    plan: PlanType = Field(..., description="현재 플랜 (free, pro, agency)")
    status: SubscriptionStatus = Field(..., description="구독 상태")
    current_period_start: Optional[datetime] = Field(None, description="현재 구독 기간 시작일")
    current_period_end: Optional[datetime] = Field(None, description="현재 구독 기간 종료일")
    cancel_at_period_end: bool = Field(
        False,
        description="기간 종료 시 취소 예정 여부 (다운그레이드)"
    )
    stripe_customer_id: Optional[str] = Field(None, description="Stripe Customer ID")
    stripe_subscription_id: Optional[str] = Field(None, description="Stripe Subscription ID")

    # 사용량 정보
    usage_current: int = Field(0, description="이번 달 사용량 (콘텐츠 생성 횟수)")
    usage_limit: int = Field(..., description="플랜별 월간 한도 (free: 20, pro: 500, agency: 무제한)")
    usage_percentage: float = Field(0.0, description="사용량 퍼센트 (0-100)")

    class Config:
        json_schema_extra = {
            "example": {
                "plan": "pro",
                "status": "active",
                "current_period_start": "2024-01-01T00:00:00Z",
                "current_period_end": "2024-02-01T00:00:00Z",
                "cancel_at_period_end": False,
                "stripe_customer_id": "cus_xxxxxxxxxxxxx",
                "stripe_subscription_id": "sub_xxxxxxxxxxxxx",
                "usage_current": 45,
                "usage_limit": 500,
                "usage_percentage": 9.0
            }
        }


class WebhookEvent(BaseModel):
    """
    Stripe Webhook 이벤트

    Stripe로부터 받은 webhook 이벤트를 처리합니다.
    """
    id: str = Field(..., description="Stripe 이벤트 ID")
    type: str = Field(..., description="이벤트 타입")
    data: dict = Field(..., description="이벤트 데이터")

    class Config:
        json_schema_extra = {
            "example": {
                "id": "evt_xxxxxxxxxxxxx",
                "type": "customer.subscription.updated",
                "data": {
                    "object": {
                        "id": "sub_xxxxxxxxxxxxx",
                        "status": "active",
                        "plan": {
                            "product": "prod_xxxxxxxxxxxxx"
                        }
                    }
                }
            }
        }
