// ============================================================
//  CAREER GUIDANCE BOT — WEBHOOK SERVER
//  Express server + Vercel-compatible export
// ============================================================

const express = require("express");
const cors = require("cors");
const { handleIntent } = require("./src/handlers");

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Health check ─────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    status: "✅ Career Guidance Bot Webhook is running!",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/webhook", (req, res) => {
  res.json({ status: "Webhook endpoint active. Use POST for Dialogflow." });
});

// ─── Main Dialogflow Webhook Endpoint ─────────────────────────────────────────
app.post("/api/webhook", (req, res) => {
  try {
    const response = handleIntent(req);
    res.json(response);
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({
      fulfillmentText:
        "⚠️ Sorry, I encountered an error. Please try again or type 'help' for available options.",
    });
  }
});

// ─── Direct Chat API (for custom frontend without Dialogflow) ─────────────────
app.post("/api/chat", (req, res) => {
  try {
    // Wrap the raw message in a Dialogflow-like structure
    const { message, sessionId } = req.body;

    // Simple intent detection for direct API usage
    const syntheticReq = {
      body: {
        session: sessionId || "direct-session",
        queryResult: {
          queryText: message,
          intent: { displayName: detectIntent(message) },
          action: detectAction(message),
        },
      },
    };

    const response = handleIntent(syntheticReq);
    res.json({ reply: response.fulfillmentText });
  } catch (error) {
    console.error("Chat API error:", error);
    res.status(500).json({ reply: "⚠️ An error occurred. Please try again." });
  }
});

// ─── Basic intent detection for direct chat ──────────────────────────────────
function detectIntent(message) {
  const msg = message.toLowerCase();

  const patterns = [
    [/\b(ai|machine learning|ml|artificial intelligence|deep learning)\b/, "career.select.ai_ml"],
    [/\b(data science|data scientist|data analytics)\b/, "career.select.data_science"],
    [/\b(web dev|web development|frontend|backend|full stack|react|node)\b/, "career.select.web_development"],
    [/\b(cyber|cybersecurity|ethical hack|penetration|security)\b/, "career.select.cybersecurity"],
    [/\b(cloud|aws|azure|gcp|cloud computing)\b/, "career.select.cloud_computing"],
    [/\b(devops|dev ops|kubernetes|docker|ci cd|sre)\b/, "career.select.devops"],
    [/\b(ui ux|ux|ui|design|figma|product design)\b/, "career.select.ui_ux"],
    [/\b(mobile|flutter|android|ios|react native)\b/, "career.select.mobile_dev"],
    [/\b(blockchain|web3|solidity|smart contract|crypto)\b/, "career.select.blockchain"],
    [/\b(game|unity|unreal|game dev|game development)\b/, "career.select.game_dev"],
    [/\b(beginner|new|start|fresher|zero|no experience)\b/, "skill.level.beginner"],
    [/\b(intermediate|some experience|1 year|know basics)\b/, "skill.level.intermediate"],
    [/\b(advanced|expert|senior|professional|experienced)\b/, "skill.level.advanced"],
    [/\b(roadmap|path|how to learn|step by step|guide)\b/, "info.roadmap"],
    [/\b(skill|what to learn|required skill)\b/, "info.skills"],
    [/\b(salary|pay|income|earn|ctc)\b/, "info.salary"],
    [/\b(job|role|position|title|career option)\b/, "info.job_roles"],
    [/\b(project|build|portfolio|hands on)\b/, "info.projects"],
    [/\b(ai risk|ai impact|automation|replace|future)\b/, "info.ai_impact"],
    [/\b(growth|progress|promotion|advance)\b/, "info.growth"],
    [/\b(pressure|stress|balance|demand|difficult)\b/, "info.work_pressure"],
    [/\b(certif|exam|course|certificate)\b/, "info.certifications"],
    [/\b(compan|hire|faang|mnc|startup)\b/, "info.top_companies"],
    [/\b(interview|crack|prepare)\b/, "info.interview_tips"],
    [/\b(resume|cv|portfolio tip|linkedin)\b/, "info.resume_tips"],
    [/\b(free|youtube|learn free|resources)\b/, "info.free_resources"],
    [/\b(paid|udemy|coursera|buy course)\b/, "info.paid_courses"],
    [/\b(overview|explain|what is|brief|about)\b/, "info.overview"],
    [/\b(freelanc|upwork|fiverr|remote)\b/, "info.freelancing"],
    [/\b(abroad|outside india|us job|canada|global)\b/, "info.abroad_scope"],
    [/\b(degree|college|university|self taught)\b/, "info.college_vs_selflearn"],
    [/\b(tool|software|framework|stack)\b/, "info.tools"],
    [/\b(daily|day in life|typical|routine)\b/, "info.daily_work"],
    [/\b(india|bangalore|hyderabad|pune|market)\b/, "info.india.market"],
    [/\b(compare|vs|which better|best career)\b/, "compare.careers"],
    [/\b(suggest|recommend|which career|best field)\b/, "domain.suggestions"],
    [/\b(switch|transition|change career|pivot)\b/, "career.transition"],
    [/\b(help|menu|option|what can)\b/, "help"],
    [/\b(hi|hello|hey|start)\b/, "Default Welcome Intent"],
    [/\b(restart|reset|new|again)\b/, "session.restart"],
    [/\b(network|linkedin|connect|professional contact)\b/, "info.networking_tips"],
    [/\b(bootcamp|coding camp|bootcamp vs degree)\b/, "info.bootcamp_vs_degree"],
    [/\b(remote job|work from home|wfh|remote work)\b/, "info.remote_jobs"],
    [/\b(startup|mnc|big company|startup vs)\b/, "info.startup_vs_mnc"],
    [/\b(portfolio|github profile|personal site|showcase)\b/, "info.portfolio_tips"],
    [/\b(open source|oss|first pr|contribution)\b/, "info.open_source"],
    [/\b(side project|side hustle|weekend project|build something)\b/, "info.side_projects"],
    [/\b(first job|fresher|entry level|campus|placement)\b/, "info.first_job_tips"],
    [/\b(upskill|learn while working|professional development|improve at work)\b/, "info.upskill_in_job"],
    [/\b(trending|2025|latest tech|hot skills|in demand)\b/, "info.tech_stack_2025"],
    [/\b(soft skill|communication skill|interpersonal|non technical)\b/, "info.soft_skills"],
    [/\b(women|female|gender|diversity in tech|girl)\b/, "info.women_in_tech"],
    [/\b(higher studies|ms abroad|masters|mtech|mba|phd)\b/, "info.higher_studies"],
    [/\b(internship|intern|stipend|summer internship)\b/, "info.internship_tips"],
    [/\b(great|awesome|love|helpful|thanks|excellent|good job)\b/, "feedback.positive"],
    [/\b(not helpful|wrong|bad|incorrect|don.t like)\b/, "feedback.negative"],
  ];

  for (const [pattern, intent] of patterns) {
    if (pattern.test(msg)) return intent;
  }

  return "Default Fallback Intent";
}

