from flask import Blueprint, jsonify, request, g
from middleware import jwt_required, role_required
from firestore_connect import db
from blueprints.thesis import _check_access
import uuid
from datetime import datetime
from firebase_admin import firestore as fs_admin


sections_bp = Blueprint("sections", __name__)

MIME_TO_TYPE = {
    "application/pdf": "document",
    "application/msword": "document",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "document",
    "text/plain": "code",
    "text/x-python": "code",
    "text/javascript": "code",
    "application/json": "code",
    "text/html": "code",
    "text/css": "code",
    "image/png": "media",
    "image/jpeg": "media",
    "image/gif": "media",
    "video/mp4": "media",
    "video/quicktime": "media",
}

def detect_type(mime_type):
    return MIME_TO_TYPE.get(mime_type, "document")

@sections_bp.route("/<thesis_id>/sections", methods=["GET"])
@jwt_required
def get_sections(thesis_id):
    thesis = db.collection("theses").document(thesis_id).get()
    if not thesis.exists:
        return jsonify({"error": "Lucrare negasita"}), 404
    _check_access(thesis.to_dict())

    sections = db.collection("theses").document(thesis_id)\
        .collection("sections").order_by("order").stream()

    result = []
    for doc in sections:
        data = doc.to_dict()
        data["id"] = doc.id
        result.append(data)
    return jsonify(result), 200

@sections_bp.route("/<thesis_id>/sections", methods=["POST"])
@jwt_required
@role_required("student")
def create_section(thesis_id):
    thesis = db.collection("theses").document(thesis_id).get()
    if not thesis.exists:
        return jsonify({"error": "Lucrare negasita"}), 404
    _check_access(thesis.to_dict())

    body = request.get_json()
    title = body.get("title", "").strip()
    if not title:
        return jsonify({"error": "Titlul sectiunii este obligatoriu"}), 400

    existing = db.collection("theses").document(thesis_id)\
        .collection("sections")\
        .order_by("order", direction=fs_admin.Query.DESCENDING)\
        .limit(1).stream()
    last_order = 0
    for doc in existing:
        last_order = doc.to_dict().get("order", 0)

    section_id = str(uuid.uuid4())
    db.collection("theses").document(thesis_id)\
        .collection("sections").document(section_id).set({
            "title": title,
            "order": last_order + 1,
            "type": "pending",
            "createdAt": datetime.utcnow()
        })
    return jsonify({"id": section_id}), 201

@sections_bp.route("/<thesis_id>/sections/<section_id>/reorder", methods=["PUT"])
@jwt_required
@role_required("student")
def reorder_section(thesis_id, section_id):
    thesis = db.collection("theses").document(thesis_id).get()
    if not thesis.exists:
        return jsonify({"error": "Lucrare negasita"}), 404
    _check_access(thesis.to_dict())

    body = request.get_json()
    direction = body.get("direction")
    if direction not in ("up", "down"):
        return jsonify({"error": "Directie invalida"}), 400

    sections_ref = db.collection("theses").document(thesis_id).collection("sections")
    all_sections = sorted(
        [{"id": d.id, **d.to_dict()} for d in sections_ref.stream()],
        key=lambda x: x["order"]
    )

    idx = next((i for i, s in enumerate(all_sections) if s["id"] == section_id), None)
    if idx is None:
        return jsonify({"error": "Sectiune negasita"}), 404

    swap_idx = idx - 1 if direction == "up" else idx + 1
    if swap_idx < 0 or swap_idx >= len(all_sections):
        return jsonify({"message": "Deja la capat"}), 200

    order_a = all_sections[idx]["order"]
    order_b = all_sections[swap_idx]["order"]
    sections_ref.document(section_id).update({"order": order_b})
    sections_ref.document(all_sections[swap_idx]["id"]).update({"order": order_a})

    return jsonify({"message": "Reordonat"}), 200