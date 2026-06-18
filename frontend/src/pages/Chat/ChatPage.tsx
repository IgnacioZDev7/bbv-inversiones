import { useState, useRef, useEffect } from 'react';
import { sendChatMessage } from '../../services/apiServices';
import { ChatIcon, PlusIcon, PaperPlaneIcon, TrashBinIcon } from '../../icons';
import type { ChatMessage, ChatConversation } from '../../types/api';

const STORAGE_KEY = 'bbv-chat-conversations';

const QUICK_QUESTIONS = [
  '¿Cómo está el mercado hoy?',
  'Recomiéndame empresas del sector financiero',
  '¿Cuál es el ROE de las mejores empresas?',
  'Analiza la liquidez del sector industrial',
  '¿Qué empresas tienen mejor patrimonio?',
  'Compara los indicadores de los últimos 3 años',
];

const generateId = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

function readConversations(): ChatConversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeConversations(convs: ChatConversation[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(convs));
}

export default function ChatPage() {
  const [conversations, setConversations] = useState<ChatConversation[]>(readConversations);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const activeConv = conversations.find((c) => c.id === activeId) ?? null;

  useEffect(() => {
    writeConversations(conversations);
  }, [conversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConv?.messages]);

  const createNewConversation = () => {
    const conv: ChatConversation = {
      id: generateId(),
      title: 'Nueva conversación',
      messages: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setConversations((prev) => [conv, ...prev]);
    setActiveId(conv.id);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const deleteConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeId === id) setActiveId(null);
  };

  const handleSend = async (overrideMsg?: string) => {
    const msg = (overrideMsg ?? input).trim();
    if (!msg || sending) return;

    let convId = activeId;
    if (!convId) {
      const conv: ChatConversation = {
        id: generateId(),
        title: msg.length > 40 ? msg.slice(0, 40) + '…' : msg,
        messages: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setConversations((prev) => [conv, ...prev]);
      setActiveId(conv.id);
      convId = conv.id;
    }

    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: msg,
      created_at: new Date().toISOString(),
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === convId
          ? { ...c, messages: [...c.messages, userMsg], updated_at: new Date().toISOString() }
          : c,
      ),
    );
    setInput('');
    setSending(true);

    try {
      const res = await sendChatMessage({ message: msg, conversation_id: convId ?? undefined });
      const botMsg: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: res.reply,
        created_at: new Date().toISOString(),
      };
      setConversations((prev) =>
        prev.map((c) =>
          c.id === convId
            ? { ...c, messages: [...c.messages, botMsg], updated_at: new Date().toISOString() }
            : c,
        ),
      );
    } catch {
      const fallback: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: 'Lo siento, no pude procesar tu consulta en este momento. Por favor intenta de nuevo.',
        created_at: new Date().toISOString(),
      };
      setConversations((prev) =>
        prev.map((c) =>
          c.id === convId ? { ...c, messages: [...c.messages, fallback] } : c,
        ),
      );
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-0">
      <aside className="hidden w-80 flex-shrink-0 border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 lg:flex lg:flex-col">
        <div className="border-b border-gray-100 p-4 dark:border-gray-700">
          <button
            onClick={createNewConversation}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4" />
            Nueva conversación
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-2">
          {conversations.length === 0 && (
            <p className="mt-8 text-center text-xs text-gray-400">No hay conversaciones previas</p>
          )}
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setActiveId(conv.id)}
              className={`group mb-1 flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                activeId === conv.id
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
              }`}
            >
              <span className="truncate font-medium">{conv.title}</span>
              <button
                onClick={(e) => deleteConversation(conv.id, e)}
                className="shrink-0 rounded p-0.5 text-gray-400 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
              >
                <TrashBinIcon className="h-3.5 w-3.5" />
              </button>
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex flex-1 flex-col bg-gray-50 dark:bg-gray-950">
        {!activeConv ? (
          <div className="flex flex-1 flex-col items-center justify-center px-4">
            <div className="mb-6 rounded-2xl bg-blue-100 p-4 dark:bg-blue-500/10">
              <ChatIcon className="h-10 w-10 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">Asistente BBV</h2>
            <p className="mb-8 max-w-md text-center text-sm text-gray-500 dark:text-gray-400">
              Consulta sobre empresas, indicadores financieros, sectores y más. Selecciona una conversación
              o crea una nueva.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {QUICK_QUESTIONS.slice(0, 4).map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    createNewConversation();
                    setTimeout(() => handleSend(q), 50);
                  }}
                  className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-600 transition-colors hover:border-blue-300 hover:text-blue-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:border-blue-500 dark:hover:text-blue-400"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-6">
              {activeConv.messages.length === 0 && (
                <div className="mb-6">
                  <p className="mb-3 text-center text-xs font-medium uppercase tracking-wider text-gray-400">
                    Preguntas rápidas
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {QUICK_QUESTIONS.map((q) => (
                      <button
                        key={q}
                        onClick={() => handleSend(q)}
                        className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-600 transition-colors hover:border-blue-300 hover:text-blue-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:border-blue-500 dark:hover:text-blue-400"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {activeConv.messages.map((msg) => (
                <div key={msg.id} className={`mb-4 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-200 bg-white text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="mb-4 flex justify-start">
                  <div className="flex max-w-[75%] items-center gap-1.5 rounded-2xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900">
                    <span
                      className="h-2 w-2 animate-bounce rounded-full bg-blue-400"
                      style={{ animationDelay: '0ms' }}
                    />
                    <span
                      className="h-2 w-2 animate-bounce rounded-full bg-blue-400"
                      style={{ animationDelay: '150ms' }}
                    />
                    <span
                      className="h-2 w-2 animate-bounce rounded-full bg-blue-400"
                      style={{ animationDelay: '300ms' }}
                    />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
              <div className="mx-auto flex max-w-4xl items-end gap-3">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Escribe tu consulta sobre empresas, indicadores..."
                  rows={1}
                  className="max-h-32 min-h-[44px] flex-1 resize-none rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 dark:focus:border-blue-500"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || sending}
                  className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <PaperPlaneIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
