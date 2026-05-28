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
    thesis_doc = db.collection("theses").document(thesis_id).get()
    if not thesis_doc.exists:
        return jsonify({"error": "Lucrare negasita"}), 404
    if thesis_doc.to_dict().get("professorId") != g.user_id:
        return jsonify({"error": "Acces interzis"}), 403

    version_ref = _get_version_ref(thesis_id, section_id, version_id)
    if not version_ref.get().exists:
        return jsonify({"error": "Versiune negasita"}), 404

    body = request.get_json()
    new_status = body.get("status", "").strip().upper()
    if new_status not in VALID_STATUSES:
        return jsonify({"error": f"Status invalid. Valori acceptate: {', '.join(VALID_STATUSES)}"}), 400

    version_ref.update({
        "status": new_status,
        "updatedAt": datetime.utcnow()
    })

    section_doc = (
        db.collection("theses").document(thesis_id)
        .collection("sections").document(section_id)
        .get()
    )
    section_title = section_doc.to_dict().get("title", "") if section_doc.exists else ""

    publisher.publish(
        PUBSUB_TOPIC_STATUS_CHANGED,
        json.dumps({
            "eventType": "status_changed",
            "thesisId": thesis_id,
            "sectionId": section_id,
            "versionId": version_id,
            "actorId": g.user_id,
            "sectionTitle": section_title,
            "status": new_status,
        }).encode("utf-8")
    )

    return jsonify({"message": "Status actualizat"}), 200