import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import { Users, DollarSign, TrendingUp, Gift, CheckCircle2, ExternalLink, ArrowLeft, Sparkles, Zap, Crown, Target, BarChart3, Globe, Shield, Brain, Rocket, TrendingUpDown, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function AffiliateProgram() {
  const navigate = useNavigate();

  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch (error) {
        return null;
      }
    },
  });

  const isGuest = !user;
  const affiliateUrl = user?.affiliate_url || "";

  const mainBenefits = [
    {
      icon: Sparkles,
      iconColor: "from-purple-500 to-pink-600",
      title: "iA Trader Scale",
      subtitle: "Análise Institucional Avançada",
      description: "Sinais gerados por IA com análise multi-timeframe completa: SMC + Fibonacci + Elliott Waves + Wyckoff. Rastreamento de Smart Money, confluências técnicas e padrões harmônicos identificados automaticamente."
    },
    {
      icon: Activity,
      iconColor: "from-emerald-500 to-teal-600",
      title: "Gestão Completa",
      subtitle: "Trades em Tempo Real",
      description: "WebSocket Binance para preços instantâneos, cálculo automático de P/L com alavancagem até 500x, alertas sonoros customizáveis e monitoramento ativo 24 horas por dia, 7 dias por semana."
    },
    {
      icon: BarChart3,
      iconColor: "from-blue-500 to-cyan-600",
      title: "Análise Avançada",
      subtitle: "Performance Profissional",
      description: "Dashboard institucional com Sharpe Ratio, Sortino Ratio, Max Drawdown, ROI detalhado, Win Rate preciso, estatísticas por par e tipo de operação, gráficos interativos de evolução patrimonial."
    },
    {
      icon: Brain,
      iconColor: "from-pink-500 to-rose-600",
      title: "Sentimento de Mercado",
      subtitle: "Análise Fundamentalista IA",
      description: "Sistema de análise fundamentalista automática em tempo real, rastreamento inteligente de notícias e eventos críticos, score de sentimento 0-100, fatores-chave identificados pela inteligência artificial."
    },
    {
      icon: Crown,
      iconColor: "from-yellow-500 to-orange-600",
      title: "Planos Flexíveis",
      subtitle: "Escalabilidade Total",
      description: "FREE (10 trades, 3 ativos), PRO (100 trades, 20 ativos), PRO+ (300 trades, 50 ativos), INFINITY PRO (ilimitado completo + acesso ao exclusivo Curso Renda 20k)."
    },
    {
      icon: Rocket,
      iconColor: "from-teal-500 to-emerald-600",
      title: "Curso Renda 20k",
      subtitle: "Sala VIP Sem Técnicas",
      description: "Exclusivo INFINITY PRO: aprenda a lucrar gerenciando sala de sinais profissionalmente usando apenas a iA Scale, sem precisar de conhecimento técnico avançado em trading ou análise."
    }
  ];

  const irresistibleReasons = [
    { icon: CheckCircle2, text: "Ferramenta completa que substitui múltiplos apps e assinaturas caras" },
    { icon: Zap, text: "IA que aprende e evolui continuamente com cada operação executada" },
    { icon: Shield, text: "Interface profissional que impressiona e gera confiança instantânea" },
    { icon: Gift, text: "Plano FREE generoso permite testar sem compromisso ou cartão" },
    { icon: DollarSign, text: "Curso Renda 20k ensina a monetizar sala VIP do zero ao lucro" },
    { icon: Brain, text: "Análise institucional que traders profissionais e fundos usam" },
    { icon: Globe, text: "Economia de tempo brutal com automação inteligente completa" },
    { icon: Users, text: "Comunidade ativa e suporte dedicado disponível 24 horas" },
    { icon: TrendingUp, text: "Atualizações constantes com novos recursos poderosos mensais" },
    { icon: Target, text: "ROI comprovado por centenas de traders ativos globalmente" }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 pb-24 md:pb-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("Dashboard"))}
            className="bg-slate-800/50 border-slate-700 hover:bg-slate-800 text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl md:text-5xl font-black text-white mb-1">
              Programa de Afiliados
            </h1>
            <p className="text-slate-400 text-base md:text-lg">Lucre compartilhando a iA Scale com traders do mundo todo</p>
          </div>
        </div>

        {/* CTA Principal - Destaque Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <Card className="bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-purple-600/20 border-2 border-purple-500/50 backdrop-blur-xl overflow-hidden shadow-2xl relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-pink-500/10 to-purple-500/5 animate-pulse"></div>
            <div className="p-8 md:p-12 text-center relative z-10">
              <motion.div
                animate={{
                  scale: [1, 1.05, 1],
                  rotate: [0, 3, -3, 0]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="inline-flex items-center justify-center w-24 h-24 md:w-28 md:h-28 rounded-3xl bg-gradient-to-br from-purple-500 to-pink-600 mb-6 shadow-2xl shadow-purple-500/50"
              >
                <Gift className="w-12 h-12 md:w-14 md:h-14 text-white" />
              </motion.div>
              
              <h2 className="text-3xl md:text-5xl font-black text-white mb-4 leading-tight">
                Transforme Indicações em<br />
                <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent">
                  Renda Passiva Vitalícia
                </span>
              </h2>
              
              <p className="text-slate-300 text-lg md:text-xl mb-8 max-w-3xl mx-auto leading-relaxed font-medium">
                {isGuest ? (
                  "Cadastre-se GRÁTIS e solicite sua afiliação para começar a ganhar comissões recorrentes compartilhando a iA Scale TradeMonitor com traders do mundo todo!"
                ) : (
                  "Ganhe comissões vitalícias por cada trader que usar a iA Scale através do seu link exclusivo. Quanto mais você compartilha, mais você lucra mensalmente!"
                )}
              </p>
              
              {isGuest ? (
                 <Button
                    onClick={() => base44.auth.redirectToLogin()}
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-2xl shadow-emerald-500/50 h-14 md:h-16 text-lg md:text-xl font-black px-10 md:px-14"
                  >
                    <Sparkles className="w-6 h-6 mr-2" />
                    Cadastrar Grátis e Começar Agora
                  </Button>
              ) : affiliateUrl ? (
                <a href={affiliateUrl} target="_blank" rel="noopener noreferrer">
                  <Button className="bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 hover:from-purple-600 hover:via-pink-600 hover:to-purple-700 text-white shadow-2xl shadow-purple-500/50 h-14 md:h-16 text-lg md:text-xl font-black px-10 md:px-14">
                    <ExternalLink className="w-6 h-6 mr-2" />
                    Solicitar Afiliação AGORA
                  </Button>
                </a>
              ) : (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 max-w-md mx-auto">
                  <p className="text-yellow-400 text-base font-semibold">
                    Programa em fase final. Em breve disponível!
                  </p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Benefícios Principais - DESTAQUE VISUAL */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Rocket className="w-8 h-8 text-emerald-400" />
            <h2 className="text-3xl md:text-4xl font-black text-white">Recursos Completos da iA Scale</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mainBenefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 backdrop-blur-xl border-slate-700/50 hover:border-slate-600/50 transition-all overflow-hidden shadow-xl h-full group">
                  <div className="p-6 md:p-8">
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br ${benefit.iconColor} flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform`}>
                        <benefit.icon className="w-8 h-8 md:w-10 md:h-10 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl md:text-2xl font-black text-white mb-1 leading-tight">{benefit.title}</h3>
                        <p className="text-base md:text-lg font-bold bg-gradient-to-r from-slate-300 to-slate-400 bg-clip-text text-transparent">{benefit.subtitle}</p>
                      </div>
                    </div>
                    <p className="text-slate-300 text-sm md:text-base leading-relaxed">{benefit.description}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Por que é Irresistível - Lista Destacada */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-8 h-8 text-yellow-400" />
            <h2 className="text-3xl md:text-4xl font-black text-white">Por que a iA Scale é Irresistível?</h2>
          </div>
          <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 backdrop-blur-xl border-slate-700/50 overflow-hidden shadow-xl">
            <div className="p-6 md:p-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {irresistibleReasons.map((reason, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-start gap-3 md:gap-4"
                  >
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <reason.icon className="w-4 h-4 md:w-5 md:h-5 text-emerald-400" />
                    </div>
                    <p className="text-slate-200 text-base md:text-lg leading-relaxed font-medium">{reason.text}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* CTA Final - Máximo Destaque */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-2 border-emerald-500/50 backdrop-blur-xl overflow-hidden shadow-2xl relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent"></div>
            <div className="p-8 md:p-12 text-center relative z-10">
              <div className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 mb-8 shadow-2xl shadow-emerald-500/50">
                <DollarSign className="w-10 h-10 md:w-12 md:h-12 text-white" />
              </div>
              
              <h2 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
                Comece a Ganhar<br />
                <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                  Hoje Mesmo
                </span>
              </h2>
              
              <p className="text-slate-200 text-lg md:text-2xl mb-10 max-w-4xl mx-auto leading-relaxed font-medium">
                {isGuest ? (
                  "Cadastre-se GRATUITAMENTE, solicite sua afiliação e comece a compartilhar a ferramenta de trading mais completa do mercado. Seus afiliados ganham, você ganha, todos ganham!"
                ) : (
                  "Cada trader que você indicar pode se tornar sua fonte de renda passiva mensal. O sistema de comissões é automático, transparente e vitalício. Não perca tempo!"
                )}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center items-center mb-10">
                <div className="flex items-center gap-3 text-emerald-400 text-base md:text-xl font-bold">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <span>Comissões Recorrentes</span>
                </div>
                <div className="flex items-center gap-3 text-emerald-400 text-base md:text-xl font-bold">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <span>Sistema Automatizado</span>
                </div>
                <div className="flex items-center gap-3 text-emerald-400 text-base md:text-xl font-bold">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <span>Ganhos Vitalícios</span>
                </div>
              </div>

              {isGuest ? (
                 <Button
                    onClick={() => base44.auth.redirectToLogin()}
                    className="bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-600 hover:via-teal-600 hover:to-emerald-700 text-white shadow-2xl shadow-emerald-500/50 h-16 md:h-20 text-xl md:text-2xl font-black px-12 md:px-16"
                  >
                    <Sparkles className="w-7 h-7 mr-3" />
                    Cadastrar Grátis e Solicitar Afiliação
                  </Button>
              ) : affiliateUrl ? (
                <a href={affiliateUrl} target="_blank" rel="noopener noreferrer">
                  <Button className="bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 hover:from-purple-600 hover:via-pink-600 hover:to-purple-700 text-white shadow-2xl shadow-purple-500/50 h-16 md:h-20 text-xl md:text-2xl font-black px-12 md:px-16">
                    <ExternalLink className="w-7 h-7 mr-3" />
                    Solicitar Minha Afiliação AGORA
                  </Button>
                </a>
              ) : (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6 max-w-md mx-auto">
                  <p className="text-yellow-400 text-lg font-bold">
                    Programa em fase final de implementação. Em breve disponível!
                  </p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}