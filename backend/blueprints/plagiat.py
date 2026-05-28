from flask import Blueprint, jsonify, request
from middleware import jwt_required, role_required
from firestore_connect import storage_client
from config import BUCKET_NAME
import uuid
import requests
from google.auth.transport.requests import Request as GoogleAuthRequest
from google.oauth2 import id_token as google_id_token

plagiat_bp = Blueprint("plagiat", __name__)
PLAGIAT_SERVICE_URL = "https://plagiat-service-499391921089.europe-west1.run.app"

@plagiat_bp.route("/analyze-upload", methods=["POST"])
@jwt_required
@role_required("prof")
def analyze_upload():
    if "file" not in request.files:
        return jsonify({"error": "Fisier lipsa"}), 400

    file = request.files["file"]
    temp_id = str(uuid.uuid4())
    gcs_path = f"temp/plagiat/{temp_id}/original.pdf"

    bucket = storage_client.bucket(BUCKET_NAME)
    blob = bucket.blob(gcs_path)
    blob.upload_from_file(file.stream, content_type="application/pdf")

    try:
        auth_req = GoogleAuthRequest()
        token = google_id_token.fetch_id_token(auth_req, PLAGIAT_SERVICE_URL)
        response = requests.post(
            f"{PLAGIAT_SERVICE_URL}/api/analyze",
            json={"gcs_path": gcs_path, "version_id": temp_id},
            headers={"Authorization": f"Bearer {token}"},
            timeout=60
        )
        return jsonify(response.json()), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        try:
            blob.delete()
        except:
            pass