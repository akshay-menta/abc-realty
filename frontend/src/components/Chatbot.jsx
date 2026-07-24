import { useState, useRef, useEffect } from 'react'
import { chatApi } from '../api/client'
import { MessageCircle, X, Send, Bot, User, RotateCcw } from 'lucide-react'
import './Chatbot.css'

const INITIAL_MESSAGE = {
  role: 'assistant',
  content: "👋 Hi! I'm your ABC Realty assistant. I can help you find properties, answer questions about listings, the buying process, or anything real estate related. How can I help you today?",
}

export default function Chatbot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([INITIAL_MESSAGE])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const userMsg = { role: 'user', content: input.trim() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const history = messages.filter(m => m.role !== 'system')
      const res = await chatApi.send(input.trim(), history)
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.response }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again or contact us directly at (512) 555-0100.",
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const resetChat = () => setMessages([INITIAL_MESSAGE])

  const QUICK_QUESTIONS = [
    'What properties are for sale in Austin?',
    'Do you have any 3-bedroom homes?',
    'What\'s the leasing process?',
    'How do I schedule a viewing?',
  ]

  return (
    <>
      {/* Chat Window */}
      <div className={`chat-window ${open ? 'open' : ''}`}>
        <div className="chat-header">
          <div className="chat-header-info">
            <div className="chat-avatar"><Bot size={18} /></div>
            <div>
              <div className="chat-title">ABC Realty Assistant</div>
              <div className="chat-status">
                <span className="status-dot" />
                {loading ? 'Thinking...' : 'Online'}
              </div>
            </div>
          </div>
          <div className="chat-header-actions">
            <button className="chat-action-btn" onClick={resetChat} title="Reset chat">
              <RotateCcw size={15} />
            </button>
            <button className="chat-action-btn" onClick={() => setOpen(false)} title="Close">
              <X size={15} />
            </button>
          </div>
        </div>

        <div className="chat-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`chat-msg ${msg.role}`}>
              <div className="msg-avatar">
                {msg.role === 'assistant' ? <Bot size={14} /> : <User size={14} />}
              </div>
              <div className="msg-bubble">
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="chat-msg assistant">
              <div className="msg-avatar"><Bot size={14} /></div>
              <div className="msg-bubble typing">
                <span /><span /><span />
              </div>
            </div>
          )}

          {/* Quick questions */}
          {messages.length === 1 && (
            <div className="quick-questions">
              <div className="quick-questions-label">Quick questions:</div>
              {QUICK_QUESTIONS.map((q, i) => (
                <button key={i} className="quick-q-btn" onClick={() => { setInput(q); inputRef.current?.focus() }}>
                  {q}
                </button>
              ))}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <div className="chat-input-area">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about properties, pricing, neighborhoods..."
            className="chat-input"
            rows={1}
            disabled={loading}
          />
          <button
            className="chat-send-btn"
            onClick={sendMessage}
            disabled={!input.trim() || loading}
          >
            <Send size={16} />
          </button>
        </div>
        <div className="chat-footer">Powered by AI · ABC Realty</div>
      </div>

      {/* Toggle Button */}
      <button
        className={`chat-toggle ${open ? 'open' : ''}`}
        onClick={() => setOpen(!open)}
        aria-label={open ? 'Close chat' : 'Open AI assistant'}
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
        {!open && <span className="chat-toggle-label">AI Assistant</span>}
      </button>
    </>
  )
}
