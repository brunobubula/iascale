import React, { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function PairSelector({ value, onChange }) {
  const [searchQuery, setSearchQuery] = useState("");

  // Busca pares da Kraken Spot
  const { data: krakenPairsData, isLoading } = useQuery({
    queryKey: ['krakenTradablePairs'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getKrakenTradablePairs');
      return response.data;
    },
    staleTime: 1000 * 60 * 60, // Cache por 1 hora
    retry: 1,
  });

  // Pares padrão (fallback)
  const DEFAULT_PAIRS = [
    { displayName: "BTC/USDT", quote: "USDT" },
    { displayName: "ETH/USDT", quote: "USDT" },
    { displayName: "BNB/USDT", quote: "USDT" },
    { displayName: "SOL/USDT", quote: "USDT" },
    { displayName: "ADA/USDT", quote: "USDT" },
    { displayName: "XRP/USDT", quote: "USDT" },
    { displayName: "DOGE/USDT", quote: "USDT" },
    { displayName: "MATIC/USDT", quote: "USDT" },
    { displayName: "DOT/USDT", quote: "USDT" },
    { displayName: "AVAX/USDT", quote: "USDT" }
  ];

  const groupedPairs = krakenPairsData?.success && krakenPairsData?.groupedPairs
    ? krakenPairsData.groupedPairs
    : { USDT: DEFAULT_PAIRS, USD: [], EUR: [], GBP: [], BTC: [], ETH: [], Others: [] };

  const allPairs = krakenPairsData?.success && krakenPairsData?.pairs
    ? krakenPairsData.pairs
    : DEFAULT_PAIRS;

  // Filtra pares baseado na busca
  const filterPairs = (pairs) => {
    if (!searchQuery) return pairs;
    return pairs.filter(p => 
      p.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.base?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const totalPairs = allPairs.length;

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white focus:border-emerald-500">
        <SelectValue>
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" />
              Carregando...
            </span>
          ) : (
            value
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="bg-slate-800 border-slate-700 max-h-96">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
          </div>
        ) : (
          <>
            {/* Campo de Busca */}
            <div className="px-2 py-2 border-b border-slate-700">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Buscar par..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-7 bg-slate-900/50 border-slate-700 text-white text-xs h-8"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div className="flex items-center justify-center gap-1 mt-2">
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
                  {totalPairs} pares disponíveis
                </Badge>
              </div>
            </div>

            {/* Pares USDT (Mais Popular) */}
            {filterPairs(groupedPairs.USDT).length > 0 && (
              <>
                <div className="px-2 py-1.5 text-xs font-semibold text-emerald-400 uppercase tracking-wide flex items-center gap-1">
                  💎 USDT ({groupedPairs.USDT.length})
                </div>
                {filterPairs(groupedPairs.USDT).map(pair => (
                  <SelectItem key={pair.displayName} value={pair.displayName} className="text-white">
                    {pair.displayName}
                  </SelectItem>
                ))}
              </>
            )}

            {/* Pares USD */}
            {filterPairs(groupedPairs.USD).length > 0 && (
              <>
                <div className="px-2 py-1.5 text-xs font-semibold text-blue-400 uppercase tracking-wide flex items-center gap-1">
                  💵 USD ({groupedPairs.USD.length})
                </div>
                {filterPairs(groupedPairs.USD).map(pair => (
                  <SelectItem key={pair.displayName} value={pair.displayName} className="text-white">
                    {pair.displayName}
                  </SelectItem>
                ))}
              </>
            )}

            {/* Pares EUR */}
            {filterPairs(groupedPairs.EUR).length > 0 && (
              <>
                <div className="px-2 py-1.5 text-xs font-semibold text-yellow-400 uppercase tracking-wide flex items-center gap-1">
                  💶 EUR ({groupedPairs.EUR.length})
                </div>
                {filterPairs(groupedPairs.EUR).map(pair => (
                  <SelectItem key={pair.displayName} value={pair.displayName} className="text-white">
                    {pair.displayName}
                  </SelectItem>
                ))}
              </>
            )}

            {/* Pares BTC */}
            {filterPairs(groupedPairs.BTC).length > 0 && (
              <>
                <div className="px-2 py-1.5 text-xs font-semibold text-orange-400 uppercase tracking-wide flex items-center gap-1">
                  ₿ BTC ({groupedPairs.BTC.length})
                </div>
                {filterPairs(groupedPairs.BTC).map(pair => (
                  <SelectItem key={pair.displayName} value={pair.displayName} className="text-white">
                    {pair.displayName}
                  </SelectItem>
                ))}
              </>
            )}

            {/* Pares ETH */}
            {filterPairs(groupedPairs.ETH).length > 0 && (
              <>
                <div className="px-2 py-1.5 text-xs font-semibold text-purple-400 uppercase tracking-wide flex items-center gap-1">
                  ⟠ ETH ({groupedPairs.ETH.length})
                </div>
                {filterPairs(groupedPairs.ETH).map(pair => (
                  <SelectItem key={pair.displayName} value={pair.displayName} className="text-white">
                    {pair.displayName}
                  </SelectItem>
                ))}
              </>
            )}

            {/* Pares GBP */}
            {filterPairs(groupedPairs.GBP).length > 0 && (
              <>
                <div className="px-2 py-1.5 text-xs font-semibold text-pink-400 uppercase tracking-wide flex items-center gap-1">
                  💷 GBP ({groupedPairs.GBP.length})
                </div>
                {filterPairs(groupedPairs.GBP).map(pair => (
                  <SelectItem key={pair.displayName} value={pair.displayName} className="text-white">
                    {pair.displayName}
                  </SelectItem>
                ))}
              </>
            )}

            {/* Outros Pares */}
            {filterPairs(groupedPairs.Others).length > 0 && (
              <>
                <div className="px-2 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Outros ({groupedPairs.Others.length})
                </div>
                {filterPairs(groupedPairs.Others).map(pair => (
                  <SelectItem key={pair.displayName} value={pair.displayName} className="text-white">
                    {pair.displayName}
                  </SelectItem>
                ))}
              </>
            )}

            {/* Nenhum resultado */}
            {searchQuery && !Object.values(groupedPairs).some(pairs => filterPairs(pairs).length > 0) && (
              <div className="text-center py-4 text-slate-500 text-sm">
                Nenhum par encontrado para "{searchQuery}"
              </div>
            )}
          </>
        )}
      </SelectContent>
    </Select>
  );
}