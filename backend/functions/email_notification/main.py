import functions_framework
import firebase_admin
from firebase_admin import firestore
from google.cloud import secretmanager
import base64
import json
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

if not firebase_admin._apps:
    firebase_admin.initialize_app()

db = firestore.client()

PROJECT_ID = "gradify-497616"
GMAIL_SENDER = "gradify.notifications@gmail.com"

STATUS_LABELS = {
    "APPROVED": "Aprobata",
    "REJECTED": "Respinsa",
    "NEEDS_CHANGES": "Necesita modificari",
    "PENDING": "In asteptare",
}


def get_secret(secret_id: str) -> str:
    client = secretmanager.SecretManagerServiceClient()
    name = f"projects/{PROJECT_ID}/secrets/{secret_id}/versions/latest"
    return client.access_secret_version(request={"name": name}).payload.data.decode("utf-8")


def get_user(user_id: str) -> dict:
    doc = db.collection("users").document(user_id).get()
    return doc.to_dict() if doc.exists else {}


def get_feedback(thesis_id: str, section_id: str, version_id: str) -> str:
    doc = (
        db.collection("theses").document(thesis_id)
        .collection("sections").document(section_id)
        .collection("versions").document(version_id)
        .get()
    )
    return doc.to_dict().get("feedbackGeneral", "") if doc.exists else ""


def send_email(recipient_email: str, subject: str, html_body: str, app_password: str) -> None:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = GMAIL_SENDER
    msg["To"] = recipient_email
    msg.attach(MIMEText(html_body, "html"))

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(GMAIL_SENDER, app_password)
        server.sendmail(GMAIL_SENDER, recipient_email, msg.as_string())


def build_html(body_content: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <style>
    body {{ font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }}
    .container {{ max-width: 560px; margin: 40px auto; background: #ffffff;
                  border-radius: 8px; padding: 32px; }}
    .header {{ font-size: 22px; font-weight: bold; color: #1a1a1a; margin-bottom: 24px; }}
    p {{ color: #333333; line-height: 1.6; }}
    .footer {{ margin-top: 32px; font-size: 12px; color: #999999; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">Gradify</div>
    {body_content}
    <div class="footer">Acest email a fost trimis automat. Nu raspunde la acest mesaj.</div>
  </div>
</body>
</html>"""


def build_body(event_type: str, data: dict) -> tuple[str, str]:
    """Returnează (subject, html_body_content)."""

    if event_type == "thesis_created":
        subject = "Gradify — Lucrare de licenta asignata"
        body = f"""
            <p>Buna ziua, <strong>{data['recipient_name']}</strong>,</p>
            <p>Profesorul <strong>{data['actor_name']}</strong> a creat lucrarea
            <strong>{data['thesis_title']}</strong> si ti-a asignat-o.</p>
            <p>Te poti conecta pe platforma pentru a incepe sa adaugi sectiuni.</p>
        """

    elif event_type == "section_uploaded":
        subject = "Gradify — Sectiune noua disponibila"
        body = f"""
            <p>Buna ziua, <strong>{data['recipient_name']}</strong>,</p>
            <p>Studentul <strong>{data['actor_name']}</strong> a incarcat o versiune noua
            pentru sectiunea <strong>{data['section_title']}</strong>
            din lucrarea <strong>{data['thesis_title']}</strong>.</p>
            <p>Te poti conecta pe platforma pentru a o revizui.</p>
        """

    elif event_type == "status_changed":
        subject = "Gradify — Status sectiune actualizat"
        feedback_block = (
            f"<p>Feedback: {data['feedback']}</p>" if data.get("feedback") else ""
        )
        body = f"""
            <p>Buna ziua, <strong>{data['recipient_name']}</strong>,</p>
            <p>Profesorul <strong>{data['actor_name']}</strong> a actualizat statusul
            sectiunii <strong>{data['section_title']}</strong>
            din lucrarea <strong>{data['thesis_title']}</strong>.</p>
            <p>Status nou: <strong>{STATUS_LABELS.get(data['status'], data['status'])}</strong></p>
            {feedback_block}
        """

    else:
        return None, None

    return subject, body


@functions_framework.cloud_event
def email_notification(cloud_event):
    raw = base64.b64decode(cloud_event.data["message"]["data"]).decode("utf-8")
    payload = json.loads(raw)

    event_type = payload.get("eventType")
    thesis_id = payload.get("thesisId")

    thesis_snap = db.collection("theses").document(thesis_id).get()
    if not thesis_snap.exists:
        print(f"[email_notification] Thesis not found: {thesis_id}")
        return
    thesis_data = thesis_snap.to_dict()

    actor = get_user(payload.get("actorId", ""))

    if event_type in ("thesis_created", "status_changed"):
        recipient = get_user(thesis_data.get("studentId", ""))
    elif event_type == "section_uploaded":
        recipient = get_user(thesis_data.get("professorId", ""))
    else:
        print(f"[email_notification] Unknown event type: {event_type}")
        return

    if not recipient.get("email"):
        print(f"[email_notification] No email for recipient")
        return

    feedback = ""
    if event_type == "status_changed":
        feedback = get_feedback(
            thesis_id,
            payload.get("sectionId", ""),
            payload.get("versionId", "")
        )

    data = {
        "recipient_name": recipient.get("name", ""),
        "actor_name": actor.get("name", ""),
        "thesis_title": thesis_data.get("title", ""),
        "section_title": payload.get("sectionTitle", ""),
        "status": payload.get("status", ""),
        "feedback": feedback,
    }

    subject, body_content = build_body(event_type, data)
    if not subject:
        return

    try:
        app_password = get_secret("gmail-app-password")
        send_email(recipient["email"], subject, build_html(body_content), app_password)
        print(f"[email_notification] Email sent to {recipient['email']} — event: {event_type}")
    except Exception as e:
        print(f"[email_notification] Error: {e}")