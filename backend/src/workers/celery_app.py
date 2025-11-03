"""
Celery application configuration for ClipPilot
Handles async tasks for script generation and job orchestration
"""

import os

from celery import Celery
from kombu import Queue

# Redis connection
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# Create Celery app
celery_app = Celery(
    "clippilot",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["src.workers.generate", "src.workers.render", "src.workers.upload"],
)

# Celery configuration
celery_app.conf.update(
    # Task settings
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Seoul",
    enable_utc=True,
    # Result backend
    result_backend=REDIS_URL,
    result_expires=86400,  # 24 hours
    # Task execution
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    task_time_limit=600,  # 10 minutes hard limit
    task_soft_time_limit=540,  # 9 minutes soft limit
    # Worker settings
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
    # Queue configuration
    task_default_queue="default",
    task_queues=(
        Queue("default", routing_key="task.default"),
        Queue("generation", routing_key="task.generation"),
        Queue("rendering", routing_key="task.rendering"),
    ),
    # Task routing
    task_routes={
        "src.workers.generate.*": {"queue": "generation"},
        "src.workers.render.*": {"queue": "rendering"},
        "src.workers.upload.*": {"queue": "default"},
    },
    # Monitoring
    task_send_sent_event=True,
    worker_send_task_events=True,
    # Error handling
    task_annotations={
        "*": {
            "rate_limit": "10/m",  # 10 tasks per minute per task type
            "max_retries": 3,
            "default_retry_delay": 60,  # 1 minute
        }
    },
)

# Auto-discover tasks
celery_app.autodiscover_tasks(["src.workers"])


# Celery events
@celery_app.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):
    """Setup periodic tasks"""
    # Clean up expired jobs every hour
    sender.add_periodic_task(
        3600.0,  # 1 hour
        cleanup_expired_jobs.s(),
        name="cleanup-expired-jobs",
    )


@celery_app.task(bind=True)
def cleanup_expired_jobs(self):
    """
    Periodic task to clean up expired jobs
    Runs every hour
    """
    from datetime import datetime, timedelta

    from src.core.supabase import get_supabase

    supabase = get_supabase()

    # Delete failed jobs older than 7 days
    cutoff_date = datetime.utcnow() - timedelta(days=7)

    response = (
        supabase.service.table("jobs")
        .delete()
        .eq("status", "failed")
        .lt("created_at", cutoff_date.isoformat())
        .execute()
    )

    deleted_count = len(response.data) if response.data else 0

    return {
        "status": "success",
        "deleted_count": deleted_count,
        "cutoff_date": cutoff_date.isoformat(),
    }


if __name__ == "__main__":
    celery_app.start()
