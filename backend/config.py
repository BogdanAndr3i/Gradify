import json
from google.cloud import secretmanager

PROJECT_ID = "gradify-497616"
BUCKET_NAME = "gradify-497616-thesis-files"
PUBSUB_TOPIC_SECTION_UPLOADED = f"projects/{PROJECT_ID}/topics/section-uploaded"
PUBSUB_TOPIC_STATUS_CHANGED = f"projects/{PROJECT_ID}/topics/status-changed"
GMAIL_SENDER = "gradify.notificari@gmail.com"

def get_secret(secret_id):
    client = secretmanager.SecretManagerServiceClient()
    name = f"projects/{PROJECT_ID}/secrets/{secret_id}/versions/latest"
    response = client.access_secret_version(request={"name": name})
    return response.payload.data.decode("UTF-8")