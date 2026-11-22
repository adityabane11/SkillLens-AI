# SkillLens AI — AI-Based Resume Screening and Skill Gap Analysis Platform

A Flask academic prototype that compares a resume with a target job description, screens the combined text using a TF-IDF + Logistic Regression classifier, identifies overlapping and missing skills, and suggests learning actions.

## Features
- Upload resumes as PDF, DOCX, or TXT (8 MB maximum).
- Extract text from PDF/DOCX/TXT files.
- ML screening label and model confidence (prototype indicator only).
- Phrase-aware skill detection with aliases such as `sklearn`/`scikit-learn`, `NodeJS`/`Node.js`, and `natural language processing`/`NLP`.
- Job-skill comparison, required/preferred skill separation when the job description explicitly labels those sections, and weighted coverage (required skills count more than preferred skills).
- Missing-skill learning suggestions and a downloadable text report.
- Sample job description and sample resume in `data/`.
- Model training script and evaluation output.

## Setup (Windows PowerShell)
1. Extract the ZIP.
2. Open PowerShell in the folder containing `app.py` and `requirements.txt`.
3. Create and activate a virtual environment:

   ```powershell
   py -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```

   If PowerShell blocks activation, use `\.venv\Scripts\python.exe` directly in the commands below.
4. Install dependencies:

   ```powershell
   python -m pip install --upgrade pip
   python -m pip install -r requirements.txt
   ```
5. Run the app:

   ```powershell
   python app.py
   ```
6. Open `http://127.0.0.1:5000` in your browser.

If `python` is not recognized, use `py app.py` or `\.venv\Scripts\python.exe app.py` after creating the virtual environment.

## Test with the included sample files
- Resume: `data/sample_resume.txt`
- Job description: use the sample button in the app or open `data/sample_job_description.txt`.

## Retrain the screening model (optional)
From the project root:

```powershell
python train_model.py
```

The training script writes `models/resume_screening_model.joblib` and prints held-out test metrics. The included dataset is very small and synthetic; the reported metrics are only a demonstration of the evaluation workflow, not evidence of real-world hiring performance. Use a larger, ethically sourced, properly labelled dataset for meaningful evaluation.

## Important limitations
- This is a learning/demo prototype, not an automated hiring decision system.
- Skill detection uses a finite taxonomy and phrase matching; it can miss synonyms, infer skills incorrectly from context, and cannot verify actual proficiency.
- Required/preferred parsing depends on headings in the job description. Without headings, detected skills are treated as equally important.
- Model confidence is not a probability that a candidate is qualified.
- Scanned/image-only PDFs may need OCR, which is not included.
- For real deployment, add authentication, privacy controls, secure file handling, stronger dataset evaluation, bias testing, and human review.


## Deploy to Vercel

This repository has a Vercel Python serverless entry point (`api/index.py`) and routing configuration (`vercel.json`).

1. Create a new GitHub repository and upload the contents of this folder (the files inside this ZIP should be at the repository root).
2. In Vercel, choose **Add New → Project**, import that GitHub repository, and keep the project root as the repository root.
3. Deploy. Vercel should detect the Python function and install dependencies from `requirements.txt`.
4. Test the homepage, sample analysis, and PDF/DOCX/TXT uploads after deployment.

**Important:** Vercel's serverless environment has request-duration, bundle-size, and temporary-storage limits. This is an academic demo; verify the deployed app end-to-end. Resume contents are sensitive: avoid uploading real personal resumes to a public demo unless you have appropriate privacy controls.


## Vercel deployment note
This package uses Vercel zero-configuration Flask detection from the root `app.py` and serves static assets from `public/static`. Do not restore a catch-all rewrite to `/api/index`. Deploy from the directory containing `app.py` and `requirements.txt`.
