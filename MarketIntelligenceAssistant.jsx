import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { 
  Sparkles, 
  Send, 
  Loader2, 
  AlertTriangle, 
  Target, 
  Newspaper, 
  Lightbulb, 
  X,
  TrendingUp
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import ReactMarkdown from "react-markdown";

export default function MarketIntelligenceAssistant({ open, onOpenChange }) {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [quickAction, setQuickAction] = useState(null);

  const QUICK_ACTIONS = [
    { 
      id: "market_sentiment", 
      label: "Sentimento do Mercado", 
      icon: TrendingUp,
      prompt: "Analise o sentimento atual do mercado de criptomoedas. Inclua: tendência geral, principais notícias das últimas 24h, e se é momento de compra ou venda. Seja objetivo. MÁXIMO 1000 caracteres."
    },
    { 
      id: "trade_ideas", 
      label: "Ideias de Trade", 
      icon: Lightbulb,
      prompt: "Com base no cenário atual do mercado cripto, sugira 2-3 categorias de moedas (ex: DeFi, Layer 2, Memecoins) e direção geral buy/sell. NÃO sugira pares específicos. Explique brevemente o motivo. Lembre que a iA Trader Scale tem análise muito mais profunda para gerar sinais específicos precisos. MÁXIMO 1000 caracteres."
    },
    { 
      id: "market_scan", 
      label: "Varredura de Mercado", 
      icon: Target,
      prompt: "Faça uma varredura completa do mercado cripto agora. Identifique: 1) Direção predominante (bullish/bearish), 2) Setores em alta/baixa (DeFi, Gaming, etc), 3) Análise técnica geral do Bitcoin. Reforce que esta é uma visão auxiliar e que a iA Trader Scale oferece análise muito mais profunda de pares específicos. MÁXIMO 1000 caracteres."
    },
    { 
      id: "news", 
      label: "Notícias Importantes", 
      icon: Newspaper,
      prompt: "Quais são as 3 notícias mais importantes do mercado cripto nas últimas 24 horas? Foque em eventos que podem impactar preços. MÁXIMO 1000 caracteres."
    }
  ];

  const handleQuickAction = async (action) => {
    setQuickAction(action.id);
    setQuery("");
    await runAnalysis(action.prompt);
  };

  const runAnalysis = async (prompt) => {
    setIsLoading(true);
    setAnalysis(null);

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        add_context_from_internet: true
      });

      const truncated = response.length > 1000 ? response.substring(0, 997) + "..." : response;
      setAnalysis(truncated);
    } catch (error) {
      setAnalysis("❌ Erro ao gerar análise. Tente novamente.");
    } finally {
      setIsLoading(false);
      setQuickAction(null);
    }
  };

  const handleSubmit = async () => {
    if (!query.trim()) return;
    
    const userPrompt = `${query}\n\nIMPORTANTE: 
1. NÃO analise pares específicos de moedas (como BTC/USDT, ETH/USDT) - fale apenas de tendências gerais e setores.
2. NÃO gere sinais de trade ou recomendações de entrada/saída específicas.
3. Reforce que para análises específicas de pares e sinais precisos, o usuário deve usar a iA Trader Scale.
4. MÁXIMO 1000 caracteres na resposta.
Use contexto atual do mercado cripto para responder de forma auxiliar e geral.`;
    
    await runAnalysis(userPrompt);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <motion.div
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center"
              animate={{
                boxShadow: [
                  "0 0 20px rgba(168, 85, 247, 0.4)",
                  "0 0 30px rgba(236, 72, 153, 0.6)",
                  "0 0 20px rgba(168, 85, 247, 0.4)"
                ]
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles className="w-5 h-5 text-white" />
            </motion.div>
            <div>
              <h2 className="text-xl font-black">iA Scale - Análise em Tempo Real</h2>
              <p className="text-slate-400 text-xs font-normal">Consulte a iA Scale antes de operar para um trade ainda mais assertivo</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Quick Actions */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-400" />
              Análises Rápidas
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_ACTIONS.map((action) => (
                <motion.button
                  key={action.id}
                  onClick={() => handleQuickAction(action)}
                  disabled={isLoading}
                  className={`p-3 rounded-lg border transition-all text-left ${
                    quickAction === action.id
                      ? 'bg-purple-500/30 border-purple-500/50'
                      : 'bg-slate-800/30 border-slate-700/50 hover:bg-slate-800/50 hover:border-slate-600/50'
                  } disabled:opacity-50`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <action.icon className="w-4 h-4 text-purple-400" />
                    <span className="text-white font-semibold text-xs">{action.label}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Custom Query */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-2">Ou pergunte algo específico:</h3>
            <div className="flex gap-2">
              <Textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ex: Qual o sentimento geral do mercado? Quais setores estão em alta?"
                className="bg-slate-800/50 border-slate-700 text-white min-h-20 flex-1"
                disabled={isLoading}
              />
              <Button
                onClick={handleSubmit}
                disabled={isLoading || !query.trim()}
                className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white h-auto"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Loading State */}
          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Card className="bg-slate-800/30 border-slate-700/50 p-6">
                  <div className="flex flex-col items-center gap-3">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <Sparkles className="w-8 h-8 text-purple-400" />
                    </motion.div>
                    <p className="text-slate-300 text-sm">Analisando mercado em tempo real...</p>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Analysis Result */}
          <AnimatePresence>
            {analysis && !isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 border-purple-500/30 p-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-purple-400" />
                      <h3 className="text-white font-bold">Análise de Mercado</h3>
                    </div>
                    <button
                      onClick={() => setAnalysis(null)}
                      className="text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="prose prose-sm prose-invert max-w-none">
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="text-slate-300 text-sm leading-relaxed mb-3">{children}</p>,
                        strong: ({ children }) => <strong className="text-white font-bold">{children}</strong>,
                        ul: ({ children }) => <ul className="list-disc pl-5 space-y-1 mb-3">{children}</ul>,
                        li: ({ children }) => <li className="text-slate-300 text-sm">{children}</li>,
                        h1: ({ children }) => <h1 className="text-white font-bold text-lg mb-2">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-white font-bold text-base mb-2">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-white font-semibold text-sm mb-1">{children}</h3>,
                      }}
                    >
                      {analysis}
                    </ReactMarkdown>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-700/50">
                    <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                        <p className="text-purple-300 text-xs leading-relaxed">
                          <strong>Para Sinais Específicos:</strong> Use a <strong>iA Trader Scale</strong> - análise profunda de pares específicos, entrada/TP/SL otimizados, treinamento especializado muito superior.
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}