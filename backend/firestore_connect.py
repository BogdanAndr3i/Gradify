import os
import firebase_admin
from firebase_admin import credentials, firestore
from google.cloud import storage, pubsub_v1

if not firebase_admin._apps:
    cred = credentials.ApplicationDefault()
    firebase_admin.initialize_app(cred, {
        "projectId": os.getenv("PROJECT_ID"),
        "storageBucket": os.getenv("BUCKET_NAME")
    })

db = firestore.client()
storage_client = storage.Client()
publisher = pubsub_v1.PublisherClient()