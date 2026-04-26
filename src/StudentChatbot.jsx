import React, { useState, useEffect, useRef } from 'react';

const KNOWLEDGE_BASE = {
  home: {
    welcome: "👋 Hi! I'm your AI Study Assistant. I'm here to help you navigate your dashboard and make the most of your learning journey!",
    suggestions: [
      "How do I start a quiz?",
      "What do I see on the Home tab?",
      "How do I check my performance?",
      "What is the TestCard?"
    ],
    responses: {
      "how do i start a quiz?": "📝 To start a quiz, click on the **'My Test'** tab in the navigation bar. From there, you can select a subject and difficulty level, then click **'Start Test'** on any available question paper. Make sure you haven't already attempted that paper!",
      "what do i see on the home tab?": "🏠 The Home tab shows:\n\n• **Available Subjects** – subjects ready for your class\n• **Performance Section** – your average score and subject-wise progress bars\n• **Student Profile** – your basic info\n• **TestCard** – summary of available, completed, and pending tests\n• **Feedback** – option to share your experience",
      "how do i check my performance?": "📊 Your performance is shown on the right side of the Home tab. You'll see:\n\n• **Average Score** – overall percentage across all tests\n• **Subject Scores** – individual progress bars for each subject\n• **Best Performers** – badges for subjects where you scored 70% or above\n\nFor detailed results, visit the **'Results'** tab.",
      "what is the testcard?": "🎯 The TestCard is a quick summary box showing:\n\n• **Test Available** – how many tests you can take\n• **Test Completed** – tests you've already finished\n• **Test Not Completed** – tests you haven't attempted yet\n\nIt helps you track your progress at a glance!",
      "default": "I'm here to help! You can ask me about starting quizzes, understanding your dashboard, checking performance, or anything else related to your learning."
    }
  },
  mytest: {
    welcome: "🧪 Welcome to the Test Center! I can help you find tests, understand the rules, and guide you through the test-taking process.",
    suggestions: [
      "How do I find available tests?",
      "What are the test rules?",
      "Why can't I start a test?",
      "What happens after I submit?"
    ],
    responses: {
      "how do i find available tests?": "🔍 Use the filters on the 'My Test' page:\n\n1. **Select Subject** – choose from your class subjects\n2. **Select Difficulty** – Easy, Medium, or Hard\n3. Only papers with an **active permit** (valid date range) will appear\n\nGreen papers are ready to attempt; grey ones are already attempted.",
      "what are the test rules?": "⏱️ **Important Test Rules:**\n\n• Tests run in **fullscreen mode** – do not exit\n• **No refreshing** the page (F5 is blocked)\n• **No right-clicking** or opening new tabs\n• A **timer** counts down – submit before time runs out\n• You can only attempt each paper **once**\n• Use the **question navigator** at the bottom to jump between questions\n• For text questions, you can use **voice input** (microphone button)",
      "why can't i start a test?": "🚫 You may not be able to start a test if:\n\n• The paper has **no active permit** (expired or not yet started)\n• You have **already attempted** that paper (shown as 'Attempted')\n• You haven't **selected filters** (try choosing a subject first)\n• There are **no question papers** available for your class yet\n\nContact your teacher if you think this is a mistake.",
      "what happens after i submit?": "✅ After submitting:\n\n1. Your score is **saved automatically**\n2. You can **review** your answers immediately\n3. The test appears in your **Results** tab\n4. The paper is marked as **'Attempted'** and cannot be retaken\n5. Your **performance metrics** on the Home tab are updated\n\nMake sure to review your mistakes to improve!",
      "default": "Ask me about finding tests, test rules, troubleshooting, or what happens after submission!"
    }
  },
  results: {
    welcome: "📈 Welcome to your Results page! I can help you understand your scores and how to improve.",
    suggestions: [
      "How do I read my results?",
      "What is a good score?",
      "Can I retake a test?",
      "How do I improve my performance?"
    ],
    responses: {
      "how do i read my results?": "📋 Each result card shows:\n\n• **Subject Name** – which test you took\n• **Date & Time** – when you attempted it\n• **Questions / Correct** – total vs. correct answers\n• **Score** – your marks (color-coded: green ≥70%, orange ≥50%, red <50%)\n\nClick **'Review'** on any test in the 'My Test' tab to see detailed question-by-question analysis.",
      "what is a good score?": "🎯 Score guide:\n\n• **Green (≥70%)** – Excellent! Keep it up! 🎉\n• **Orange (50-69%)** – Good, but there's room for improvement 👍\n• **Red (<50%)** – Needs more practice and review 💪\n\nDon't worry about low scores – use them to identify weak areas and focus your study!",
      "can i retake a test?": "❌ No, each question paper can only be attempted **once**. This ensures fair assessment.\n\nHowever, you can:\n• Look for **new question papers** on the same subject\n• Ask your teacher to **create more papers**\n• **Review your mistakes** using the Review feature to learn from them",
      "how do i improve my performance?": "📚 Tips to improve:\n\n1. **Review wrong answers** – understand why you got them wrong\n2. **Focus on weak subjects** – check the subject-wise bars in Performance\n3. **Practice regularly** – take all available tests\n4. **Read questions carefully** – don't rush\n5. **Use the Query tab** – ask your teacher for help on difficult topics\n6. **Check 'Best Performers'** – build on your strengths!",
      "default": "Ask me about reading results, score interpretation, or tips to improve your performance!"
    }
  },
  profile: {
    welcome: "👤 Welcome to your Profile section! I can help you manage your personal information.",
    suggestions: [
      "How do I edit my profile?",
      "What info is shown in my profile?",
      "Can I change my class or board?",
      "Why is my profile important?"
    ],
    responses: {
      "how do i edit my profile?": "✏️ To edit your profile:\n\n1. Click **'Profile'** in the navigation bar\n2. In the popup, click the **'Edit Profile'** button\n3. Update your **Name**, **Roll Number**, or **Date of Birth**\n4. Click **'Save Changes'**\n\nNote: Class and Board are set by your teacher and cannot be changed here.",
      "what info is shown in my profile?": "🪪 Your profile displays:\n\n• **Name** – your full name\n• **Roll Number** – your unique student ID\n• **Date of Birth** – in DD-MM-YYYY format\n• **Class** – your current class (read-only)\n• **Board** – your education board (read-only)\n\nThis information is also visible in the side panel on your Home tab.",
      "can i change my class or board?": "🚫 **No**, Class and Board are managed by your teacher/administrator and are **read-only** for students.\n\nIf you believe your class or board is incorrect, please submit a **Query** from the Queries tab or contact your teacher directly.",
      "why is my profile important?": "✅ Your profile ensures:\n\n• **Correct test assignments** – tests are matched to your class and board\n• **Accurate records** – your results are linked to your identity\n• **Personalized experience** – subjects and papers are filtered for your class\n\nKeep your name and roll number up to date for proper result tracking!",
      "default": "Ask me about editing your profile, understanding profile fields, or why your profile matters!"
    }
  },
  queries: {
    welcome: "💬 Welcome to the Queries section! I can help you communicate with your teachers effectively.",
    suggestions: [
      "How do I submit a query?",
      "What categories can I choose?",
      "How long does a response take?",
      "What should I include in my query?"
    ],
    responses: {
      "how do i submit a query?": "📝 To submit a query:\n\n1. Go to the **'Queries'** tab\n2. Click **'+ Submit New Query'**\n3. Select a **Category** (e.g., Test Related, Technical Issue)\n4. Write your **message** clearly\n5. Click **'Submit Query'**\n\nYour teacher will review it and respond soon!",
      "what categories can i choose?": "📂 Available query categories:\n\n• **General Inquiry** – general questions\n• **Test Related** – issues with tests or results\n• **Question Related** – doubts about specific questions\n• **Technical Issue** – app or login problems\n• **Account** – profile or login issues\n• **Other** – anything not covered above\n\nPick the most relevant one so your teacher can help faster!",
      "how long does a response take?": "⏳ Response times depend on your teacher's availability. Typically:\n\n• **Urgent technical issues** – within 24 hours\n• **General queries** – 1-3 days\n• **Question doubts** – usually by the next class\n\nYou'll see a **'✓ Resolved'** badge once your query is answered. Check back regularly!",
      "what should i include in my query?": "✍️ A good query includes:\n\n• **Clear subject line** – pick the right category\n• **Specific details** – mention the test name, question number, or error message\n• **What you expected** – what should have happened\n• **What actually happened** – the problem you faced\n\nExample: *'In the Math Easy test (Q3), I think my answer should be accepted because...'*",
      "default": "Ask me about submitting queries, choosing categories, or writing effective questions!"
    }
  }
};

