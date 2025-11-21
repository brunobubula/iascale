import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  DollarSign, 
  TrendingUp, 
  Sparkles, 
  Users, 
  Clock, 
  Target,
  Zap,
  BarChart3,
  Send,
  Download,
  Shield,
  Rocket,
  Crown,
  CheckCircle,
  Star,
  Infinity as InfinityIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CTA_TEXTS = [
  "🚀 INICIAR MINHA JORNADA AGORA!",
  "💰 QUERO FATURAR 20K POR MÊS!",
  "⚡ CRIAR MINHA SALA DE SINAIS HOJE!",
  "🔥 SIM, EU QUERO SER INFINITY PRO!",
  "💎 DESBLOQUEAR RENDA RECORRENTE!",
  "🎯 COMEÇAR A LUCRAR EM 24 HORAS!",
  "✨ TRANSFORMAR MINHA VIDA AGORA!",
  "🏆 ENTRAR PARA O INFINITY PRO!",
  "💸 ATIVAR MINHA SALA VIP AGORA!",
  "🌟 FAZER PARTE DA ELITE TRADER!"
];

const BENEFITS = [
  {
    icon: DollarSign,
    title: "Renda Recorrente Mensal",
    description: "Ganhe de R$1.000 até R$30.000 por mês com assinaturas recorrentes da sua sala VIP. Crie uma fonte de renda passiva sustentável.",
    gradient: "from-emerald-500 to-teal-600"
  },
  {
    icon: Rocket,
    title: "Baixíssimo Investimento Inicial",
    description: "Comece com praticamente zero investimento. Sem necessidade de capital para trading, apenas a plataforma e você está pronto para lucrar.",
    gradient: "from-blue-500 to-cyan-600"
  },
  {
    icon: Sparkles,
    title: "Zero Experiência Necessária",
    description: "Não precisa saber NADA de trading! A iA Scale gera sinais profissionais automaticamente. Você só copia e cola no grupo.",
    gradient: "from-purple-500 to-pink-600"
  },
  {
    icon: InfinityIcon,
    title: "Sinais Ilimitados 24/7",
    description: "Gere quantos sinais quiser, quando quiser. Sem limites, sem restrições. A iA trabalha 24 horas por dia para você.",
    gradient: "from-yellow-500 to-orange-600"
  },
  {
    icon: Clock,
    title: "Inicie em Poucas Horas",
    description: "Configure sua sala VIP e comece a enviar sinais no mesmo dia. O setup é rápido e descomplicado.",
    gradient: "from-red-500 to-pink-600"
  },
  {
    icon: TrendingUp,
    title: "Surfe a Onda da IA",
    description: "Trading com IA é a maior tendência do momento. Posicione-se como pioneiro e capitalize essa revolução tecnológica.",
    gradient: "from-indigo-500 to-purple-600"
  },
  {
    icon: Send,
    title: "Sistema Copy & Paste",
    description: "Clique no botão, copie o sinal formatado e cole no Telegram. Sem complicações, sem análises manuais, sem stress.",
    gradient: "from-green-500 to-emerald-600"
  },
  {
    icon: BarChart3,
    title: "Painel de Controle Profissional",
    description: "Monitore todos os sinais enviados, alertas automáticos, dados em tempo real e métricas detalhadas de cada operação.",
    gradient: "from-cyan-500 to-blue-600"
  },
  {
    icon: Target,
    title: "Rastreamento de Performance",
    description: "Acompanhe lucros/perdas de cada sinal, win rate, ROI e estatísticas completas. Mostre resultados reais aos seus membros.",
    gradient: "from-orange-500 to-red-600"
  },
  {
    icon: Download,
    title: "Relatórios Profissionais",
    description: "Gere e baixe relatórios detalhados com todos os trades enviados, divididos por períodos. Transparência total para seus membros.",
    gradient: "from-teal-500 to-cyan-600"
  },
  {
    icon: Users,
    title: "Negócio Escalável",
    description: "Comece com 10 membros e escale para centenas. Seu trabalho permanece o mesmo, mas sua renda multiplica exponencialmente.",
    gradient: "from-violet-500 to-purple-600"
  },
  {
    icon: Shield,
    title: "Suporte VIP Dedicado",
    description: "Tenha acesso prioritário ao suporte 24/7, consultoria especializada e material exclusivo para gestão de sala.",
    gradient: "from-slate-500 to-slate-700"
  }
];

