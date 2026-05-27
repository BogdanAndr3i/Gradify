import functions_framework
import firebase_admin
from firebase_admin import credentials, firestore
from google.cloud import storage
import pdfplumber
import difflib
import base64
import json
import io

if not firebase_admin._apps:
    firebase_admin.initialize_app()

db = firestore.client()
gcs = storage.Client()

BUCKET_NAME = "gradify-497616-thesis-files"


def extract_text(blob_bytes: bytes, mime_type: str) -> str:
    if mime_type == "application/pdf":
        with pdfplumber.open(io.BytesIO(blob_bytes)) as pdf:
            return "\n".join(
                page.extract_text() or "" for page in pdf.pages
            )
    for encoding in ("utf-8", "latin-1"):
        try:
            return blob_bytes.decode(encoding)
        except UnicodeDecodeError:
            continue
    return blob_bytes.decode("utf-8", errors="replace")


def generate_unified_diff(old_text: str, new_text: str) -> str:
    lines = difflib.unified_diff(
        old_text.splitlines(keepends=True),
        new_text.splitlines(keepends=True),
        fromfile="versiunea_anterioara",
        tofile="versiunea_curenta",
        lineterm="",
    )
    return "\n".join(lines)


def download_blob(gcs_path: str) -> bytes:
    return gcs.bucket(BUCKET_NAME).blob(gcs_path).download_as_bytes()


def upload_blob(gcs_path: str, content: str) -> None:
    blob = gcs.bucket(BUCKET_NAME).blob(gcs_path)
    blob.upload_from_string(content, content_type="text/plain; charset=utf-8")


@functions_framework.cloud_event
def diff_generator(cloud_event):
    raw = base64.b64decode(cloud_event.data["message"]["data"]).decode("utf-8")
    payload = json.loads(raw)

    thesis_id = payload["thesisId"]
    section_id = payload["sectionId"]
    version_id = payload["versionId"]
    section_type = payload.get("sectionType", "document")

    version_ref = (
        db.collection("theses")
        .document(thesis_id)
        .collection("sections")
        .document(section_id)
        .collection("versions")
        .document(version_id)
    )

    if section_type == "media":
        version_ref.update({"hasDiff": False, "diffGcsPath": None})
        return

    version_data = version_ref.get().to_dict()
    if not version_data:
        print(f"[diff_generator] Version not found: {version_id}")
        return

    version_number = version_data.get("versionNumber", 1)
    current_gcs_path = version_data.get("gcsPath")
    mime_type = version_data.get("mimeType", "text/plain")

    if version_number <= 1:
        version_ref.update({"hasDiff": False, "diffGcsPath": None})
        return

    prev_snap = (
        db.collection("theses")
        .document(thesis_id)
        .collection("sections")
        .document(section_id)
        .collection("versions")
        .where("versionNumber", "==", version_number - 1)
        .limit(1)
        .get()
    )

    if not prev_snap:
        version_ref.update({"hasDiff": False, "diffGcsPath": None})
        return

    prev_gcs_path = prev_snap[0].to_dict().get("gcsPath")

    try:
        current_text = extract_text(download_blob(current_gcs_path), mime_type)
        prev_text = extract_text(download_blob(prev_gcs_path), mime_type)

        diff_content = generate_unified_diff(prev_text, current_text)

        diff_gcs_path = (
            f"theses/{thesis_id}/sections/{section_id}/versions/{version_id}/diff.diff"
        )
        upload_blob(diff_gcs_path, diff_content)

        version_ref.update({"hasDiff": True, "diffGcsPath": diff_gcs_path})
        print(f"[diff_generator] Diff saved: {diff_gcs_path}")

    except Exception as e:
        print(f"[diff_generator] Error: {e}")
        version_ref.update({"hasDiff": False, "diffGcsPath": None})