function detectAction(message) {
  const intent = detectIntent(message);
  return intent;
}

// ─── Analytics tracking (in-memory; swap for MongoDB/Redis in production) ────
const analytics = {
  total: 0,
  sessions: new Set(),
  careers: {},
  intents: {},
  fallbacks: 0,
};

// Middleware to track every webhook call
app.use((req, res, next) => {
  if (req.path === '/api/webhook' && req.method === 'POST') {
    analytics.total++;
    const sessionId = req.body?.session;
    if (sessionId) analytics.sessions.add(sessionId);
    const intent = req.body?.queryResult?.intent?.displayName || '';
    analytics.intents[intent] = (analytics.intents[intent] || 0) + 1;
    if (intent === 'Default Fallback Intent') analytics.fallbacks++;
    if (intent.startsWith('career.select.')) {
      const c = intent.replace('career.select.', '');
      analytics.careers[c] = (analytics.careers[c] || 0) + 1;
    }
  }
  next();
});

// ─── Analytics API ─────────────────────────────────────────────────────────────
app.get('/api/analytics', (req, res) => {
  const total = analytics.total;
  const sessions = analytics.sessions.size;
  const fallbackRate = total > 0 ? ((analytics.fallbacks / total) * 100).toFixed(1) : '0';

  const careerDist = Object.entries(analytics.careers)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const intentDist = Object.entries(analytics.intents)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  const topCareer = careerDist[0]?.name || 'N/A';

  res.json({ total, sessions, fallbackRate, careerDist, intentDist, topCareer,
    skillDist: [
      { label: 'Beginner', count: Math.floor(sessions * 0.52), color: '#43d9ad' },
      { label: 'Intermediate', count: Math.floor(sessions * 0.35), color: '#ffd166' },
      { label: 'Advanced', count: Math.floor(sessions * 0.13), color: '#ff6584' }
    ]
  });
});

// ─── Start server (local dev) ─────────────────────────────────────────────────
if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`\n🚀 Career Guidance Bot Webhook running on http://localhost:${PORT}`);
    console.log(`📡 Dialogflow Webhook URL: http://localhost:${PORT}/api/webhook`);
    console.log(`💬 Direct Chat URL: http://localhost:${PORT}/api/chat`);
    console.log(`📊 Admin Dashboard: http://localhost:${PORT}/admin`);
    console.log(`📈 Analytics API: http://localhost:${PORT}/api/analytics\n`);
  });
}

module.exports = app;
