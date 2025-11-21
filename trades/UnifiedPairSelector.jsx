import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Loader2, Search, Flame, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

// Função para obter logo do ativo com múltiplas fontes de fallback
const getAssetLogos = (baseAsset) => {
  const cleanAsset = baseAsset.replace(/\s+/g, '').toUpperCase();
  const symbol = cleanAsset.toLowerCase();
  
  return [
    // Fonte 1: Cryptocurrency Icons (GitHub CDN - mais confiável)
    `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${symbol}.png`,
    // Fonte 2: CryptoIcons.org
    `https://cryptoicons.org/api/icon/${symbol}/128`,
    // Fonte 3: Coinlore
    `https://www.coinlore.com/img/${symbol}.png`,
  ];
};

// Componente separado para exibir o valor selecionado
function SelectedValue({ value }) {
  const [imageIndex, setImageIndex] = useState(0);
  const [allFailed, setAllFailed] = useState(false);
  
  if (!value) return null;
  
  const baseAsset = value.split('/')[0];
  const logoUrls = getAssetLogos(baseAsset);
  
  const handleImageError = () => {
    if (imageIndex < logoUrls.length - 1) {
      setImageIndex(imageIndex + 1);
    } else {
      setAllFailed(true);
    }
  };
  
  return (
    <div className="flex items-center gap-2">
      {!allFailed ? (
        <img 
          key={imageIndex}
          src={logoUrls[imageIndex]}
          alt={baseAsset}
          className="w-5 h-5 rounded-full object-cover bg-slate-800"
          onError={handleImageError}
          loading="eager"
        />
      ) : (
        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
          <span className="text-white text-[8px] font-bold">{baseAsset[0]}</span>
        </div>
      )}
      <span>{value}</span>
    </div>
  );
}

