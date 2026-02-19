# 🧬 PharmaGuard

AI-Powered Pharmacogenomic Risk Analyzer that interprets VCF genomic files and predicts personalized drug response using CPIC-style rules.

---

## 🌍 Live Demo

🔗 https://vm-svitqrya94greo9kn36t8h.vusercontent.net/

🎥 LinkedIn Demo Video:  
(Add your LinkedIn video link here)

---

## 🧠 Project Overview

PharmaGuard is a full-stack pharmacogenomics web application that:

- Parses VCF v4.2 genomic files
- Extracts STAR alleles from INFO fields
- Maps genotypes to phenotypes
- Applies CPIC-based drug response rules
- Classifies risk into:
  - 🟢 Low
  - 🟡 Moderate
  - 🔴 High
- Displays clean color-coded UI results
- Returns structured JSON output

---

## 🧬 Supported Genes

- CYP2D6
- CYP2C19
- CYP2C9
- SLCO1B1
- TPMT
- DPYD

---

## 💊 Supported Drugs

- Codeine
- Warfarin
- Clopidogrel
- Simvastatin
- Azathioprine
- Fluorouracil

---

## 🎯 Risk Classification

| Phenotype | Risk |
|------------|--------|
| Normal | 🟢 Low |
| Intermediate | 🟡 Moderate |
| Poor | 🔴 High |
| Ultra-rapid | 🔴 High |
| Decreased Function | 🟡 Moderate |
| Low Function | 🔴 High |

---

## 🏗 Architecture Overview

```
User Uploads VCF
        ↓
VCF Parser
        ↓
STAR Extraction
        ↓
Phenotype Mapper
        ↓
PGx Rules Engine
        ↓
Risk Classification
        ↓
Frontend Dashboard
```

---

## 📂 Project Structure

```bash
app/
├── api/
│   ├── analyze/
│   └── health/
├── page.tsx
├── layout.tsx

components/
├── pharmaguard/
└── ui/

lib/
├── pgx/
│   ├── vcf-parser.ts
│   ├── phenotype-mapper.ts
│   ├── pgx-rules-engine.ts
│   ├── llm-explainer.ts
│   └── types.ts
```

---

## 🛠 Tech Stack

### Frontend
- Next.js
- React
- TypeScript
- Tailwind CSS

### Backend Logic
- TypeScript PGx Engine
- CPIC-aligned rules

### Deployment
- Vercel

---

## ⚙️ Installation (Run Locally)

### 1️⃣ Clone Repository

```bash
git clone https://github.com/your-username/pharmaguard.git
cd pharmaguard
```

### 2️⃣ Install Dependencies

```bash
npm install
```

or

```bash
pnpm install
```

### 3️⃣ Run Development Server

```bash
pnpm dev
```

### 4️⃣ Open in Browser

```
http://localhost:3000
```

---

## 📡 API Documentation

### POST `/api/analyze`

Analyze a VCF file and return drug risk prediction.

### Sample Response

```json
{
  "patient_id": "PGX-001",
  "timestamp": "2025-01-01T10:00:00Z",
  "risk_assessment": [
    {
      "drug": "Clopidogrel",
      "phenotype": "Intermediate",
      "risk": "Moderate",
      "recommendation": "Consider alternative therapy"
    }
  ]
}
```

---

## 🧪 Usage

1. Upload a valid VCF v4.2 file
2. Select drug(s)
3. Click Analyze
4. View:
   - Risk badge
   - Phenotype
   - Clinical recommendation
   - JSON export option

---

## 👥 Team Members

- Vaibhav – Full Stack Developer & PGx Logic(Complete Designer)
- Govind Sharma - Researcher of the project
- Sam Gandhi - Frontend Developer

---

## ⚠️ Disclaimer

This project is a hackathon prototype and not intended for clinical use.

---

## ⭐ Support

If you like this project, please star the repository.
