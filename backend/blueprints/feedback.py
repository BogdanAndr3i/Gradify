from flask import Blueprint, jsonify, request, g
from middleware import jwt_required, role_required
from firestore_connect import db
from datetime import datetime

feedback_bp = Blueprint("feedback", __name__)

@feedback_bp.route("/<thesis_id>/sections/<section_id>/versions/<version_id>/feedback", methods=["POST"])
@jwt_required
@role_required("prof")
def add_feedback(thesis_id, section_id, version_id):
    version_ref = _get_version_ref(thesis_id, section_id, version_id)
    if not version_ref.get().exists:
        return jsonify({"error": "Versiune negasita"}), 404

    body = request.get_json()
    feedback = body.get("feedbackGeneral", "").strip()
    if not feedback:
        return jsonify({"error": "Feedback-ul este obligatoriu"}), 400

    version_ref.update({
        "feedbackGeneral": feedback,
        "updatedAt": datetime.utcnow()
    })

    return jsonify({"message": "Feedback salvat"}), 200


def _get_version_ref(thesis_id, section_id, version_id):
    return (
        db.collection("theses").document(thesis_id)
        .collection("sections").document(section_id)
        .collection("versions").document(version_id)
    )