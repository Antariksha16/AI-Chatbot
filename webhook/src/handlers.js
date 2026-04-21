// ============================================================
//  DIALOGFLOW WEBHOOK HANDLER
//  Handles all intents and returns personalized responses
// ============================================================

const careerData = require("./careerData");

// ─── Session state store (in-memory; use Redis in production) ───────────────
const sessions = {};

function getSession(sessionId) {
  if (!sessions[sessionId]) {
    sessions[sessionId] = { career: null, level: null, skills: [] };
  }
  return sessions[sessionId];
}

// ─── Main dispatcher ─────────────────────────────────────────────────────────
function handleIntent(req) {
  const body = req.body;
  const intentName = body.queryResult?.intent?.displayName || "";
  const action = body.queryResult?.action || "";
  const queryText = body.queryResult?.queryText || "";
  const sessionId = body.session || "default";
  const session = getSession(sessionId);

  // Career selection intents
  if (intentName.startsWith("career.select.")) {
    const careerKey = intentName.replace("career.select.", "");
    session.career = careerKey;
    const data = careerData[careerKey];
    return {
      fulfillmentText: `Great choice! 🎯 You're interested in **${data.name}**.\n\nTo give you a personalized roadmap, what is your current skill level?\n\n• 🟢 **Beginner** – Little to no experience\n• 🟡 **Intermediate** – Some experience, know basics\n• 🔴 **Advanced** – Working professional looking to upskill`,
    };
  }

  // Skill level intents
  if (intentName.startsWith("skill.level.")) {
    const levelMap = {
      "skill.level.beginner": "beginner",
      "skill.level.intermediate": "intermediate",
      "skill.level.advanced": "advanced",
    };
    session.level = levelMap[intentName];

    const emoji = { beginner: "🟢", intermediate: "🟡", advanced: "🔴" };
    const careerName = session.career ? careerData[session.career]?.name : "your chosen career";

    return {
      fulfillmentText: `${emoji[session.level]} **${capitalize(session.level)} level** noted!\n\nNow tell me — what skills do you already know?\n(e.g., Python, JavaScript, SQL — or type **'none'** if starting fresh)\n\n_Once I know your skills, I can give you a fully personalized roadmap for **${careerName}**!_`,
    };
  }

  // Known skills input
  if (action === "skill.level" && session.level && !intentName.startsWith("skill.level.")) {
    session.skills = queryText.split(/[,\s]+/).filter(Boolean);
    const data = session.career ? careerData[session.career] : null;

    if (!data) {
      return {
        fulfillmentText:
          "Thanks! What career are you interested in? (e.g., AI/ML, Web Dev, Data Science, Cybersecurity, Cloud, DevOps, UI/UX, Mobile Dev, Blockchain, Game Dev)",
      };
    }

    return {
      fulfillmentText: `✅ Got it! Here's what I can help you with for **${data.name}** (${capitalize(session.level)} level):\n\nJust ask me about any of these:\n\n📍 **Roadmap** — Your step-by-step learning path\n🛠️ **Skills** — Required technical & soft skills\n💰 **Salary** — India + global ranges\n💼 **Job Roles** — What you can become\n🚀 **Projects** — Practical builds for your portfolio\n⚠️ **AI Risk** — Future-proofing analysis\n📈 **Growth** — Long-term career path\n😓 **Work Pressure** — Stress & work-life balance\n🎓 **Certifications** — Best certs to pursue\n🏢 **Top Companies** — Who's hiring\n🎤 **Interview Tips** — How to crack the job\n\n_Type any topic above to dive in!_`,
    };
  }

  // ── Specific info intents ──────────────────────────────────────────────────

  const data = session.career ? careerData[session.career] : null;

  if (!data && isInfoIntent(intentName)) {
    return {
      fulfillmentText:
        "Please tell me which career you're interested in first! (e.g., AI/ML, Web Dev, Data Science, Cybersecurity, Cloud, DevOps, UI/UX, Mobile Dev, Blockchain, Game Dev)",
    };
  }

  switch (intentName) {
    case "info.overview":
      return reply(`📌 **${data.name} — Career Overview**\n\n${data.overview}`);

    case "info.roadmap": {
      const lvl = session.level || "beginner";
      const steps = data.roadmap[lvl] || data.roadmap.beginner;
      return reply(
        `🗺️ **${data.name} Roadmap (${capitalize(lvl)} Level)**\n\n${steps.join("\n")}\n\n💡 _Ask about **projects**, **certifications**, or **job roles** next!_`
      );
    }

    case "info.skills":
      return reply(
        `🛠️ **Skills Required — ${data.name}**\n\n**Technical Skills:**\n${bulletList(data.skills.technical)}\n\n**Soft Skills:**\n${bulletList(data.skills.soft)}`
      );

    case "info.salary":
      return reply(
        `💰 **Salary Range — ${data.name}**\n\n🇮🇳 **India:**\n${data.salary.india}\n\n🌍 **Global:**\n${data.salary.global}\n\n_Salaries vary by company, city, and specialization._`
      );

    case "info.job_roles":
      return reply(
        `💼 **Job Roles — ${data.name}**\n\n${bulletList(data.jobRoles)}\n\n_Ask about **salary** or **top companies** to learn more!_`
      );

    case "info.projects":
      return reply(
        `🔨 **Project Suggestions — ${data.name}**\n\n${data.projects.join("\n")}\n\n💡 Build these and put them on GitHub for a strong portfolio!`
      );

    case "info.ai_impact":
      return reply(
        `🤖 **AI Impact Risk — ${data.name}**\n\nRisk Level: **${data.aiRisk.level}**\n\n${data.aiRisk.reason}\n\n_Stay updated on AI trends and continuously upskill to future-proof your career._`
      );

    case "info.growth":
      return reply(
        `📈 **Career Growth — ${data.name}**\n\n**Typical Progression:**\n${data.growth}\n\n_Long-term, you can transition into management, consulting, or entrepreneurship._`
      );

    case "info.work_pressure":
      return reply(
        `😓 **Work Pressure — ${data.name}**\n\n${data.workPressure}\n\n_Work-life balance varies significantly by company culture. Startups tend to be more demanding than large corporations._`
      );

    case "info.certifications":
      return reply(
        `🎓 **Top Certifications — ${data.name}**\n\n${bulletList(data.certifications)}\n\n💡 Start with the first one listed as the most accessible entry point.`
      );

    case "info.top_companies":
      return reply(
        `🏢 **Top Companies Hiring — ${data.name}**\n\n${bulletList(data.topCompanies)}`
      );

    case "info.interview_tips":
      return reply(
        `🎤 **Interview Tips — ${data.name}**\n\n${bulletList(data.interviewTips)}\n\n_Consistency is key — practice daily!_`
      );

    case "info.resume_tips":
      return reply(
        `📄 **Resume Tips — ${data.name}**\n\n${bulletList(data.resumeTips)}\n\n_Tailor your resume for each job application!_`
      );

    case "info.free_resources":
      return reply(
        `📚 **Free Learning Resources — ${data.name}**\n\n${bulletList(data.freeResources)}\n\n_Consistency beats intensity. Study 1–2 hours daily._`
      );

    case "info.paid_courses":
      return reply(
        `💳 **Best Paid Courses — ${data.name}**\n\n${bulletList(data.paidCourses)}\n\n_Wait for Udemy sales (₹499) — they happen every few weeks!_`
      );

    case "info.freelancing":
      return reply(
        `💻 **Freelancing Opportunities — ${data.name}**\n\n${data.freelancing}\n\n_Build a portfolio first, then start applying on Upwork/Fiverr._`
      );

    case "info.abroad_scope":
      return reply(
        `✈️ **International Career Scope — ${data.name}**\n\n${data.abroad}`
      );

    case "info.college_vs_selflearn":
      return reply(
        `🎓 **Degree vs Self-Learning — ${data.name}**\n\n${data.collegeDegree}`
      );

    case "info.tools":
      return reply(
        `🔧 **Tools & Technologies — ${data.name}**\n\n${bulletList(data.tools)}`
      );

    case "info.daily_work":
      return reply(
        `📅 **Daily Work Life — ${data.name}**\n\n${data.dailyWork}`
      );

    case "info.india.market":
      return reply(
        `🇮🇳 **India Job Market — ${data.name}**\n\n${data.indiaMarket}`
      );

    case "domain.suggestions":
      return reply(buildDomainSuggestions());

    case "compare.careers":
      return reply(buildCareerComparison());

    case "career.transition":
      return reply(
        `🔄 **Career Transition Guide**\n\nTo give you personalized transition advice, tell me:\n1. Your **current field** (e.g., Web Dev, IT Support)\n2. Your **target career** (e.g., Data Science, Cloud)\n\nOr explore any career from scratch — just type the name!`
      );

    // ── Extra intents ────────────────────────────────────────────────────────

    case "info.networking_tips":
      return reply(
        `🤝 **Professional Networking Tips**\n\n**LinkedIn (Most Important):**\n• Optimize your headline: "Aspiring ML Engineer | Python | TensorFlow"\n• Connect with 5 professionals in your target field weekly\n• Comment thoughtfully on posts — don't just like\n• Post your learning journey (even as a beginner!)\n• Send personalized connection requests\n\n**Other Ways:**\n• Attend local tech meetups (Meetup.com)\n• Join Discord communities (100devs, DevCord, etc.)\n• Participate in Hackathons — great for networking\n• Contribute to open source — maintainers notice you\n• Alumni networks (LinkedIn, college groups)\n\n💡 **Rule of thumb:** Give value first. Share articles, answer questions, help others — then ask for referrals.`
      );

    case "info.bootcamp_vs_degree": {
      const d = data;
      return reply(
        `🎓 **Bootcamp vs Degree — ${d ? d.name : "Tech Careers"}**\n\n**Coding Bootcamp ✅**\n• Duration: 3–6 months\n• Cost: ₹50K–₹3L (India) / $10K–$20K (US)\n• Fast entry into job market\n• Practical, hands-on projects\n• Best for: Web Dev, UI/UX, Frontend\n• Risk: Less valued by top MNCs (Google, Microsoft)\n\n**4-Year CS Degree ✅**\n• Duration: 4 years\n• Stronger fundamentals (algorithms, OS, networking)\n• Valued by FAANG and research-oriented roles\n• Better for: AI/ML, Systems, Cybersecurity\n• Opens door to MS/PhD paths\n\n**Verdict:** For most tech roles, a strong **portfolio + certifications** beats both. Degree matters more for AI/ML and top-tier companies. Bootcamp is great if you need to switch careers fast.\n\n_Your selected field (${d ? d.name : "tech"}) lean: ${d ? (["ai_ml","cybersecurity"].includes(session.career) ? "Degree preferred" : "Portfolio + certs often enough") : "portfolio-first"}_`
      );
    }

    case "info.remote_jobs":
      return reply(
        `🌍 **Remote Job Opportunities in Tech**\n\n**Best Remote-Friendly Careers:**\n• 🌐 Web/Frontend Dev — Highest remote availability\n• ☁️ Cloud/DevOps — Almost all roles can be remote\n• 🔐 Cybersecurity — Many remote consulting roles\n• 🎨 UI/UX Design — Fully remote-friendly\n• 📱 Mobile Dev — High remote demand\n\n**Top Platforms to Find Remote Jobs:**\n• LinkedIn (filter: Remote)\n• Remote.co / We Work Remotely\n• AngelList / Wellfound (startup remote)\n• Toptal (vetted, high-paying)\n• Turing.com (US salary from India)\n• Upwork / Fiverr (freelance remote)\n\n**Tips to Get Remote Jobs:**\n• Get certifications (AWS, Google, etc.)\n• Build a portfolio with live deployed projects\n• Learn async communication (writing clearly matters!)\n• Show timezone flexibility in your profile\n\n🇮🇳 **India Advantage:** Earn US/EU salaries while living in India via Turing, Toptal, or direct remote hiring.`
      );

    case "info.startup_vs_mnc":
      return reply(
        `🏢 **Startup vs MNC — What's Right for You?**\n\n**MNC (TCS, Infosys, Wipro, Accenture, Google, Microsoft)**\n• ✅ Job security & stable salary\n• ✅ Structured learning & L&D programs\n• ✅ Brand name on resume (globally recognized)\n• ✅ Work-life balance (usually 9–6)\n• ❌ Slower growth & promotions\n• ❌ May work on legacy tech\n• ❌ Large team = less individual impact\n\n**Startup (Razorpay, Zepto, CRED, Early-stage)**\n• ✅ Fast career growth (2–3x faster)\n• ✅ Work on cutting-edge tech\n• ✅ High ownership & responsibility\n• ✅ ESOPs can be life-changing (if company IPOs)\n• ❌ Higher risk, unstable (especially early-stage)\n• ❌ Less structured mentorship\n• ❌ Can be high pressure / long hours\n\n**Recommendation by stage:**\n• Fresh graduate → MNC for foundation, switch in 1–2 years\n• 2–3 years experience → Funded startup for growth\n• Senior → Your choice based on risk appetite\n\n💡 _Best path: MNC for 1–2 years → Series B+ startup for growth_`
      );

    case "info.portfolio_tips": {
      const name = data ? data.name : "Tech";
      return reply(
        `💼 **Portfolio Building Guide — ${name}**\n\n**GitHub Portfolio:**\n• Pin 4–6 best projects\n• Write detailed READMEs with screenshots\n• Include live demo links\n• Show consistent commit history\n• Contribute to open source\n\n**Personal Website (Recommended):**\n• Use: Vercel + Next.js or Webflow (no-code)\n• Sections: About, Skills, Projects, Blog, Contact\n• Keep it clean and fast-loading\n• Domain: yourname.dev (~₹800/year)\n\n**Project Quality Checklist:**\n• ✅ Solves a real problem\n• ✅ Live deployed URL\n• ✅ Clean code on GitHub\n• ✅ README with setup instructions\n• ✅ Screenshots/demo video\n\n**Platform-specific:**\n• Designers → Behance / Dribbble\n• Data Scientists → Kaggle profile + notebooks\n• Security → CTF writeups + TryHackMe profile\n\n💡 _3 great projects > 10 mediocre ones._`
      );
    }

    case "info.open_source":
      return reply(
        `🌐 **Contributing to Open Source**\n\n**Why it matters:**\n• Real-world codebase experience\n• Builds your GitHub profile\n• Networking with global developers\n• Some companies hire directly from OSS contributions\n\n**How to Start (Beginner-friendly):**\n1. Look for issues labeled **'good first issue'** or **'help wanted'**\n2. Start with documentation fixes — underrated and welcomed\n3. Use: github.com/explore → filter by language\n4. First PR doesn't have to be code — fix a typo, update docs\n\n**Great Starter Repos:**\n• freeCodeCamp (JavaScript)\n• first-contributions (practice repo)\n• HuggingFace Transformers (Python/ML)\n• OWASP projects (security)\n\n**Programs with Stipends:**\n• 🎯 **Google Summer of Code (GSoC)** — ₹1–3L stipend\n• 🎯 **MLH Fellowship** — paid open source contribution\n• 🎯 **Outreachy** — paid internship for underrepresented groups\n\n💡 _Make your first contribution this week — it takes < 30 minutes!_`
      );

    case "info.side_projects": {
      const careerName = data ? data.name : "Tech";
      return reply(
        `🚀 **Side Project Ideas — ${careerName}**\n\n**Profitable Side Projects:**\n• SaaS tools (tiny niche problems pay well)\n• Chrome extensions (monetize with one-time purchase)\n• Notion templates / Figma UI kits (Gumroad)\n• Technical blog / YouTube channel (ad revenue + sponsorships)\n• Freelance on weekends (Upwork / Fiverr)\n\n**Projects That Impress Recruiters:**\n• An app used by real users (even 100 users)\n• Open source tool with GitHub stars\n• Developer tool that solves your own pain point\n• A "build in public" project documented on Twitter/LinkedIn\n\n**Time-boxing Strategy:**\n• Weekend project: 8–10 hours total\n• Set a ship deadline: 2 weeks max for MVP\n• Focus on one core feature, launch fast, iterate\n\n**Platforms to Ship & Monetize:**\n• Product Hunt (launch day traffic)\n• Indie Hackers (community + feedback)\n• Gumroad (sell digital products)\n• GitHub Sponsors (for open source)\n\n💡 _The best side project is one you finish and ship — not one you plan forever._`
      );
    }

    case "info.first_job_tips":
      return reply(
        `🎯 **How to Land Your First Tech Job**\n\n**The Honest Truth:**\nMost freshers fail because they apply with empty GitHub profiles and generic resumes. Fix that first.\n\n**Step-by-Step Plan:**\n1. **Build 3 strong projects** → Push to GitHub with live demos\n2. **Optimize LinkedIn** → Professional photo, strong headline, 500+ connections\n3. **Tailor each resume** → Match keywords from job description\n4. **Apply strategically** → 10 quality applications > 100 mass applications\n5. **Referrals** → 60% of jobs are filled via referrals — reach out!\n\n**Platforms to Apply (India):**\n• LinkedIn (most important)\n• Naukri.com (traditional companies)\n• AngelList / Wellfound (startups)\n• Internshala (fresher friendly)\n• Company career pages directly\n\n**Interview Prep:**\n• DSA: Solve 50 LeetCode problems (Easy + Medium)\n• Projects: Be ready to explain every line of code\n• Behavioral: STAR method for HR rounds\n\n**Timeline Expectation:**\n• With strong portfolio: 1–3 months\n• Without portfolio: 6–12 months\n\n💡 _The fastest path to a job is a referral from someone who already works there._`
      );

    case "info.upskill_in_job":
      return reply(
        `📈 **How to Upskill While Working Full-Time**\n\n**Time Management Strategy:**\n• Dedicate 45–60 min/day before or after work\n• Use commute time for podcasts/audiobooks\n• Block "learning time" on your calendar — treat it like a meeting\n• Weekends: 2–3 hours deep work sessions\n\n**Best Learning Formats for Busy Professionals:**\n• Udemy courses (self-paced, lifetime access)\n• YouTube (free, watch at 1.5x)\n• Pluralsight / LinkedIn Learning (company often pays!)\n• Technical books (O'Reilly, Pragmatic Programmer)\n\n**Ask Your Employer:**\n• Many companies have ₹20K–₹50K annual L&D budget\n• Ask your manager to fund Coursera/Udemy/AWS certs\n• Some companies allow 20% time for learning projects\n\n**Track Progress:**\n• Keep a learning log (Notion or plain text)\n• Set quarterly goals: "Earn AWS SAA cert by Q3"\n• Share learnings on LinkedIn — builds reputation\n\n**Avoid Burnout:**\n• Learn in focused sprints, not marathons\n• Take breaks — rest is part of learning\n• Switch between topics to stay fresh\n\n💡 _1 hour/day = 365 hours/year = more than a full college semester_`
      );

    case "info.tech_stack_2025":
      return reply(
        `🔥 **Trending Tech Stack & Skills in 2025**\n\n**Most In-Demand Languages:**\n1. Python — AI, Data, Backend\n2. JavaScript/TypeScript — Web, Full Stack\n3. Rust — Systems, WebAssembly\n4. Go (Golang) — Cloud, Microservices\n5. Solidity — Blockchain\n\n**Hottest Frameworks/Tools:**\n• 🤖 AI/LLM: LangChain, HuggingFace, RAG pipelines\n• 🌐 Web: Next.js 14+, Astro, SvelteKit\n• ☁️ Cloud: Kubernetes, Terraform, Pulumi\n• 📊 Data: Polars (replacing Pandas), DuckDB\n• 🔐 Security: Zero-Trust Architecture, SAST tools\n\n**Emerging Fields with High Demand:**\n• AI Engineering (prompt engineering + LLM ops)\n• Platform Engineering (DevOps evolved)\n• FinTech / RegTech development\n• Quantum Computing (early but growing)\n• Edge Computing & IoT\n\n**Skills That Will ALWAYS Matter:**\n• System Design\n• Communication & documentation\n• Problem-solving & debugging\n• Version control (Git)\n• Cloud fundamentals\n\n💡 _Don't chase every trend. Master fundamentals + 1–2 trending specializations._`
      );

    case "info.soft_skills":
      return reply(
        `🧠 **Soft Skills That Make or Break Tech Careers**\n\n**Top 7 Soft Skills for Tech Professionals:**\n\n1. **Communication** — Can you explain a complex system to a non-technical stakeholder? This separates seniors from juniors.\n\n2. **Problem-Solving Mindset** — Break problems into small pieces. Don't panic when stuck. Google well.\n\n3. **Time Management** — Estimate tasks accurately. Hit deadlines. Under-promise, over-deliver.\n\n4. **Adaptability** — Tech changes fast. Those who learn quickly thrive.\n\n5. **Collaboration** — Code is a team sport. Ego kills great teams.\n\n6. **Writing Skills** — Clear PR descriptions, documentation, Slack messages — writing is coding adjacent.\n\n7. **Feedback Reception** — Take code review feedback professionally. It's about the code, not you.\n\n**How to Develop Them:**\n• Communication: Teach what you learn (blog/YouTube)\n• Problem-solving: LeetCode + system design\n• Writing: Keep a technical journal\n• Collaboration: Pair programming, open source\n\n💡 _Technical skills get you an interview. Soft skills get you promoted._`
      );

    case "info.women_in_tech":
      return reply(
        `👩‍💻 **Women in Tech — Resources & Guidance**\n\n**Scholarships & Programs:**\n• Google Women Techmakers Scholars\n• Microsoft LEAP (returnship program)\n• Outreachy (paid OSS internships)\n• Adobe India Women-in-Technology scholarship\n• Nasscom Foundation initiatives\n\n**Communities to Join:**\n• Women Who Code (global)\n• GirlScript Foundation (India)\n• AnitaB.org / Grace Hopper Community\n• WiMLDS (Women in Machine Learning & Data Science)\n• LinkedIn "Women in Tech India" groups\n\n**Mentorship Platforms:**\n• ADPList.org — Free 1:1 mentorship\n• Lean In Circles\n• Sheryl Sandberg's LeanIn.org\n\n**Stats to Inspire:**\n• Women in tech earn 15–20% more than average women's salaries in India\n• Companies with gender-diverse teams outperform by 21% (McKinsey)\n\n**Advice:**\n• Don't let imposter syndrome hold you back\n• Your perspective as a diverse professional is valuable\n• Apply even if you meet only 60% of requirements\n\n💡 _The best time to join tech was 10 years ago. The second-best time is today._`
      );

    case "info.higher_studies":
      return reply(
        `🎓 **Higher Studies: MS Abroad vs Job in India**\n\n**MS Abroad (USA/Canada/Germany):**\n• ✅ Top-tier research & professors\n• ✅ Strong alumni network\n• ✅ OPT/work visa opportunities\n• ✅ Avg salary post-MS (US): $100K–$140K\n• ❌ Cost: ₹40L–₹80L total (loans + living)\n• ❌ 2 years of delayed income\n• Best for: AI/ML research, academia, FAANG targeting\n\n**MTech in India (IITs/NITs):**\n• ✅ Low cost (₹50K–₹2L/year)\n• ✅ Gate to research & PSU jobs\n• ✅ IIT brand value\n• ❌ Smaller global network\n• Best for: Core engineering, academia, PSUs\n\n**MBA (IIM/ISB):**\n• Best for: Product Management, Consulting, Entrepreneurship\n• Not needed for purely technical roles\n\n**Job First (Recommended for most):**\n• Earn, build experience, then decide on MS\n• Many companies sponsor MS (Infosys, Wipro, TCS, Accenture)\n• MS after 2–3 years of work → stronger profile → better admits + scholarships\n\n**Our Recommendation:**\n• AI/ML → MS strongly recommended\n• Web/Mobile/DevOps → Job > MS\n• Data Science → Job first, MS if needed for senior roles\n\n💡 _Work 2 years, save money, apply with strong SOP + work experience = better scholarship chances_`
      );

    case "info.internship_tips":
      return reply(
        `🧑‍💼 **How to Get a Tech Internship in India**\n\n**When to Start:**\n• Pre-final year (3rd year BTech) → Summer internships\n• Apply from: October onwards for May/June internships\n• Off-campus internships: Apply year-round\n\n**Best Platforms:**\n• Internshala ⭐ (India's #1 for internships)\n• LinkedIn (filter: Internship)\n• LetsIntern / Twenty19\n• AngelList (startup internships)\n• Company websites directly (TCS iON, Infosys InStep, etc.)\n\n**Top-Paying Internships in India:**\n• Google STEP / SWE internship: ₹1.5–2L/month\n• Microsoft Explore: ₹1.2L/month\n• Amazon SDE Intern: ₹80K–₹1.5L/month\n• Flipkart/Razorpay/CRED: ₹40K–₹80K/month\n• Most startups: ₹10K–₹30K/month\n\n**How to Stand Out:**\n• Strong GitHub profile with 2–3 projects\n• Competitive programming (LeetCode 50+ problems)\n• Apply early — positions fill up fast\n• Target referrals through LinkedIn\n• Off-campus hustle beats waiting for campus drive\n\n**What to Do During Internship:**\n• Ask questions, take initiative, document your work\n• Aim for a Pre-Placement Offer (PPO) — 70% convert\n\n💡 _One good internship is worth more than 10 certifications on your resume._`
      );

    case "feedback.positive":
      return reply(`Thank you so much! 😊 Really glad I could help with your career journey!\n\nFeel free to ask me anything else — roadmaps, salaries, interview tips, or explore a new career domain anytime. 🚀`);

    case "feedback.negative":
      return reply(`I'm sorry to hear that! 😔 I'm continuously improving.\n\nCould you tell me what you were looking for? Type your question again and I'll try to give you a better, more specific answer!\n\nYou can also type **help** to see all the topics I can assist with.`);

    default:
      return {
        fulfillmentText:
          "⚠️ This assistant is restricted to career-related guidance only. Please ask about careers, skills, jobs, or learning paths!",
      };
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isInfoIntent(name) {
  return name.startsWith("info.") || name.startsWith("career.");
}

function reply(text) {
  return { fulfillmentText: text };
}

function bulletList(arr) {
  return arr.map((item) => `• ${item}`).join("\n");
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function buildDomainSuggestions() {
  return `🌟 **Top Career Suggestions Based on Demand & Growth (2025)**\n
🥇 **AI/ML Engineer** — Highest demand, top salaries, future-proof
🥈 **Cloud Architect** — Every company moving to cloud
🥉 **Cybersecurity Analyst** — Critical skills shortage globally
4️⃣ **Data Scientist** — Data-driven decisions in every industry
5️⃣ **Full Stack Developer** — Most versatile, huge freelancing market
6️⃣ **DevOps / SRE** — Bridge between dev and ops, excellent pay
7️⃣ **Mobile Developer (Flutter)** — India's mobile-first economy
8️⃣ **Blockchain Developer** — Niche but highest per-project pay

💡 _Tell me any career name to get a full personalized analysis!_`;
}

function buildCareerComparison() {
  const table = [
    ["Career", "India Salary (Senior)", "AI Risk", "Demand", "Difficulty"],
    ["AI/ML", "₹50+ LPA", "🟢 Low", "🔥🔥🔥", "High"],
    ["Data Science", "₹40+ LPA", "🟡 Medium", "🔥🔥🔥", "Medium"],
    ["Web Dev", "₹35+ LPA", "🟡 Medium", "🔥🔥🔥", "Low-Med"],
    ["Cybersecurity", "₹50+ LPA", "🟢 Low", "🔥🔥🔥", "High"],
    ["Cloud / DevOps", "₹60+ LPA", "🟢 Low", "🔥🔥🔥", "Medium"],
    ["UI/UX", "₹35+ LPA", "🟡 Medium", "🔥🔥", "Low-Med"],
    ["Blockchain", "₹80+ LPA", "🟢 Low", "🔥🔥", "Very High"],
    ["Mobile Dev", "₹38+ LPA", "🟡 Medium", "🔥🔥", "Medium"],
    ["Game Dev", "₹35+ LPA", "🟡 Medium", "🔥", "Medium-High"],
  ];

  const formatted = table
    .map((row, i) => (i === 0 ? row.join(" | ") : row.join(" | ")))
    .join("\n");

  return `📊 **Career Comparison Matrix**\n\n\`\`\`\n${formatted}\n\`\`\`\n\n💡 _Type any career name for a deep dive!_`;
}

module.exports = { handleIntent };
