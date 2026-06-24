from pydantic import BaseModel
from typing import Generic, TypeVar, Optional, List

T = TypeVar("T")

class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    page_size: int
    has_next: bool