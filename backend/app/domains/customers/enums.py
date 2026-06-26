from enum import Enum

class CustomerType(str, Enum):
    individual  = "individual"
    corporate   = "corporate"
    government  = "government"

class CustomerStatus(str, Enum):
    active      = "active"
    inactive    = "inactive"
    suspended   = "suspended"