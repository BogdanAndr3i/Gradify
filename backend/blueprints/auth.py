from flask import Blueprint, jsonify, request, g
from middleware import jwt_required
from firestore_connect import db
from datetime import datetime

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/register", methods=["POST"])
@jwt_required
def register():
    user_ref = db.collection("users").document(g.user_id)
    user_doc = user_ref.get()

    if user_doc.exists:
        data = user_doc.to_dict()
        data["id"] = g.user_id
        return jsonify(data), 200

    body = request.get_json() or {}
    name = body.get("name", "").strip() or g.email.split("@")[0]

    now = datetime.utcnow()
    user_ref.set({
        "email": g.email,
        "name": name,
        "role": "pending",
        "facultate": None,
        "departament": None,
        "createdAt": now,
        "updatedAt": now,
    })

    return jsonify({
        "id": g.user_id,
        "email": g.email,
        "name": name,
        "role": "pending",
    }), 201


@auth_bp.route("/me", methods=["GET"])
@jwt_required
def me():
    user_ref = db.collection("users").document(g.user_id)
    user_doc = user_ref.get()
    if not user_doc.exists:
        return jsonify({"error": "Utilizator negasit"}), 404
    data = user_doc.to_dict()
    data["id"] = g.user_id
    return jsonify(data), 200


@auth_bp.route("/logout", methods=["POST"])
@jwt_required
def logout():
    return jsonify({"message": "Deconectat"}), 200

@auth_bp.route("/me", methods=["PUT"])
@jwt_required
def update_me():
    body = request.get_json() or {}
    allowed = ["facultate", "departament"]
    update_data = {k: body[k] for k in allowed if k in body}
    if not update_data:
        return jsonify({"error": "Niciun camp de actualizat"}), 400
    update_data["updatedAt"] = datetime.utcnow()
    db.collection("users").document(g.user_id).update(update_data)
    return jsonify({"message": "Profil actualizat"}), 200