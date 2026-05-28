from flask import Blueprint, jsonify, request, g
from middleware import jwt_required, role_required
from firestore_connect import db
from firebase_admin import auth
from datetime import datetime

admin_bp = Blueprint("admin", __name__)

# ── Utilizatori ──────────────────────────────────────────────────────────────

@admin_bp.route("/users", methods=["GET"])
@jwt_required
@role_required("admin")
def get_users():
    role_filter = request.args.get("role")
    query = db.collection("users")
    if role_filter:
        query = query.where("role", "==", role_filter)
    result = []
    for doc in query.stream():
        data = doc.to_dict()
        data["id"] = doc.id
        result.append(data)
    return jsonify(result), 200


@admin_bp.route("/users/<user_id>/approve", methods=["PUT"])
@jwt_required
@role_required("admin")
def approve_user(user_id):
    body = request.get_json()
    role = body.get("role", "").strip()
    if role not in ("student", "prof"):
        return jsonify({"error": "Rol invalid. Valori acceptate: student, prof"}), 400

    user_ref = db.collection("users").document(user_id)
    if not user_ref.get().exists:
        return jsonify({"error": "Utilizator negasit"}), 404

    user_ref.update({
        "role": role,
        "updatedAt": datetime.utcnow()
    })

    auth.set_custom_user_claims(user_id, {"role": role})

    return jsonify({"message": "Utilizator aprobat"}), 200

@admin_bp.route("/students", methods=["GET"])
@jwt_required
@role_required("prof", "admin")
def get_students():
    unassigned_only = request.args.get("unassigned", "").lower() == "true"

    students = []
    for doc in db.collection("users").where("role", "==", "student").stream():
        data = doc.to_dict()
        data["id"] = doc.id
        students.append(data)

    if unassigned_only:
        assigned_ids = set()
        for thesis in db.collection("theses").stream():
            sid = thesis.to_dict().get("studentId")
            if sid:
                assigned_ids.add(sid)
        students = [s for s in students if s["id"] not in assigned_ids]

    return jsonify(students), 200


# ── Platforma ─────────────────────────────────────────────────────────────────

@admin_bp.route("/platform", methods=["GET"])
@jwt_required
def get_platform():
    doc = db.collection("platform").document("config").get()
    if not doc.exists:
        return jsonify({"anunt": None, "termenLimita": None}), 200
    return jsonify(doc.to_dict()), 200


@admin_bp.route("/platform", methods=["PUT"])
@jwt_required
@role_required("admin")
def update_platform():
    body = request.get_json()
    anunt = body.get("anunt")
    termen_limita = body.get("termenLimita")

    update_data = {"updatedAt": datetime.utcnow()}
    if anunt is not None:
        update_data["anunt"] = anunt
    if termen_limita is not None:
        update_data["termenLimita"] = termen_limita

    db.collection("platform").document("config").set(update_data, merge=True)
    return jsonify({"message": "Configuratie actualizata"}), 200

@admin_bp.route("/users/<user_id>/reject", methods=["DELETE"])
@jwt_required
@role_required("admin")
def reject_user(user_id):
    user_ref = db.collection("users").document(user_id)
    if not user_ref.get().exists:
        return jsonify({"error": "Utilizator negasit"}), 404
    user_ref.delete()
    try:
        auth.delete_user(user_id)
    except Exception:
        pass
    return jsonify({"message": "Utilizator respins si sters"}), 200