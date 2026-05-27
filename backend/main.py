from flask import Flask
from blueprints.auth import auth_bp
from blueprints.thesis import thesis_bp
from blueprints.sections import sections_bp
from blueprints.versions import versions_bp
from blueprints.feedback import feedback_bp
from blueprints.status import status_bp
from blueprints.admin import admin_bp
import firebase_admin
from firebase_admin import credentials

cred = credentials.ApplicationDefault()
firebase_admin.initialize_app(cred, {
    "projectId": "gradify-497616",
    "storageBucket": "gradify-497616-thesis-files"
})

app = Flask(__name__)

app.register_blueprint(auth_bp, url_prefix="/api/auth")
app.register_blueprint(thesis_bp, url_prefix="/api/theses")
app.register_blueprint(sections_bp, url_prefix="/api/theses")
app.register_blueprint(versions_bp, url_prefix="/api/sections")
app.register_blueprint(feedback_bp, url_prefix="/api/versions")
app.register_blueprint(status_bp, url_prefix="/api/versions")
app.register_blueprint(admin_bp, url_prefix="/api/admin")

if __name__ == "__main__":
    app.run(debug=False)