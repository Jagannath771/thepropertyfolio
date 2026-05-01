"""Storage service — S3-compatible file upload (AWS S3 or Cloudflare R2)."""

from __future__ import annotations

import mimetypes
import uuid
from datetime import datetime

import boto3
import structlog
from botocore.exceptions import ClientError

from app.config import settings

logger = structlog.get_logger(__name__)


def _get_s3_client() -> boto3.client:  # type: ignore[type-arg]
    """Get a configured S3 client (works with AWS S3 or Cloudflare R2)."""
    kwargs: dict = {
        "region_name": settings.AWS_REGION,
        "aws_access_key_id": settings.AWS_ACCESS_KEY_ID,
        "aws_secret_access_key": settings.AWS_SECRET_ACCESS_KEY,
    }
    if settings.AWS_S3_ENDPOINT_URL:
        kwargs["endpoint_url"] = settings.AWS_S3_ENDPOINT_URL
    return boto3.client("s3", **kwargs)


def generate_presigned_upload_url(
    filename: str,
    content_type: str,
    folder: str = "properties",
) -> tuple[str, str]:
    """
    Generate a presigned PUT URL for direct browser-to-S3 upload.

    Returns:
        Tuple of (presigned_url, public_object_url)
    """
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "jpg"
    object_key = f"{folder}/{datetime.now().strftime('%Y/%m')}/{uuid.uuid4()}.{ext}"

    try:
        client = _get_s3_client()
        presigned_url = client.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": settings.AWS_S3_BUCKET,
                "Key": object_key,
                "ContentType": content_type,
            },
            ExpiresIn=900,  # 15 minutes
        )
        if settings.AWS_S3_ENDPOINT_URL:
            public_url = f"{settings.AWS_S3_ENDPOINT_URL}/{settings.AWS_S3_BUCKET}/{object_key}"
        else:
            public_url = f"https://{settings.AWS_S3_BUCKET}.s3.{settings.AWS_REGION}.amazonaws.com/{object_key}"

        logger.info("Generated presigned upload URL", key=object_key)
        return presigned_url, public_url

    except ClientError as e:
        logger.error("Failed to generate presigned URL", error=str(e))
        raise


def delete_object(object_url: str) -> bool:
    """Delete an object from S3/R2 by its public URL."""
    try:
        # Extract key from URL
        if settings.AWS_S3_ENDPOINT_URL:
            prefix = f"{settings.AWS_S3_ENDPOINT_URL}/{settings.AWS_S3_BUCKET}/"
        else:
            prefix = f"https://{settings.AWS_S3_BUCKET}.s3.{settings.AWS_REGION}.amazonaws.com/"

        object_key = object_url.replace(prefix, "")
        client = _get_s3_client()
        client.delete_object(Bucket=settings.AWS_S3_BUCKET, Key=object_key)
        logger.info("Deleted S3 object", key=object_key)
        return True
    except Exception as e:
        logger.error("Failed to delete S3 object", url=object_url, error=str(e))
        return False


def get_content_type(filename: str) -> str:
    """Guess MIME type from filename, defaulting to image/jpeg."""
    content_type, _ = mimetypes.guess_type(filename)
    return content_type or "image/jpeg"
