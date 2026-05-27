import logging
import google.cloud.logging
from google.cloud.logging.handlers import CloudLoggingHandler

client = google.cloud.logging.Client()
handler = CloudLoggingHandler(client, name="gradify-backend")

logger = logging.getLogger("gradify")
logger.setLevel(logging.DEBUG)
logger.addHandler(handler)

def log_info(message, user_id=None, extra=None):
    payload = {"message": message}
    if user_id:
        payload["user_id"] = user_id
    if extra:
        payload.update(extra)
    logger.info(payload)

def log_error(message, user_id=None, extra=None):
    payload = {"message": message}
    if user_id:
        payload["user_id"] = user_id
    if extra:
        payload.update(extra)
    logger.error(payload)

def log_warning(message, user_id=None, extra=None):
    payload = {"message": message}
    if user_id:
        payload["user_id"] = user_id
    if extra:
        payload.update(extra)
    logger.warning(payload)