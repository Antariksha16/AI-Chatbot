# 🤖 AI Career Guidance Bot

A complete Dialogflow-powered career guidance chatbot with Node.js webhook and a beautiful dark-themed frontend — deployable to Vercel in minutes.

---

## 📁 Project Structure

```
career-bot/
├── dialogflow-agent/          ← Import this into Dialogflow
│   ├── agent.json             ← Agent configuration
│   └── intents/               ← 42 intent JSON files (84 files total)
│       ├── Default Welcome Intent.json
│       ├── career.select.ai_ml.json
│       ├── info.roadmap.json
│       └── ... (40+ more)
│
├── webhook/                   ← Node.js backend (Vercel serverless)
│   ├── index.js               ← Express server + /api/webhook endpoint
│   ├── package.json
│   └── src/
│       ├── handlers.js        ← Intent handler logic
│       └── careerData.js      ← Career knowledge base (10 domains)
│
├── frontend/                  ← Chat UI
│   ├── index.html             ← Full chat interface
│   ├── package.json
│   └── vite.config.js
│
├── vercel.json                ← Vercel deployment config
├── package.json               ← Root package
└── README.md                  ← This file
```

---

## 🚀 Deployment Guide

### Step 1 — Deploy Backend to Vercel

1. Push this folder to a **GitHub repository**
2. Go to [vercel.com](https://vercel.com) → **New Project**
3. Import your GitHub repository
4. Set **Root Directory** to `/` (default)
5. Vercel auto-detects `vercel.json` — click **Deploy**
6. Note your deployment URL: `https://your-app.vercel.app`

### Step 2 — Import Agent into Google Dialogflow

1. Go to [dialogflow.cloud.google.com](https://dialogflow.cloud.google.com)
2. Create a **new agent** (name it "CareerGuidanceBot")
3. Click ⚙️ **Settings** → **Export and Import** tab
4. Click **RESTORE FROM ZIP**
5. Zip the `dialogflow-agent/` folder:
   ```bash
   cd dialogflow-agent
   zip -r ../career-bot-agent.zip .
   ```
6. Upload `career-bot-agent.zip`

### Step 3 — Connect Webhook to Dialogflow

1. In Dialogflow → **Fulfillment** (left sidebar)
2. Enable **Webhook**
3. Set URL to: `https://your-app.vercel.app/api/webhook`
4. Click **Save**

### Step 4 — Update Frontend API URL

In `frontend/index.html`, the API URL is already auto-detected:
```javascript
const API_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3001/api/chat'
  : '/api/chat';
```
No changes needed after Vercel deployment!

---

## 💻 Local Development

```bash
# 1. Install dependencies
cd webhook && npm install
cd ../frontend && npm install

# 2. Start webhook server (Terminal 1)
cd webhook && node index.js
# Server runs at: http://localhost:3001

# 3. Start frontend (Terminal 2)
cd frontend && npx vite
# Frontend runs at: http://localhost:5173
```

---

## 🎯 Intent List (42 Intents)

### Core Flow
| Intent | Trigger |
|--------|---------|
| Default Welcome Intent | "hi", "hello", "start" |
| Default Fallback Intent | Off-topic queries |
| help | "help", "menu", "options" |
| about.bot | "who are you", "what is this" |
| session.restart | "restart", "reset", "new career" |

### Career Selection (10 Intents)
| Intent | Career |
|--------|--------|
| career.select.ai_ml | AI / Machine Learning |
| career.select.data_science | Data Science |
| career.select.web_development | Web Development |
| career.select.cybersecurity | Cybersecurity |
| career.select.cloud_computing | Cloud Computing |
| career.select.devops | DevOps / SRE |
| career.select.ui_ux | UI/UX Design |
| career.select.mobile_dev | Mobile Development |
| career.select.blockchain | Blockchain / Web3 |
| career.select.game_dev | Game Development |

### Skill Level (3 Intents)
| Intent | Level |
|--------|-------|
| skill.level.beginner | Beginner |
| skill.level.intermediate | Intermediate |
| skill.level.advanced | Advanced |

### Information Intents (20 Intents)
| Intent | Information |
|--------|-------------|
| info.overview | Career overview |
| info.roadmap | Learning roadmap |
| info.skills | Required skills |
| info.salary | Salary ranges |
| info.job_roles | Job titles |
| info.projects | Project suggestions |
| info.ai_impact | AI risk analysis |
| info.growth | Career growth path |
| info.work_pressure | Work-life balance |
| info.certifications | Best certifications |
| info.top_companies | Top hiring companies |
| info.interview_tips | Interview preparation |
| info.resume_tips | Resume & portfolio |
| info.free_resources | Free learning resources |
| info.paid_courses | Paid course recommendations |
| info.freelancing | Freelancing opportunities |
| info.abroad_scope | International scope |
| info.college_vs_selflearn | Degree vs self-taught |
| info.tools | Tools & technologies |
| info.daily_work | Day in the life |

### Special Intents
| Intent | Purpose |
|--------|---------|
| info.india.market | India-specific job market |
| compare.careers | Career comparison table |
| domain.suggestions | Personalized career suggestions |
| career.transition | Career switching guidance |

---

## 🌟 Features

- **42 Intents** — Comprehensive coverage of all career-related queries
- **10 Career Domains** — AI/ML, Data Science, Web Dev, Cybersecurity, Cloud, DevOps, UI/UX, Mobile, Blockchain, Game Dev
- **Personalized Responses** — Adapts based on selected career + skill level
- **Interactive UI** — Beautiful dark-themed chat interface with quick chips
- **Session Memory** — Remembers your career and skill level within a session
- **India + Global Salary Data** — Localized for Indian users
- **AI Risk Analysis** — Honest assessment of automation risk per career
- **Direct Chat API** — Works even without Dialogflow (built-in intent detection)
- **Vercel Ready** — One-click deployment

---

## 🔧 Customization

### Add a New Career Domain
1. Add career data in `webhook/src/careerData.js`
2. Create intent files in `dialogflow-agent/intents/`
3. Add sidebar button in `frontend/index.html`

### Change the Webhook URL
Update `dialogflow-agent/agent.json`:
```json
"webhook": {
  "url": "https://YOUR-APP.vercel.app/api/webhook"
}
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| POST | `/api/webhook` | Dialogflow webhook |
| POST | `/api/chat` | Direct chat API |

### Direct Chat API Example
```bash
curl -X POST https://your-app.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "AI career roadmap", "sessionId": "user123"}'
```

---

## 🤝 Tech Stack

- **Dialogflow ES** — NLU engine
- **Node.js + Express** — Webhook backend
- **Vercel** — Serverless deployment
- **Vanilla JS + CSS** — Frontend (no framework needed)

---

## 📝 License

MIT License — Free to use and modify.
