/**
 * Client-Side Deterministic Rule-Based Chat Engine & Mock API Fallback
 * Provides offline/client-side rule-based matching when backend is not connected.
 */

export const DEFAULT_INTENTS = [
  {
    id: 1,
    name: "greeting",
    keywords: ["hello", "hi", "hey", "howdy", "greetings", "yo", "hola", "sup"],
    response: "👋 **Hello there!** Welcome to LogicFlow!\n\nI'm here to help you with information about our services, pricing, hours, and more. What can I do for you today?",
    category: "greeting",
    priority: 10,
    is_active: true,
    hit_count: 42
  },
  {
    id: 2,
    name: "good_morning",
    keywords: ["good morning", "morning"],
    response: "🌅 **Good morning!** Hope you're having a great start to your day!\n\nHow can I assist you today?",
    category: "greeting",
    priority: 5,
    is_active: true,
    hit_count: 14
  },
  {
    id: 3,
    name: "good_evening",
    keywords: ["good evening", "evening", "good night"],
    response: "🌙 **Good evening!** Thanks for reaching out.\n\nI'm here to help — what would you like to know?",
    category: "greeting",
    priority: 5,
    is_active: true,
    hit_count: 9
  },
  {
    id: 4,
    name: "farewell",
    keywords: ["bye", "goodbye", "see you", "farewell", "see ya"],
    response: "👋 **Goodbye!** It was great chatting with you.\n\nFeel free to come back anytime. Have a wonderful day! ✨",
    category: "farewell",
    priority: 10,
    is_active: true,
    hit_count: 19
  },
  {
    id: 5,
    name: "help",
    keywords: ["help", "assist", "support", "what can you do", "commands", "menu"],
    response: "🛠️ **Here's what I can help you with:**\n\n- 💰 **Pricing** — Ask about our plans and costs\n- 🕐 **Hours** — Our business hours and availability\n- 📞 **Contact** — How to reach our team\n- 🔧 **Services** — What we offer\n- 📍 **Location** — Where to find us\n- 😂 **Jokes** — I know a few!\n- ℹ️ **About** — Learn about this bot\n\nJust type any of these topics, or ask me a question!",
    category: "help",
    priority: 10,
    is_active: true,
    hit_count: 88
  },
  {
    id: 6,
    name: "pricing",
    keywords: ["pricing", "price", "cost", "plans", "subscription", "fees", "how much"],
    response: "💰 **Our Pricing Plans:**\n\n| Plan | Price | Features |\n|------|-------|----------|\n| **Starter** | Free | 100 messages/mo, basic intents |\n| **Pro** | $19/mo | Unlimited messages, analytics |\n| **Enterprise** | Custom | Priority support, custom intents |\n\nWant to get started? Type **contact** to talk to sales!",
    category: "business",
    priority: 8,
    is_active: true,
    hit_count: 53
  },
  {
    id: 7,
    name: "hours",
    keywords: ["hours", "schedule", "open", "time", "available", "availability", "when"],
    response: "🕐 **Business Hours:**\n\n- **Monday – Friday:** 9:00 AM – 6:00 PM (IST)\n- **Saturday:** 10:00 AM – 2:00 PM (IST)\n- **Sunday:** Closed\n\n💡 This chatbot is available **24/7** though! Feel free to ask anything.",
    category: "business",
    priority: 8,
    is_active: true,
    hit_count: 27
  },
  {
    id: 8,
    name: "contact",
    keywords: ["contact", "email", "phone", "reach", "call", "connect"],
    response: "📞 **Contact Us:**\n\n- 📧 Email: **support@logicflow.ai**\n- 📱 Phone: **+91 98765 43210**\n- 💬 Live Chat: You're using it right now! 😄\n- 🐦 Twitter: **@LogicFlow**\n\nWe typically respond within 24 hours.",
    category: "business",
    priority: 8,
    is_active: true,
    hit_count: 31
  },
  {
    id: 9,
    name: "services",
    keywords: ["services", "offerings", "what do you offer", "products", "features"],
    response: "🔧 **Our Services:**\n\n1. 🤖 **AI Chatbot Development** — Custom rule-based & hybrid bots\n2. 📊 **Data Analytics** — Insights from your conversation data\n3. 🔌 **API Integration** — Connect your bot to existing systems\n4. 🎨 **Custom UI/UX** — Branded chat interfaces\n5. 📈 **Training & Consulting** — AI strategy for your team\n\nType **pricing** for plan details or **contact** to get started!",
    category: "business",
    priority: 8,
    is_active: true,
    hit_count: 34
  },
  {
    id: 10,
    name: "about",
    keywords: ["about", "who are you", "what are you", "about you", "your name"],
    response: "🤖 **About LogicFlow:**\n\nI'm a **rule-based AI assistant** built as a LogicFlow AI demonstration.\n\n**How I work:**\n- I use a **dictionary/hash-map** knowledge base for instant O(1) intent matching\n- Every query goes through **Input → Process → Output** (IPO model)\n- My knowledge base is fully **manageable via the admin panel**\n- Pure deterministic logic! 🧠\n\nBuilt with ❤️ by **Vinay-711**",
    category: "about",
    priority: 10,
    is_active: true,
    hit_count: 65
  },
  {
    id: 11,
    name: "joke",
    keywords: ["joke", "funny", "laugh", "humor", "tell me a joke"],
    response: "😂 Here's one for you:\n\n> Why do programmers prefer dark mode?\n> Because **light attracts bugs!** 🐛\n\nWant to hear another one? Just ask! 😄",
    category: "entertainment",
    priority: 5,
    is_active: true,
    hit_count: 47
  }
];

