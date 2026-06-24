import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, SendHorizontal, Trash2, X, Sparkles, Loader2 } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { useToast } from '../../hooks/useToast';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Initial welcome message
const welcomeMessage: Message = {
  role: 'assistant',
  content: `Chào bạn! Tôi là trợ lý ảo hỗ trợ thông tin học tập, quy trình đào tạo và thủ tục sát hạch lái xe. 

Tôi có thể giúp bạn giải đáp các vấn đề như:
- **Hồ sơ đăng ký** học lái xe các hạng A1, A2, B1, B2, C...
- **Quy trình học** lý thuyết, mô phỏng cabin, số km đường trường (DAT).
- **Lịch thi sát hạch** và các lệ phí liên quan.

Bạn cần tôi hỗ trợ thông tin gì hôm nay?`
};

export function ChatbotWidget() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>(() => {
    const savedChat = localStorage.getItem('igen_chatbot_history');
    if (savedChat) {
      try {
        return JSON.parse(savedChat);
      } catch (e) {
        console.error("Failed to parse chatbot history", e);
      }
    }
    return [welcomeMessage];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);


  // Save history to localStorage
  const saveHistory = (newMessages: Message[]) => {
    setMessages(newMessages);
    localStorage.setItem('igen_chatbot_history', JSON.stringify(newMessages));
  };

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 100);
    }
  }, [messages, isOpen, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

    if (!textToSend) {
      setInput('');
    }

    const updatedUserMessages: Message[] = [...messages, { role: 'user', content: text }];
    saveHistory(updatedUserMessages);
    setIsLoading(true);

    try {
      // Filter out system and format properly for API
      const apiMessages = updatedUserMessages
        .filter(msg => msg.role === 'user' || msg.role === 'assistant')
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));

      const res = await apiFetch('/chatbot/chat', {
        method: 'POST',
        body: JSON.stringify({ messages: apiMessages })
      });

      if (res.success && res.reply) {
        saveHistory([...updatedUserMessages, { role: 'assistant', content: res.reply }]);
      } else {
        throw new Error(res.error || "Không nhận được phản hồi từ trợ lý ảo.");
      }
    } catch (error) {
      console.error("Chatbot Error:", error);
      toast.error(error instanceof Error ? error.message : "Đã xảy ra lỗi khi kết nối với AI.");
      // Keep message list intact, user can retry
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    setShowConfirmClear(true);
  };

  const quickSuggestions = [
    "Hồ sơ đăng ký học lái xe gồm những gì?",
    "Quy trình thi bằng lái xe B2?",
    "Lệ phí thi tốt nghiệp và sát hạch thế nào?",
  ];

  // Helper to parse basic markdown format (bold, bullet points, line breaks)
  const renderMessageContent = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('* ') || line.trim().startsWith('• ');
      const content = isBullet ? line.trim().substring(2) : line;

      // Parse bold elements **text**
      const parts = content.split(/(\*\*.*?\*\*)/g);
      const parsedLine = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={pIdx} className="font-extrabold text-slate-900">{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      if (isBullet) {
        return (
          <div key={idx} className="flex items-start gap-2 my-1 pl-1">
            <span className="text-cyan-500 mt-1.5 shrink-0 select-none">•</span>
            <span className="text-slate-700 leading-relaxed text-xs sm:text-sm">{parsedLine}</span>
          </div>
        );
      }

      // Empty line to margin
      if (!line.trim()) {
        return <div key={idx} className="h-2" />;
      }

      return (
        <p key={idx} className="my-1 text-slate-700 leading-relaxed text-xs sm:text-sm">
          {parsedLine}
        </p>
      );
    });
  };

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-[60]">
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative w-14 h-14 bg-gradient-to-tr from-brand-primary to-cyan-600 hover:from-cyan-600 hover:to-brand-primary text-white rounded-full shadow-lg shadow-cyan-500/25 flex items-center justify-center cursor-pointer border border-white/10"
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -45, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 45, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X className="w-6 h-6" />
              </motion.div>
            ) : (
              <motion.div
                key="chat"
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.7, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="relative"
              >
                <Bot className="w-6 h-6" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-cyan-600 animate-pulse" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 250 }}
            className="fixed bottom-24 right-6 w-96 h-[550px] max-h-[calc(100vh-8rem)] max-w-[calc(100vw-2rem)] bg-white/95 backdrop-blur-md rounded-[2rem] border border-slate-100/50 shadow-2xl flex flex-col z-[60] overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-brand-primary via-cyan-600 to-cyan-700 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center shadow-inner">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-black tracking-tight flex items-center gap-1.5">
                    Trợ lý ảo AI
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  </h4>
                  <p className="text-[10px] text-cyan-100 font-bold tracking-wide uppercase flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    Trực tuyến
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {messages.length > 1 && (
                  <button
                    onClick={handleClearHistory}
                    className="p-2 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                    title="Làm mới lịch sử chat"
                  >
                    <Trash2 className="w-4 h-4 text-cyan-100 hover:text-white" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4 text-cyan-100 hover:text-white" />
                </button>
              </div>
            </div>

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50 no-scrollbar">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-2.5 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    {msg.role !== 'user' && (
                      <div className="w-7 h-7 rounded-lg bg-cyan-50 border border-cyan-100 flex items-center justify-center shrink-0 mt-1 shadow-sm">
                        <Bot className="w-4 h-4 text-cyan-600" />
                      </div>
                    )}
                    <div
                      className={`px-4 py-3 rounded-2xl text-slate-800 shadow-sm ${msg.role === 'user'
                        ? 'bg-cyan-600 text-white rounded-br-none font-medium'
                        : 'bg-white rounded-bl-none border border-slate-100'
                        }`}
                    >
                      {msg.role === 'user' ? (
                        <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        renderMessageContent(msg.content)
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex gap-2.5 max-w-[85%]">
                    <div className="w-7 h-7 rounded-lg bg-cyan-50 border border-cyan-100 flex items-center justify-center shrink-0 mt-1 shadow-sm">
                      <Bot className="w-4 h-4 text-cyan-600" />
                    </div>
                    <div className="px-4 py-3 rounded-2xl rounded-bl-none bg-white border border-slate-100 flex items-center gap-1.5 shadow-sm min-h-[38px]">
                      <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" />
                    </div>
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {messages.length === 1 && !isLoading && (
                <div className="pt-2 space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Gợi ý câu hỏi:</p>
                  <div className="space-y-1.5">
                    {quickSuggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(suggestion)}
                        className="w-full text-left px-4 py-2.5 bg-white hover:bg-cyan-50/30 text-xs font-bold text-slate-600 hover:text-cyan-600 rounded-xl border border-slate-100 hover:border-cyan-100 transition-all cursor-pointer shadow-sm active:scale-[0.99]"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Footer */}
            <div className="p-4 bg-white border-t border-slate-100/80 shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Hỏi trợ lý ảo..."
                  disabled={isLoading}
                  className="flex-1 h-11 bg-slate-50 border border-slate-200 focus:border-cyan-500 px-4 rounded-xl text-xs sm:text-sm font-medium outline-none focus:ring-4 focus:ring-cyan-500/5 transition-all text-slate-800 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="w-11 h-11 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-cyan-500/10 active:scale-95 cursor-pointer shrink-0"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <SendHorizontal className="w-4 h-4" />
                  )}
                </button>
              </form>

            </div>

            {/* Custom Confirmation Dialog */}
            <AnimatePresence>
              {showConfirmClear && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6"
                >
                  <motion.div
                    initial={{ scale: 0.9, y: 10 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 10 }}
                    className="bg-white rounded-3xl p-6 shadow-2xl max-w-xs w-full text-center space-y-4 border border-slate-100/50"
                  >
                    <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 mx-auto">
                      <Trash2 className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-slate-800">Xóa lịch sử chat?</h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Hành động này sẽ xóa toàn bộ nội dung trò chuyện hiện tại và không thể hoàn tác.
                      </p>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowConfirmClear(false)}
                        className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer border border-slate-200/20"
                      >
                        Hủy
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          saveHistory([welcomeMessage]);
                          toast.success("Đã làm mới lịch sử trò chuyện!");
                          setShowConfirmClear(false);
                        }}
                        className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-500/10 transition-all active:scale-95 cursor-pointer"
                      >
                        Xóa
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
