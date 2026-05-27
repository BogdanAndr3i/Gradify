from flask import Blueprint, jsonify, request, g
from middleware import jwt_required, role_required
from firestore_connect import db, publisher
from blueprints.feedback import _get_version_ref
from config import PUBSUB_TOPIC_STATUS_CHANGED
import json
from datetime import datetime

status_bp = Blueprint("status", __name__)

VALID_STATUSES = {"APPROVED", "REJECTED", "NEEDS_CHANGES"}

@status_bp.route("/<thesis_id>/sections/<section_id>/versions/<version_id>/status", methods=["PUT"])
@jwt_required
@role_required("prof")
def update_status(thesis_id, section_id, version_id):
    version_ref = _get_version_ref(thesis_id, section_id, version_id)
    version_doc = version_ref.get()
    if not version_doc.exists:
        return jsonify({"error": "Versiune negasita"}), 404

    body = request.get_json()
    new_status = body.get("status", "").strip().upper()
    if new_status not in VALID_STATUSES:
        return jsonify({"error": f"Status invalid. Valori acceptate: {', '.join(VALID_STATUSES)}"}), 400

    version_ref.update({
        "status": new_status,
        "updatedAt": datetime.utcnow()
    })

    thesis_doc = db.collection("theses").document(thesis_id).get()
    student_id = thesis_doc.to_dict().get("studentId")

    publisher.publish(
        PUBSUB_TOPIC_STATUS_CHANGED,
        json.dumps({
            "userId": student_id,
            "thesisId": thesis_id,
            "sectionId": section_id,
            "versionId": version_id,
            "status": new_status
        }).encode("utf-8")
    )

    return jsonify({"message": "Status actualizat"}), 200