function getStoredIntents() {
  try {
    const stored = localStorage.getItem('LOGICFLOW_INTENTS');
    if (stored) return JSON.parse(stored);
  } catch (e) {}
  return DEFAULT_INTENTS;
}

export function matchRuleBasedIntent(userText) {
  const sanitized = (userText || '').trim().toLowerCase();
  if (!sanitized) return null;

  const intents = getStoredIntents();

  // 1. Exact match on keyword
  for (const intent of intents) {
    if (!intent.is_active) continue;
    for (const kw of intent.keywords) {
      if (sanitized === kw.toLowerCase()) {
        return {
          intent: intent.name,
          response: intent.response,
          strategy: 'exact',
          confidence: 1.0,
          matched_keyword: kw
        };
      }
    }
  }

  // 2. Substring matching
  for (const intent of intents) {
    if (!intent.is_active) continue;
    for (const kw of intent.keywords) {
      const kwLower = kw.toLowerCase();
      if (sanitized.includes(kwLower) || kwLower.includes(sanitized)) {
        return {
          intent: intent.name,
          response: intent.response,
          strategy: 'substring',
          confidence: 0.85,
          matched_keyword: kw
        };
      }
    }
  }

  // 3. Token-level matching
  const tokens = sanitized.split(/\s+/).filter(t => t.length > 2);
  for (const token of tokens) {
    for (const intent of intents) {
      if (!intent.is_active) continue;
      for (const kw of intent.keywords) {
        if (kw.toLowerCase().split(/\s+/).includes(token)) {
          return {
            intent: intent.name,
            response: intent.response,
            strategy: 'token',
            confidence: 0.7,
            matched_keyword: token
          };
        }
      }
    }
  }

  // Default fallback
  return {
    intent: 'unmatched',
    response: `🤔 I'm not sure I understand "**${userText}**".\n\nHere are some things you can ask me:\n- 💰 **Pricing**\n- 🕐 **Hours**\n- 📞 **Contact**\n- 🔧 **Services**\n- ℹ️ **About**\n- 😂 **Tell me a joke**\n\nOr type **help** to see all available topics!`,
    strategy: 'fallback',
    confidence: 0.0,
    matched_keyword: null
  };
}

// Local Session Helpers
export function getLocalSessions() {
  try {
    const raw = localStorage.getItem('LOGICFLOW_SESSIONS');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  const defaultSessions = [{
    id: 1,
    title: "Welcome to LogicFlow",
    created_at: new Date().toISOString(),
    messages: [
      {
        id: 1,
        role: "bot",
        content: "👋 **Hello!** Welcome to LogicFlow. Ask me about pricing, services, hours, or type **help** to get started!",
        timestamp: new Date().toISOString()
      }
    ]
  }];
  saveLocalSessions(defaultSessions);
  return defaultSessions;
}

export function saveLocalSessions(sessions) {
  try {
    localStorage.setItem('LOGICFLOW_SESSIONS', JSON.stringify(sessions));
  } catch (e) {}
}