// Componente para item de par com logo e estrela
function PairItem({ pair, isFavorite, onToggleFavorite }) {
  const baseAsset = pair.base || pair.baseAsset || pair.displayName.split('/')[0];
  const [imageIndex, setImageIndex] = useState(0);
  const [allFailed, setAllFailed] = useState(false);
  
  const logoUrls = getAssetLogos(baseAsset);
  
  const handleImageError = () => {
    if (imageIndex < logoUrls.length - 1) {
      setImageIndex(imageIndex + 1);
    } else {
      setAllFailed(true);
    }
  };

  return (
    <div className="flex items-center justify-between w-full gap-3 pr-2">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {/* Logo do Ativo */}
        {!allFailed ? (
          <img 
            key={imageIndex}
            src={logoUrls[imageIndex]}
            alt={baseAsset}
            className="w-6 h-6 rounded-full flex-shrink-0 object-cover bg-slate-800"
            onError={handleImageError}
            loading="eager"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-[10px] font-bold">{baseAsset[0]}</span>
          </div>
        )}
        
        {/* Nome do Par */}
        <span className="font-medium text-sm">{pair.displayName}</span>
      </div>

      {/* Estrela de Favorito */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggleFavorite(pair.displayName);
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        className="flex-shrink-0 hover:scale-125 transition-transform p-1 -mr-1"
      >
        <Star 
          className={`w-4 h-4 ${
            isFavorite 
              ? 'fill-yellow-400 text-yellow-400' 
              : 'text-slate-600 hover:text-yellow-400'
          }`} 
        />
      </button>
    </div>
  );
}

export default function UnifiedPairSelector({ value, onChange, type = "spot" }) {
  const [activeTab, setActiveTab] = useState(type);
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  // Busca favoritos
  const { data: favorites = [] } = useQuery({
    queryKey: ['favoritePairs'],
    queryFn: () => base44.entities.FavoritePair.list(),
    initialData: [],
  });

  // Busca pares Spot
  const { data: krakenPairsData, isLoading: loadingSpot } = useQuery({
    queryKey: ['krakenTradablePairs'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getKrakenTradablePairs');
      return response.data;
    },
    staleTime: 1000 * 60 * 60,
    retry: 1,
  });

  // Busca pares Futuros
  const { data: krakenFuturesData, isLoading: loadingFutures } = useQuery({
    queryKey: ['krakenFuturesPairs'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getKrakenFuturesPairs');
      return response.data;
    },
    staleTime: 1000 * 60 * 60,
    retry: 1,
  });

  // Mutations para favoritos
  const addFavoriteMutation = useMutation({
    mutationFn: (pair) => base44.entities.FavoritePair.create({ pair }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favoritePairs'] });
    },
  });

  const removeFavoriteMutation = useMutation({
    mutationFn: (id) => base44.entities.FavoritePair.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favoritePairs'] });
    },
  });

  const toggleFavorite = (pairName) => {
    const existingFavorite = favorites.find(f => f.pair === pairName);
    if (existingFavorite) {
      removeFavoriteMutation.mutate(existingFavorite.id);
    } else {
      addFavoriteMutation.mutate(pairName);
    }
  };

  const isFavorite = (pairName) => {
    return favorites.some(f => f.pair === pairName);
  };

  const DEFAULT_PAIRS = [
    { displayName: "BTC/USDT", quote: "USDT", base: "BTC" },
    { displayName: "ETH/USDT", quote: "USDT", base: "ETH" }
  ];

  const groupedSpotPairs = krakenPairsData?.success && krakenPairsData?.groupedPairs
    ? krakenPairsData.groupedPairs
    : { USDT: DEFAULT_PAIRS, USD: [], EUR: [], GBP: [], BTC: [], ETH: [], Others: [] };

  // Processar futuros para formato BTC/USDT
  const processFuturesPairs = (futuresData) => {
    if (!futuresData) return [];
    
    return futuresData.map(pair => ({
      ...pair,
      // Converter para formato padrão: "BTC/USDT"
      displayName: pair.baseAsset ? `${pair.baseAsset}/USDT` : pair.displayName,
      base: pair.baseAsset,
      quote: "USDT"
    }));
  };

  const usdPerpetualsDirect = krakenFuturesData?.success && krakenFuturesData?.usdPerpetualsDirect
    ? processFuturesPairs(krakenFuturesData.usdPerpetualsDirect)
    : [];

  const usdPerpetualsInverse = krakenFuturesData?.success && krakenFuturesData?.usdPerpetualsInverse
    ? processFuturesPairs(krakenFuturesData.usdPerpetualsInverse)
    : [];

  const allSpotPairs = krakenPairsData?.success && krakenPairsData?.pairs
    ? krakenPairsData.pairs
    : DEFAULT_PAIRS;

  const allFuturesPairs = [...usdPerpetualsDirect, ...usdPerpetualsInverse];

  // Lista de pares mais populares (em ordem de prioridade)
  const POPULAR_PAIRS = [
    "BTC/USDT", "ETH/USDT", "BNB/USDT", "SOL/USDT", "XRP/USDT",
    "ADA/USDT", "DOGE/USDT", "MATIC/USDT", "DOT/USDT", "AVAX/USDT",
    "LINK/USDT", "UNI/USDT", "ATOM/USDT", "LTC/USDT", "BCH/USDT",
    "NEAR/USDT", "APT/USDT", "ARB/USDT", "OP/USDT", "SUI/USDT"
  ];

  // Ordena pares por popularidade
  const sortByPopularity = (pairs, popularList) => {
    if (!pairs) return [];
    
    return [...pairs].sort((a, b) => {
      const aIndex = popularList.indexOf(a.displayName);
      const bIndex = popularList.indexOf(b.displayName);
      
      if (aIndex === -1 && bIndex === -1) {
        return a.displayName.localeCompare(b.displayName);
      }
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      
      return aIndex - bIndex;
    });
  };

  // Filtra e ordena pares
  const filterPairs = (pairs, popularList) => {
    if (!pairs) return [];
    
    let filtered = pairs;
    
    if (searchQuery) {
      filtered = pairs.filter(p => 
        p.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.base?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.baseAsset?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return sortByPopularity(filtered, popularList);
  };

  const favoritePairsList = favorites.map(f => {
    const spotPair = allSpotPairs.find(p => p.displayName === f.pair);
    const futuresPair = allFuturesPairs.find(p => p.displayName === f.pair);
    
    return spotPair || futuresPair || { displayName: f.pair, base: f.pair.split('/')[0] };
  });

  // Abre menu ao trocar de aba
  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setSearchQuery("");
    // Abre o menu automaticamente após trocar de aba
    setTimeout(() => setIsOpen(true), 100);
  };

  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-slate-800/50 border border-slate-700/50 p-1 mb-2">
          <TabsTrigger 
            value="favorites"
            className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400 text-xs"
          >
            <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />
            Favoritos
          </TabsTrigger>
          <TabsTrigger 
            value="spot"
            className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 text-xs"
          >
            Spot
          </TabsTrigger>
          <TabsTrigger 
            value="futures"
            className="data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400 text-xs"
          >
            <Flame className="w-3 h-3 mr-1" />
            Futuros
          </TabsTrigger>
        </TabsList>

        {/* Tab Favoritos */}
        <TabsContent value="favorites" className="mt-0">
          <Select value={value} onValueChange={onChange} open={isOpen} onOpenChange={setIsOpen}>
            <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white focus:border-yellow-500">
              <SelectValue>
                <SelectedValue value={value} />
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700 max-h-96">
              {favorites.length === 0 ? (
                <div className="text-center py-6 px-4 text-slate-500 text-sm">
                  <Star className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                  <p>Nenhum favorito ainda</p>
                  <p className="text-xs mt-1">Clique na ⭐ para adicionar</p>
                </div>
              ) : (
                <>
                  <div className="px-2 py-2 border-b border-slate-700 sticky top-0 bg-slate-800 z-10">
                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-[10px]">
                      <Star className="w-3 h-3 mr-1 fill-yellow-400" />
                      {favorites.length} favorito(s)
                    </Badge>
                  </div>
                  {favoritePairsList.map(pair => (
                    <SelectItem key={pair.displayName} value={pair.displayName} className="text-white hover:bg-slate-700/50">
                      <PairItem 
                        pair={pair}
                        isFavorite={true}
                        onToggleFavorite={toggleFavorite}
                      />
                    </SelectItem>
                  ))}
                </>
              )}
            </SelectContent>
          </Select>
        </TabsContent>

        {/* Tab Spot */}
        <TabsContent value="spot" className="mt-0">
          <Select value={value} onValueChange={onChange} open={isOpen} onOpenChange={setIsOpen}>
            <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white focus:border-emerald-500">
              <SelectValue>
                {loadingSpot ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Carregando...
                  </span>
                ) : (
                  <SelectedValue value={value} />
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700 max-h-96">
              {loadingSpot ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                </div>
              ) : (
                <>
                  <div className="px-2 py-2 border-b border-slate-700 sticky top-0 bg-slate-800 z-10">
                    <div className="relative mb-2">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                      <Input
                        type="text"
                        placeholder="Buscar par..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-7 bg-slate-900/50 border-slate-700 text-white text-xs h-8"
                        onKeyDown={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
                      {allSpotPairs.length} pares spot
                    </Badge>
                  </div>

                  {/* USDT - Mais populares primeiro */}
                  {filterPairs(groupedSpotPairs.USDT, POPULAR_PAIRS).length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-emerald-400 uppercase tracking-wide bg-emerald-500/10 sticky top-[72px] z-10">
                        💎 USDT ({groupedSpotPairs.USDT.length})
                      </div>
                      {filterPairs(groupedSpotPairs.USDT, POPULAR_PAIRS).map(pair => (
                        <SelectItem key={pair.displayName} value={pair.displayName} className="text-white hover:bg-slate-700/50">
                          <PairItem 
                            pair={pair}
                            isFavorite={isFavorite(pair.displayName)}
                            onToggleFavorite={toggleFavorite}
                          />
                        </SelectItem>
                      ))}
                    </>
                  )}

                  {/* USD */}
                  {filterPairs(groupedSpotPairs.USD, POPULAR_PAIRS).length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-blue-400 uppercase tracking-wide bg-blue-500/10">
                        💵 USD ({groupedSpotPairs.USD.length})
                      </div>
                      {filterPairs(groupedSpotPairs.USD, POPULAR_PAIRS).map(pair => (
                        <SelectItem key={pair.displayName} value={pair.displayName} className="text-white hover:bg-slate-700/50">
                          <PairItem 
                            pair={pair}
                            isFavorite={isFavorite(pair.displayName)}
                            onToggleFavorite={toggleFavorite}
                          />
                        </SelectItem>
                      ))}
                    </>
                  )}

                  {/* EUR */}
                  {filterPairs(groupedSpotPairs.EUR, POPULAR_PAIRS).length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-yellow-400 uppercase tracking-wide bg-yellow-500/10">
                        💶 EUR ({groupedSpotPairs.EUR.length})
                      </div>
                      {filterPairs(groupedSpotPairs.EUR, POPULAR_PAIRS).map(pair => (
                        <SelectItem key={pair.displayName} value={pair.displayName} className="text-white hover:bg-slate-700/50">
                          <PairItem 
                            pair={pair}
                            isFavorite={isFavorite(pair.displayName)}
                            onToggleFavorite={toggleFavorite}
                          />
                        </SelectItem>
                      ))}
                    </>
                  )}

                  {/* BTC */}
                  {filterPairs(groupedSpotPairs.BTC, POPULAR_PAIRS).length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-orange-400 uppercase tracking-wide bg-orange-500/10">
                        ₿ BTC ({groupedSpotPairs.BTC.length})
                      </div>
                      {filterPairs(groupedSpotPairs.BTC, POPULAR_PAIRS).map(pair => (
                        <SelectItem key={pair.displayName} value={pair.displayName} className="text-white hover:bg-slate-700/50">
                          <PairItem 
                            pair={pair}
                            isFavorite={isFavorite(pair.displayName)}
                            onToggleFavorite={toggleFavorite}
                          />
                        </SelectItem>
                      ))}
                    </>
                  )}

                  {/* ETH */}
                  {filterPairs(groupedSpotPairs.ETH, POPULAR_PAIRS).length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-purple-400 uppercase tracking-wide bg-purple-500/10">
                        ⟠ ETH ({groupedSpotPairs.ETH.length})
                      </div>
                      {filterPairs(groupedSpotPairs.ETH, POPULAR_PAIRS).map(pair => (
                        <SelectItem key={pair.displayName} value={pair.displayName} className="text-white hover:bg-slate-700/50">
                          <PairItem 
                            pair={pair}
                            isFavorite={isFavorite(pair.displayName)}
                            onToggleFavorite={toggleFavorite}
                          />
                        </SelectItem>
                      ))}
                    </>
                  )}

                  {/* GBP */}
                  {filterPairs(groupedSpotPairs.GBP, POPULAR_PAIRS).length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-pink-400 uppercase tracking-wide bg-pink-500/10">
                        💷 GBP ({groupedSpotPairs.GBP.length})
                      </div>
                      {filterPairs(groupedSpotPairs.GBP, POPULAR_PAIRS).map(pair => (
                        <SelectItem key={pair.displayName} value={pair.displayName} className="text-white hover:bg-slate-700/50">
                          <PairItem 
                            pair={pair}
                            isFavorite={isFavorite(pair.displayName)}
                            onToggleFavorite={toggleFavorite}
                          />
                        </SelectItem>
                      ))}
                    </>
                  )}

                  {/* Outros */}
                  {filterPairs(groupedSpotPairs.Others, POPULAR_PAIRS).length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                        Outros ({groupedSpotPairs.Others.length})
                      </div>
                      {filterPairs(groupedSpotPairs.Others, POPULAR_PAIRS).map(pair => (
                        <SelectItem key={pair.displayName} value={pair.displayName} className="text-white hover:bg-slate-700/50">
                          <PairItem 
                            pair={pair}
                            isFavorite={isFavorite(pair.displayName)}
                            onToggleFavorite={toggleFavorite}
                          />
                        </SelectItem>
                      ))}
                    </>
                  )}

                  {searchQuery && !Object.values(groupedSpotPairs).some(pairs => filterPairs(pairs, POPULAR_PAIRS).length > 0) && (
                    <div className="text-center py-4 text-slate-500 text-sm">
                      Nenhum par encontrado
                    </div>
                  )}
                </>
              )}
            </SelectContent>
          </Select>
        </TabsContent>

        {/* Tab Futuros */}
        <TabsContent value="futures" className="mt-0">
          <Select value={value} onValueChange={onChange} open={isOpen} onOpenChange={setIsOpen}>
            <SelectTrigger className="bg-slate-800/50 border-orange-700 text-white focus:border-orange-500">
              <SelectValue>
                {loadingFutures ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Carregando...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Flame className="w-3 h-3 text-orange-400" />
                    <SelectedValue value={value} />
                  </span>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700 max-h-96">
              {loadingFutures ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                </div>
              ) : (
                <>
                  <div className="px-2 py-2 border-b border-slate-700 sticky top-0 bg-slate-800 z-10">
                    <div className="relative mb-2">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                      <Input
                        type="text"
                        placeholder="Buscar futuro..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-7 bg-slate-900/50 border-slate-700 text-white text-xs h-8"
                        onKeyDown={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-[10px]">
                      <Flame className="w-3 h-3 mr-1" />
                      {allFuturesPairs.length} futuros
                    </Badge>
                  </div>

                  {/* Perpétuos USD Diretos - Formato BTC/USDT */}
                  {filterPairs(usdPerpetualsDirect, POPULAR_PAIRS).length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-orange-400 uppercase tracking-wide bg-orange-500/10 sticky top-[72px] z-10">
                        🔥 Perpétuos Diretos ({usdPerpetualsDirect.length})
                      </div>
                      {filterPairs(usdPerpetualsDirect, POPULAR_PAIRS).map(pair => (
                        <SelectItem key={pair.symbol} value={pair.displayName} className="text-white hover:bg-slate-700/50">
                          <PairItem 
                            pair={pair}
                            isFavorite={isFavorite(pair.displayName)}
                            onToggleFavorite={toggleFavorite}
                          />
                        </SelectItem>
                      ))}
                    </>
                  )}

                  {/* Perpétuos USD Inversos */}
                  {filterPairs(usdPerpetualsInverse, POPULAR_PAIRS).length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-red-400 uppercase tracking-wide bg-red-500/10">
                        ⚡ Perpétuos Inversos ({usdPerpetualsInverse.length})
                      </div>
                      {filterPairs(usdPerpetualsInverse, POPULAR_PAIRS).map(pair => (
                        <SelectItem key={pair.symbol} value={pair.displayName} className="text-white hover:bg-slate-700/50">
                          <PairItem 
                            pair={pair}
                            isFavorite={isFavorite(pair.displayName)}
                            onToggleFavorite={toggleFavorite}
                          />
                        </SelectItem>
                      ))}
                    </>
                  )}

                  {searchQuery && 
                   filterPairs(usdPerpetualsDirect, POPULAR_PAIRS).length === 0 && 
                   filterPairs(usdPerpetualsInverse, POPULAR_PAIRS).length === 0 && (
                    <div className="text-center py-4 text-slate-500 text-sm">
                      Nenhum futuro encontrado
                    </div>
                  )}
                </>
              )}
            </SelectContent>
          </Select>
        </TabsContent>
      </Tabs>
    </div>
  );
}