import { useEffect, useState } from 'react';
import api from '../api/axios';

const ChatAssistant = () => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I can help you find products, track orders, or answer FAQs.' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!input.trim()) return;
    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    try {
      const res = await api.post('/chat', {
        message: input,
        previousMessages: newMessages.slice(-5),
      });
      const reply = res.data.data.response?.message || '...';
      setMessages([...newMessages, { role: 'assistant', content: reply }]);
    } catch (err) {
      setMessages([...newMessages, { role: 'assistant', content: 'Sorry, I had trouble. Try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const container = document.getElementById('chat-scroll');
    if (container) container.scrollTop = container.scrollHeight;
  }, [messages]);

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-xl shadow flex flex-col h-[70vh]">
      <div className="p-4 border-b border-slate-200 font-semibold">AI Assistant</div>
      <div id="chat-scroll" className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex ${m.role === 'assistant' ? 'justify-start' : 'justify-end'}`}>
            <div className={`inline-block max-w-[70%] break-words rounded-2xl px-3 py-2 leading-relaxed shadow-sm ${m.role === 'assistant' ? 'bg-slate-100 text-slate-800' : 'bg-primary text-white'}`}>
              {m.content}
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-slate-200 flex gap-2">
        <input className="flex-1 border rounded px-3 py-2" placeholder="Ask about products or orders..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' ? send() : null} />
        <button className="btn-primary" onClick={send} disabled={loading}>{loading ? '...' : 'Send'}</button>
      </div>
    </div>
  );
};

export default ChatAssistant;
