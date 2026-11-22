from flask import Flask, render_template, request
from werkzeug.utils import secure_filename
from pathlib import Path
import io
import os
import joblib
import fitz
from docx import Document

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 8 * 1024 * 1024

ALLOWED_EXTENSIONS = {"pdf", "docx", "txt"}

SKILL_TAXONOMY = [
    "python", "java", "c++", "c", "javascript", "typescript", "html", "css",
    "react", "node.js", "flask", "django", "rest api", "sql", "mysql",
    "mongodb", "pandas", "numpy", "scikit-learn", "tensorflow", "pytorch",
    "machine learning", "deep learning", "nlp", "data analysis",
    "data visualization", "git", "github", "linux", "docker", "aws",
    "communication", "problem solving", "teamwork", "agile"
]

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "models" / "resume_screening_model.joblib"
MODEL = joblib.load(MODEL_PATH) if MODEL_PATH.exists() else None

RECOMMENDATIONS = {
    "python": "Practise Python fundamentals, functions, collections and small projects.",
    "java": "Review OOP, collections, exception handling and build a small Java project.",
    "sql": "Practise SELECT, JOIN, GROUP BY, subqueries and database design.",
    "mysql": "Build a small MySQL database and practise joins and constraints.",
    "flask": "Build a small Flask REST API and connect it to a database.",
    "rest api": "Learn HTTP methods, JSON, status codes and REST API design.",
    "machine learning": "Study supervised learning, evaluation metrics and scikit-learn pipelines.",
    "nlp": "Learn preprocessing, TF-IDF, embeddings and text classification.",
    "pandas": "Practise data cleaning, filtering, grouping and merging datasets.",
    "git": "Practise commits, branches, merges and conflict resolution.",
    "github": "Publish projects with README files and meaningful commit history.",
    "html": "Practise semantic HTML and accessible page structure.",
    "css": "Practise responsive design, Flexbox and CSS Grid.",
    "javascript": "Practise DOM manipulation, events, arrays and asynchronous requests.",
    "react": "Learn components, props, state and hooks.",
    "communication": "Practise explaining technical work clearly and presenting projects.",
    "problem solving": "Solve beginner programming problems regularly and explain your approach."
}

def allowed_file(name):
    return "." in name and name.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_text(upload):
    name = secure_filename(upload.filename or "")
    ext = Path(name).suffix.lower()
    raw = upload.read()
    if ext == ".pdf":
        with fitz.open(stream=raw, filetype="pdf") as pdf:
            return "\n".join(p.get_text("text") for p in pdf)
    if ext == ".docx":
        doc = Document(io.BytesIO(raw))
        text = [p.text for p in doc.paragraphs]
        for table in doc.tables:
            for row in table.rows:
                text.append(" ".join(cell.text for cell in row.cells))
        return "\n".join(text)
    if ext == ".txt":
        return raw.decode("utf-8", errors="ignore")
    raise ValueError("Unsupported file")

def clean(text):
    return " ".join((text or "").replace("\x00", " ").split())

# Phrase-aware matching reduces false positives (for example, "c" inside "communication").
SKILL_ALIASES = {
    "c++": ["c++", "cpp"], "c": ["c language", "programming in c"],
    "javascript": ["javascript", "js"], "typescript": ["typescript"],
    "node.js": ["node.js", "nodejs", "node js"], "rest api": ["rest api", "restful api", "rest apis"],
    "scikit-learn": ["scikit-learn", "scikit learn", "sklearn"],
    "machine learning": ["machine learning", "ml"], "deep learning": ["deep learning"],
    "nlp": ["nlp", "natural language processing"], "data analysis": ["data analysis", "analyze data", "analyse data"],
    "problem solving": ["problem solving", "problem-solving"], "communication": ["communication", "communicate effectively"],
    "teamwork": ["teamwork", "team work", "collaboration"], "mysql": ["mysql", "my sql"],
    "github": ["github"], "git": ["git", "version control"],
}


def _contains_phrase(text, phrase):
    import re
    return re.search(r"(?<![a-z0-9+#.])" + re.escape(phrase.lower()) + r"(?![a-z0-9+#.])", text.lower()) is not None


def find_skills(text):
    low = clean(text).lower()
    found = []
    for skill in SKILL_TAXONOMY:
        aliases = SKILL_ALIASES.get(skill, [skill])
        if any(_contains_phrase(low, alias) for alias in aliases):
            found.append(skill)
    return sorted(set(found))