export default function UpgradeRenda20k() {
  const navigate = useNavigate();
  const [ctaIndex, setCtaIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleCTAClick = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setCtaIndex((prev) => (prev + 1) % CTA_TEXTS.length);
      setIsAnimating(false);
      navigate(createPageUrl("SejaPRO"));
    }, 300);
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
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
            <div className="flex items-center gap-3">
              <motion.div
                animate={{
                  rotate: [0, 10, -10, 10, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Crown className="w-12 h-12 text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.8)]" />
              </motion.div>
              <h1 className="text-3xl md:text-5xl font-black bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
                Renda 20k com Sala de Sinais
              </h1>
            </div>
            <p className="text-slate-400 mt-2 text-lg">
              Transforme sua vida criando sua própria sala VIP de sinais com IA
            </p>
          </div>
        </div>

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <Card className="bg-gradient-to-br from-purple-900/40 via-pink-900/30 to-purple-900/40 backdrop-blur-xl border-purple-500/30 overflow-hidden shadow-2xl relative">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-transparent to-purple-500/5"></div>
            
            <div className="relative z-10 p-8 md:p-12 text-center">
              <motion.div
                animate={{
                  scale: [1, 1.02, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <h2 className="text-4xl md:text-6xl font-black text-white mb-6">
                  Crie Sua Sala VIP e Fature até{" "}
                  <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                    R$30.000/Mês
                  </span>
                </h2>
              </motion.div>

              <p className="text-slate-200 text-xl md:text-2xl max-w-4xl mx-auto mb-8 leading-relaxed">
                Com o <span className="font-bold text-purple-400">INFINITY PRO</span>, você tem tudo que precisa para criar e gerenciar uma sala de sinais lucrativa, mesmo sem experiência em trading!
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-emerald-500/20 border-2 border-emerald-500/50 rounded-xl p-6"
                >
                  <div className="text-5xl font-black text-emerald-400 mb-2">0</div>
                  <div className="text-white font-semibold">Experiência Necessária</div>
                  <div className="text-slate-300 text-sm mt-2">A IA faz tudo por você</div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-purple-500/20 border-2 border-purple-500/50 rounded-xl p-6"
                >
                  <div className="text-5xl font-black text-purple-400 mb-2">∞</div>
                  <div className="text-white font-semibold">Sinais Ilimitados</div>
                  <div className="text-slate-300 text-sm mt-2">24/7 sem restrições</div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-yellow-500/20 border-2 border-yellow-500/50 rounded-xl p-6"
                >
                  <div className="text-5xl font-black text-yellow-400 mb-2">24h</div>
                  <div className="text-white font-semibold">Para Começar</div>
                  <div className="text-slate-300 text-sm mt-2">Setup rápido e fácil</div>
                </motion.div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Benefits Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-3">
              12 Motivos Para Criar Sua Sala VIP Hoje
            </h2>
            <p className="text-slate-400 text-lg">
              Benefícios exclusivos do INFINITY PRO que vão transformar sua vida financeira
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {BENEFITS.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50 hover:border-purple-500/30 transition-all h-full p-6">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${benefit.gradient} flex items-center justify-center mb-4`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-white font-bold text-xl mb-3">{benefit.title}</h3>
                    <p className="text-slate-300 leading-relaxed">{benefit.description}</p>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Visual Examples Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-12"
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-3">
              Veja Como é Simples na Prática
            </h2>
            <p className="text-slate-400 text-lg">
              Sistema profissional que qualquer pessoa pode usar
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1: Gerando Sinal */}
            <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50 overflow-hidden">
              <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 p-6 border-b border-slate-800/50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                  </div>
                  <h3 className="text-white font-bold text-xl">Passo 1: Gerar Sinal com IA</h3>
                </div>
                <p className="text-slate-300 text-sm mb-4">
                  Clique em um botão e a IA analisa o mercado em segundos, gerando sinais profissionais automaticamente
                </p>
              </div>
              <div className="p-6 bg-slate-950/50">
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-4 border border-purple-500/30">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span className="text-purple-400 text-sm font-semibold">Sinal Gerado pela iA</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Par:</span>
                      <span className="text-white font-semibold">BTC/USDT</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Tipo:</span>
                      <span className="text-emerald-400 font-semibold">COMPRA</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Entrada:</span>
                      <span className="text-white font-semibold">$65,234.50</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">TP:</span>
                      <span className="text-emerald-400 font-semibold">$67,890.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">SL:</span>
                      <span className="text-red-400 font-semibold">$64,100.00</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Card 2: Compartilhando */}
            <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50 overflow-hidden">
              <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 p-6 border-b border-slate-800/50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <Send className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h3 className="text-white font-bold text-xl">Passo 2: Compartilhar no Telegram</h3>
                </div>
                <p className="text-slate-300 text-sm mb-4">
                  Clique em "Copiar para Telegram" e cole no seu grupo VIP. Pronto! Seus membros já têm o sinal.
                </p>
              </div>
              <div className="p-6 bg-slate-950/50">
                <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/50 rounded-xl p-4 border border-blue-500/30">
                  <div className="flex items-center gap-2 mb-3">
                    <Send className="w-4 h-4 text-blue-400" />
                    <span className="text-blue-400 text-sm font-semibold">Mensagem Formatada</span>
                  </div>
                  <div className="text-xs text-slate-200 font-mono bg-slate-950/50 p-3 rounded-lg border border-slate-700">
                    🎯 SINAL SCALE CRIPTO iA<br/>
                    <br/>
                    📊 Par: BTC/USDT<br/>
                    🟢 Tipo: COMPRA<br/>
                    💰 Entrada: $65,234.50<br/>
                    🎯 TP: $67,890.00<br/>
                    ⛔ SL: $64,100.00<br/>
                    <br/>
                    ⚡ Gerado pela iA Trader Scale
                  </div>
                </div>
              </div>
            </Card>

            {/* Card 3: Monitorando */}
            <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50 overflow-hidden">
              <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 p-6 border-b border-slate-800/50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-blue-400" />
                  </div>
                  <h3 className="text-white font-bold text-xl">Passo 3: Monitorar Performance</h3>
                </div>
                <p className="text-slate-300 text-sm mb-4">
                  Acompanhe todos os sinais em tempo real no painel. Veja lucros, alertas e estatísticas automaticamente.
                </p>
              </div>
              <div className="p-6 bg-slate-950/50">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span className="text-white text-sm font-semibold">BTC/USDT</span>
                    </div>
                    <span className="text-emerald-400 font-bold">+$1,245.00</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span className="text-white text-sm font-semibold">ETH/USDT</span>
                    </div>
                    <span className="text-emerald-400 font-bold">+$890.50</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-yellow-400" />
                      <span className="text-white text-sm font-semibold">SOL/USDT</span>
                    </div>
                    <span className="text-yellow-400 font-bold">Em Andamento</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Card 4: Relatórios */}
            <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50 overflow-hidden">
              <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 p-6 border-b border-slate-800/50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                    <Download className="w-5 h-5 text-orange-400" />
                  </div>
                  <h3 className="text-white font-bold text-xl">Passo 4: Gerar Relatórios</h3>
                </div>
                <p className="text-slate-300 text-sm mb-4">
                  Baixe relatórios profissionais com todos os sinais, lucros e estatísticas para mostrar aos membros.
                </p>
              </div>
              <div className="p-6 bg-slate-950/50">
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-4 border border-orange-500/30">
                  <div className="flex items-center gap-2 mb-4">
                    <Download className="w-4 h-4 text-orange-400" />
                    <span className="text-orange-400 text-sm font-semibold">Relatório Mensal</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-700">
                      <div className="text-slate-400 text-xs mb-1">Total Sinais</div>
                      <div className="text-white font-bold text-lg">247</div>
                    </div>
                    <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-700">
                      <div className="text-slate-400 text-xs mb-1">Win Rate</div>
                      <div className="text-emerald-400 font-bold text-lg">78%</div>
                    </div>
                    <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-700">
                      <div className="text-slate-400 text-xs mb-1">Lucro Total</div>
                      <div className="text-emerald-400 font-bold text-lg">+$45k</div>
                    </div>
                    <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-700">
                      <div className="text-slate-400 text-xs mb-1">ROI Médio</div>
                      <div className="text-emerald-400 font-bold text-lg">+12%</div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </motion.div>

        {/* Success Stories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-12"
        >
          <Card className="bg-gradient-to-br from-yellow-900/20 to-orange-900/20 backdrop-blur-xl border-yellow-500/30 overflow-hidden">
            <div className="p-8 md:p-12">
              <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-black text-white mb-3">
                  Potencial de Ganhos Mensais
                </h2>
                <p className="text-slate-300 text-lg">
                  Exemplos reais de quanto você pode faturar com sua sala VIP
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-slate-900/50 rounded-xl p-6 border-2 border-slate-700"
                >
                  <div className="text-center mb-4">
                    <Star className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                    <div className="text-slate-400 font-semibold mb-2">Iniciante</div>
                    <div className="text-4xl font-black text-white mb-1">R$2.500</div>
                    <div className="text-slate-400 text-sm">por mês</div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-slate-300">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span>50 membros × R$50/mês</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span>2-3 sinais por dia</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span>1-2 horas de trabalho/dia</span>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl p-6 border-2 border-purple-500 relative overflow-hidden"
                >
                  <div className="absolute -top-2 -right-2">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                      POPULAR
                    </div>
                  </div>
                  <div className="text-center mb-4">
                    <Star className="w-12 h-12 text-purple-400 mx-auto mb-2" />
                    <div className="text-purple-400 font-semibold mb-2">Intermediário</div>
                    <div className="text-4xl font-black text-white mb-1">R$10.000</div>
                    <div className="text-slate-300 text-sm">por mês</div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-slate-200">
                      <CheckCircle className="w-4 h-4 text-purple-400" />
                      <span>200 membros × R$50/mês</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-200">
                      <CheckCircle className="w-4 h-4 text-purple-400" />
                      <span>5-8 sinais por dia</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-200">
                      <CheckCircle className="w-4 h-4 text-purple-400" />
                      <span>2-3 horas de trabalho/dia</span>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl p-6 border-2 border-yellow-500 relative overflow-hidden"
                >
                  <motion.div
                    animate={{
                      rotate: [0, 10, -10, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                    }}
                    className="absolute -top-2 -right-2"
                  >
                    <Crown className="w-8 h-8 text-yellow-400" />
                  </motion.div>
                  <div className="text-center mb-4">
                    <Star className="w-12 h-12 text-yellow-400 mx-auto mb-2" />
                    <div className="text-yellow-400 font-semibold mb-2">Avançado</div>
                    <div className="text-4xl font-black text-white mb-1">R$30.000+</div>
                    <div className="text-slate-300 text-sm">por mês</div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-slate-200">
                      <CheckCircle className="w-4 h-4 text-yellow-400" />
                      <span>500+ membros × R$60/mês</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-200">
                      <CheckCircle className="w-4 h-4 text-yellow-400" />
                      <span>10+ sinais por dia</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-200">
                      <CheckCircle className="w-4 h-4 text-yellow-400" />
                      <span>3-4 horas de trabalho/dia</span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Final CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="text-center"
        >
          <Card className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 backdrop-blur-xl border-purple-500/50 overflow-hidden shadow-2xl relative">
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 via-transparent to-purple-500/10 animate-pulse"></div>
            </div>

            <div className="relative z-10 p-12">
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <InfinityIcon className="w-20 h-20 text-purple-400 mx-auto mb-6" />
              </motion.div>

              <h2 className="text-4xl md:text-6xl font-black text-white mb-4">
                Pronto Para Começar Sua Jornada?
              </h2>
              
              <p className="text-slate-200 text-xl md:text-2xl max-w-3xl mx-auto mb-8">
                Junte-se aos traders que já estão faturando mensalmente com suas salas VIP gerenciadas por IA
              </p>

              <div className="flex items-center justify-center gap-6 text-sm text-slate-300 mb-8">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  <span>Sem Contrato</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  <span>Cancele Quando Quiser</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  <span>Suporte 24/7</span>
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={ctaIndex}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.3 }}
                >
                  <Button
                    onClick={handleCTAClick}
                    disabled={isAnimating}
                    className="bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 hover:from-yellow-600 hover:via-orange-600 hover:to-red-600 text-white font-black text-xl md:text-2xl px-12 py-8 rounded-2xl shadow-2xl shadow-yellow-500/50 transform hover:scale-105 transition-all"
                  >
                    <Rocket className="w-8 h-8 mr-3" />
                    {CTA_TEXTS[ctaIndex]}
                  </Button>
                </motion.div>
              </AnimatePresence>

              <p className="text-slate-400 text-sm mt-6">
                💡 Clique no botão para mudar a mensagem e ser redirecionado
              </p>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}