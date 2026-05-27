from flask import Blueprint, jsonify, request, g
from middleware import jwt_required, role_required
from firestore_connect import db, publisher
from config import PUBSUB_TOPIC_STATUS_CHANGED
import uuid
import json
from datetime import datetime

thesis_bp = Blueprint("thesis", __name__)


@thesis_bp.route("", methods=["GET"])
@jwt_required
def get_theses():
    if g.role == "student":
        query = db.collection("theses").where("studentId", "==", g.user_id).stream()
    elif g.role == "prof":
        query = db.collection("theses").where("professorId", "==", g.user_id).stream()
    elif g.role == "admin":
        query = db.collection("theses").stream()
    else:
        return jsonify({"error": "Acces interzis"}), 403

    result = []
    for doc in query:
        data = doc.to_dict()
        data["id"] = doc.id
        result.append(data)
    return jsonify(result), 200


@thesis_bp.route("/<thesis_id>", methods=["GET"])
@jwt_required
def get_thesis(thesis_id):
    doc = db.collection("theses").document(thesis_id).get()
    if not doc.exists:
        return jsonify({"error": "Lucrare negasita"}), 404
    data = doc.to_dict()
    data["id"] = doc.id
    _check_access(data)
    return jsonify(data), 200


@thesis_bp.route("", methods=["POST"])
@jwt_required
@role_required("prof")
def create_thesis():
    body = request.get_json()
    title = body.get("title", "").strip()
    student_id = body.get("studentId", "").strip()

    if not title or not student_id:
        return jsonify({"error": "Titlu si studentId obligatorii"}), 400

    thesis_id = str(uuid.uuid4())
    now = datetime.utcnow()

    db.collection("theses").document(thesis_id).set({
        "title": title,
        "studentId": student_id,
        "professorId": g.user_id,
        "globalStatus": "IN_PROGRESS",
        "createdAt": now,
        "updatedAt": now
    })

    publisher.publish(
        PUBSUB_TOPIC_STATUS_CHANGED,
        json.dumps({
            "eventType": "thesis_created",
            "thesisId": thesis_id,
            "actorId": g.user_id,
        }).encode("utf-8")
    )

    return jsonify({"id": thesis_id}), 201


def _check_access(thesis_data):
    if g.role == "student" and thesis_data.get("studentId") != g.user_id:
        from flask import abort
        abort(403)
    if g.role == "prof" and thesis_data.get("professorId") != g.user_id:
        from flask import abort
        abort(403)