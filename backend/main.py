from flask import Flask, jsonify, request
from dotenv import load_dotenv
load_dotenv()

from flask_cors import CORS
from firestore_connect import db
from logger import log_error, log_info, log_warning
from blueprints.auth import auth_bp
from blueprints.thesis import thesis_bp
from blueprints.sections import sections_bp
from blueprints.versions import versions_bp
from blueprints.feedback import feedback_bp
from blueprints.status import status_bp
from blueprints.admin import admin_bp
from blueprints.plagiat import plagiat_bp

app = Flask(__name__)

CORS(app, origins=[
    "https://gradify-497616.web.app",
    "https://gradify-497616.firebaseapp.com",
    "http://localhost:5173"
])

app.register_blueprint(auth_bp, url_prefix="/api/auth")
app.register_blueprint(thesis_bp, url_prefix="/api/theses")
app.register_blueprint(sections_bp, url_prefix="/api/theses")
app.register_blueprint(versions_bp, url_prefix="/api/theses")
app.register_blueprint(feedback_bp, url_prefix="/api/theses")
app.register_blueprint(status_bp, url_prefix="/api/theses")
app.register_blueprint(admin_bp, url_prefix="/api/admin")
app.register_blueprint(plagiat_bp, url_prefix="/api/plagiat")

@app.errorhandler(404)
def not_found(e):
    log_warning(f"404 - {request.method} {request.path}")
    return jsonify({"error": "Endpoint negasit"}), 404

@app.errorhandler(405)
def method_not_allowed(e):
    log_warning(f"405 - {request.method} {request.path}")
    return jsonify({"error": "Metoda HTTP nepermisa"}), 405

@app.errorhandler(500)
def internal_error(e):
    log_error(f"500 - {request.method} {request.path}", extra={"error": str(e)})
    return jsonify({"error": "Eroare interna de server"}), 500

@app.errorhandler(Exception)
def unhandled_exception(e):
    log_error(
        f"Exceptie necaptata - {request.method} {request.path}",
        extra={"error": str(e), "type": type(e).__name__}
    )
    return jsonify({"error": "Eroare interna de server"}), 500

if __name__ == "__main__":
    app.run(debug=False)