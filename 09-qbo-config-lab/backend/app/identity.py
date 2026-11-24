# app/identity.py

import app.config as config

def current_user() -> str:
    """The single source of the acting user. Replace the body when auth exists."""
    return config.DEFAULT_USER