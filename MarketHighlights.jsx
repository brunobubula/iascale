import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Flame } from "lucide-react";
import { motion } from "framer-motion";
import { useCryptoPrice } from "./trades/useCryptoPrice";

export default function MarketHighlights({ hideExchangeNames = true }) {
  const [selectedExchange, setSelectedExchange] = useState("all");

  const { data: pairs = [], isLoading } = useQuery({
    queryKey: ['tradablePairs'],
    queryFn: () => base44.entities.TradablePair.filter({ is_active: true }),
    refetchInterval: 5000, // Atualizar a cada 5 segundos
    staleTime: 0, // Sempre buscar dados frescos
  });

  const filteredPairs = selectedExchange === "all" 
    ? pairs 
    : pairs.filter(p => p.exchange === selectedExchange);

  const topGainers = [...filteredPairs]
    .filter(p => (p.price_change_24h || 0) > 0)
    .sort((a, b) => (b.price_change_24h || 0) - (a.price_change_24h || 0))
    .slice(0, 5);

  const topLosers = [...filteredPairs]
    .filter(p => (p.price_change_24h || 0) < 0)
    .sort((a, b) => (a.price_change_24h || 0) - (b.price_change_24h || 0))
    .slice(0, 5);

  const trendingPairs = filteredPairs.filter(p => p.is_trending).slice(0, 5);

  // Buscar preços em tempo real
  const allDisplayedPairs = [...new Set([
    ...topGainers.map(p => p.display_name),
    ...topLosers.map(p => p.display_name),
    ...trendingPairs.map(p => p.display_name)
  ])];
  const realtimePrices = useCryptoPrice(allDisplayedPairs);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const renderPairCard = (pair, index) => {
    const realtimePrice = realtimePrices[pair.display_name];
    const currentPrice = realtimePrice?.price || pair.current_price;
    const priceChange24h = realtimePrice?.change24h || pair.price_change_24h;

    return (
      <motion.div
        key={pair.id}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.1 }}
        className="bg-slate-900/50 rounded-lg p-3 hover:bg-slate-900/70 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold text-sm">{pair.display_name}</span>
              {!hideExchangeNames && (
                <Badge className="bg-slate-700/50 text-slate-300 text-xs">{pair.exchange}</Badge>
              )}
            </div>
            <p className="text-slate-400 text-xs mt-0.5">
              $ {currentPrice?.toFixed(2) || '-'}
            </p>
          </div>
          <div className="text-right">
            <p className={`font-bold text-sm ${
              (priceChange24h || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {(priceChange24h || 0) >= 0 ? '+' : ''}{priceChange24h?.toFixed(2)}%
            </p>
            <p className="text-slate-400 text-xs">
              $ {(pair.volume_24h || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {!hideExchangeNames && (
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setSelectedExchange("all")}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              selectedExchange === "all"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50"
                : "bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:bg-slate-800"
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setSelectedExchange("Binance")}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              selectedExchange === "Binance"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50"
                : "bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:bg-slate-800"
            }`}
          >
            Binance
          </button>
          <button
            onClick={() => setSelectedExchange("Kraken")}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              selectedExchange === "Kraken"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50"
                : "bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:bg-slate-800"
            }`}
          >
            Kraken
          </button>
          <button
            onClick={() => setSelectedExchange("Bybit")}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              selectedExchange === "Bybit"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50"
                : "bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:bg-slate-800"
            }`}
          >
            Bybit
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Gainers */}
        <Card className="bg-gradient-to-br from-emerald-900/20 to-teal-900/20 border-emerald-500/30 p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <h3 className="text-white font-bold">Top Ganhadores 24h</h3>
          </div>

          <div className="space-y-2">
            {topGainers.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-4">Nenhum ganhador hoje</p>
            ) : (
              topGainers.map((pair, index) => renderPairCard(pair, index))
            )}
          </div>
        </Card>

        {/* Top Losers */}
        <Card className="bg-gradient-to-br from-red-900/20 to-orange-900/20 border-red-500/30 p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-red-400" />
            </div>
            <h3 className="text-white font-bold">Top Perdedores 24h</h3>
          </div>

          <div className="space-y-2">
            {topLosers.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-4">Nenhum perdedor hoje</p>
            ) : (
              topLosers.map((pair, index) => renderPairCard(pair, index))
            )}
          </div>
        </Card>

        {/* Trending */}
        <Card className="bg-gradient-to-br from-yellow-900/20 to-orange-900/20 border-yellow-500/30 p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
              <Flame className="w-4 h-4 text-yellow-400" />
            </div>
            <h3 className="text-white font-bold">Em Alta Agora</h3>
          </div>

          <div className="space-y-2">
            {trendingPairs.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-4">Nenhum par em alta</p>
            ) : (
              trendingPairs.map((pair, index) => renderPairCard(pair, index))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}