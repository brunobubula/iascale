import React, { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, X, Send, Loader2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

const QUICK_QUESTIONS = [
  "Como funcionam os créditos?",
  "Quais são os planos disponíveis?",
  "Como usar a IA Trader?",
  "Como criar um trade?",
  "O que é o limite de conta?"
];

export default function AIAssistantChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Olá! Sou seu assistente IA. Como posso ajudar com dúvidas sobre o app?"
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessageMutation = useMutation({
    mutationFn: async (message) => {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um assistente do app Scale Cripto. Responda de forma breve e útil sobre:
        
Contexto do App:
- Créditos: Cada R$ 1 = C$ 3 de limite. Créditos não expiram e desbloqueiam recursos ilimitados.
- Planos: PRO (R$ 97/mês, 100 trades, 30 IAs), PRO+ (R$ 197/mês, 300 trades, 100 IAs), INFINITY PRO (R$ 497/mês, ilimitado).
- IA Trader: Gera sinais de trade baseados em análise técnica avançada.
- Trades: Usuários podem criar trades manuais com stop loss e take profit.

Pergunta do usuário: ${message}

Responda de forma simples, direta e amigável em português.`,
        add_context_from_internet: false
      });
      return response;
    },
    onSuccess: (data) => {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: data
      }]);

      // Log interaction for learning
      base44.functions.invoke('logAIInteraction', {
        question: inputMessage,
        answer: data,
        userId: user?.id,
        helpful: null
      }).catch(() => {});
    },
    onError: (error) => {
      toast.error("Erro ao processar mensagem");
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Desculpe, ocorreu um erro. Tente novamente."
      }]);
    }
  });

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage = inputMessage;
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setInputMessage("");
    
    sendMessageMutation.mutate(userMessage);
  };

  const handleQuickQuestion = (question) => {
    setInputMessage(question);
    setTimeout(() => handleSendMessage(), 100);
  };

  const logFeedback = (messageIndex, helpful) => {
    base44.functions.invoke('updateAIFeedback', {
      question: messages[messageIndex - 1]?.content,
      answer: messages[messageIndex]?.content,
      helpful
    }).catch(() => {});
  };

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full shadow-2xl flex items-center justify-center z-50 hover:scale-110 transition-transform"
          >
            <MessageCircle className="w-6 h-6 text-white" />
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full"
            />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 w-96 h-[600px] z-50 shadow-2xl"
          >
            <Card className="bg-slate-900 border-slate-800 h-full flex flex-col overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-sm">Assistente IA</h3>
                    <p className="text-white/80 text-xs">Sempre online</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950">
                {messages.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                        msg.role === "user"
                          ? "bg-purple-500 text-white"
                          : "bg-slate-800 text-slate-200 border border-slate-700"
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                      
                      {msg.role === "assistant" && idx > 0 && (
                        <div className="flex gap-2 mt-2 pt-2 border-t border-slate-700/50">
                          <button
                            onClick={() => logFeedback(idx, true)}
                            className="text-xs text-emerald-400 hover:text-emerald-300"
                          >
                            👍 Útil
                          </button>
                          <button
                            onClick={() => logFeedback(idx, false)}
                            className="text-xs text-red-400 hover:text-red-300"
                          >
                            👎 Não ajudou
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
                
                {sendMessageMutation.isPending && (
                  <div className="flex justify-start">
                    <div className="bg-slate-800 rounded-2xl px-4 py-3 border border-slate-700">
                      <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Questions */}
              {messages.length === 1 && (
                <div className="p-3 bg-slate-900/50 border-t border-slate-800">
                  <p className="text-slate-400 text-xs mb-2">Perguntas rápidas:</p>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_QUESTIONS.slice(0, 3).map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleQuickQuestion(q)}
                        className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded-lg transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="p-4 bg-slate-900 border-t border-slate-800">
                <div className="flex gap-2">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder="Digite sua pergunta..."
                    className="flex-1 bg-slate-800 border-slate-700 text-white"
                    disabled={sendMessageMutation.isPending}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={sendMessageMutation.isPending || !inputMessage.trim()}
                    className="bg-gradient-to-r from-purple-500 to-pink-600"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}