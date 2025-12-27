import { useEffect, useState } from 'react';
import { ChatBubbleLeftEllipsisIcon, XMarkIcon } from '@heroicons/react/24/outline';
import api from '../../api/axios';
import { useAuth } from '../../hooks/useAuth';

const ChatWidget = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! Need help finding products or tracking an order?' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const container = document.getElementById('chat-widget-scroll');
    if (container) container.scrollTop = container.scrollHeight;
  }, [messages, open]);

  const send = async () => {
    if (!input.trim()) return;
    const nextMessages = [...messages, { role: 'user', content: input }];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);
    try {
      const res = await api.post('/chat', {
        message: input,
        previousMessages: nextMessages.slice(-5),
      });
      const reply = res.data.data.response?.message || '...';
      setMessages([...nextMessages, { role: 'assistant', content: reply }]);
    } catch (err) {
      setMessages([...nextMessages, { role: 'assistant', content: 'Sorry, I had trouble. Try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="fixed bottom-6 right-4 z-40 flex flex-col items-end gap-3">
      {open && (
        <div className="w-80 sm:w-96 h-[420px] bg-white shadow-xl rounded-2xl border border-slate-200 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 via-blue-500 to-emerald-400 shadow-md flex items-center justify-center text-white font-bold text-base">
                VC
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Campus Assistant</p>
                <p className="text-xs text-slate-500">Ask about products, orders, or policies</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close chat">
              <XMarkIcon className="h-5 w-5 text-slate-500" />
            </button>
          </div>
          <div id="chat-widget-scroll" className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50/60">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex ${m.role === 'assistant' ? 'justify-start' : 'justify-end'}`}>
                <div
                  className={`inline-block max-w-[78%] break-words rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm ${
                    m.role === 'assistant'
                      ? 'bg-white text-slate-800'
                      : 'bg-primary text-white'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-slate-200 flex gap-2">
            <input
              className="flex-1 border rounded px-3 py-2 text-sm"
              placeholder="Ask me anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => (e.key === 'Enter' ? send() : null)}
            />
            <button className="btn-primary text-sm" onClick={send} disabled={loading}>
              {loading ? '...' : 'Send'}
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className="relative btn-primary shadow-xl flex items-center gap-3 rounded-full px-5 py-3 text-sm"
        aria-label="Open chat assistant"
      >
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 via-blue-500 to-emerald-400 flex items-center justify-center text-white font-semibold text-sm">
            VC
          </div>
          <div className="flex flex-col items-start leading-tight">
            <span className="text-xs text-white/80">Chat with</span>
            <span className="text-sm font-semibold">Campus Assistant</span>
          </div>
          <ChatBubbleLeftEllipsisIcon className="h-5 w-5 text-white" />
      </button>
    </div>
  );
};

export default ChatWidget;
