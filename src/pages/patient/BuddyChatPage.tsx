import { FormEvent, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { patientApi } from '../../api/patient';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

const copy = {
  title: 'AnytimeBuddy',
  subtitle: '24/7 companion support. ₹150/call or Premium Free.',
  placeholder: 'Share how you are feeling right now...',
};

export default function BuddyChatPage() {
  const navigate = useNavigate();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Hi, I am AnytimeBuddy. I can support you between sessions. What would help most right now?',
    },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  const quickPrompts = useMemo(
    () => ['Help me calm anxiety quickly', 'Give me a sleep reset plan', 'Guide me through a 2-minute grounding'],
    [],
  );

  const send = async (event?: FormEvent<HTMLFormElement>, explicit?: string) => {
    if (event) event.preventDefault();
    const value = String(explicit ?? input).trim();
    if (!value || sending) return;

    setMessages((prev) => [...prev, { role: 'user', content: value }]);
    setInput('');
    setSending(true);

    try {
      const response = await patientApi.aiChat({
        message: value,
        bot_type: 'mood_ai',
        response_style: 'concise',
      });
      const payload = (response as any)?.data ?? response;
      const reply = String(payload?.response || 'I hear you. I am with you. Let us take this one step at a time.');
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Connection is unstable right now. I am still here. Try again in a moment.',
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-4 px-4 pb-20 pt-4 sm:px-6 lg:pb-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">{copy.title}</h1>
          <p className="mt-0.5 text-sm text-charcoal/60">{copy.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="rounded-full border border-calm-sage/20 bg-white px-4 py-2 text-sm font-semibold text-charcoal/75 hover:bg-calm-sage/5"
        >
          ← Back
        </button>
      </header>

      <div className="flex flex-wrap gap-2">
        {quickPrompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            disabled={sending}
            onClick={() => { void send(undefined, prompt); }}
            className="rounded-full border border-calm-sage/20 bg-white px-3 py-1.5 text-xs font-medium text-charcoal/70 hover:border-calm-sage/50"
          >
            {prompt}
          </button>
        ))}
      </div>

      <div className="min-h-[400px] space-y-3 overflow-y-auto rounded-2xl border border-calm-sage/15 bg-white/80 p-4 lg:min-h-[520px]">
        {messages.map((message, index) => (
          <div key={`${message.role}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-6 ${
                message.role === 'user' ? 'bg-teal-600 text-white' : 'border border-calm-sage/15 bg-white text-charcoal/82 shadow-sm'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
        {sending && <p className="text-xs text-charcoal/55">AnytimeBuddy is typing...</p>}
      </div>

      <form onSubmit={send} className="flex gap-2">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={copy.placeholder}
          className="h-12 flex-1 rounded-xl border border-calm-sage/25 bg-white px-4 text-sm text-charcoal outline-none focus:border-teal-400"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="h-12 rounded-xl bg-teal-600 px-5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
