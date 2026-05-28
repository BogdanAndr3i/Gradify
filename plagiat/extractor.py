import pdfplumber
import os
import re
import io
import pickle
import tempfile
import threading
import nltk
import numpy as np
from nltk.corpus import stopwords
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from flask import Flask, request, jsonify
from flask_cors import CORS
from google.cloud import storage, firestore

nltk.download('stopwords', quiet=True)

BUCKET_NAME = os.environ.get("BUCKET_NAME", "gradify-497616-thesis-files")
CORPUS_PICKLE_PATH = "_plagiat_corpus/corpus.pkl"
SEED_PREFIX = "_plagiat_corpus/seed/"

storage_client = storage.Client()
db = firestore.Client()

_corpus_lock = threading.Lock()


class DetectorPlagiat:
    def __init__(self, dimensiune_bucata=50):
        self.vectorizer = TfidfVectorizer()
        self.matrice_baza_date = None
        self.mapare_bucati = []
        self.dimensiune_bucata = dimensiune_bucata

    def curata_text(self, text_brut):
        text = text_brut.lower()
        text = re.sub(r'[^a-zăâîșț]+', ' ', text)
        cuvinte = text.split()
        stop_words_ro = set(stopwords.words('romanian'))
        return [c for c in cuvinte if c not in stop_words_ro and len(c) > 2]

    def imparte_in_bucati(self, lista_cuvinte):
        bucati = []
        for i in range(0, len(lista_cuvinte), self.dimensiune_bucata):
            bucata = " ".join(lista_cuvinte[i:i + self.dimensiune_bucata])
            bucati.append(bucata)
        return bucati

    def extrage_text_din_pdf(self, continut_bytes):
        text_complet = ""
        try:
            with pdfplumber.open(io.BytesIO(continut_bytes)) as pdf:
                for pagina in pdf.pages:
                    extras = pagina.extract_text()
                    if extras:
                        text_complet += extras + "\n"
        except Exception as e:
            print(f"Eroare extragere text PDF: {e}")
        return text_complet

    def construieste_corpus(self, blobs_cu_id):
        """
        blobs_cu_id: lista de tuple (identifier, continut_bytes)
        identifier: pentru seed = numele fisierului, pentru versiuni = version_id
        """
        bucati_totale = []
        mapare = []

        for identifier, continut_bytes in blobs_cu_id:
            text_brut = self.extrage_text_din_pdf(continut_bytes)
            if not text_brut:
                continue
            cuvinte_curate = self.curata_text(text_brut)
            bucati_document = self.imparte_in_bucati(cuvinte_curate)
            for index, bucata in enumerate(bucati_document):
                bucati_totale.append(bucata)
                mapare.append({"document": identifier, "index_bucata": index})

        if bucati_totale:
            self.vectorizer = TfidfVectorizer()
            self.matrice_baza_date = self.vectorizer.fit_transform(bucati_totale)
            self.mapare_bucati = mapare
            print(f"Corpus construit: {len(bucati_totale)} fragmente din {len(blobs_cu_id)} documente.")
        else:
            print("Avertisment: niciun text extras, corpus gol.")

    def verifica_document(self, continut_bytes, version_id):
        if self.matrice_baza_date is None:
            return None, [], []

        text_brut = self.extrage_text_din_pdf(continut_bytes)
        cuvinte_curate = self.curata_text(text_brut)
        bucati_nou = self.imparte_in_bucati(cuvinte_curate)

        if not bucati_nou:
            return None, [], []

        matrice_nou = self.vectorizer.transform(bucati_nou)
        similaritati = cosine_similarity(matrice_nou, self.matrice_baza_date)

        # Excludere "sine insusi" dupa version_id
        for i, mapare in enumerate(self.mapare_bucati):
            if mapare["document"] == version_id:
                similaritati[:, i] = 0.0

        scoruri_agregate = {}
        fragmente_suspecte = []

        for index_bucata_noua, scoruri_bucata in enumerate(similaritati):
            scor_maxim = float(np.max(scoruri_bucata))
            index_cel_mai_bun = int(np.argmax(scoruri_bucata))

            if scor_maxim == 0:
                continue

            sursa = self.mapare_bucati[index_cel_mai_bun]["document"]
            scoruri_agregate.setdefault(sursa, []).append(scor_maxim)

            if scor_maxim > 0.50:
                fragmente_suspecte.append({
                    "text_student": bucati_nou[index_bucata_noua],
                    "document_sursa": sursa,
                    "scor_potrivire": round(scor_maxim * 100, 2)
                })

        fragmente_suspecte.sort(key=lambda x: x["scor_potrivire"], reverse=True)

        surse_principale = []
        for doc, lista_scoruri in scoruri_agregate.items():
            procent = round(float(np.mean(lista_scoruri)) * 100, 2)
            if procent >= 5.0:
                surse_principale.append({"document": doc, "procent": procent})
        surse_principale.sort(key=lambda x: x["procent"], reverse=True)

        scor_general = surse_principale[0]["procent"] if surse_principale else 0.0

        if scor_general < 15:
            risc = "VERDE"
            mesaj = "Originalitate ridicata. Nu au fost detectate similaritati majore."
        elif scor_general < 40:
            risc = "GALBEN"
            mesaj = "Risc moderat. Au fost detectate parafrazari sau similaritati partiale."
        else:
            risc = "ROSU"
            mesaj = "Risc major de plagiat. Au fost detectate fragmente copiate masiv."

        return {"scor_general": scor_general, "stare_risc": risc, "mesaj": mesaj}, surse_principale, fragmente_suspecte


