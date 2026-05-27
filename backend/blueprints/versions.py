from flask import Blueprint, jsonify, request, g
from firebase_admin import firestore
from middleware import jwt_required, role_required
from firestore_connect import db, storage_client, publisher
from blueprints.sections import detect_type
from config import BUCKET_NAME, PUBSUB_TOPIC_SECTION_UPLOADED, PUBSUB_TOPIC_STATUS_CHANGED
import uuid
import json
from datetime import datetime

versions_bp = Blueprint("versions", __name__)

@versions_bp.route("/<thesis_id>/sections/<section_id>/versions", methods=["GET"])
@jwt_required
def get_versions(thesis_id, section_id):
    thesis = db.collection("theses").document(thesis_id).get()
    if not thesis.exists:
        return jsonify({"error": "Lucrare negasita"}), 404

    section_ref = db.collection("theses").document(thesis_id)\
        .collection("sections").document(section_id)
    if not section_ref.get().exists:
        return jsonify({"error": "Sectiune negasita"}), 404

    versions = section_ref.collection("versions")\
        .order_by("versionNumber").stream()

    result = []
    for doc in versions:
        data = doc.to_dict()
        data["id"] = doc.id
        result.append(data)
    return jsonify(result), 200


@versions_bp.route("/<thesis_id>/sections/<section_id>/versions/upload", methods=["POST"])
@jwt_required
@role_required("student")
def upload_version(thesis_id, section_id):
    thesis = db.collection("theses").document(thesis_id).get()
    if not thesis.exists:
        return jsonify({"error": "Lucrare negasita"}), 404

    section_ref = db.collection("theses").document(thesis_id)\
        .collection("sections").document(section_id)
    section_doc = section_ref.get()
    if not section_doc.exists:
        return jsonify({"error": "Sectiune negasita"}), 404

    section_data = section_doc.to_dict()

    if "file" not in request.files:
        return jsonify({"error": "Fisier lipsa"}), 400

    file = request.files["file"]
    mime_type = file.content_type
    file_type = detect_type(mime_type)
    ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else "bin"

    existing_versions = list(
        section_ref.collection("versions")
        .order_by("versionNumber", direction=firestore.Query.DESCENDING)
        .limit(1).stream()
    )
    version_number = 1
    if existing_versions:
        version_number = existing_versions[0].to_dict().get("versionNumber", 0) + 1

    version_id = str(uuid.uuid4())
    gcs_path = f"theses/{thesis_id}/sections/{section_id}/versions/{version_id}/original.{ext}"

    bucket = storage_client.bucket(BUCKET_NAME)
    blob = bucket.blob(gcs_path)
    blob.upload_from_file(file.stream, content_type=mime_type)
    blob.reload()
    size_bytes = blob.size

    if section_data.get("type") == "pending":
        section_ref.update({"type": file_type})

    now = datetime.utcnow()
    section_ref.collection("versions").document(version_id).set({
        "versionNumber": version_number,
        "gcsPath": gcs_path,
        "mimeType": mime_type,
        "sizeBytes": size_bytes,
        "status": "PENDING",
        "submittedAt": now,
        "feedbackGeneral": None,
        "diffGcsPath": None,
        "hasDiff": False
    })

    section_title = section_data.get("title", "")

    publisher.publish(
        PUBSUB_TOPIC_SECTION_UPLOADED,
        json.dumps({
            "eventType": "section_uploaded",
            "thesisId": thesis_id,
            "sectionId": section_id,
            "versionId": version_id,
            "gcsPath": gcs_path,
            "sectionType": file_type,
            "versionNumber": version_number
        }).encode("utf-8")
    )

    publisher.publish(
        PUBSUB_TOPIC_STATUS_CHANGED,
        json.dumps({
            "eventType": "section_uploaded",
            "thesisId": thesis_id,
            "sectionId": section_id,
            "versionId": version_id,
            "actorId": g.user_id,
            "sectionTitle": section_title,
        }).encode("utf-8")
    )

    return jsonify({"id": version_id, "versionNumber": version_number}), 201