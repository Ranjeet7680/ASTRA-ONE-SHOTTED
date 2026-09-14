"""
Input validation, string sanitization, and security rules
"""
import re

USERNAME_REGEX = re.compile(r"^[a-zA-Z0-9_\-\.]{3,24}$")
EMAIL_REGEX = re.compile(r"^[\w\.\+\-]+@[a-zA-Z0-9\-]+\.[a-zA-Z0-9\-\.]+$")

def is_valid_username(username: str) -> bool:
    if not username:
        return False
    return bool(USERNAME_REGEX.match(username))

def is_valid_email(email: str) -> bool:
    if not email:
        return False
    return bool(EMAIL_REGEX.match(email))

def sanitize_string(text: str, max_length: int = 128) -> str:
    if not text:
        return ""
    # Strip HTML tags and control chars
    clean = re.sub(r"[<>]", "", text)
    return clean.strip()[:max_length]
