import functions_framework
import firebase_admin
from firebase_admin import firestore
from google.cloud import secretmanager
import base64
import json
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import requests
from google.auth.transport.requests import Request as GoogleAuthRequest
from google.oauth2 import id_token as google_id_token

PLAGIAT_SERVICE_URL = "https://plagiat-service-499391921089.europe-west1.run.app"

# Inițializare Firebase Admin doar dacă nu a fost deja inițializat
if not firebase_admin._apps:
    firebase_admin.initialize_app()

db = firestore.client()

# Constante Globale
PROJECT_ID = "gradify-497616"
GMAIL_SENDER = "gradify.notifications@gmail.com"
BASE_URL = "https://gradify-497616.web.app"
LOGO_URL = f"{BASE_URL}/logo_gradify.svg"

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

def build_html(body_content: str, role_text: str) -> str:
    """Generează layout-ul global de email (header, styles, footer)"""
    return f"""<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Notificare Gradify</title>
  <style>
    body {{
      margin: 0;
      padding: 40px 20px;
      background-color: #f3f4f6;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      color: #374151;
    }}
    .email-wrapper {{
      max-width: 600px;
      margin: 0 auto 50px auto;
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
      border: 1px solid #f3f4f6;
    }}
    .header {{
      background-color: #e5e7eb;
      padding: 30px;
      text-align: center;
      border-bottom: 1px solid #d1d5db;
    }}
    .logo-img {{
      height: 80px;
      width: auto;
      max-width: 100%;
      display: block;
      margin: 0 auto;
    }}
    .content {{
      padding: 40px;
      line-height: 1.7;
      font-size: 16px;
    }}
    .content p {{
      margin: 0 0 20px 0;
    }}
    .content strong {{
      color: #111827;
      font-weight: 600;
    }}
    .thesis-title {{
      text-align: center;
      font-size: 18px;
      color: #1f2937;
      background-color: #f8fafc;
      padding: 15px;
      border-radius: 8px;
      border: 1px dashed #cbd5e1;
      margin: 25px 0;
      font-weight: 600;
    }}
    .badge {{
      display: inline-block;
      padding: 6px 16px;
      border-radius: 9999px;
      font-size: 14px;
      font-weight: 600;
      margin-top: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      background-color: #e5e7eb;
      color: #374151;
      border: 1px solid #d1d5db;
    }}
    .badge-green {{ background-color: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }}
    .badge-yellow {{ background-color: #fef9c3; color: #a16207; border: 1px solid #fef08a; }}
    .badge-red {{ background-color: #fee2e2; color: #b91c1c; border: 1px solid #fecaca; }}
    .feedback-box {{
      background-color: #f0fdf4;
      border: 4px solid #22c55e;
      padding: 24px;
      margin: 30px 0;
      border-radius: 0 12px 12px 0;
      position: relative;
    }}
    .feedback-box.warning {{
      background-color: #fffbeb;
      border-color: #eab308; /* Galben/Portocaliu */
    }}
    .feedback-box.error {{
      background-color: #fef2f2;
      border-color: #ef4444; /* Roșu */
    }}
    .feedback-box p {{
      margin: 0;
      color: #4b5563;
      font-style: italic;
      font-size: 15px;
    }}
    .btn-container {{
      text-align: center;
      margin: 40px 0 10px 0;
    }}
    .cta-button {{
      display: inline-block;
      background-color: #2563eb;
      color: #ffffff;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
      transition: background-color 0.2s, transform 0.2s;
    }}
    .cta-button:hover {{
      background-color: #1d4ed8;
    }}
    .footer {{
      background-color: #f9fafb;
      padding: 24px 40px;
      text-align: center;
      color: #6b7280;
      font-size: 13px;
      line-height: 1.6;
      border-top: 1px solid #e5e7eb;
    }}
    .footer p {{
      margin: 0 0 8px 0;
    }}
    .footer a {{
      color: #2563eb;
      text-decoration: none;
    }}
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="header">
      <img src="{LOGO_URL}" alt="Gradify Logo" class="logo-img">
    </div>
    <div class="content">
      {body_content}
    </div>
    <div class="footer">
      <p>Acest email a fost generat automat de platforma <strong>Gradify</strong>.</p>
      <p>Ai primit acest mesaj deoarece ești înregistrat ca {role_text}. <a href="{BASE_URL}/profil">Setări profil</a></p>
      <p>&copy; 2026 Gradify. Toate drepturile rezervate.</p>
    </div>
  </div>
</body>
</html>"""

