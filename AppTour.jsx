import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, ChevronRight, ChevronLeft, Sparkles, TrendingUp, Plus, BarChart3, Bell, Settings, Target } from "lucide-react";

const TOUR_STEPS = [
  {
    id: "welcome",
    title: "Bem-vindo ao Scale Cripto iA! 👋",
    description: "Vamos fazer um tour rápido pelas principais funcionalidades. Este guia levará apenas 2 minutos!",
    target: null,
    icon: Sparkles,
    position: "center"
  },
  {
    id: "add_trade",
    title: "Criar Novo Trade",
    description: "Clique aqui para criar manualmente um sinal de trade com entrada, TP e SL personalizados.",
    target: '[data-tour="add-trade"]',
    icon: Plus,
    position: "bottom"
  },
  {
    id: "ai_trader",
    title: "iA Trader Automática",
    description: "Nossa inteligência artificial analisa o mercado e gera sinais otimizados automaticamente!",
    target: '[data-tour="ai-trader"]',
    icon: Sparkles,
    position: "bottom"
  },
  {
    id: "active_trades",
    title: "Trades Ativos",
    description: "Aqui você visualiza todos os seus trades abertos em tempo real com P/L atualizado automaticamente.",
    target: '[data-tour="trades-list"]',
    icon: TrendingUp,
    position: "top"
  },
  {
    id: "trade_actions",
    title: "Ações do Trade",
    description: "Passe o mouse sobre um card de trade para ver opções: criar alertas, compartilhar, editar ou fechar.",
    target: '[data-tour="trade-card"]',
    icon: Target,
    position: "left"
  },
  {
    id: "notifications",
    title: "Central de Notificações",
    description: "Receba alertas quando seus trades atingirem TP, SL ou condições personalizadas que você definir.",
    target: '[data-tour="notifications"]',
    icon: Bell,
    position: "bottom"
  },
  {
    id: "analytics",
    title: "Análise P/L",
    description: "Acompanhe seu desempenho com estatísticas detalhadas, gráficos e histórico completo de lucros.",
    target: '[data-tour="analytics"]',
    icon: BarChart3,
    position: "bottom"
  },
  {
    id: "settings",
    title: "Configurações",
    description: "Personalize sua experiência: tema claro/escuro, notificações, saldo inicial e preferências.",
    target: '[data-tour="settings"]',
    icon: Settings,
    position: "bottom"
  }
];

export default function AppTour({ user }) {
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);
  const [showTour, setShowTour] = useState(false);
  const [highlightPosition, setHighlightPosition] = useState(null);

  const { data: tourProgress } = useQuery({
    queryKey: ['appTour', user?.id],
    queryFn: async () => {
      const tours = await base44.entities.AppTour.filter({ user_id: user?.id });
      return tours[0] || null;
    },
    enabled: !!user
  });

  useEffect(() => {
    if (user && !tourProgress?.is_completed && !tourProgress?.skipped) {
      // Mostrar tour para novos usuários após 2 segundos
      const timer = setTimeout(() => setShowTour(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [user, tourProgress]);

  useEffect(() => {
    if (showTour && currentStep > 0) {
      const step = TOUR_STEPS[currentStep];
      if (step.target) {
        const element = document.querySelector(step.target);
        if (element) {
          const rect = element.getBoundingClientRect();
          setHighlightPosition({
            top: rect.top + window.scrollY,
            left: rect.left + window.scrollX,
            width: rect.width,
            height: rect.height
          });
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else {
        setHighlightPosition(null);
      }
    }
  }, [currentStep, showTour]);

  const updateTourMutation = useMutation({
    mutationFn: async ({ completed_steps, is_completed, skipped }) => {
      if (tourProgress) {
        return await base44.entities.AppTour.update(tourProgress.id, {
          completed_steps,
          is_completed,
          skipped,
          completed_at: is_completed ? new Date().toISOString() : null
        });
      } else {
        return await base44.entities.AppTour.create({
          user_id: user?.id,
          completed_steps,
          is_completed,
          skipped,
          completed_at: is_completed ? new Date().toISOString() : null
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appTour'] });
    }
  });

  const handleNext = () => {
    const nextStep = currentStep + 1;
    if (nextStep < TOUR_STEPS.length) {
      setCurrentStep(nextStep);
      updateTourMutation.mutate({
        completed_steps: [...(tourProgress?.completed_steps || []), TOUR_STEPS[currentStep].id],
        is_completed: false,
        skipped: false
      });
    } else {
      // Tour concluído
      updateTourMutation.mutate({
        completed_steps: TOUR_STEPS.map(s => s.id),
        is_completed: true,
        skipped: false
      });
      setShowTour(false);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    updateTourMutation.mutate({
      completed_steps: tourProgress?.completed_steps || [],
      is_completed: false,
      skipped: true
    });
    setShowTour(false);
  };

  if (!showTour || !user) return null;

  const step = TOUR_STEPS[currentStep];
  const Icon = step.icon;
  const isWelcome = step.position === "center";

  return (
    <>
      {/* Overlay */}
      <AnimatePresence>
        {showTour && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
            onClick={handleSkip}
          />
        )}
      </AnimatePresence>

      {/* Highlight Spotlight */}
      <AnimatePresence>
        {showTour && highlightPosition && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed z-[9999] pointer-events-none"
            style={{
              top: highlightPosition.top - 8,
              left: highlightPosition.left - 8,
              width: highlightPosition.width + 16,
              height: highlightPosition.height + 16,
              boxShadow: '0 0 0 4px rgba(16, 185, 129, 0.5), 0 0 0 9999px rgba(0, 0, 0, 0.6)',
              borderRadius: '12px',
              transition: 'all 0.3s ease'
            }}
          />
        )}
      </AnimatePresence>

      {/* Tour Card */}
      <AnimatePresence>
        {showTour && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={`fixed z-[10000] ${
              isWelcome 
                ? 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2' 
                : 'bottom-8 right-8'
            }`}
          >
            <Card className="bg-slate-900 border-emerald-500/50 shadow-2xl w-[400px] max-w-[90vw]">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg">{step.title}</h3>
                      <p className="text-slate-500 text-xs">
                        Passo {currentStep + 1} de {TOUR_STEPS.length}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleSkip}
                    className="text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <p className="text-slate-300 text-sm mb-4 leading-relaxed">
                  {step.description}
                </p>

                <div className="flex items-center gap-2 mb-4">
                  {TOUR_STEPS.map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-1.5 flex-1 rounded-full transition-all ${
                        idx <= currentStep ? 'bg-emerald-500' : 'bg-slate-700'
                      }`}
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSkip}
                    className="bg-slate-800/50 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    Pular Tour
                  </Button>
                  <div className="flex gap-2">
                    {currentStep > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePrevious}
                        className="bg-slate-800/50 border-slate-700 text-white hover:bg-slate-800"
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Anterior
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={handleNext}
                      className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                    >
                      {currentStep === TOUR_STEPS.length - 1 ? 'Concluir' : 'Próximo'}
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}