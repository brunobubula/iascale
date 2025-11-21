import React, { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Loader2, Search, Flame } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function FuturesPairSelector({ value, onChange }) {
  const [searchQuery, setSearchQuery] = useState("");

  // Busca futuros da Kraken
  const { data: krakenFuturesData, isLoading } = useQuery({
    queryKey: ['krakenFuturesPairs'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getKrakenFuturesPairs');
      return response.data;
    },
    staleTime: 1000 * 60 * 60, // Cache por 1 hora
    retry: 1,
  });

  // Pares padrão (fallback)
  const DEFAULT_FUTURES = [
    { displayName: "BTC/USD Perpétuo", symbol: "PF_XBTUSD", baseAsset: "BTC", isInverse: false },
    { displayName: "ETH/USD Perpétuo", symbol: "PF_ETHUSD", baseAsset: "ETH", isInverse: false },
  ];

  const usdPerpetualsDirect = krakenFuturesData?.success && krakenFuturesData?.usdPerpetualsDirect
    ? krakenFuturesData.usdPerpetualsDirect
    : DEFAULT_FUTURES;

  const usdPerpetualsInverse = krakenFuturesData?.success && krakenFuturesData?.usdPerpetualsInverse
    ? krakenFuturesData.usdPerpetualsInverse
    : [];

  const usdFixed = krakenFuturesData?.success && krakenFuturesData?.usdFixed
    ? krakenFuturesData.usdFixed
    : [];

  // Filtra futuros baseado na busca
  const filterFutures = (futures) => {
    if (!searchQuery) return futures;
    return futures.filter(f => 
      f.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.baseAsset.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const totalFutures = usdPerpetualsDirect.length + usdPerpetualsInverse.length + usdFixed.length;

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="bg-slate-800/50 border-orange-700 text-white focus:border-orange-500">
        <SelectValue>
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" />
              Carregando...
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <Flame className="w-3 h-3 text-orange-400" />
              {value}
            </span>
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
                  placeholder="Buscar futuro..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-7 bg-slate-900/50 border-slate-700 text-white text-xs h-8"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div className="flex items-center justify-center gap-1 mt-2">
                <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-[10px]">
                  <Flame className="w-3 h-3 mr-1" />
                  {totalFutures} futuros disponíveis
                </Badge>
              </div>
            </div>

            {/* Perpétuos USD Diretos (Mais Populares) */}
            {filterFutures(usdPerpetualsDirect).length > 0 && (
              <>
                <div className="px-2 py-1.5 text-xs font-semibold text-orange-400 uppercase tracking-wide flex items-center gap-1 bg-orange-500/10">
                  🔥 Perpétuos USD - Diretos ({usdPerpetualsDirect.length})
                </div>
                {filterFutures(usdPerpetualsDirect).map(pair => (
                  <SelectItem key={pair.symbol} value={pair.displayName} className="text-white">
                    <div className="flex items-center justify-between w-full gap-2">
                      <span>{pair.displayName}</span>
                      <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-[9px]">
                        {pair.baseAsset}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </>
            )}

            {/* Perpétuos USD Inversos */}
            {filterFutures(usdPerpetualsInverse).length > 0 && (
              <>
                <div className="px-2 py-1.5 text-xs font-semibold text-red-400 uppercase tracking-wide flex items-center gap-1 bg-red-500/10">
                  ⚡ Perpétuos USD - Inversos ({usdPerpetualsInverse.length})
                </div>
                {filterFutures(usdPerpetualsInverse).map(pair => (
                  <SelectItem key={pair.symbol} value={pair.displayName} className="text-white">
                    <div className="flex items-center justify-between w-full gap-2">
                      <span>{pair.displayName}</span>
                      <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[9px]">
                        INV
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </>
            )}

            {/* Futuros com Vencimento */}
            {filterFutures(usdFixed).length > 0 && (
              <>
                <div className="px-2 py-1.5 text-xs font-semibold text-blue-400 uppercase tracking-wide flex items-center gap-1 bg-blue-500/10">
                  📅 Futuros com Vencimento ({usdFixed.length})
                </div>
                {filterFutures(usdFixed).map(pair => (
                  <SelectItem key={pair.symbol} value={pair.displayName} className="text-white">
                    <div className="flex items-center justify-between w-full gap-2">
                      <span className="text-xs">{pair.displayName}</span>
                    </div>
                  </SelectItem>
                ))}
              </>
            )}

            {/* Nenhum resultado */}
            {searchQuery && 
             filterFutures(usdPerpetualsDirect).length === 0 && 
             filterFutures(usdPerpetualsInverse).length === 0 && 
             filterFutures(usdFixed).length === 0 && (
              <div className="text-center py-4 text-slate-500 text-sm">
                Nenhum futuro encontrado para "{searchQuery}"
              </div>
            )}
          </>
        )}
      </SelectContent>
    </Select>
  );
}