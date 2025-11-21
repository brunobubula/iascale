import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, TrendingUp, TrendingDown, Flame, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function DynamicPairSelector({ value, onChange, showMetrics = true, hideExchangeNames = false }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterExchange, setFilterExchange] = useState("all");
  const [filterPerformance, setFilterPerformance] = useState("all");
  const [isOpen, setIsOpen] = useState(false);

  const { data: pairs = [], isLoading } = useQuery({
    queryKey: ['tradablePairs'],
    queryFn: () => base44.entities.TradablePair.filter({ is_active: true }, '-volume_24h'),
    refetchInterval: 60000,
  });

  const filteredPairs = pairs.filter(pair => {
    const matchesSearch = pair.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         pair.base_asset.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesExchange = filterExchange === "all" || pair.exchange === filterExchange;
    
    let matchesPerformance = true;
    if (filterPerformance === "gainers") {
      matchesPerformance = (pair.price_change_24h || 0) > 5;
    } else if (filterPerformance === "losers") {
      matchesPerformance = (pair.price_change_24h || 0) < -5;
    } else if (filterPerformance === "trending") {
      matchesPerformance = pair.is_trending;
    }
    
    return matchesSearch && matchesExchange && matchesPerformance;
  });

  const handleSelect = (pair) => {
    onChange(pair.display_name);
    setIsOpen(false);
    setSearchQuery("");
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Buscar par de moedas..."
          value={value || searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="pl-10 bg-slate-900/50 border-slate-700 text-white"
        />
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full mt-2 left-0 right-0 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-20 overflow-hidden"
            >
              {/* Filtros */}
              <div className="p-3 border-b border-slate-800 space-y-2">
                {!hideExchangeNames && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFilterExchange("all")}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        filterExchange === "all"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                      }`}
                    >
                      Todas
                    </button>
                    <button
                      onClick={() => setFilterExchange("Kraken")}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        filterExchange === "Kraken"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                      }`}
                    >
                      Kraken
                    </button>
                  </div>
                )}

                {showMetrics && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFilterPerformance("all")}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        filterPerformance === "all"
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                      }`}
                    >
                      Todos
                    </button>
                    <button
                      onClick={() => setFilterPerformance("trending")}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        filterPerformance === "trending"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                      }`}
                    >
                      <Flame className="w-3 h-3 inline mr-1" />
                      Em Alta
                    </button>
                    <button
                      onClick={() => setFilterPerformance("gainers")}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        filterPerformance === "gainers"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                      }`}
                    >
                      +5% 24h
                    </button>
                    <button
                      onClick={() => setFilterPerformance("losers")}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        filterPerformance === "losers"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                      }`}
                    >
                      -5% 24h
                    </button>
                  </div>
                )}
              </div>

              {/* Lista de Pares */}
              <div className="max-h-96 overflow-y-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500"></div>
                  </div>
                ) : filteredPairs.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    Nenhum par encontrado
                  </div>
                ) : (
                  filteredPairs.map((pair) => (
                    <button
                      key={pair.id}
                      onClick={() => handleSelect(pair)}
                      className="w-full flex items-center justify-between p-3 hover:bg-slate-800 transition-colors border-b border-slate-800/50"
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-semibold">{pair.display_name}</span>
                            {pair.is_trending && (
                              <Flame className="w-3 h-3 text-yellow-400" />
                            )}
                          </div>
                          {showMetrics && (
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-slate-400 text-xs">${pair.current_price?.toFixed(2)}</span>
                              {!hideExchangeNames && (
                                <Badge className="bg-slate-700 text-slate-300 text-xs">{pair.exchange}</Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {showMetrics && (
                        <div className="text-right">
                          <div className={`text-sm font-bold ${
                            (pair.price_change_24h || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
                          }`}>
                            {(pair.price_change_24h || 0) >= 0 ? '+' : ''}{pair.price_change_24h?.toFixed(2)}%
                          </div>
                          <div className="text-slate-400 text-xs">
                            ${(pair.volume_24h || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                          </div>
                        </div>
                      )}
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}