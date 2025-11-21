
import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { 
  TrendingUp, 
  Plus, 
  LayoutDashboard, 
  Settings, 
  Bell, 
  BellOff, 
  Gift, 
  GraduationCap, 
  Infinity as InfinityIcon, 
  Crown, 
  Sparkles, 
  Zap, 
  LogOut, 
  User, 
  Wallet, 
  DollarSign, 
  Shield, 
  UserPlus, 
  Share2, 
  Building2, 
  Star, 
  ChevronLeft, 
  ChevronRight, 
  BarChart3,
  CheckCircle,
  AlertCircle,
  Calculator,
  ChevronDown,
  FileText
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import TradeAlertMonitor from "@/components/trades/TradeAlertMonitor";
import CreditAuditAlert from "@/components/CreditAuditAlert";
import TopBar from "@/components/TopBar";
import GuestTopBanner from "@/components/GuestTopBanner";
import ProfileCompletionBanner from "@/components/security/ProfileCompletionBanner";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { hasInfinityProAccess } from "@/components/AccessControl";
import PushNotificationManager from "@/components/PushNotificationManager";
import BottomNav from "@/components/BottomNav";
import AIAssistantChat from "@/components/AIAssistantChat";

const navigationItems = [
  {
    title: "Dashboard",
    url: createPageUrl("Dashboard"),
    icon: LayoutDashboard,
  },
  {
    title: "+ Add Crédito",
    url: createPageUrl("AddCredito"),
    icon: Plus,
  },
  {
    title: "Estudos Admin",
    url: createPageUrl("AdminStudies"),
    icon: GraduationCap,
  },
  {
    title: "Análise Preditiva",
    url: createPageUrl("AITrader"),
    icon: Sparkles,
    isPro: true,
  },
  {
    title: "Nova Estratégia",
    url: createPageUrl("AddSignal"),
    icon: TrendingUp,
  },
  {
    title: "Renda 20k",
    url: createPageUrl("Renda20k"),
    icon: DollarSign,
    isInfinityPro: true,
  },
  {
    title: "Análise P/L",
    url: createPageUrl("AnalisePL"),
    icon: BarChart3,
  },
  {
    title: "Relatório Créditos",
    url: createPageUrl("CreditReports"),
    icon: Wallet,
  },
  {
    title: "Admin Master",
    url: createPageUrl("AdminMaster"),
    icon: Shield,
    adminOnly: true,
  },
  {
    title: "Upgrade PRO",
    url: createPageUrl("SejaPRO"),
    icon: Crown,
    hideForInfinityPro: true,
  },
];

const toolsMenuItems = [
  {
    title: "Juros Compostos",
    url: createPageUrl("CompoundCalculator"),
    icon: Calculator,
  },
  {
    title: "Alertas de Pares",
    url: createPageUrl("PairAlerts"),
    icon: Bell,
  },
  {
    title: "Análise Preditiva",
    url: createPageUrl("PredictiveAnalysis"),
    icon: Sparkles,
    isInfinityPro: true,
  },
];

const NotificationBell = ({ user, notificationsEnabled, toggleNotifications }) => {
  const isLight = user?.theme === "light";

  return (
    <button
      onClick={toggleNotifications}
      className={`relative p-2 rounded-xl transition-all duration-200 ${
        isLight ? "text-gray-600 hover:bg-gray-100" : "hover:bg-slate-800/50 text-slate-300"
      }`}
      aria-label={notificationsEnabled ? "Desativar notificações" : "Ativar notificações"}
    >
      {notificationsEnabled ? (
        <Bell className="w-5 h-5 text-emerald-400" />
      ) : (
        <BellOff className="w-5 h-5 text-slate-500" />
      )}
    </button>
  );
};

function LayoutContent({ children, currentPageName, user, notificationsEnabled, toggleNotifications, isAdmin, isProActive, planType }) {
  const { setOpen, open } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();

  const handleMobileNavClick = () => {
    if (window.innerWidth < 768) {
      setTimeout(() => {
        setOpen(false);
      }, 100);
    }
  };

  const handleNavClick = (item) => {
    if (item.title === "Renda 20k" && !isAdmin) {
      const hasAccess = hasInfinityProAccess(user);
      
      if (hasAccess) {
        navigate(item.url);
        handleMobileNavClick();
        return;
      }
      
      navigate(createPageUrl("UpgradeRenda20k"));
      handleMobileNavClick();
      return;
    }
    
    navigate(item.url);
    handleMobileNavClick();
  };

  const { data: trades = [] } = useQuery({
    queryKey: ['trades'],
    queryFn: () => base44.entities.TradeSignal.list("-created_date"),
    initialData: [],
    enabled: !!user,
    refetchInterval: 60000,
  });

  const getPlanStats = (allTrades) => {
    if (!user) return null;

    const hasCredits = (user.account_credit_balance || 0) >= 10;
    const isPro = user.is_pro || false;
    const proExpiration = user.pro_expiration_date ? new Date(user.pro_expiration_date) : null;
    const isProActive = isPro && (!proExpiration || proExpiration > new Date());
    
    let effectivePlan;
    if (isProActive && (planType === 'infinity_pro' || planType === 'enterprise')) {
      effectivePlan = planType;
    } else if (hasCredits) {
      effectivePlan = 'infinity_pro';
    } else {
      effectivePlan = isProActive ? planType : 'free';
    }
    
    const TRADE_LIMITS = {
      free: { total: 10, active: 3 },
      pro: { total: 100, active: 20 },
      pro_plus: { total: 300, active: 50 },
      infinity_pro: { total: -1, active: -1 },
      enterprise: { total: -1, active: -1 }
    };

    const AI_LIMITS = {
      free: 5,
      pro: 30,
      pro_plus: 100,
      infinity_pro: -1,
      enterprise: -1
    };

    let tradeLimits, aiLimit;
    
    if (isProActive && (planType === 'infinity_pro' || planType === 'enterprise')) {
      tradeLimits = TRADE_LIMITS[planType];
      aiLimit = AI_LIMITS[planType];
    } else if (hasCredits && isProActive && planType !== 'infinity_pro' && planType !== 'enterprise') {
      const planLimits = TRADE_LIMITS[planType];
      const aiPlanLimit = AI_LIMITS[planType];
      const dynamicCreditLimit = Math.floor(user.account_credit_balance / 10);
      
      tradeLimits = {
        total: planLimits.total === -1 ? -1 : planLimits.total + dynamicCreditLimit,
        active: planLimits.active === -1 ? -1 : planLimits.active + dynamicCreditLimit
      };
      aiLimit = aiPlanLimit === -1 ? -1 : aiPlanLimit + dynamicCreditLimit;
    } else if (hasCredits && !isProActive) {
      const dynamicLimit = Math.floor(user.account_credit_balance / 10);
      tradeLimits = { total: dynamicLimit, active: dynamicLimit };
      aiLimit = dynamicLimit;
    } else {
      tradeLimits = TRADE_LIMITS[effectivePlan];
      aiLimit = AI_LIMITS[effectivePlan];
    }

    const aiUsed = user.ai_trader_uses_count || 0;
    const totalTradesCount = allTrades?.length || 0;
    const activeTradesCount = allTrades?.filter(t => t.status === "ACTIVE").length || 0;

    return {
      tradeLimits,
      aiLimit,
      aiUsed,
      totalTradesCount,
      activeTradesCount,
      aiRemaining: aiLimit === -1 ? '∞' : Math.max(0, aiLimit - aiUsed),
      expirationDate: user.pro_expiration_date ? new Date(user.pro_expiration_date) : null,
      hasTemporaryProAccess: hasCredits && !isProActive,
      effectivePlan
    };
  };

  const planStats = getPlanStats(trades);
  const isGuest = !user;

  return (
    <>
      <TradeAlertMonitor trades={trades} />
      <CreditAuditAlert />

      <Sidebar 
        className="border-r border-slate-700/30 backdrop-blur-xl"
        style={{ backgroundColor: '#091020' }}
        collapsible="icon"
      >
        <SidebarHeader className="border-b border-slate-600/30 p-6" style={{ backgroundColor: '#091020' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center shadow-lg flex-shrink-0">
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690c0c0bc7d291a071fd4ad2/57f18d4cb_Art-ScaleCriptoiA-LOGO6mini.png" 
                  alt="Scale Cripto"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="group-data-[collapsible=icon]:hidden">
                <h2 className="font-bold text-lg text-white">
                  Scale Cripto
                </h2>
                  <p className="text-xs text-slate-400">
                    iA Geradora de Sinais
                  </p>
              </div>
            </div>
          </SidebarHeader>
        
        <SidebarContent className="p-3" style={{ backgroundColor: '#091020' }}>
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider px-3 py-2 text-slate-500">
              Navegação
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navigationItems.slice(0, 4).map((item) => {
                  if (item.hideForInfinityPro && !isGuest) {
                    const hasCredits = (user?.account_credit_balance || 0) >= 10;
                    const isPro = user?.is_pro || false;
                    const currentPlanType = user?.pro_plan_type || 'free';
                    const proExpiration = user?.pro_expiration_date ? new Date(user.pro_expiration_date) : null;
                    const isProActiveCheck = isPro && (!proExpiration || proExpiration > new Date());

                    if (isAdmin || hasCredits || (isProActiveCheck && currentPlanType === 'infinity_pro')) {
                      return null;
                    }
                  }

                  if (item.adminOnly && !isAdmin) {
                    return null;
                  }

                  const isSejaProPage = item.title === "Upgrade PRO";
                  const isCurrentPage = location.pathname === item.url;

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <div
                          onClick={() => handleNavClick(item)}
                          className={`transition-all duration-200 rounded-xl mb-1 cursor-pointer ${
                            isCurrentPage 
                              ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10 text-emerald-400 border-l-2 border-emerald-500'
                              : 'text-slate-400 hover:bg-slate-800/50'
                          }`}
                        >
                          <div className="flex items-center gap-3 px-4 py-3 w-full">
                            {isSejaProPage ? (
                              <div className="relative">
                                {isCurrentPage ? (
                                  <motion.div
                                    animate={{
                                      filter: [
                                        "drop-shadow(0 0 4px rgba(251,191,36,0.8))",
                                        "drop-shadow(0 0 8px rgba(249,115,22,0.8))",
                                        "drop-shadow(0 0 6px rgba(239,68,68,0.8))",
                                        "drop-shadow(0 0 8px rgba(249,115,22,0.8))",
                                        "drop-shadow(0 0 4px rgba(251,191,36,0.8))",
                                      ]
                                    }}
                                    transition={{
                                      duration: 2,
                                      repeat: Infinity,
                                      ease: "easeInOut"
                                    }}
                                  >
                                    <motion.div
                                      animate={{
                                        color: [
                                          "#fbbf24",
                                          "#f97316", 
                                          "#ef4444",
                                          "#f97316",
                                          "#fbbf24"
                                        ]
                                      }}
                                      transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                      }}
                                    >
                                      <Crown className="w-5 h-5" />
                                    </motion.div>

                                    <motion.div
                                      className="absolute -top-1 -right-1 w-1 h-1 rounded-full bg-orange-500"
                                      animate={{
                                        y: [-2, -6],
                                        x: [0, 2],
                                        opacity: [1, 0],
                                        scale: [0.5, 0]
                                      }}
                                      transition={{
                                        duration: 0.6,
                                        repeat: Infinity,
                                        repeatDelay: 0.2
                                      }}
                                    />
                                    <motion.div
                                      className="absolute -top-1 left-0 w-1 h-1 rounded-full bg-yellow-500"
                                      animate={{
                                        y: [-2, -5],
                                        x: [0, -1],
                                        opacity: [1, 0],
                                        scale: [0.5, 0]
                                      }}
                                      transition={{
                                        duration: 0.5,
                                        repeat: Infinity,
                                        repeatDelay: 0.3
                                      }}
                                    />
                                    <motion.div
                                      className="absolute top-0 right-1 w-1 h-1 rounded-full bg-red-500"
                                      animate={{
                                        y: [-1, -4],
                                        x: [0, 1],
                                        opacity: [1, 0],
                                        scale: [0.5, 0]
                                      }}
                                      transition={{
                                        duration: 0.7,
                                        repeat: Infinity,
                                        repeatDelay: 0.1
                                      }}
                                    />
                                  </motion.div>
                                ) : (
                                  <div
                                    style={{
                                      background: "linear-gradient(to right, #fbbf24, #f97316, #ef4444)",
                                      WebkitBackgroundClip: "text",
                                      WebkitTextFillColor: "transparent",
                                      backgroundClip: "text",
                                      display: "inline-block"
                                    }}
                                  >
                                    <Crown className="w-5 h-5" />
                                  </div>
                                )}
                              </div>
                            ) : (
                              <item.icon className="w-5 h-5" />
                            )}
                            <span className={`font-medium group-data-[collapsible=icon]:hidden ${
                              isSejaProPage
                                ? "bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(251,191,36,0.3)] font-black" 
                                : ""
                            }`}>
                              {item.title}
                            </span>
                          </div>
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}

                <SidebarMenuItem>
                  <div className="px-4 py-2">
                    <div
                      className="flex items-center justify-between cursor-pointer text-slate-400 hover:text-white transition-all"
                      onClick={(e) => {
                        const submenu = e.currentTarget.nextElementSibling;
                        if (submenu) {
                          submenu.classList.toggle('hidden');
                        }
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <Calculator className="w-5 h-5" />
                        <span className="font-medium group-data-[collapsible=icon]:hidden">Ferramentas</span>
                      </div>
                      <ChevronDown className="w-4 h-4 group-data-[collapsible=icon]:hidden" />
                    </div>
                    <div className="hidden mt-2 ml-8 space-y-1 group-data-[collapsible=icon]:hidden">
                      {toolsMenuItems.map((tool) => {
                        const IconComponent = tool.icon;

                        // Verificar se precisa de acesso especial
                        if (tool.isInfinityPro && !isAdmin) {
                          const hasAccess = isProActive && (planType === 'infinity_pro' || planType === 'enterprise');

                          if (!hasAccess) {
                            return (
                              <div
                                key={tool.title}
                                onClick={() => {
                                  navigate(createPageUrl("SejaPRO"));
                                  handleMobileNavClick();
                                }}
                                className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800/50 transition-all cursor-pointer"
                              >
                                <IconComponent className="w-4 h-4" />
                                <span className="text-sm font-medium">{tool.title}</span>
                              </div>
                            );
                          }
                        }

                        return (
                          <div
                            key={tool.title}
                            onClick={() => {
                              navigate(tool.url);
                              handleMobileNavClick();
                            }}
                            className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800/50 transition-all cursor-pointer"
                          >
                            <IconComponent className="w-4 h-4" />
                            <span className="text-sm font-medium">{tool.title}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </SidebarMenuItem>

                {navigationItems.slice(4).map((item) => {
                  if (item.hideForInfinityPro && !isGuest) {
                    const hasCredits = (user?.account_credit_balance || 0) >= 10;
                    const isPro = user?.is_pro || false;
                    const currentPlanType = user?.pro_plan_type || 'free';
                    const proExpiration = user?.pro_expiration_date ? new Date(user.pro_expiration_date) : null;
                    const isProActiveCheck = isPro && (!proExpiration || proExpiration > new Date());
                    
                    if (isAdmin || hasCredits || (isProActiveCheck && currentPlanType === 'infinity_pro')) {
                      return null;
                    }
                  }

                  if (item.adminOnly && !isAdmin) {
                    return null;
                  }

                  const isSejaProPage = item.title === "Upgrade PRO";
                  const isCurrentPage = location.pathname === item.url;

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <div
                          onClick={() => handleNavClick(item)}
                          className={`transition-all duration-200 rounded-xl mb-1 cursor-pointer ${
                            isCurrentPage 
                              ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10 text-emerald-400 border-l-2 border-emerald-500'
                              : 'text-slate-400 hover:bg-slate-800/50'
                          }`}
                        >
                          <div className="flex items-center gap-3 px-4 py-3 w-full">
                            {isSejaProPage ? (
                              <div className="relative">
                                {isCurrentPage ? (
                                  <motion.div
                                    animate={{
                                      filter: [
                                        "drop-shadow(0 0 4px rgba(251,191,36,0.8))",
                                        "drop-shadow(0 0 8px rgba(249,115,22,0.8))",
                                        "drop-shadow(0 0 6px rgba(239,68,68,0.8))",
                                        "drop-shadow(0 0 8px rgba(249,115,22,0.8))",
                                        "drop-shadow(0 0 4px rgba(251,191,36,0.8))",
                                      ]
                                    }}
                                    transition={{
                                      duration: 2,
                                      repeat: Infinity,
                                      ease: "easeInOut"
                                    }}
                                  >
                                    <motion.div
                                      animate={{
                                        color: [
                                          "#fbbf24",
                                          "#f97316", 
                                          "#ef4444",
                                          "#f97316",
                                          "#fbbf24"
                                        ]
                                      }}
                                      transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                      }}
                                    >
                                      <Crown className="w-5 h-5" />
                                    </motion.div>
                                    
                                    <motion.div
                                      className="absolute -top-1 -right-1 w-1 h-1 rounded-full bg-orange-500"
                                      animate={{
                                        y: [-2, -6],
                                        x: [0, 2],
                                        opacity: [1, 0],
                                        scale: [0.5, 0]
                                      }}
                                      transition={{
                                        duration: 0.6,
                                        repeat: Infinity,
                                        repeatDelay: 0.2
                                      }}
                                    />
                                    <motion.div
                                      className="absolute -top-1 left-0 w-1 h-1 rounded-full bg-yellow-500"
                                      animate={{
                                        y: [-2, -5],
                                        x: [0, -1],
                                        opacity: [1, 0],
                                        scale: [0.5, 0]
                                      }}
                                      transition={{
                                        duration: 0.5,
                                        repeat: Infinity,
                                        repeatDelay: 0.3
                                      }}
                                    />
                                    <motion.div
                                      className="absolute top-0 right-1 w-1 h-1 rounded-full bg-red-500"
                                      animate={{
                                        y: [-1, -4],
                                        x: [0, 1],
                                        opacity: [1, 0],
                                        scale: [0.5, 0]
                                      }}
                                      transition={{
                                        duration: 0.7,
                                        repeat: Infinity,
                                        repeatDelay: 0.1
                                      }}
                                    />
                                  </motion.div>
                                ) : (
                                  <div
                                    style={{
                                      background: "linear-gradient(to right, #fbbf24, #f97316, #ef4444)",
                                      WebkitBackgroundClip: "text",
                                      WebkitTextFillColor: "transparent",
                                      backgroundClip: "text",
                                      display: "inline-block"
                                    }}
                                  >
                                    <Crown className="w-5 h-5" />
                                  </div>
                                )}
                              </div>
                            ) : (
                              <item.icon className="w-5 h-5" />
                            )}
                            <span className={`font-medium group-data-[collapsible=icon]:hidden ${
                              isSejaProPage
                                ? "bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(251,191,36,0.3)] font-black" 
                                : ""
                            }`}>
                              {item.title}
                            </span>
                          </div>
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {!isGuest && (
            <>
              <SidebarGroup className="mt-6">
                <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider px-3 py-2 text-slate-500">
                  Minha Conta
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <div className="px-4 py-3 space-y-3">
                    {user && (
                      <>
                        <div className="rounded-xl p-3 border bg-gradient-to-br from-slate-800/90 to-slate-700/90 border-slate-600/40 group-data-[collapsible=icon]:hidden">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden shadow-lg bg-gradient-to-br from-emerald-500 to-teal-600">
                              {user?.profile_picture_url ? (
                                <img 
                                  src={user.profile_picture_url} 
                                  alt="Foto"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <User className="w-5 h-5 text-white" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-sm truncate text-white" title={user.full_name || user.email}>
                                {user.full_name || user.email}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                Trader Ativo
                              </div>
                            </div>
                          </div>

                          {isAdmin ? (
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400/40">
                              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                                <Crown className="w-4 h-4 text-white" />
                              </div>
                              <span className="text-sm font-black text-yellow-400">ADMIN</span>
                            </div>
                          ) : isProActive ? (
                            <>
                              {planType === 'pro' && (
                                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-400/40">
                                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                                    <Zap className="w-4 h-4 text-white" />
                                  </div>
                                  <span className="text-sm font-black text-blue-400">PRO</span>
                                </div>
                              )}

                              {planType === 'pro_plus' && (
                                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/40">
                                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                                    <Star className="w-4 h-4 text-white" />
                                  </div>
                                  <span className="text-sm font-black text-purple-400">PRO+</span>
                                </div>
                              )}

                              {planType === 'infinity_pro' && (
                                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-400/50">
                                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                                    <InfinityIcon className="w-4 h-4 text-white" />
                                  </div>
                                  <span className="text-sm font-black text-emerald-400">INFINITY PRO</span>
                                </div>
                              )}

                              {planType === 'enterprise' && (
                                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-slate-600/20 to-slate-700/20 border border-slate-500/40">
                                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center flex-shrink-0 shadow-lg">
                                    <Building2 className="w-4 h-4 text-white" />
                                  </div>
                                  <span className="text-sm font-black text-slate-300">ENTERPRISE</span>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-600/30">
                              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center flex-shrink-0 shadow-sm">
                                <User className="w-4 h-4 text-slate-400" />
                              </div>
                              <span className="text-sm font-bold text-slate-300">FREE</span>
                            </div>
                          )}
                        </div>

                        {planStats && (
                          <div className="rounded-xl p-3 border bg-gradient-to-br from-slate-800/90 to-slate-900/90 border-slate-600/40 group-data-[collapsible=icon]:hidden">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                                  <span className="text-[10px] font-semibold text-slate-300">
                                    Análise iA
                                  </span>
                                </div>
                                <span className={`font-black text-[11px] ${
                                  planStats.aiLimit === -1 
                                    ? "text-emerald-500" 
                                    : planStats.aiUsed >= planStats.aiLimit 
                                    ? "text-red-500" 
                                    : planStats.aiUsed >= planStats.aiLimit * 0.8
                                    ? "text-yellow-500"
                                    : "text-white"
                                }`}>
                                  {planStats.aiUsed}/{planStats.aiLimit === -1 ? '∞' : planStats.aiLimit}
                                </span>
                              </div>
      
                              <div className="border-t border-slate-600/40"></div>
      
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <BarChart3 className="w-3.5 h-3.5 text-blue-400" />
                                  <span className="text-[10px] font-semibold text-slate-300">
                                    Trades Totais
                                  </span>
                                </div>
                                <span className={`font-black text-[11px] ${
                                  planStats.tradeLimits.total === -1 
                                    ? "text-emerald-500" 
                                    : planStats.totalTradesCount >= planStats.tradeLimits.total
                                    ? "text-red-500"
                                    : planStats.totalTradesCount >= planStats.tradeLimits.total * 0.8
                                    ? "text-yellow-500"
                                    : "text-white"
                                }`}>
                                  {planStats.totalTradesCount}/{planStats.tradeLimits.total === -1 ? '∞' : planStats.tradeLimits.total}
                                </span>
                              </div>
      
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                                  <span className="text-[10px] font-semibold text-slate-300">
                                    Simultâneos
                                  </span>
                                </div>
                                <span className={`font-black text-[11px] ${
                                  planStats.tradeLimits.active === -1 
                                    ? "text-emerald-500" 
                                    : planStats.activeTradesCount >= planStats.tradeLimits.active
                                    ? "text-red-500"
                                    : planStats.activeTradesCount >= planStats.tradeLimits.active * 0.8
                                    ? "text-yellow-500"
                                    : "text-white"
                                }`}>
                                  {planStats.activeTradesCount}/{planStats.tradeLimits.active === -1 ? '∞' : planStats.tradeLimits.active}
                                </span>
                              </div>
      
                              {planStats.expirationDate && isProActive && (
                                <>
                                  <div className="border-t border-slate-600/40"></div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-semibold text-slate-300">
                                      Vence em
                                    </span>
                                    <span className={`font-black text-[11px] ${
                                      (() => {
                                        const now = new Date();
                                        const diff = planStats.expirationDate - now;
                                        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                                        if (days < 0) return 'text-red-500';
                                        if (days <= 7) return 'text-yellow-500';
                                        return 'text-white';
                                      })()
                                    }`}>
                                      {(() => {
                                        const now = new Date();
                                        const diff = planStats.expirationDate - now;
                                        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                                        if (days < 0) return 'Expirado';
                                        if (days === 0) return 'Hoje';
                                        if (days === 1) return '1 dia';
                                        if (days < 30) return `${days} dias`;
                                        const months = Math.floor(days / 30);
                                        if (months === 1) return '1 mês';
                                        return `${months} meses`;
                                      })()}
                                    </span>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </SidebarGroupContent>
              </SidebarGroup>
            </>
          )}

          {isGuest && (
            <SidebarGroup className="mt-6">
              <SidebarGroupContent>
                <div className="px-4 py-3">
                  <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-purple-500/50 rounded-xl p-4 text-center">
                    <Sparkles className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                    <p className="text-white font-bold text-sm mb-2">Visitante</p>
                    <p className="text-slate-400 text-xs mb-3">Cadastre-se grátis para usar todas as funções!</p>
                    <button
                      onClick={() => base44.auth.redirectToLogin()}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-2 px-4 rounded-lg text-xs transition-all"
                    >
                      Cadastrar Grátis
                    </button>
                  </div>
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </SidebarContent>

        <SidebarFooter className="border-t border-slate-600/30 p-4" style={{ backgroundColor: '#091020' }}>
          {isGuest && (
            <button
              onClick={() => base44.auth.redirectToLogin()}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold py-3 px-4 rounded-xl text-sm transition-all shadow-lg group-data-[collapsible=icon]:hidden"
            >
              <UserPlus className="w-4 h-4 inline mr-2" />
              Entrar / Cadastrar
            </button>
          )}
        </SidebarFooter>
      </Sidebar>

      {/* Toggle Button - Desktop Sidebar */}
      <div className="hidden md:block fixed top-1/2 left-0 z-50 transform -translate-y-1/2" style={{ left: open ? '240px' : '48px', transition: 'left 0.2s' }}>
        <button
          onClick={() => setOpen(!open)}
          className="bg-slate-800/90 hover:bg-slate-700/90 text-slate-300 hover:text-white border border-slate-700/50 rounded-r-lg p-2 shadow-lg transition-all"
        >
          {open ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      <main className="flex-1 flex flex-col min-w-0 w-full overflow-x-hidden">
        {isGuest && <GuestTopBanner />}
        {!isGuest && <ProfileCompletionBanner user={user} />}

        {/* Mobile TopBar */}
        <header className={`backdrop-blur-xl border-b ${
          user?.theme === "light" ? "bg-white/30 border-gray-300/50" : "bg-slate-950/30 border-slate-600/30"
        } px-4 sm:px-6 py-3 sm:py-4 md:hidden ${isGuest ? 'top-[63px]' : 'top-0'} z-10`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SidebarTrigger className={`p-2 rounded-xl transition-all duration-200 ${
                user?.theme === "light" ? "text-gray-600 hover:bg-gray-100" : "hover:bg-slate-800/50 text-slate-300"
              }`}>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className="transition-all duration-300"
                >
                  <line x1="4" y1="7" x2="20" y2="7" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="17" x2="20" y2="17" />
                </svg>
              </SidebarTrigger>
              
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690c0c0bc7d291a071fd4ad2/57f18d4cb_Art-ScaleCriptoiA-LOGO6mini.png" 
                alt="Logo"
                className="w-8 h-8"
                style={{ filter: 'brightness(0) invert(1)' }}
              />
              
              <h1 className={`text-lg font-bold ${
                user?.theme === "light" ? "text-gray-900" : "text-white"
              }`}>ScaleCripto</h1>
            </div>

            {!isGuest && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(createPageUrl("AddCredito"))}
                  className={`p-2 rounded-xl transition-all duration-200 ${
                    user?.theme === "light" ? "text-gray-600 hover:bg-gray-100" : "hover:bg-slate-800/50 text-slate-300"
                  }`}
                >
                  <Wallet className="w-5 h-5 text-emerald-400" />
                </button>

                <NotificationBell 
                  user={user} 
                  notificationsEnabled={notificationsEnabled} 
                  toggleNotifications={toggleNotifications} 
                />
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="relative w-10 h-10 rounded-full overflow-hidden hover:opacity-80 transition-all bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                      {user?.profile_picture_url && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 z-10 pointer-events-none">
                          <div className="relative w-full h-full">
                            <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-white rounded-full shadow-sm" />
                            <div className="absolute top-0.5 right-0.5 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[7px] border-t-red-600" />
                          </div>
                        </div>
                      )}
                      
                      {user?.profile_picture_url ? (
                        <img 
                          src={user.profile_picture_url} 
                          alt="Perfil"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-white text-base">🦊</div>
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="bg-slate-800 border-slate-700 min-w-[260px]"
                    align="end"
                  >
                    <div className="px-3 py-3 border-b border-slate-700/50">
                      <div className="font-semibold text-white text-sm mb-0.5">{user?.nickname || user?.full_name || "Usuário"}</div>
                      <div className="text-slate-400 text-xs mb-2">{user?.email}</div>

                      <div className="flex items-center gap-2 bg-slate-900/50 rounded-lg px-2.5 py-2 border border-slate-700/30 mb-2">
                        <img 
                          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690c0c0bc7d291a071fd4ad2/95e02d2cc_Art-ScaleCriptoiA-LOGO8App.png" 
                          alt="C$"
                          className="w-5 h-5 flex-shrink-0"
                        />
                        <div className="flex-1">
                          <div className="text-slate-500 text-[10px]">Créditos</div>
                          <div className="text-white font-bold text-sm">
                            C$ {(user?.account_credit_balance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-[10px]">
                        {user?.profile_completed ? (
                          <>
                            <CheckCircle className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                            <span className="text-emerald-400 font-semibold">Conta Ativa</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3 h-3 text-orange-400 flex-shrink-0" />
                            <span className="text-orange-400 font-semibold">Ativar Conta</span>
                          </>
                        )}
                      </div>

                      <div className="text-slate-500 text-[10px] mt-1">
                        {isAdmin ? "Admin" : isProActive ? `Plano ${planType?.toUpperCase()}` : "Plano FREE"}
                      </div>
                    </div>

                    <DropdownMenuItem
                      onClick={() => navigate(createPageUrl("AddCredito"))}
                      className="text-white hover:bg-slate-700 cursor-pointer py-2.5 px-3"
                    >
                      <Plus className="w-4 h-4 mr-3 text-emerald-400" />
                      <div className="font-semibold text-sm">Add Saldo</div>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator className="bg-slate-700/50" />

                    <DropdownMenuItem
                      onClick={() => {
                        const event = new CustomEvent('openProfitShareCard');
                        window.dispatchEvent(event);
                      }}
                      className="text-white hover:bg-slate-700 cursor-pointer py-2 px-3"
                    >
                      <Share2 className="w-3.5 h-3.5 mr-2 text-purple-400" />
                      <div className="text-xs font-semibold">Compartilhar Lucro</div>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator className="bg-slate-700/50" />

                    <DropdownMenuItem
                      onClick={() => navigate(createPageUrl("MyProfile"))}
                      className="text-white hover:bg-slate-700 cursor-pointer py-2 px-3"
                    >
                      <User className="w-3.5 h-3.5 mr-2 text-blue-400" />
                      <div className="text-xs font-semibold">Meu Perfil</div>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => navigate(createPageUrl("UserSettings"))}
                      className="text-white hover:bg-slate-700 cursor-pointer py-2 px-3"
                    >
                      <Settings className="w-3.5 h-3.5 mr-2 text-slate-400" />
                      <div className="text-xs font-semibold">Preferências</div>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => navigate(createPageUrl("AffiliateProgram"))}
                      className="text-white hover:bg-slate-700 cursor-pointer py-2 px-3"
                    >
                      <Gift className="w-3.5 h-3.5 mr-2 text-pink-400" />
                      <div className="text-xs font-semibold">Afiliados</div>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => navigate(createPageUrl("TermsOfUse"))}
                      className="text-white hover:bg-slate-700 cursor-pointer py-2 px-3"
                    >
                      <FileText className="w-3.5 h-3.5 mr-2 text-blue-400" />
                      <div className="text-xs font-semibold">Termos de Uso</div>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator className="bg-slate-700/50" />

                    <DropdownMenuItem
                      onClick={() => {
                        if (window.confirm("Tem certeza que deseja sair?")) {
                          base44.auth.logout();
                        }
                      }}
                      className="text-slate-500 hover:bg-slate-700/50 cursor-pointer py-2 px-3"
                    >
                      <LogOut className="w-3.5 h-3.5 mr-2 text-slate-500" />
                      <div className="text-xs font-semibold text-slate-500">Sair da Conta</div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </header>

        {!isGuest && <TopBar user={user} isProActive={isProActive} />}

        <div className="flex-1 overflow-x-hidden w-full pb-16 md:pb-0">
          {children}
        </div>

        {/* BottomNav fixo para mobile */}
        <div className="md:hidden">
          <BottomNav />
        </div>
      </main>
    </>
  );
}

export default function Layout({ children, currentPageName }) {
  const queryClient = useQueryClient();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);

  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch (error) {
        return null;
      }
    },
    refetchInterval: 5000,
    staleTime: 0,
  });

  React.useEffect(() => {
    if (user) {
      setNotificationsEnabled(user.notifications_enabled !== false);
      
      const theme = user.theme || "dark";
      document.documentElement.classList.toggle("light", theme === "light");
      
      if (user.notifications_enabled !== false && "Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, [user]);

  const toggleNotifications = async () => {
    const newState = !notificationsEnabled;
    
    if (newState && "Notification" in window && Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        alert("Por favor, permita notificações no seu navegador para receber alertas.");
        return;
      }
    }
    
    setNotificationsEnabled(newState);
    try {
      await base44.auth.updateMe({ notifications_enabled: newState });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    } catch (error) {
      console.error("Erro ao atualizar status de notificação:", error);
      setNotificationsEnabled(!newState); 
      alert("Não foi possível atualizar o status de notificações. Tente novamente.");
    }
  };

  const isAdmin = user?.role === "admin";
  const isPro = user?.is_pro || false;
  const proExpiration = user?.pro_expiration_date ? new Date(user.pro_expiration_date) : null;
  const isProActive = isAdmin || (isPro && (!proExpiration || proExpiration > new Date()));
  const planType = user?.pro_plan_type || 'free';

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <PushNotificationManager user={user} />
      
      <div className={`min-h-screen flex w-full overflow-x-hidden ${
        user?.theme === "light" 
          ? "bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200" 
          : "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"
      }`}>
        <LayoutContent 
          children={children}
          currentPageName={currentPageName}
          user={user}
          notificationsEnabled={notificationsEnabled}
          toggleNotifications={toggleNotifications}
          isAdmin={isAdmin}
          isProActive={isProActive}
          planType={planType}
        />
      </div>

      {/* AI Assistant Chat - only show for logged in users */}
      {user && <AIAssistantChat />}
    </SidebarProvider>
  );
}
