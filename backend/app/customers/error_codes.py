from enum import Enum


class CustomerErrorCode(str, Enum):
    CUSTOMER_NOT_FOUND = "CUSTOMER_NOT_FOUND"