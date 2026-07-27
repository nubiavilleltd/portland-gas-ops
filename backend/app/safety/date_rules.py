from datetime import datetime


MIN_SCHEDULE_DURATION_MINUTES = 3
SCHEDULE_DEVIATION_TOLERANCE_MINUTES = 3


def start_of_minute(value: datetime) -> datetime:
    """Match the minute precision supported by Safety date/time inputs."""
    return value.replace(second=0, microsecond=0)
