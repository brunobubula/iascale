import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import GlobalSearch from "./GlobalSearch";
import { 
  HelpCircle, 
  Plus, 
  Edit3, 
  Sparkles, 
  Crown, 
  DollarSign, 
  Wallet, 
  LifeBuoy, 
  Target, 
  TrendingUp, 
  Zap, 
  PieChart, 
  Home, 
  ArrowUpRight, 
  ArrowDownRight, 
  User, 
  Settings, 
  Gift, 
  ChevronDown, 
  Share2, 
  Eye, 
  EyeOff, 
  LogOut, 
  BarChart3,
  CheckCircle,
  AlertCircle,
  Search,
  Calculator
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { useSingleCryptoPrice, useCryptoPrice } from "../components/trades/useCryptoPrice";
import AccountProfitShareCard from "./AccountProfitShareCard";
import NotificationBell from "@/components/NotificationBell";
import MarketIntelligenceAssistant from "./MarketIntelligenceAssistant"; // Added import for MarketIntelligenceAssistant

export default function TopBar({ user, isProActive }) {
  const navigate = useNavigate();
  const showUpgradeButton = !isProActive;
  const [showProfitShareCard, setShowProfitShareCard] = useState(false);
  const [hideBalance, setHideBalance] = useState(false);
  const [showMarketAssistant, setShowMarketAssistant] = useState(false);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);

  React.useEffect(() => {
    const handleOpenProfitShareCard = () => {
      setShowProfitShareCard(true);
    };

    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowGlobalSearch(true);
      }
    };

    window.addEventListener('openProfitShareCard', handleOpenProfitShareCard);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('openProfitShareCard', handleOpenProfitShareCard);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch (error) {
        return user;
      }
    },
    refetchInterval: 3000,
    staleTime: 0,
    initialData: user
  });

  const { data: trades } = useQuery({
    queryKey: ['trades'],
    queryFn: () => base44.entities.TradeSignal.list("-created_date"),
    initialData: [],
    refetchInterval: 60000
  });

  const btcPriceData = useSingleCryptoPrice("BTC/USDT");
  const btcPrice = btcPriceData?.price;
  const btcChange24h = btcPriceData?.change24h || 0;

  const activeTrades = trades.filter((t) => t.status === "ACTIVE");
  const activePairs = [...new Set(activeTrades.map((t) => t.pair))];

  const realtimePrices = useCryptoPrice(activePairs);

  const calculateOpenPL = () => {
    let totalPLUSD = 0;
    let totalPercentage = 0;
    let count = 0;

    activeTrades.forEach((trade) => {
      const isBuy = trade.type === "BUY";
      const leverage = trade.leverage || 1;
      const entryAmount = trade.entry_amount || 0;
      const totalOperatedValue = entryAmount * leverage;
      const entry = trade.entry_price || 0;

      const realtimePrice = realtimePrices[trade.pair]?.price;
      const current = realtimePrice || trade.current_price || trade.entry_price || 0;

      if (entry !== 0) {
        let profitLoss = 0;
        if (isBuy) {
          profitLoss = (current - entry) / entry * 100;
        } else {
          profitLoss = (entry - current) / entry * 100;
        }

        const profitLossUSD = profitLoss / 100 * totalOperatedValue;
        totalPLUSD += profitLossUSD;
        totalPercentage += profitLoss;
        count++;
      }
    });

    const avgPercentage = count > 0 ? totalPercentage / count : 0;

    return { totalPLUSD, avgPercentage };
  };

  const openPLData = calculateOpenPL();

  const isAdmin = currentUser?.role === "admin";
  const isPro = currentUser?.is_pro || false;
  const planType = currentUser?.pro_plan_type || 'free';
  const proExpiration = currentUser?.pro_expiration_date ? new Date(currentUser.pro_expiration_date) : null;
  const isProActiveCheck = isPro && (!proExpiration || proExpiration > new Date());
  const isInfinityPro = isAdmin || isProActiveCheck && planType === 'infinity_pro';

  const creditBalance = currentUser?.account_credit_balance || 0;

  return (
    <div className="w-full">
      {/* Desktop TopBar */}
      <div className="hidden md:block w-full px-6 py-2 border-b border-slate-700/10 bg-slate-900/10 backdrop-blur-xl sticky top-0 z-20">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="text-slate-400 text-xs font-medium">BTC:</div>
            {btcPrice ?
            <>
                <div className="text-slate-400 text-sm font-bold">
                  ${btcPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className={`flex items-center gap-0.5 ${btcChange24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {btcChange24h >= 0 ?
                <ArrowUpRight className="w-3 h-3" /> :
                <ArrowDownRight className="w-3 h-3" />
                }
                  <span className="text-xs font-bold">
                    {btcChange24h >= 0 ? '+' : ''}{btcChange24h.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                  </span>
                </div>
              </> :
            <div className="text-slate-500 text-xs">Carregando...</div>
            }
          </div>

          <div className="w-px h-6 bg-slate-700/30"></div>

          <div className="flex items-center gap-3 ml-auto">
            {/* Busca Global */}
            <button
              onClick={() => setShowGlobalSearch(true)}
              className="px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800/70 text-slate-400 hover:text-white transition-all flex items-center gap-2 text-sm"
            >
              <Search className="w-4 h-4" />
              <span className="hidden lg:inline">Buscar</span>
              <kbd className="hidden lg:inline text-xs bg-slate-700/50 px-1.5 py-0.5 rounded">⌘K</kbd>
            </button>

            {/* Botão Calculadora */}
            <motion.button
              onClick={() => navigate(createPageUrl("CompoundCalculator"))}
              className="relative w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 shadow-lg shadow-indigo-500/50 overflow-hidden group"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              title="Calculadora de Juros Compostos"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-indigo-400/50 via-purple-400/50 to-indigo-600/50"
                animate={{
                  rotate: [0, 360]
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0.8, 0.5]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="w-full h-full rounded-full bg-gradient-to-br from-white/30 to-transparent"
                />
              </div>
              <div className="relative z-10 flex items-center justify-center h-full">
                <Calculator className="w-5 h-5 text-white drop-shadow-lg" />
              </div>
            </motion.button>

            {/* Botão iA estilo Siri - 0.4x menor */}
            <motion.button
              onClick={() => setShowMarketAssistant(true)}
              className="relative w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600 shadow-lg shadow-purple-500/50 overflow-hidden group"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-purple-400/50 via-pink-400/50 to-purple-600/50"
                animate={{
                  rotate: [0, 360]
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0.8, 0.5]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="w-full h-full rounded-full bg-gradient-to-br from-white/30 to-transparent"
                />
              </div>
              <div className="relative z-10 flex items-center justify-center h-full">
                <Sparkles className="w-5 h-5 text-white drop-shadow-lg" />
              </div>
            </motion.button>

            <div className="w-px h-6 bg-slate-700/30"></div>

            <Button
              onClick={() => navigate(createPageUrl("CentralDeAjuda"))}
              variant="outline"
              size="sm"
              className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/70 text-white h-9">
              <HelpCircle className="w-4 h-4 mr-2" />
              Suporte
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  className="bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800/70 text-white h-9 font-semibold">
                  <Plus className="w-4 h-4 mr-2" />
                  Sinal
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="bg-slate-800 border-slate-700 min-w-[200px]"
                align="end">
                <DropdownMenuItem
                  onClick={() => navigate(createPageUrl("AddSignal"))}
                  className="text-white hover:bg-slate-700 cursor-pointer py-3 px-4">
                  <Edit3 className="w-4 h-4 mr-3 text-emerald-400" />
                  <div>
                    <div className="font-semibold">Sinal Manual</div>
                    <div className="text-xs text-slate-400">Criar trade manualmente</div>
                  </div>
                </DropdownMenuItem>
                
                <DropdownMenuItem
                  onClick={() => navigate(createPageUrl("AITrader"))}
                  className="text-white hover:bg-slate-700 cursor-pointer py-3 px-4">
                  <Sparkles className="w-3.5 h-3.5 mr-3 text-purple-400" />
                  <div>
                    <div className="font-semibold">Sinal iA</div>
                    <div className="text-xs text-slate-400">Gerar com inteligência artificial</div>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              onClick={() => navigate(createPageUrl("UpgradeRenda20k"))}
              size="sm"
              className="bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800/70 text-white h-9 font-semibold">
              <DollarSign className="w-4 h-4 mr-2" />
              Renda 20k
            </Button>

            <Button
              onClick={() => navigate(createPageUrl("Portfolio"))}
              variant="outline"
              size="sm"
              className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/70 text-white h-9">
              <Wallet className="w-4 h-4 mr-2" />
              Portfólio
            </Button>

            <Button
              onClick={() => navigate(createPageUrl("AddCredito"))}
              size="sm"
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white h-9 font-bold shadow-lg shadow-emerald-500/30">
              <Plus className="w-4 h-4 mr-2" />
              Add Crédito
            </Button>

            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center overflow-hidden flex-shrink-0">
                <img
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690c0c0bc7d291a071fd4ad2/5369c59b7_Art-ScaleCriptoiA-LOGO8App.png"
                  alt="Scale Coin"
                  className="w-full h-full object-cover" />
              </div>
              <span className="text-slate-300 text-sm font-normal">
                {hideBalance ? "C$ ••••••" : `C$ ${creditBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </span>
              <button
                onClick={() => setHideBalance(!hideBalance)}
                className="text-slate-400 hover:text-slate-300 transition-colors ml-1">
                {hideBalance ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Ícone de Perfil - Header Desktop (Direita) */}
            <div className="flex items-center gap-3">
              <NotificationBell user={user} />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-slate-700/50 hover:border-emerald-500/50 transition-all bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center group">
                    {currentUser?.profile_picture_url &&
                    <div className="absolute -top-1 -right-1 w-5 h-5 z-10 pointer-events-none">
                        <div className="relative w-full h-full">
                          <div className="absolute top-0 right-0 w-2 h-2 bg-white rounded-full shadow-sm" />
                          <div className="absolute top-0.5 right-0.5 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-red-600" />
                        </div>
                      </div>
                    }
                    
                    {currentUser?.profile_picture_url ?
                    <img
                      src={currentUser.profile_picture_url}
                      alt="Perfil"
                      className="w-full h-full object-cover" /> :
                    <div className="text-white text-lg">🦊</div>
                    }
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="bg-slate-800 border-slate-700 min-w-[240px]"
                  align="end">
                  <div className="px-3 py-2.5 border-b border-slate-700/50">
                    <div className="font-semibold text-white text-sm">{currentUser?.nickname || currentUser?.full_name || currentUser?.email}</div>
                    <div className="text-slate-400 text-xs mt-0.5">{currentUser?.email}</div>
                    <div className="text-slate-400 text-xs mt-1">
                      {isAdmin ? "Admin" : isProActive ? `Plano ${planType?.toUpperCase()}` : "Plano FREE"}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      {currentUser?.profile_completed ? (
                        <>
                          <CheckCircle className="w-3 h-3 text-emerald-400" />
                          <span className="text-xs font-semibold text-emerald-400">Conta Ativa</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3 h-3 text-orange-400" />
                          <span className="text-xs font-semibold text-orange-400">Ativar Conta</span>
                        </>
                      )}
                    </div>
                  </div>

                  {!isInfinityPro &&
                  <>
                      <DropdownMenuItem
                      onClick={() => navigate(createPageUrl("SejaPRO"))}
                      className="text-white hover:bg-slate-700 cursor-pointer py-2.5 px-3">
                        <Crown className="w-4 h-4 mr-3 text-yellow-400" />
                        <div>
                          <div className="font-semibold text-sm">Upgrade</div>
                          <div className="text-xs text-slate-400">Desbloqueie recursos PRO</div>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-slate-700/50" />
                    </>
                  }

                  <DropdownMenuItem
                    onClick={() => setShowProfitShareCard(true)}
                    className="text-white hover:bg-slate-700 cursor-pointer py-2 px-3">
                    <Share2 className="w-4 h-4 mr-3 text-purple-400" />
                    <div className="font-semibold text-sm">Compartilhar Lucro</div>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => navigate(createPageUrl("AffiliateProgram"))}
                    className="text-white hover:bg-slate-700 cursor-pointer py-2 px-3">
                    <Gift className="w-4 h-4 mr-3 text-pink-400" />
                    <div className="font-semibold text-sm">Programa de Afiliados</div>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => navigate(createPageUrl("Portfolio"))}
                    className="text-white hover:bg-slate-700 cursor-pointer py-2 px-3">
                    <Wallet className="w-4 h-4 mr-3 text-cyan-400" />
                    <div className="font-semibold text-sm">Meus Ativos</div>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="bg-slate-700/50" />

                  <div className="px-3 py-1.5">
                    <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Conta</div>
                  </div>

                  <DropdownMenuItem
                    onClick={() => navigate(createPageUrl("MyProfile"))}
                    className="text-white hover:bg-slate-700 cursor-pointer py-2 px-3">
                    <User className="w-4 h-4 mr-3 text-blue-400" />
                    <div className="font-semibold text-sm">Meu Perfil</div>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => navigate(createPageUrl("UserSettings"))}
                    className="text-white hover:bg-slate-700 cursor-pointer py-2 px-3">
                    <Settings className="w-4 h-4 mr-3 text-slate-400" />
                    <div className="font-semibold text-sm">Preferências</div>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="bg-slate-700/50" />

                  <DropdownMenuItem
                    onClick={() => navigate(createPageUrl("CentralDeAjuda"))}
                    className="text-white hover:bg-slate-700 cursor-pointer py-2 px-3">
                    <HelpCircle className="w-4 h-4 mr-3 text-blue-500" />
                    <div className="font-semibold text-sm">Ajuda & Suporte</div>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="bg-slate-700/50" />

                  <DropdownMenuItem
                    onClick={() => {
                      if (window.confirm("Tem certeza que deseja sair da conta?")) {
                        base44.auth.logout();
                      }
                    }}
                    className="text-slate-500 hover:bg-slate-700/50 cursor-pointer py-2 px-3">
                    <LogOut className="w-4 h-4 mr-3 text-slate-500" />
                    <div className="font-semibold text-sm text-slate-500">Sair da Conta</div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile TopBar */}
      <div className="md:hidden w-full border-b border-slate-700/10 bg-slate-900/10 backdrop-blur-xl sticky top-[57px] z-20">
        <Card className="bg-transparent border-0 shadow-none">
          <div className="px-4 py-3">
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => navigate(createPageUrl("Dashboard"))}
                className="flex flex-col items-center gap-1.5 flex-shrink-0">
                <div className="w-11 h-11 rounded-full bg-slate-800/80 border border-slate-700/50 hover:bg-slate-700/80 flex items-center justify-center transition-all">
                  <Home className="w-4 h-4 text-emerald-400" />
                </div>
              </button>

              <button
                onClick={() => navigate(createPageUrl("CentralDeAjuda"))}
                className="flex flex-col items-center gap-1.5 flex-shrink-0">
                <div className="w-11 h-11 rounded-full bg-slate-800/80 border border-slate-700/50 hover:bg-slate-700/80 flex items-center justify-center transition-all">
                  <LifeBuoy className="w-4 h-4 text-blue-400" />
                </div>
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex flex-col items-center gap-1.5 flex-shrink-0">
                    <div className="w-11 h-11 rounded-full bg-slate-800/80 border border-slate-700/50 hover:bg-slate-700/80 flex items-center justify-center transition-all">
                      <Target className="w-4 h-4 text-emerald-400" />
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-slate-800 border-slate-700 min-w-[180px]">
                  <DropdownMenuItem
                    onClick={() => navigate(createPageUrl("AddSignal"))}
                    className="text-white hover:bg-slate-700 cursor-pointer py-2 px-3">
                    <Edit3 className="w-3.5 h-3.5 mr-2 text-emerald-400" />
                    <div className="text-xs">Sinal Manual</div>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem
                    onClick={() => navigate(createPageUrl("AITrader"))}
                    className="text-white hover:bg-slate-700 cursor-pointer py-2 px-3">
                    <Sparkles className="w-3.5 h-3.5 mr-2 text-purple-400" />
                    <div className="text-xs">Sinal iA</div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <button
                onClick={() => navigate(createPageUrl("UpgradeRenda20k"))}
                className="flex flex-col items-center gap-1.5 flex-shrink-0">
                <div className="w-11 h-11 rounded-full bg-slate-800/80 border border-slate-700/50 hover:bg-slate-700/80 flex items-center justify-center transition-all">
                  <TrendingUp className="w-4 h-4 text-yellow-400" />
                </div>
              </button>

              <button
                onClick={() => navigate(createPageUrl("Portfolio"))}
                className="flex flex-col items-center gap-1.5 flex-shrink-0">
                <div className="w-11 h-11 rounded-full bg-slate-800/80 border border-slate-700/50 hover:bg-slate-700/80 flex items-center justify-center transition-all">
                  <PieChart className="w-4 h-4 text-cyan-400" />
                </div>
              </button>
            </div>
          </div>
        </Card>
      </div>

      <AccountProfitShareCard
        open={showProfitShareCard}
        onOpenChange={setShowProfitShareCard}
        openPLData={openPLData}
        user={currentUser}
        activeTrades={activeTrades} />

      <MarketIntelligenceAssistant
        open={showMarketAssistant}
        onOpenChange={setShowMarketAssistant}
      />

      <GlobalSearch
        open={showGlobalSearch}
        onOpenChange={setShowGlobalSearch}
      />
    </div>
  );
}