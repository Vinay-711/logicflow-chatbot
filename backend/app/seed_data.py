"""
Seed Data — Initial Knowledge Base Intents.

Seeds 20 realistic intents across multiple categories on first run.
These demonstrate the rule-based engine's capability and provide
a useful starting point for the admin to extend.
"""

from sqlalchemy.orm import Session
from app.models import Intent


SEED_INTENTS = [
    # ── Greetings ─────────────────────────────────────────────
    {
        "name": "greeting",
        "keywords": ["hello", "hi", "hey", "howdy", "greetings", "yo", "hola", "sup"],
        "response": (
            "👋 **Hello there!** Welcome to LogicFlow!\n\n"
            "I'm here to help you with information about our services, pricing, "
            "hours, and more. What can I do for you today?"
        ),
        "category": "greeting",
    },
    {
        "name": "good_morning",
        "keywords": ["good morning", "morning"],
        "response": (
            "🌅 **Good morning!** Hope you're having a great start to your day!\n\n"
            "How can I assist you today?"
        ),
        "category": "greeting",
    },
    {
        "name": "good_evening",
        "keywords": ["good evening", "evening", "good night"],
        "response": (
            "🌙 **Good evening!** Thanks for reaching out.\n\n"
            "I'm here to help — what would you like to know?"
        ),
        "category": "greeting",
    },

    # ── Farewells ─────────────────────────────────────────────
    {
        "name": "farewell",
        "keywords": ["bye", "goodbye", "see you", "farewell", "see ya"],
        "response": (
            "👋 **Goodbye!** It was great chatting with you.\n\n"
            "Feel free to come back anytime. Have a wonderful day! ✨"
        ),
        "category": "farewell",
    },

    # ── Help ──────────────────────────────────────────────────
    {
        "name": "help",
        "keywords": ["help", "assist", "support", "what can you do", "commands", "menu"],
        "response": (
            "🛠️ **Here's what I can help you with:**\n\n"
            "- 💰 **Pricing** — Ask about our plans and costs\n"
            "- 🕐 **Hours** — Our business hours and availability\n"
            "- 📞 **Contact** — How to reach our team\n"
            "- 🔧 **Services** — What we offer\n"
            "- 📍 **Location** — Where to find us\n"
            "- 😂 **Jokes** — I know a few!\n"
            "- ℹ️ **About** — Learn about this bot\n\n"
            "Just type any of these topics, or ask me a question!"
        ),
        "category": "help",
    },

    # ── Pricing ───────────────────────────────────────────────
    {
        "name": "pricing",
        "keywords": ["pricing", "price", "cost", "plans", "subscription", "fees", "how much"],
        "response": (
            "💰 **Our Pricing Plans:**\n\n"
            "| Plan | Price | Features |\n"
            "|------|-------|----------|\n"
            "| **Starter** | Free | 100 messages/mo, basic intents |\n"
            "| **Pro** | $19/mo | Unlimited messages, analytics |\n"
            "| **Enterprise** | Custom | Priority support, custom intents |\n\n"
            "Want to get started? Visit our [pricing page](#) or type **contact** to talk to sales!"
        ),
        "category": "business",
    },

    # ── Hours ─────────────────────────────────────────────────
    {
        "name": "hours",
        "keywords": ["hours", "schedule", "open", "time", "available", "availability", "when"],
        "response": (
            "🕐 **Business Hours:**\n\n"
            "- **Monday – Friday:** 9:00 AM – 6:00 PM (IST)\n"
            "- **Saturday:** 10:00 AM – 2:00 PM (IST)\n"
            "- **Sunday:** Closed\n\n"
            "💡 This chatbot is available **24/7** though! Feel free to ask anything."
        ),
        "category": "business",
    },

    # ── Contact ───────────────────────────────────────────────
    {
        "name": "contact",
        "keywords": ["contact", "email", "phone", "reach", "call", "connect"],
        "response": (
            "📞 **Contact Us:**\n\n"
            "- 📧 Email: **support@logicflow.ai**\n"
            "- 📱 Phone: **+91 98765 43210**\n"
            "- 💬 Live Chat: You're using it right now! 😄\n"
            "- 🐦 Twitter: **@LogicFlow**\n\n"
            "We typically respond within 24 hours."
        ),
        "category": "business",
    },

    # ── Services ──────────────────────────────────────────────
    {
        "name": "services",
        "keywords": ["services", "offerings", "what do you offer", "products", "features"],
        "response": (
            "🔧 **Our Services:**\n\n"
            "1. 🤖 **AI Chatbot Development** — Custom rule-based & hybrid bots\n"
            "2. 📊 **Data Analytics** — Insights from your conversation data\n"
            "3. 🔌 **API Integration** — Connect your bot to existing systems\n"
            "4. 🎨 **Custom UI/UX** — Branded chat interfaces\n"
            "5. 📈 **Training & Consulting** — AI strategy for your team\n\n"
            "Type **pricing** for plan details or **contact** to get started!"
        ),
        "category": "business",
    },

    # ── About ─────────────────────────────────────────────────
    {
        "name": "about",
        "keywords": ["about", "who are you", "what are you", "about you", "your name"],
        "response": (
            "🤖 **About LogicFlow:**\n\n"
            "I'm a **rule-based AI assistant** built as a "
            "LogicFlow AI Blueprint demonstration.\n\n"
            "**How I work:**\n"
            "- I use a **dictionary/hash-map** knowledge base for instant intent matching\n"
            "- Every query goes through **Input → Process → Output** (IPO model)\n"
            "- My knowledge base is fully **manageable via the admin panel**\n"
            "- No ML or external AI — pure deterministic logic! 🧠\n\n"
            "Built with ❤️ using FastAPI + React"
        ),
        "category": "about",
    },

    # ── Jokes ─────────────────────────────────────────────────
    {
        "name": "joke",
        "keywords": ["joke", "funny", "laugh", "humor", "tell me a joke"],
        "response": (
            "😂 Here's one for you:\n\n"
            "> Why do programmers prefer dark mode?\n"
            "> Because **light attracts bugs!** 🐛\n\n"
            "Want to hear another one? Just ask! 😄"
        ),
        "category": "fun",
    },

    # ── Thanks ────────────────────────────────────────────────
    {
        "name": "thanks",
        "keywords": ["thanks", "thank you", "appreciate", "thx", "ty", "cheers"],
        "response": (
            "😊 **You're welcome!** Happy to help.\n\n"
            "Is there anything else I can assist you with?"
        ),
        "category": "social",
    },

    # ── How Are You ───────────────────────────────────────────
    {
        "name": "how_are_you",
        "keywords": ["how are you", "how's it going", "what's up", "how do you do"],
        "response": (
            "😊 I'm doing great, thanks for asking!\n\n"
            "I'm a bot, so I'm always running at **100% efficiency** ⚡\n"
            "How can I help you today?"
        ),
        "category": "social",
    },

    # ── Location ──────────────────────────────────────────────
    {
        "name": "location",
        "keywords": ["location", "address", "where", "office", "headquarters", "map"],
        "response": (
            "📍 **Our Location:**\n\n"
            "**LogicFlow HQ**\n"
            "123 Innovation Drive, Tech Park\n"
            "Bengaluru, Karnataka 560001\n"
            "India 🇮🇳\n\n"
            "📌 [View on Google Maps](#)"
        ),
        "category": "business",
    },

    # ── Feedback ──────────────────────────────────────────────
    {
        "name": "feedback",
        "keywords": ["feedback", "suggestion", "complaint", "review", "improve"],
        "response": (
            "📝 **We value your feedback!**\n\n"
            "Please share your thoughts:\n"
            "- 📧 Email us at **feedback@logicflow.ai**\n"
            "- ⭐ Rate your experience in the chat\n"
            "- 💡 Suggest new features or improvements\n\n"
            "Your input helps us build a better product. Thank you! 🙏"
        ),
        "category": "support",
    },

    # ── Status ────────────────────────────────────────────────
    {
        "name": "status",
        "keywords": ["status", "update", "system status", "uptime", "downtime"],
        "response": (
            "🟢 **System Status: All Systems Operational**\n\n"
            "- 🖥️ API Server: **Online**\n"
            "- 💬 Chat Engine: **Running**\n"
            "- 🗃️ Database: **Connected**\n"
            "- ⏱️ Response Time: **< 100ms**\n\n"
            "Last checked: Just now ✅"
        ),
        "category": "technical",
    },

    # ── Capabilities ──────────────────────────────────────────
    {
        "name": "capabilities",
        "keywords": ["capabilities", "abilities", "can you", "what can you do", "skills"],
        "response": (
            "🚀 **My Capabilities:**\n\n"
            "✅ Answer questions about our business\n"
            "✅ Provide pricing and service information\n"
            "✅ Share contact details and hours\n"
            "✅ Tell jokes and engage in small talk\n"
            "✅ Track and learn from unmatched queries\n"
            "✅ Support multiple chat sessions\n\n"
            "⚠️ I'm a **rule-based** bot — I work best with specific topics!\n"
            "Type **help** to see all available topics."
        ),
        "category": "about",
    },

    # ── Privacy ───────────────────────────────────────────────
    {
        "name": "privacy",
        "keywords": ["privacy", "data", "security", "gdpr", "personal information"],
        "response": (
            "🔒 **Privacy & Security:**\n\n"
            "- Your chat data is stored **securely** in our database\n"
            "- We **never share** your data with third parties\n"
            "- You can **delete** your chat history anytime\n"
            "- Passwords are **hashed** using bcrypt\n"
            "- Sessions are protected by **JWT tokens**\n\n"
            "For full details, check our privacy policy."
        ),
        "category": "legal",
    },

    # ── Compliment ────────────────────────────────────────────
    {
        "name": "compliment",
        "keywords": ["nice", "awesome", "great", "cool", "amazing", "love it", "wonderful"],
        "response": (
            "🥰 **Aww, thank you!** That really makes my circuits happy!\n\n"
            "Is there anything else I can help you with? 😊"
        ),
        "category": "social",
    },

    # ── Careers ───────────────────────────────────────────────
    {
        "name": "careers",
        "keywords": ["careers", "jobs", "hiring", "internship", "work with us", "openings"],
        "response": (
            "💼 **Careers at LogicFlow:**\n\n"
            "We're always looking for talented people!\n\n"
            "🔥 **Current Openings:**\n"
            "- AI Software Engineer\n"
            "- Full-Stack Developer\n"
            "- Product Designer\n\n"
            "📧 Send your resume to **careers@logicflow.ai**\n"
            "or visit our careers page for more info!"
        ),
        "category": "business",
    },
]


def seed_intents(db: Session) -> int:
    """
    Seed the database with initial intents and a default user if none exist.
    """
    # Seed default user for auto-login / bypass auth
    from app.models import User
    default_user = db.query(User).filter(User.id == 1).first()
    if not default_user:
        user = User(
            id=1,
            email="admin@logicflow.ai",
            hashed_password="mocked-unused-password",
            username="Admin",
            is_admin=True,
        )
        db.add(user)
        db.commit()

    existing_count = db.query(Intent).count()
    if existing_count > 0:
        return 0

    count = 0
    for data in SEED_INTENTS:
        intent = Intent(
            name=data["name"],
            keywords=data["keywords"],
            response=data["response"],
            category=data["category"],
        )
        db.add(intent)
        count += 1

    db.commit()
    return count
