import os
import time
import random
import string
import boto3
from botocore.exceptions import BotoCoreError, ClientError
from typing import Optional, Dict, Any
from config import CONFIG

class S3Service:
    _s3_client = None

    @classmethod
    def get_client(cls):
        if cls._s3_client is None:
            try:
                access_key = CONFIG.AWS_ACCESS_KEY_ID or os.getenv("AWS_ACCESS_KEY_ID")
                secret_key = CONFIG.AWS_SECRET_ACCESS_KEY or os.getenv("AWS_SECRET_ACCESS_KEY")
                region = CONFIG.AWS_REGION or os.getenv("AWS_REGION", "ap-southeast-2")

                if access_key and secret_key:
                    session = boto3.Session(
                        aws_access_key_id=access_key.strip(),
                        aws_secret_access_key=secret_key.strip(),
                        region_name=region.strip()
                    )
                    cls._s3_client = session.client('s3')
                else:
                    cls._s3_client = boto3.client('s3', region_name=region)
            except Exception as e:
                print(f"⚠️ S3 Client initialization warning: {e}")
        return cls._s3_client

    @classmethod
    def upload_media(cls, file_bytes: bytes, original_filename: str, mime_type: str) -> Optional[str]:
        client = cls.get_client()
        if not client:
            return None

        ext = original_filename.split('.')[-1] if '.' in original_filename else 'jpg'
        rand_str = ''.join(random.choices(string.ascii_lowercase + string.digits, k=5))
        s3_key = f"uploads/in2peta_{int(time.time() * 1000)}_{rand_str}.{ext}"

        try:
            client.put_object(
                Bucket=CONFIG.S3_BUCKET,
                Key=s3_key,
                Body=file_bytes,
                ContentType=mime_type
            )
            s3_url = f"https://{CONFIG.S3_BUCKET}.s3.{CONFIG.AWS_REGION}.amazonaws.com/{s3_key}"
            print(f"[AWS S3] Successfully uploaded media: {s3_url}")
            return s3_url
        except (BotoCoreError, ClientError, Exception) as e:
            print(f"[AWS S3] Upload error: {e}")
            return None

    @classmethod
    def check_status(cls) -> Dict[str, Any]:
        if CONFIG.AWS_ACCESS_KEY_ID and CONFIG.AWS_SECRET_ACCESS_KEY:
            return {
                "connected": True,
                "mode": "Environment Variables (Cloud Deployment)",
                "bucket": CONFIG.S3_BUCKET,
                "region": CONFIG.AWS_REGION
            }
        try:
            client = cls.get_client()
            if client:
                return {
                    "connected": True,
                    "profile": os.getenv("AWS_PROFILE", "postiz-dev"),
                    "bucket": CONFIG.S3_BUCKET,
                    "region": CONFIG.AWS_REGION
                }
        except Exception as e:
            return {
                "connected": False,
                "error": str(e),
                "bucket": CONFIG.S3_BUCKET
            }
        return {"connected": False, "bucket": CONFIG.S3_BUCKET}