def classify_job_skills(job_text):
    """Separate required/preferred skills when the job description labels them.
    If no labelled sections are found, all detected skills are treated equally.
    """
    import re
    text = clean(job_text)
    required_markers = r"\b(required|requirements|must[- ]have|minimum qualifications|essential skills|what you need)\b"
    preferred_markers = r"\b(preferred|nice[- ]to[- ]have|bonus skills|good to have|desired qualifications)\b"
    matches = list(re.finditer(required_markers + "|" + preferred_markers, text, re.I))
    if not matches:
        skills = find_skills(text)
        return skills, [], False
    required, preferred = set(), set()
    for i, match in enumerate(matches):
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        section = text[match.end():end]
        skills = set(find_skills(section))
        marker = match.group(0).lower()
        if re.search(preferred_markers, marker, re.I):
            preferred.update(skills)
        else:
            required.update(skills)
    preferred -= required
    # Include skills before the first labelled section as general requirements.
    if matches[0].start() > 0:
        required.update(find_skills(text[:matches[0].start()]))
    if not required and not preferred:
        skills = find_skills(text)
        return skills, [], False
    return sorted(required), sorted(preferred), True


def skill_gap(resume_text, job_text):
    resume_skills = set(find_skills(resume_text))
    required, preferred, labelled = classify_job_skills(job_text)
    role_skills = set(required) | set(preferred)
    matched = sorted(resume_skills & role_skills)
    missing = sorted(role_skills - resume_skills)
    matched_required = sorted(resume_skills & set(required))
    missing_required = sorted(set(required) - resume_skills)
    matched_preferred = sorted(resume_skills & set(preferred))
    missing_preferred = sorted(set(preferred) - resume_skills)
    required_coverage = round(len(matched_required) / len(required) * 100, 1) if required else None
    overall_coverage = round((len(matched_required) + 0.5 * len(matched_preferred)) / (len(required) + 0.5 * len(preferred)) * 100, 1) if role_skills else 0
    return {
        "matched": matched, "missing": missing, "coverage": overall_coverage,
        "required": required, "preferred": preferred,
        "matched_required": matched_required, "missing_required": missing_required,
        "matched_preferred": matched_preferred, "missing_preferred": missing_preferred,
        "required_coverage": required_coverage, "labelled_sections": labelled,
        "resume_skills": sorted(resume_skills),
    }

def ml_screen(resume_text, job_text):
    if MODEL is None:
        return {"label": "Model unavailable", "confidence": 0.0}
    combined = resume_text + " [JOB] " + job_text
    label = MODEL.predict([combined])[0]
    probs = MODEL.predict_proba([combined])[0]
    confidence = float(max(probs) * 100)
    return {
        "label": str(label),
        "confidence": round(confidence, 1)
    }

@app.route("/", methods=["GET", "POST"])
def index():
    result = None
    error = None
    job_text = ""
    resume_name = ""

    if request.method == "POST":
        upload = request.files.get("resume")
        job_text = clean(request.form.get("job_description", ""))

        if not upload or not upload.filename:
            error = "Please select a resume."
        elif not allowed_file(upload.filename):
            error = "Upload a PDF, DOCX, or TXT file."
        elif not job_text:
            error = "Please enter a job description."
        else:
            try:
                resume_name = secure_filename(upload.filename)
                resume_text = clean(extract_text(upload))
                if len(resume_text) < 20:
                    error = "Very little text was extracted from the resume."
                else:
                    gaps = skill_gap(resume_text, job_text)
                    ml = ml_screen(resume_text, job_text)
                    result = {
                        **gaps,
                        "ml": ml,
                        "resume_words": len(resume_text.split()),
                        "job_words": len(job_text.split()),
                        "recommendations": [
                            (s, RECOMMENDATIONS.get(
                                s, f"Study {s} fundamentals and practise them in a small project."
                            ))
                            for s in gaps["missing"]
                        ]
                    }
            except Exception:
                app.logger.exception("Analysis failed")
                error = "Could not read the resume. Please check that it is a valid file."

    return render_template(
        "index.html",
        result=result,
        error=error,
        job_text=job_text,
        resume_name=resume_name,
        sample_job_description=(BASE_DIR / "data" / "sample_job_description.txt").read_text(encoding="utf-8") if (BASE_DIR / "data" / "sample_job_description.txt").exists() else ""
    )

@app.errorhandler(413)
def too_large(_):
    return render_template("index.html",
        error="File is too large. Maximum size is 8 MB.",
        result=None, job_text="", resume_name="", sample_job_description=""
    ), 413

if __name__ == "__main__":
    app.run(debug=False)