# ── Corpus management ──────────────────────────────────────────────────────────

detector = DetectorPlagiat()


def salveaza_corpus_in_gcs():
    date = pickle.dumps({
        "vectorizer": detector.vectorizer,
        "matrice_baza_date": detector.matrice_baza_date,
        "mapare_bucati": detector.mapare_bucati,
    })
    bucket = storage_client.bucket(BUCKET_NAME)
    bucket.blob(CORPUS_PICKLE_PATH).upload_from_string(
        date, content_type="application/octet-stream"
    )
    print("Corpus salvat in GCS.")


def incarca_corpus_din_gcs():
    try:
        bucket = storage_client.bucket(BUCKET_NAME)
        blob = bucket.blob(CORPUS_PICKLE_PATH)
        if not blob.exists():
            print("corpus.pkl nu exista in GCS — se construieste acum din seed.")
            construieste_si_salveaza_corpus()
            return
        date = blob.download_as_bytes()
        obj = pickle.loads(date)
        detector.vectorizer = obj["vectorizer"]
        detector.matrice_baza_date = obj["matrice_baza_date"]
        detector.mapare_bucati = obj["mapare_bucati"]
        print(f"Corpus incarcat din GCS: {len(detector.mapare_bucati)} fragmente.")
    except Exception as e:
        print(f"Eroare la incarcarea corpus din GCS: {e}")


def construieste_si_salveaza_corpus():
    blobs_cu_id = []
    bucket = storage_client.bucket(BUCKET_NAME)

    # 1. Seed
    for blob in bucket.list_blobs(prefix=SEED_PREFIX):
        if blob.name.endswith(".pdf"):
            continut = blob.download_as_bytes()
            identifier = os.path.basename(blob.name)
            blobs_cu_id.append((identifier, continut))
    print(f"Seed: {len(blobs_cu_id)} documente.")

    # 2. Versiuni APPROVED din Firestore
    versiuni_approved = (
        db.collection_group("versions")
        .where("status", "==", "APPROVED")
        .stream()
    )
    count_versiuni = 0
    for ver in versiuni_approved:
        data = ver.to_dict()
        gcs_path = data.get("gcsPath")
        version_id = ver.id
        if not gcs_path:
            continue
        try:
            continut = bucket.blob(gcs_path).download_as_bytes()
            blobs_cu_id.append((version_id, continut))
            count_versiuni += 1
        except Exception as e:
            print(f"Eroare download {gcs_path}: {e}")
    print(f"Versiuni APPROVED: {count_versiuni} documente.")

    with _corpus_lock:
        detector.construieste_corpus(blobs_cu_id)
        salveaza_corpus_in_gcs()


# ── Flask app ──────────────────────────────────────────────────────────────────

app = Flask(__name__)
CORS(app)

print("Pornire server — incarc corpus din GCS...")
incarca_corpus_din_gcs()


@app.route('/api/analyze', methods=['POST'])
def analyze_document():
    """
    Accepta:
      - multipart file (TesterPlagiatPage — tool manual)
      - JSON { gcs_path, version_id } (versions.py — trigger automat)
    """
    version_id = None
    continut_bytes = None

    if request.is_json:
        body = request.get_json()
        gcs_path = body.get("gcs_path")
        version_id = body.get("version_id")
        if not gcs_path or not version_id:
            return jsonify({"eroare": "gcs_path si version_id sunt obligatorii."}), 400
        try:
            bucket = storage_client.bucket(BUCKET_NAME)
            continut_bytes = bucket.blob(gcs_path).download_as_bytes()
        except Exception as e:
            return jsonify({"eroare": f"Nu am putut descarca fisierul din GCS: {e}"}), 500
    else:
        if 'file' not in request.files:
            return jsonify({"eroare": "Nu a fost atasat niciun fisier."}), 400
        fisier = request.files['file']
        version_id = fisier.filename
        continut_bytes = fisier.read()

    with _corpus_lock:
        sumar, surse, fragmente = detector.verifica_document(continut_bytes, version_id)

    if sumar is None:
        return jsonify({"eroare": "Fisierul nu contine text procesabil sau corpusul e gol."}), 400

    return jsonify({
        "status": "succes",
        "sumar_analiza": sumar,
        "surse_principale": surse,
        "fragmente_suspecte": fragmente
    }), 200


@app.route('/rebuild-corpus', methods=['POST'])
def rebuild_corpus():
    """Apelat de email_notification Cloud Function cand o versiune devine APPROVED."""
    threading.Thread(target=construieste_si_salveaza_corpus).start()
    return jsonify({"status": "rebuild started"}), 202


@app.route('/health', methods=['GET'])
def health():
    fragmente = len(detector.mapare_bucati) if detector.mapare_bucati else 0
    return jsonify({"status": "ok", "corpus_fragmente": fragmente}), 200


if __name__ == '__main__':
    print("Server anti-plagiat ONLINE pe http://127.0.0.1:5000")
    app.run(debug=True, port=5000)