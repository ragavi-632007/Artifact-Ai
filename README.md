# ArtifactAI

ArtifactAI is an AI-powered archaeological document analysis system that uses NLP and machine learning to analyze excavation reports and discover relationships between archaeological sites.

## 🚀 Features

* PDF excavation report analysis
* Text preprocessing and cleaning
* Semantic embeddings using Sentence Transformers
* Cosine similarity analysis
* K-Means clustering
* t-SNE visualization
* Interactive frontend dashboard

## 🛠️ Tech Stack

### Frontend

* React.js

### Backend / AI

* Python
* Flask
* pdfplumber
* scikit-learn
* sentence-transformers
* pandas
* matplotlib

## 📂 Workflow

1. Extract text from excavation report PDFs
2. Preprocess and clean text
3. Generate embeddings using `all-MiniLM-L6-v2`
4. Perform similarity analysis and clustering
5. Visualize relationships between reports in the React dashboard

## 📊 Results

* Processed 31 excavation reports
* Applied K-Means clustering (`k=4`)
* Achieved silhouette score of ~0.344
* Generated semantic relationship visualizations

## ▶️ Installation

```bash
git clone https://github.com/yourusername/ArtifactAI.git
cd ArtifactAI
pip install -r requirements.txt
```

## ▶️ Run

Frontend:

```bash
npm install
npm start
```


