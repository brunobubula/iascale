import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Crown, 
  Sparkles,
  Target,
  ExternalLink,
  Trash2,
  Timer
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function PredictivePairAnalysis({ user }) {
  const [selectedPairs, setSelectedPairs] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [selectedPrediction, setSelectedPrediction] = useState(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Verificar acesso - INFINITY PRO, ENTERPRISE ou ADMIN
  const isAdmin = user?.role === "admin";
  const isPro = user?.is_pro || false;
  const planType = user?.pro_plan_type || 'free';
  const proExpiration = user?.pro_expiration_date ? new Date(user.pro_expiration_date) : null;
  const isProActive = isPro && (!proExpiration || proExpiration > new Date());

  const hasAccess = isAdmin || 
                   (isProActive && (planType === 'infinity_pro' || planType === 'enterprise'));

  const { data: allPredictions = [] } = useQuery({
    queryKey: ['pairPredictions'],
    queryFn: async () => {
      return await base44.entities.PairPrediction.list("-created_date", 50);
    },
    enabled: hasAccess,
    refetchInterval: 60000,
  });

  // Separar previsões ativas (30 min) e expiradas (histórico)
  const predictions = allPredictions.filter(p => {
    if (!p.created_date) return false;
    const createdTime = new Date(p.created_date).getTime();
    const now = Date.now();
    const thirtyMinutes = 30 * 60 * 1000;
    return (now - createdTime) < thirtyMinutes;
  });

  const expiredPredictions = allPredictions.filter(p => {
    if (!p.created_date) return false;
    const createdTime = new Date(p.created_date).getTime();
    const now = Date.now();
    const thirtyMinutes = 30 * 60 * 1000;
    return (now - createdTime) >= thirtyMinutes;
  });

  const { data: aiTrades = [] } = useQuery({
    queryKey: ['aiTrades'],
    queryFn: () => base44.entities.TradeSignal.filter({ from_ai_trader: true }),
    enabled: hasAccess,
    refetchInterval: 60000,
  });

  const { data: allPairs = [] } = useQuery({
    queryKey: ['allTradablePairs'],
    queryFn: () => base44.entities.TradablePair.filter({ is_active: true }),
    enabled: hasAccess,
    refetchInterval: 60000,
  });

  // Calcular pares mais usados na IA Trader
  const getPriorityPairs = () => {
    // Contar frequência de cada par nos trades da IA
    const pairCount = {};
    aiTrades.forEach(trade => {
      const pair = trade.pair;
      pairCount[pair] = (pairCount[pair] || 0) + 1;
    });

    // Ordenar por frequência (mais usados primeiro)
    const sortedAIPairs = Object.entries(pairCount)
      .sort(([, a], [, b]) => b - a)
      .map(([pair]) => pair);

    // Adicionar outros pares ativos que não estão nos trades da IA
    const otherPairs = allPairs
      .map(p => p.display_name)
      .filter(pair => !sortedAIPairs.includes(pair));

    // Combinar: pares da IA primeiro, depois os outros
    return [...sortedAIPairs, ...otherPairs];
  };

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const priorityPairs = getPriorityPairs();
      const pairsToAnalyze = selectedPairs.length > 0 
        ? selectedPairs.map(p => p.replace('/', ''))
        : priorityPairs.slice(0, 15).map(p => p.replace('/', ''));

      const response = await base44.functions.invoke('analyzePairPredictions', {
        pair_symbols: pairsToAnalyze
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pairPredictions'] });
      setSelectedPairs([]);
    }
  });

  const clearPredictionsMutation = useMutation({
    mutationFn: async () => {
      const deletePromises = predictions.map(pred => 
        base44.entities.PairPrediction.delete(pred.id)
      );
      await Promise.all(deletePromises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pairPredictions'] });
      setTimeRemaining(null);
    }
  });

  const handleAnalyze = async () => {
    setAnalyzing(true);
    await analyzeMutation.mutateAsync();
    setAnalyzing(false);
  };

  // Helper functions
  const calculateTimeRemaining = () => {
    if (predictions.length === 0) return null;
    
    const oldestPrediction = predictions.reduce((oldest, pred) => {
      const predDate = new Date(pred.created_date);
      const oldestDate = new Date(oldest.created_date);
      return predDate < oldestDate ? pred : oldest;
    });

    const createdAt = new Date(oldestPrediction.created_date);
    const expiresAt = new Date(createdAt.getTime() + 30 * 60 * 1000);
    const now = new Date();
    const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
    
    return remaining;
  };

  const formatCountdown = (seconds) => {
    if (seconds === null || seconds === 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Timer para atualizar contador e limpar automaticamente
  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining();
      setTimeRemaining(remaining);
      
      // Se o tempo acabou e há previsões, limpar automaticamente
      if (remaining === 0 && predictions.length > 0) {
        clearPredictionsMutation.mutate();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [predictions.length]);

  if (!hasAccess) {
    return (
      <Card className="bg-gradient-to-br from-yellow-900/20 to-orange-900/20 border-yellow-500/30 p-6">
        <div className="text-center">
          <Crown className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
          <h3 className="text-white font-bold text-lg mb-2">Análise Preditiva com IA</h3>
          <p className="text-slate-300 text-sm mb-4">
            Esta funcionalidade exclusiva usa IA para prever movimentos de mercado nas próximas 24h.
          </p>
          <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
            Disponível apenas para INFINITY PRO e ENTERPRISE
          </Badge>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800/50 border-slate-700 p-3 md:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Brain className="w-5 h-5 text-purple-400" />
            <h3 className="text-white font-semibold text-sm md:text-base">Análise Preditiva de Pares</h3>
            <Badge className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/30 text-xs">
              <Crown className="w-3 h-3 mr-1" />
              INFINITY PRO
            </Badge>
            {timeRemaining !== null && timeRemaining > 0 && predictions.length > 0 && (
              <Badge className={`border text-xs font-mono ${
                timeRemaining <= 60 
                  ? 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse'
                  : timeRemaining <= 300
                  ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                  : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
              }`}>
                <Timer className="w-3 h-3 mr-1" />
                {formatCountdown(timeRemaining)}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {predictions.length > 0 && (
              <Button
                onClick={() => {
                  if (confirm(`Deseja limpar ${predictions.length} previsão(ões) ativa(s)?`)) {
                    clearPredictionsMutation.mutate();
                  }
                }}
                disabled={clearPredictionsMutation.isPending}
                variant="outline"
                size="sm"
                className="bg-red-500/10 border-red-500/30 hover:bg-red-500/20 text-red-400 flex-1 sm:flex-none"
              >
                <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4 mr-2" />
                Limpar
              </Button>
            )}
            <Button
              onClick={handleAnalyze}
              disabled={analyzing || analyzeMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700 text-white flex-1 sm:flex-none"
              size="sm"
            >
              <Sparkles className={`w-4 h-4 mr-2 ${analyzing ? 'animate-spin' : ''}`} />
              {analyzing ? 'Analisando...' : 'Analisar'}
            </Button>
          </div>
        </div>

        <p className="text-slate-400 text-sm mb-4">
          A IA analisa volume, variação de preço e tendências para prever movimentos nas próximas 24h.
          <span className="text-purple-400 font-semibold ml-2">
            Previsões são válidas por 30 minutos
          </span>
        </p>
      </Card>

      {predictions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <h3 className="text-white font-semibold text-sm">Previsões Ativas</h3>
            <Badge className="bg-purple-500/20 text-purple-400 text-xs">
              {predictions.length} par{predictions.length > 1 ? 'es' : ''}
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-full">
              {/* Header */}
              <div className="hidden md:grid grid-cols-5 gap-3 px-4 py-2 bg-slate-900/50 rounded-t-lg border border-slate-700/50">
                <div className="text-slate-400 text-xs font-semibold">Par</div>
                <div className="text-slate-400 text-xs font-semibold text-center">Confiança</div>
                <div className="text-slate-400 text-xs font-semibold text-center">Previsão 24h</div>
                <div className="text-slate-400 text-xs font-semibold text-center">Alvo</div>
                <div className="text-slate-400 text-xs font-semibold text-center">Risco</div>
              </div>

              {/* Predictions List */}
              <div className="space-y-1">
                {predictions.map((pred, index) => {
                  const isPredictionBullish = pred.prediction_type === 'bullish';
                  const isPredictionBearish = pred.prediction_type === 'bearish';
                  
                  return (
                    <motion.div
                      key={pred.id}
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => setSelectedPrediction(pred)}
                      className={`cursor-pointer transition-all hover:bg-slate-800/50 ${
                        isPredictionBullish 
                          ? 'bg-gradient-to-r from-emerald-900/10 to-transparent border-l-2 border-emerald-500/50' 
                          : isPredictionBearish
                          ? 'bg-gradient-to-r from-red-900/10 to-transparent border-l-2 border-red-500/50'
                          : 'bg-slate-900/20 border-l-2 border-slate-700/50'
                      } rounded-lg border-t border-b border-r border-slate-700/30`}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-2 md:gap-3 px-3 md:px-4 py-2.5 md:py-3">
                        {/* Par */}
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            isPredictionBullish ? 'bg-emerald-400' : isPredictionBearish ? 'bg-red-400' : 'bg-slate-400'
                          }`}></div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-white font-bold text-sm">{pred.pair_display_name}</span>
                            <div className="flex items-center gap-1">
                              <Badge className={`${
                                isPredictionBullish 
                                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                                  : isPredictionBearish
                                  ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                  : 'bg-slate-500/20 text-slate-400 border-slate-500/30'
                              } border text-[10px] px-1.5 py-0 h-4 leading-none`}>
                                {isPredictionBullish ? <TrendingUp className="w-2.5 h-2.5 mr-0.5" /> : isPredictionBearish ? <TrendingDown className="w-2.5 h-2.5 mr-0.5" /> : <Minus className="w-2.5 h-2.5 mr-0.5" />}
                                {pred.prediction_type === 'bullish' ? 'ALTA' : pred.prediction_type === 'bearish' ? 'BAIXA' : 'NEUTRO'}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Confiança */}
                        <div className="flex md:justify-center items-center gap-2 md:gap-0">
                          <span className="text-slate-400 text-xs md:hidden">Confiança:</span>
                          <Badge className={`${
                            pred.confidence_score >= 70 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                            pred.confidence_score >= 50 ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                            'bg-red-500/20 text-red-400 border-red-500/30'
                          } border text-xs px-2 py-1`}>
                            {pred.confidence_score}%
                          </Badge>
                        </div>

                        {/* Previsão 24h */}
                        <div className="flex md:justify-center items-center gap-2 md:gap-0">
                          <span className="text-slate-400 text-xs md:hidden">Previsão:</span>
                          <span className={`font-bold text-sm ${
                            isPredictionBullish ? 'text-emerald-400' : isPredictionBearish ? 'text-red-400' : 'text-slate-400'
                          }`}>
                            {pred.predicted_change_24h >= 0 ? '+' : ''}{pred.predicted_change_24h?.toFixed(2)}%
                          </span>
                        </div>

                        {/* Alvo */}
                        <div className="flex md:justify-center items-center gap-2 md:gap-0">
                          <span className="text-slate-400 text-xs md:hidden">Alvo:</span>
                          <span className="text-white font-semibold text-sm">
                            ${pred.predicted_price_target?.toFixed(8)}
                          </span>
                        </div>

                        {/* Risco */}
                        <div className="flex md:justify-center items-center gap-2 md:gap-0">
                          <span className="text-slate-400 text-xs md:hidden">Risco:</span>
                          <Badge className={`${
                            pred.risk_level === 'low' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                            pred.risk_level === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                            'bg-red-500/20 text-red-400 border-red-500/30'
                          } border text-xs px-2 py-1`}>
                            {pred.risk_level === 'low' ? 'Baixo' : pred.risk_level === 'medium' ? 'Médio' : 'Alto'}
                          </Badge>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>

          <p className="text-slate-400 text-xs text-center mt-3">
            Clique em uma linha para ver detalhes completos e criar trade
          </p>
        </div>
      )}

      {predictions.length === 0 && !analyzing && (
        <Card className="bg-slate-800/30 border-slate-700/50 p-8 text-center">
          <Target className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">
            Nenhuma previsão ativa. Clique em "Analisar Top Pares" para gerar previsões com IA.
          </p>
        </Card>
      )}

      {/* Dialog de Detalhes */}
      <Dialog open={!!selectedPrediction} onOpenChange={() => setSelectedPrediction(null)}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl">
          {selectedPrediction && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${
                    selectedPrediction.prediction_type === 'bullish' 
                      ? 'bg-emerald-500/20' 
                      : selectedPrediction.prediction_type === 'bearish'
                      ? 'bg-red-500/20'
                      : 'bg-slate-700/20'
                  } flex items-center justify-center`}>
                    {selectedPrediction.prediction_type === 'bullish' ? (
                      <TrendingUp className="w-5 h-5 text-emerald-400" />
                    ) : selectedPrediction.prediction_type === 'bearish' ? (
                      <TrendingDown className="w-5 h-5 text-red-400" />
                    ) : (
                      <Minus className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold">{selectedPrediction.pair_display_name}</span>
                      <Badge className={`${
                        selectedPrediction.confidence_score >= 70 ? 'bg-emerald-500/20 text-emerald-400' :
                        selectedPrediction.confidence_score >= 50 ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {selectedPrediction.confidence_score}% de confiança
                      </Badge>
                    </div>
                    <p className="text-slate-400 text-sm mt-1">
                      Análise Preditiva com IA
                    </p>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-slate-800/50 border-slate-700 p-4">
                    <p className="text-slate-400 text-xs mb-1">Previsão 24h</p>
                    <p className={`text-2xl font-bold ${
                      selectedPrediction.prediction_type === 'bullish' ? 'text-emerald-400' :
                      selectedPrediction.prediction_type === 'bearish' ? 'text-red-400' :
                      'text-slate-400'
                    }`}>
                      {selectedPrediction.predicted_change_24h >= 0 ? '+' : ''}
                      {selectedPrediction.predicted_change_24h?.toFixed(2)}%
                    </p>
                  </Card>

                  <Card className="bg-slate-800/50 border-slate-700 p-4">
                    <p className="text-slate-400 text-xs mb-1">Preço Alvo</p>
                    <p className="text-2xl font-bold text-white">
                      ${selectedPrediction.predicted_price_target?.toFixed(8)}
                    </p>
                  </Card>
                </div>

                <Card className="bg-slate-800/50 border-slate-700 p-4">
                  <p className="text-slate-400 text-xs mb-2">Recomendação da IA</p>
                  <p className="text-white leading-relaxed">
                    {selectedPrediction.recommendation}
                  </p>
                </Card>

                {selectedPrediction.analysis_factors && (
                  <Card className="bg-slate-800/50 border-slate-700 p-4">
                    <p className="text-slate-400 text-xs mb-2">Fatores Analisados</p>
                    <div className="space-y-2">
                      {Object.entries(selectedPrediction.analysis_factors).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-slate-300 text-sm capitalize">
                            {key.replace(/_/g, ' ')}
                          </span>
                          <span className="text-white font-semibold text-sm">
                            {typeof value === 'number' ? value.toFixed(2) : value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                <div className="flex items-center justify-between">
                  <Badge className={`${
                    selectedPrediction.risk_level === 'low' ? 'bg-green-500/20 text-green-400' :
                    selectedPrediction.risk_level === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    Risco {selectedPrediction.risk_level === 'low' ? 'Baixo' : 
                           selectedPrediction.risk_level === 'medium' ? 'Médio' : 'Alto'}
                  </Badge>
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedPrediction(null)}
                  className="bg-slate-800/50 border-slate-700 hover:bg-slate-800 text-white"
                >
                  Fechar
                </Button>
                <Button
                  onClick={() => {
                    const pairSymbol = selectedPrediction.pair_symbol || selectedPrediction.pair_display_name;
                    navigate(`${createPageUrl("AITrader")}?selectedPair=${encodeURIComponent(pairSymbol)}`);
                  }}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Criar Trade com IA
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Histórico de Previsões Expiradas */}
      {expiredPredictions.length > 0 && (
        <Card className="bg-slate-800/30 border-slate-700/50 p-4 mt-8">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-4 h-4 text-slate-500" />
            <h3 className="text-slate-300 font-semibold text-sm">Histórico de Previsões</h3>
            <Badge className="bg-slate-700/50 text-slate-400 text-xs">
              {expiredPredictions.length} previsão{expiredPredictions.length > 1 ? 'ões' : ''} expirada{expiredPredictions.length > 1 ? 's' : ''}
            </Badge>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {expiredPredictions.map((pred) => {
              const isPredictionBullish = pred.prediction_type === 'bullish';
              const isPredictionBearish = pred.prediction_type === 'bearish';
              
              return (
                <div
                  key={pred.id}
                  className="bg-slate-900/30 rounded-lg p-3 border border-slate-700/30"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded ${
                        isPredictionBullish ? 'bg-emerald-500/20' : isPredictionBearish ? 'bg-red-500/20' : 'bg-slate-700/20'
                      } flex items-center justify-center`}>
                        {isPredictionBullish ? (
                          <TrendingUp className="w-3 h-3 text-emerald-400" />
                        ) : isPredictionBearish ? (
                          <TrendingDown className="w-3 h-3 text-red-400" />
                        ) : (
                          <Minus className="w-3 h-3 text-slate-400" />
                        )}
                      </div>
                      <span className="text-slate-300 font-semibold text-sm">{pred.pair_display_name}</span>
                      <Badge className="bg-slate-700/50 text-slate-400 text-[10px]">
                        {pred.confidence_score}%
                      </Badge>
                    </div>
                    <div className="text-right">
                      <span className={`font-bold text-sm ${
                        isPredictionBullish ? 'text-emerald-400' : isPredictionBearish ? 'text-red-400' : 'text-slate-400'
                      }`}>
                        {pred.predicted_change_24h >= 0 ? '+' : ''}{pred.predicted_change_24h?.toFixed(2)}%
                      </span>
                      <p className="text-slate-500 text-[10px] mt-0.5">
                        Alvo: ${pred.predicted_price_target?.toFixed(8)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}