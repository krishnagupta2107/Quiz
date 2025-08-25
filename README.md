# C6 Quiz Question Creator for Educators

An app that uploads a **PDF chapter** (processed with an unstructured-data toolkit) and automatically generates **multiple-choice** and **true/false** questions with answer keys using an **LLM**.  
The generated questions are rendered in a simple web form for teachers to **review and export**.

---

## ✨ Features
- 📄 Upload PDF chapters
- 🤖 Process content using **Hugging Face Unstructured**
- 📝 Generate **MCQs** and **True/False** questions with **answer keys**
- 🎨 Simple web UI for teachers to review questions
- 📤 Export questions easily for classroom use
- 🌐 Deployed with **Netlify**

---

## 🛠️ Tech Stack
- **TypeScript**
- **JavaScript (ES6)**
- **HTML5**
- **Gemini API** (for question generation)
- **Netlify** (deployment)
- **Hugging Face Unstructured Toolkit** (PDF content processing)

---

## 📂 Project Structure
```
.
├── client/              # Frontend code
├── server/              # Backend logic
├── shared/              # Shared utilities
├── public/              # Static assets
├── .env                 # Environment variables (ignored in git)
├── netlify.toml         # Netlify configuration
├── package.json         # Dependencies
└── index.html           # Entry point
```

---**
To check live demo open this link:**https://cozy-pegasus-6f0cfc.netlify.app/

## ⚙️ Setup & Installation

### 1. Clone the repository
```bash
git clone https://github.com/<your-username>/<repo-name>.git
cd <repo-name>
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup environment variables
Create a `.env` file in the root directory:
```env
GEMINI_API_KEY=your_api_key_here
```

⚠️ Make sure `.env` is listed in `.gitignore` so secrets are not pushed to GitHub.

### 4. Run locally
```bash
npm run dev
```

### 5. Build for production
```bash
npm run build
```

---

## 🚀 Deployment (Netlify)
1. Push your code to GitHub.
2. Connect the repo to **Netlify**.
3. Add your `GEMINI_API_KEY` as an **Environment Variable** in Netlify settings.
4. Deploy 🎉

---

## 📌 Future Improvements
- Support for more question types (Fill in the blanks, Short answers)
- Rich text export (Word / PDF)
- User authentication for educators
- Question difficulty tagging

---

## 🧑‍💻 Contributors
- Krishna Gupta (Creator)

---

## 📜 License
This project is licensed under the **MIT License**.
