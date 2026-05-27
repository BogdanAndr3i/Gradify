import os
from dotenv import load_dotenv

load_dotenv()

PROJECT_ID = os.getenv("PROJECT_ID")
BUCKET_NAME = os.getenv("BUCKET_NAME")
PUBSUB_TOPIC_SECTION_UPLOADED = os.getenv("PUBSUB_TOPIC_SECTION_UPLOADED")
PUBSUB_TOPIC_STATUS_CHANGED = os.getenv("PUBSUB_TOPIC_STATUS_CHANGED")
GMAIL_SENDER = os.getenv("GMAIL_SENDER")

def get_secret(secret_id):
    from google.cloud import secretmanager
    client = secretmanager.SecretManagerServiceClient()
    name = f"projects/{PROJECT_ID}/secrets/{secret_id}/versions/latest"
    response = client.access_secret_version(request={"name": name})
    return response.payload.data.decode("UTF-8")