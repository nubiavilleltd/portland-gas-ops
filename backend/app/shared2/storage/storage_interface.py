
from __future__ import annotations

"""
Abstract interface for file storage.
This is the contract every storage provider must fulfill.
Swap Cloudinary for S3, GCS, or anything else by implementing this interface
and changing the import in cloudinary_service.py — nothing else changes.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from enum import Enum


class ResourceType(str, Enum):
    IMAGE    = "image"    # JPEGs, PNGs, WebP — processed by CDN
    RAW      = "raw"      # PDFs, DOCs — served as-is with correct Content-Type
    AUTO     = "auto"     # Let provider detect; use IMAGE or RAW when you know the type


@dataclass
class UploadResult:
    url:          str       # Secure HTTPS URL to access the file
    public_id:    str       # Provider-assigned identifier (useful for deletion)
    resource_type: str      # "image" | "raw" | "auto"
    file_size:    int       # bytes
    format:       str       # "jpg", "pdf", etc.


class StorageInterface(ABC):
    """
    Every storage backend must implement these three methods.
    Callers never import cloudinary directly — always go through this interface.
    """

    @abstractmethod
    def upload(
        self,
        file_bytes:    bytes,
        filename:      str,
        folder:        str,          # e.g. "products", "employees/documents"
        resource_type: ResourceType = ResourceType.AUTO,
        overwrite:     bool         = False,
    ) -> UploadResult:
        """Upload file bytes and return a result with the public URL."""
        ...

    @abstractmethod
    def delete(self, public_id: str, resource_type: ResourceType = ResourceType.IMAGE) -> bool:
        """Delete a file by its provider public_id. Returns True on success."""
        ...