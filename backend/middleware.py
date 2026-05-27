from functools import wraps
from flask import request, jsonify, g
from firebase_admin import auth
from logger import log_error, log_warning

def jwt_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            log_warning(
                "Token lipsa",
                extra={"endpoint": request.path, "method": request.method}
            )
            return jsonify({"error": "Token lipsa"}), 401
        token = auth_header.split("Bearer ")[1]
        try:
            decoded = auth.verify_id_token(token)
            g.user_id = decoded["uid"]
            g.role = decoded.get("role", "pending")
            g.email = decoded.get("email", "")
        except Exception as e:
            log_error(
                "Token invalid",
                extra={"endpoint": request.path, "error": str(e)}
            )
            return jsonify({"error": "Token invalid"}), 401
        return f(*args, **kwargs)
    return decorated

def role_required(*roles):
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            if g.role not in roles:
                log_warning(
                    "Acces interzis",
                    user_id=g.user_id,
                    extra={
                        "endpoint": request.path,
                        "role": g.role,
                        "required": list(roles)
                    }
                )
                return jsonify({"error": "Acces interzis"}), 403
            return f(*args, **kwargs)
        return decorated
    return decorator