def build_body(event_type: str, data: dict) -> tuple[str, str, str]:
    """Returnează (subject, html_body_content, role_text) pe baza tipului de eveniment."""
    
    thesis_id = data.get("thesis_id", "")

    if event_type == "thesis_created":
        subject = f"Gradify — Lucrare de licență asignată: {data['thesis_title']}"
        role_text = "student"
        body = f"""
            <p>Salut <strong>{data['recipient_name']}</strong>,</p>
            <p>Te informăm că profesorul coordonator <strong>{data['actor_name']}</strong> ți-a asignat oficial lucrarea de licență în platforma noastră.</p>
            <div class="thesis-title">„{data['thesis_title']}”</div>
            <p>Începând din acest moment, lucrarea este activă în contul tău. Te poți autentifica pentru a stabili structura inițială, a adăuga secțiunile necesare și a încărca primele documente pentru revizuire.</p>
            <p>Mult succes în redactarea lucrării!</p>
            <div class="btn-container">
                <a href="{BASE_URL}/upload" class="cta-button">Accesează Platforma</a>
            </div>
        """

    elif event_type == "section_uploaded":
        subject = f"Gradify — Material nou încărcat: {data['section_title']}"
        role_text = "profesor coordonator"
        body = f"""
            <p>Bună ziua, <strong>{data['recipient_name']}</strong>,</p>
            <p>Studentul <strong>{data['actor_name']}</strong> a încărcat o nouă versiune a secțiunii <strong>„{data['section_title']}”</strong>, aferentă lucrării de licență pe care o coordonați.</p>
            <p>Noul material este acum disponibil în platformă și așteaptă evaluarea dumneavoastră. Puteți vizualiza textul integral, istoricul modificărilor și puteți lăsa comentarii direct pe secțiunile dorite.</p>
            <div class="btn-container">
                <a href="{BASE_URL}/revizuire/{thesis_id}" class="cta-button">Revizuiește Secțiunea</a>
            </div>
        """

    elif event_type == "status_changed":
        subject = f"Gradify — Actualizare status secțiune: {data['section_title']}"
        role_text = "student"
        
        raw_status = data['status']
        status_label = STATUS_LABELS.get(raw_status, raw_status)
        
        # Logica dinamică pentru clase CSS
        badge_class = "badge-yellow"
        feedback_class = "warning"
        
        if raw_status == "APPROVED":
            badge_class = "badge-green"
            feedback_class = ""  # Va folosi styling-ul verde default din CSS
        elif raw_status == "REJECTED":
            badge_class = "badge-red"
            feedback_class = "error" # Va folosi styling-ul roșu de eroare

        feedback_block = ""
        if data.get("feedback"):
            feedback_block = f"""
                <p style="margin-top: 30px;">Mai jos regăsești observațiile lăsate de profesor:</p>
                <div class="feedback-box {feedback_class}">
                    <p>„{data['feedback']}”</p>
                </div>
            """

        body = f"""
            <p>Salut <strong>{data['recipient_name']}</strong>,</p>
            <p>Profesorul coordonator <strong>{data['actor_name']}</strong> a evaluat cea mai recentă versiune a secțiunii <strong>„{data['section_title']}”</strong>.</p>
            
            <p>Statusul secțiunii a fost actualizat la:<br>
            <span class="badge {badge_class}">{status_label}</span></p>

            {feedback_block}

            <p>Te rugăm să accesezi platforma pentru a vizualiza toate detaliile și a lua măsurile necesare.</p>
            <div class="btn-container">
                <a href="{BASE_URL}/istoric" class="cta-button">Vezi Detalii în Cont</a>
            </div>
        """

    else:
        return None, None, None

    return subject, body, role_text

def trigger_corpus_rebuild():
    try:
        auth_req = GoogleAuthRequest()
        token = google_id_token.fetch_id_token(auth_req, PLAGIAT_SERVICE_URL)
        requests.post(
            f"{PLAGIAT_SERVICE_URL}/rebuild-corpus",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10
        )
        print("[email_notification] Rebuild corpus triggered.")
    except Exception as e:
        print(f"[email_notification] Rebuild corpus error: {e}")

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
    if event_type == "status_changed" and payload.get("status") == "APPROVED":
        trigger_corpus_rebuild()

    data = {
        "recipient_name": recipient.get("name", ""),
        "actor_name": actor.get("name", ""),
        "thesis_title": thesis_data.get("title", ""),
        "section_title": payload.get("sectionTitle", ""),
        "status": payload.get("status", ""),
        "feedback": feedback,
        "thesis_id": thesis_id,
    }

    subject, body_content, role_text = build_body(event_type, data)
    if not subject:
        return

    try:
        app_password = get_secret("gmail-app-password")
        send_email(recipient["email"], subject, build_html(body_content, role_text), app_password)
        print(f"[email_notification] Email sent to {recipient['email']} — event: {event_type}")
    except Exception as e:
        print(f"[email_notification] Error: {e}")