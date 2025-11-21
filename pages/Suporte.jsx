import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, MessageSquare, Send, Loader2, Sparkles, ThumbsUp, ThumbsDown, CheckCircle, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { useToast } from "@/components/ui/use-toast";

export default function Suporte() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const sendFeedbackMutation = useMutation({
    mutationFn: async ({ messageId, feedback, wasUseful }) => {
      await base44.entities.AIAssistantLog.create({
        ai_type: 'support',
        user_email: user?.email,
        user_query: messages.find(m => m.id === messageId)?.userMessage || '',
        ai_response: messages.find(m => m.id === messageId)?.content || '',
        feedback_rating: feedback,
        was_useful: wasUseful,
        response_time_ms: messages.find(m => m.id === messageId)?.responseTime || 0
      });
    },
    onSuccess: () => {
      toast({
        title: "✅ Feedback Enviado!",
        description: "Isso ajuda a melhorar a iA Suporte.",
        duration: 3000
      });
    }
  });

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: inputMessage,
      userMessage: inputMessage
    };

    setMessages([...messages, userMsg]);
    setInputMessage("");
    setIsLoading(true);

    const startTime = Date.now();

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é o assistente de suporte da Scale Cripto iA, uma plataforma de trading de criptomoedas.

Dúvida do usuário: ${inputMessage}

Responda de forma clara, objetiva e útil. Se for sobre funcionalidades do app, explique passo a passo.
Se for sobre trading, dê orientações gerais mas lembre que a iA Trader oferece análises específicas.

MÁXIMO 800 caracteres.`,
        add_context_from_internet: false
      });

      const responseTime = Date.now() - startTime;

      const aiMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response,
        responseTime,
        userMessage: inputMessage,
        feedbackGiven: false
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      toast({
        title: "❌ Erro",
        description: "Erro ao processar sua mensagem",
        duration: 3000
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = (messageId, wasUseful) => {
    setMessages(messages.map(m => 
      m.id === messageId ? { ...m, feedbackGiven: true, wasUseful } : m
    ));
    
    sendFeedbackMutation.mutate({
      messageId,
      feedback: wasUseful ? 'positive' : 'negative',
      wasUseful
    });
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("CentralDeAjuda"))}
            className="bg-slate-800/50 border-slate-700 hover:bg-slate-800 text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-blue-400" />
              Suporte com iA
            </h1>
            <p className="text-slate-400 text-sm mt-1">Converse com nossa assistente inteligente</p>
          </div>
        </div>

        <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50 p-6 mb-6 h-[600px] flex flex-col">
          <div className="flex-1 overflow-y-auto mb-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-10 h-10 text-purple-400" />
                </div>
                <h3 className="text-white font-bold text-lg mb-2">Como posso ajudar?</h3>
                <p className="text-slate-400 text-sm">Digite sua dúvida abaixo e receba uma resposta personalizada</p>
              </div>
            ) : (
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.role === 'user' ? (
                      <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-2xl px-4 py-3 max-w-[80%]">
                        <p className="text-white text-sm">{message.content}</p>
                      </div>
                    ) : (
                      <div className="max-w-[85%]">
                        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl px-4 py-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-4 h-4 text-purple-400" />
                            <span className="text-purple-400 font-semibold text-xs">iA Suporte Pro</span>
                          </div>
                          <ReactMarkdown className="text-slate-300 text-sm prose prose-sm prose-invert max-w-none">
                            {message.content}
                          </ReactMarkdown>
                        </div>
                        
                        {!message.feedbackGiven && (
                          <div className="flex items-center gap-2 mt-2 ml-2">
                            <span className="text-slate-500 text-xs">Isso foi útil?</span>
                            <Button
                              onClick={() => handleFeedback(message.id, true)}
                              size="sm"
                              variant="outline"
                              className="bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 h-7 text-xs"
                            >
                              <ThumbsUp className="w-3 h-3 mr-1" />
                              Útil
                            </Button>
                            <Button
                              onClick={() => handleFeedback(message.id, false)}
                              size="sm"
                              variant="outline"
                              className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 h-7 text-xs"
                            >
                              <ThumbsDown className="w-3 h-3 mr-1" />
                              Não útil
                            </Button>
                          </div>
                        )}

                        {message.feedbackGiven && (
                          <div className="flex items-center gap-2 mt-2 ml-2">
                            {message.wasUseful ? (
                              <div className="flex items-center gap-1 text-emerald-400 text-xs">
                                <CheckCircle className="w-3 h-3" />
                                <span>Obrigado pelo feedback!</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-slate-400 text-xs">
                                <XCircle className="w-3 h-3" />
                                <span>Vamos melhorar!</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
            
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                    <span className="text-slate-400 text-sm">iA Suporte Pro está pensando...</span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          <div className="flex gap-2">
            <Textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Digite sua dúvida..."
              className="bg-slate-800/50 border-slate-700 text-white resize-none"
              rows={2}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white h-auto px-6"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}