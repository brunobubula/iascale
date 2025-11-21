import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { Brain, Send, Loader2, Sparkles, Users, TrendingUp, Shield, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";

const QUICK_ACTIONS = [
  {
    id: "active_users_today",
    label: "Usuários ativos hoje",
    icon: Users,
    color: "emerald",
    prompt: "Liste todos os usuários que fizeram login ou criaram trades hoje, mostrando nome, email e última atividade."
  },
  {
    id: "top_traders",
    label: "Top 10 traders",
    icon: TrendingUp,
    color: "blue",
    prompt: "Identifique os 10 usuários com melhor performance de trading (maior win rate e P/L positivo), mostrando métricas principais."
  },
  {
    id: "credit_buyers",
    label: "Compradores de crédito",
    icon: Sparkles,
    color: "purple",
    prompt: "Liste usuários que compraram créditos nos últimos 7 dias, ordenados por valor gasto."
  },
  {
    id: "retention_risk",
    label: "Risco de churn",
    icon: Shield,
    color: "yellow",
    prompt: "Identifique usuários com atividade decrescente nas últimas 2 semanas que podem precisar de ações de retenção."
  }
];

export default function AdminAIAssistant() {
  const [query, setQuery] = useState("");
  const [conversation, setConversation] = useState([]);

  const queryMutation = useMutation({
    mutationFn: async (userQuery) => {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um assistente IA especializado em análise de dados de usuários para administradores.

Contexto: Você tem acesso a dados de:
- Usuários (email, nome, role, pro_plan_type, account_credit_balance, is_pro, etc)
- Trades (TradeSignal e FuturesPosition)
- Transações de crédito
- Logs de auditoria
- Sessões de usuário

Pergunta do admin: ${userQuery}

IMPORTANTE: 
1. Seja específico e acionável
2. Forneça números e estatísticas quando possível
3. Sugira próximas ações quando relevante
4. Use formato markdown para melhor legibilidade
5. Se precisar de dados em tempo real, mencione que o admin deve executar consultas específicas

Responda de forma profissional e concisa.`,
        add_context_from_internet: false
      });

      return response;
    },
    onSuccess: (data) => {
      setConversation(prev => [...prev, {
        role: 'assistant',
        content: data,
        timestamp: new Date()
      }]);
    }
  });

  const handleSend = () => {
    if (!query.trim()) return;

    setConversation(prev => [...prev, {
      role: 'user',
      content: query,
      timestamp: new Date()
    }]);

    queryMutation.mutate(query);
    setQuery("");
  };

  const handleQuickAction = (action) => {
    setQuery(action.prompt);
    setConversation(prev => [...prev, {
      role: 'user',
      content: action.prompt,
      timestamp: new Date()
    }]);
    queryMutation.mutate(action.prompt);
  };

  return (
    <Card className="bg-gradient-to-br from-purple-900/50 to-indigo-900/50 border-purple-500/50 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
          <Brain className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-white">Assistente IA Admin</h2>
          <p className="text-purple-300 text-sm">Análise inteligente de dados e automação</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {QUICK_ACTIONS.map(action => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleQuickAction(action)}
              className={`bg-${action.color}-500/10 border border-${action.color}-500/30 rounded-lg p-3 text-left hover:bg-${action.color}-500/20 transition-all`}
            >
              <Icon className={`w-5 h-5 text-${action.color}-400 mb-2`} />
              <div className="text-white text-sm font-semibold">{action.label}</div>
            </motion.button>
          );
        })}
      </div>

      {/* Conversation */}
      <div className="bg-slate-950/50 rounded-xl border border-slate-800/50 p-4 mb-4 max-h-96 overflow-y-auto space-y-3">
        {conversation.length === 0 ? (
          <div className="text-center py-8">
            <Sparkles className="w-12 h-12 text-purple-400 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Faça uma pergunta ou use uma ação rápida</p>
          </div>
        ) : (
          <AnimatePresence>
            {conversation.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`${
                  msg.role === 'user' 
                    ? 'bg-blue-500/20 border-blue-500/30 ml-12' 
                    : 'bg-purple-500/20 border-purple-500/30 mr-12'
                } border rounded-lg p-3`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {msg.role === 'assistant' ? (
                    <Brain className="w-4 h-4 text-purple-400" />
                  ) : (
                    <Users className="w-4 h-4 text-blue-400" />
                  )}
                  <span className="text-xs text-slate-400">
                    {msg.role === 'assistant' ? 'Assistente IA' : 'Você'}
                  </span>
                </div>
                
                {msg.role === 'assistant' ? (
                  <ReactMarkdown className="text-sm text-slate-200 prose prose-sm prose-invert max-w-none">
                    {msg.content}
                  </ReactMarkdown>
                ) : (
                  <p className="text-sm text-white">{msg.content}</p>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <Textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Ex: Mostre usuários que compraram mais de R$ 200 em créditos este mês..."
          className="bg-slate-800/50 border-slate-700 text-white resize-none"
          rows={3}
        />
        <Button
          onClick={handleSend}
          disabled={queryMutation.isPending || !query.trim()}
          className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white px-6"
        >
          {queryMutation.isPending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </Button>
      </div>
    </Card>
  );
}