function StudentChatbot({ activeTab, isTestActive }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Reset and send welcome message when tab changes
  useEffect(() => {
    if (!isTestActive && isOpen) {
      const tabData = KNOWLEDGE_BASE[activeTab] || KNOWLEDGE_BASE.home;
      setMessages([
        { sender: 'bot', text: tabData.welcome, time: new Date() }
      ]);
    }
  }, [activeTab, isTestActive]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const getBotResponse = (userText) => {
    const tabData = KNOWLEDGE_BASE[activeTab] || KNOWLEDGE_BASE.home;
    const lowerText = userText.toLowerCase().trim();

    // Check for exact or partial matches in responses
    for (const [key, response] of Object.entries(tabData.responses)) {
      if (key === 'default') continue;
      if (lowerText.includes(key) || key.includes(lowerText)) {
        return response;
      }
    }

    // Generic fallback responses
    const fallbacks = [
      "🤔 I'm not sure I understood that. Try clicking one of the suggestion buttons below, or rephrase your question!",
      "💡 I can help with topics related to this page. Try asking about the features you see, or use the quick suggestions!",
      "🙂 I'm still learning! For the best help, try one of the suggested questions below."
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  };

  const sendMessage = (text) => {
    if (!text.trim()) return;

    const userMsg = { sender: 'user', text, time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    // Simulate typing delay
    setTimeout(() => {
      const botResponse = getBotResponse(text);
      setMessages(prev => [...prev, { sender: 'bot', text: botResponse, time: new Date() }]);
      setIsTyping(false);
    }, 800 + Math.random() * 600);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const handleSuggestionClick = (suggestion) => {
    sendMessage(suggestion);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Don't render at all during active test
  if (isTestActive) return null;

  const tabData = KNOWLEDGE_BASE[activeTab] || KNOWLEDGE_BASE.home;
  const suggestions = tabData.suggestions;

  return (
    <div className="student-chatbot-container">
      {/* Floating Button */}
      {!isOpen && (
        <button
          className="student-chatbot-fab"
          onClick={() => setIsOpen(true)}
          title="AI Study Assistant"
          aria-label="Open AI Study Assistant"
        >
          <span className="student-chatbot-fab-icon">🤖</span>
          <span className="student-chatbot-fab-pulse"></span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="student-chatbot-window">
          {/* Header */}
          <div className="student-chatbot-header">
            <div className="student-chatbot-header-info">
              <span className="student-chatbot-avatar">🤖</span>
              <div>
                <div className="student-chatbot-name">AI Study Assistant</div>
                <div className="student-chatbot-status">
                  <span className="student-chatbot-status-dot"></span>
                  Online
                </div>
              </div>
            </div>
            <button
              className="student-chatbot-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>

          {/* Messages Area */}
          <div className="student-chatbot-messages">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`student-chatbot-message ${msg.sender === 'user' ? 'user' : 'bot'}`}
              >
                <div className="student-chatbot-message-bubble">
                  {msg.text.split('\n').map((line, i) => (
                    <span key={i}>
                      {line.includes('**') ? (
                        line.split('**').map((part, j) =>
                          j % 2 === 1 ? (
                            <strong key={j}>{part}</strong>
                          ) : (
                            <span key={j}>{part}</span>
                          )
                        )
                      ) : (
                        line
                      )}
                      {i < msg.text.split('\n').length - 1 && <br />}
                    </span>
                  ))}
                </div>
                <div className="student-chatbot-message-time">
                  {formatTime(msg.time)}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="student-chatbot-message bot">
                <div className="student-chatbot-message-bubble typing">
                  <span className="student-chatbot-typing-dot"></span>
                  <span className="student-chatbot-typing-dot"></span>
                  <span className="student-chatbot-typing-dot"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && !isTyping && (
            <div className="student-chatbot-suggestions">
              {suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  className="student-chatbot-suggestion-chip"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          {/* Input Area */}
          <form className="student-chatbot-input-area" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              type="text"
              className="student-chatbot-input"
              placeholder="Type your question..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <button
              type="submit"
              className="student-chatbot-send"
              disabled={!inputValue.trim() || isTyping}
              aria-label="Send message"
            >
              ➤
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default StudentChatbot;

