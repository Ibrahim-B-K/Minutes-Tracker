"""
supabase_utils.py - Shared utility for uploading files to Supabase Storage.

Supports both minutes and response attachments via the `folder` parameter.
Uses exactly the same upload pattern as the working minutes upload.
"""
import os
import uuid
import requests
from urllib.parse import quote

SUPABASE_URL = os.getenv('SUPABASE_URL', '')
SUPABASE_KEY = os.getenv('SUPABASE_KEY', '')


def upload_to_supabase(file_data: bytes, original_filename: str, bucket: str, folder: str = 'public') -> str | None:
    """
    Upload a file to a Supabase Storage bucket.

    Args:
        file_data:          Raw file bytes to upload.
        original_filename:  Original filename (used to build the storage path).
        bucket:             Name of the Supabase bucket (e.g. 'Mnutes', 'Response').
        folder:             Sub-folder inside the bucket (default: 'public').

    Returns:
        The public URL of the uploaded file, or None if the upload failed.
    """
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("⚠️ Supabase credentials not configured.")
        return None

    unique_name = f"{uuid.uuid4()}_{original_filename}"
    storage_path = f"{folder}/{unique_name}"
    encoded_path = quote(storage_path, safe='/')

    upload_url = f"{SUPABASE_URL}/storage/v1/object/{bucket}/{encoded_path}"

    # Match exact header pattern used in working minutes upload
    headers = {
        'apikey': SUPABASE_KEY,
        'Content-Type': 'application/octet-stream',
    }

    try:
        response = requests.put(upload_url, data=file_data, headers=headers, timeout=30)
        if response.status_code == 200:
            public_url = f"{SUPABASE_URL}/storage/v1/object/public/{bucket}/{encoded_path}"
            print(f"✅ Uploaded to Supabase [{bucket}]: {public_url}")
            return public_url
        else:
            print(f"⚠️ Supabase upload failed [{response.status_code}]: {response.text}")
            return None
    except Exception as exc:
        print(f"⚠️ Supabase upload exception: {exc}")
        return None
