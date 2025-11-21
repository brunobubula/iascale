import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  GraduationCap, 
  Filter, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ArrowLeft,
  Sparkles,
  TrendingUp,
  Plus,
  Eye,
  Lock,
  DollarSign,
  Loader2
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StudyCard from "../components/studies/StudyCard";
import Disclaimer from "../components/Disclaimer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";

export default function AdminStudies() {
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedStudy, setSelectedStudy] = useState(null);
  const [unlocking, setUnlocking] = useState(false);
  const [showEntryAmountDialog, setShowEntryAmountDialog] = useState(false);
  const [selectedStudyToUnlock, setSelectedStudyToUnlock] = useState(null);
  const [entryAmountInput, setEntryAmountInput] = useState("100");
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: studies = [], isLoading } = useQuery({
    queryKey: ['adminStudies'],
    queryFn: () => base44.entities.AdminStudy.list("-published_date", 100),
    initialData: [],
  });

  const { data: myPurchases = [] } = useQuery({
    queryKey: ['myStudyPurchases'],
    queryFn: () => base44.entities.UserStudyPurchase.list("-created_date", 500),
    initialData: [],
    enabled: !!user,
  });

  const isAdmin = user?.role === "admin";
  const planType = user?.pro_plan_type || 'free';
  const hasUnlimitedAccess = planType === 'infinity_pro' || planType === 'enterprise';

  const hasAccessToStudy = (studyId) => {
    if (isAdmin || hasUnlimitedAccess) return true;
    return myPurchases.some(p => p.admin_study_id === studyId);
  };

  const filteredStudies = studies.filter(study => {
    if (filterStatus === "all") return true;
    return study.status === filterStatus;
  });

  const handleUnlockStudy = async (study) => {
    if (!user) {
      toast({
        title: "Autenticação necessária",
        description: "Faça login para desbloquear estudos.",
        duration: 3000,
      });
      return;
    }

    // Fecha o dialog de detalhes e abre o dialog de entry_amount
    setSelectedStudy(null);
    setSelectedStudyToUnlock(study);
    setShowEntryAmountDialog(true);
  };

  const handleConfirmUnlockAndOpen = async () => {
    if (!selectedStudyToUnlock || !entryAmountInput || parseFloat(entryAmountInput) <= 0) {
      toast({
        title: "❌ Erro",
        description: "Informe um valor de margem válido (maior que zero).",
        duration: 3000,
      });
      return;
    }

    const study = selectedStudyToUnlock;
    const entryAmount = parseFloat(entryAmountInput);

    setUnlocking(true);
    try {
      // 1. Desbloquear o estudo
      const response = await base44.functions.invoke('accessAdminStudy', {
        admin_study_id: study.id
      });

      if (!response.data.success) {
        throw new Error("Falha ao desbloquear estudo");
      }

      // 2. Determinar status e preços do trade
      let newTradeStatus = "ACTIVE";
      let tradeCurrentPrice = study.entry_price;
      let profitLossPercentage = 0;
      let profitLossUSD = 0;
      let closedAt = null;

      if (study.status === "TP_HIT") {
        newTradeStatus = "TAKE_PROFIT_HIT";
        tradeCurrentPrice = study.closed_price || study.take_profit;
        profitLossPercentage = study.profit_loss_percentage || 0;
        profitLossUSD = study.profit_loss_usd || 0;
        closedAt = new Date().toISOString();
      } else if (study.status === "SL_HIT") {
        newTradeStatus = "STOP_LOSS_HIT";
        tradeCurrentPrice = study.closed_price || study.stop_loss;
        profitLossPercentage = study.profit_loss_percentage || 0;
        profitLossUSD = study.profit_loss_usd || 0;
        closedAt = new Date().toISOString();
      } else if (study.status === "CLOSED") {
        newTradeStatus = "CLOSED";
        tradeCurrentPrice = study.closed_price || study.entry_price;
        profitLossPercentage = study.profit_loss_percentage || 0;
        profitLossUSD = study.profit_loss_usd || 0;
        closedAt = new Date().toISOString();
      }

      // 3. Criar o TradeSignal com os dados do estudo
      const newTradeData = {
        pair: study.pair,
        type: study.type,
        entry_price: study.entry_price,
        entry_amount: entryAmount,
        leverage: study.leverage || 1,
        take_profit: study.take_profit,
        stop_loss: study.stop_loss,
        current_price: tradeCurrentPrice,
        status: newTradeStatus,
        profit_loss_percentage: profitLossPercentage,
        profit_loss_usd: profitLossUSD,
        notes: `📚 Estudo Admin: ${study.title}\n${study.description || ''}`,
        from_ai_trader: true,
        closed_at: closedAt,
      };

      const tradeResponse = await base44.entities.TradeSignal.create(newTradeData);

      // 4. Invalidar queries
      queryClient.invalidateQueries({ queryKey: ['myStudyPurchases'] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['trades'] });

      // 5. Fechar dialog
      setShowEntryAmountDialog(false);
      setSelectedStudyToUnlock(null);
      setEntryAmountInput("100");

      // 6. Feedback ao usuário
      const accessType = response.data.access_type;
      
      if (accessType === 'CREDIT_PURCHASE') {
        toast({
          title: "✅ Estudo Desbloqueado e Trade Criado!",
          description: `C$ ${response.data.credits_spent} debitados. Trade adicionado ao seu dashboard.`,
          duration: 5000,
        });
      } else if (accessType === 'UNLIMITED_PLAN') {
        toast({
          title: "✅ Estudo Desbloqueado e Trade Criado!",
          description: "Acesso ilimitado - Trade adicionado ao seu dashboard.",
          duration: 5000,
        });
      }

      // 7. Navegar para o dashboard destacando o novo trade
      navigate(`${createPageUrl("Dashboard")}?new_trade=${tradeResponse.id}`);

    } catch (error) {
      if (error.response?.data?.error === 'NotEnoughCredits') {
        toast({
          title: "Créditos Insuficientes",
          description: error.response.data.message,
          action: (
            <Button
              onClick={() => navigate(createPageUrl("AddCredito"))}
              className="bg-emerald-500 hover:bg-emerald-600"
              size="sm"
            >
              Adicionar Créditos
            </Button>
          ),
          duration: 6000,
        });
      } else {
        toast({
          title: "Erro ao Desbloquear",
          description: error.message || "Não foi possível desbloquear o estudo. Tente novamente.",
          duration: 3000,
        });
      }
      
      // Fechar o dialog em caso de erro
      setShowEntryAmountDialog(false);
      setSelectedStudyToUnlock(null);
    } finally {
      setUnlocking(false);
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => navigate(createPageUrl("Dashboard"))}
              className="text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Estudos de Performance</h1>
            <p className="text-slate-400 text-sm">Análises educacionais e simulações históricas</p>
          </div>
        </div>

        <Disclaimer />

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-[200px] bg-slate-900/50 border-slate-700/50 text-slate-300">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800/95 border-slate-700">
              <SelectItem value="all" className="text-white">Todos os Estudos</SelectItem>
              <SelectItem value="ACTIVE" className="text-white">Ativos</SelectItem>
              <SelectItem value="CLOSED" className="text-white">Fechados</SelectItem>
              <SelectItem value="TP_HIT" className="text-white">TP Atingido</SelectItem>
              <SelectItem value="SL_HIT" className="text-white">SL Atingido</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Eye className="w-4 h-4" />
            <span>{filteredStudies.length} estudo(s) encontrado(s)</span>
          </div>

          {(hasUnlimitedAccess || isAdmin) && (
            <div className="ml-auto">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 text-xs font-semibold">Acesso Ilimitado Ativo</span>
              </div>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
          </div>
        ) : filteredStudies.length === 0 ? (
          <Card className="bg-slate-900/50 border-slate-800/50 p-12 text-center">
            <GraduationCap className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Nenhum estudo encontrado</h3>
            <p className="text-slate-400">
              {filterStatus === "all" 
                ? "Ainda não há estudos de performance publicados." 
                : "Nenhum estudo encontrado com este filtro."}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStudies.map((study, index) => (
              <div key={study.id} onClick={() => setSelectedStudy(study)}>
                <StudyCard
                  study={study}
                  hasAccess={hasAccessToStudy(study.id)}
                  onUnlock={() => handleUnlockStudy(study)}
                  isUnlimited={hasUnlimitedAccess || isAdmin}
                  index={index}
                />
              </div>
            ))}
          </div>
        )}

        <Dialog open={!!selectedStudy && !unlocking} onOpenChange={() => setSelectedStudy(null)}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg">
            {selectedStudy && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    {selectedStudy.title}
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                  {selectedStudy.description && (
                    <div className="bg-slate-800/30 rounded-lg p-3">
                      <p className="text-slate-300 text-sm whitespace-pre-line">{selectedStudy.description}</p>
                    </div>
                  )}

                  {selectedStudy.media_url && (
                    <div className="rounded-lg overflow-hidden">
                      <img 
                        src={selectedStudy.media_url} 
                        alt="Análise técnica"
                        className="w-full h-auto"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-slate-800/30 rounded-lg p-3">
                      <div className="text-slate-400 mb-1">Par</div>
                      <div className="text-white font-semibold">{selectedStudy.pair}</div>
                    </div>
                    <div className="bg-slate-800/30 rounded-lg p-3">
                      <div className="text-slate-400 mb-1">Tipo</div>
                      <div className="text-white font-semibold">{selectedStudy.type}</div>
                    </div>
                  </div>

                  {hasAccessToStudy(selectedStudy.id) && (
                    <>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="bg-slate-800/30 rounded-lg p-3">
                          <div className="text-slate-400 mb-1">Entrada</div>
                          <div className="text-white font-semibold">${(selectedStudy.entry_price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                        </div>
                        <div className="bg-slate-800/30 rounded-lg p-3">
                          <div className="text-slate-400 mb-1">Alavancagem</div>
                          <div className="text-white font-semibold">{selectedStudy.leverage}x</div>
                        </div>
                        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
                          <div className="text-emerald-400 mb-1">Take Profit</div>
                          <div className="text-emerald-400 font-semibold">${(selectedStudy.take_profit || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                        </div>
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                          <div className="text-red-400 mb-1">Stop Loss</div>
                          <div className="text-red-400 font-semibold">${(selectedStudy.stop_loss || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                        </div>
                      </div>

                      {(selectedStudy.status === 'CLOSED' || selectedStudy.status === 'TP_HIT' || selectedStudy.status === 'SL_HIT') && (
                        <div className={`p-4 rounded-lg ${
                          (selectedStudy.profit_loss_usd || 0) >= 0
                            ? 'bg-emerald-500/10 border border-emerald-500/30'
                            : 'bg-red-500/10 border border-red-500/30'
                        }`}>
                          <div className="text-center">
                            <div className="text-slate-400 text-xs mb-1">Resultado da Simulação</div>
                            <div className={`text-3xl font-black ${
                              (selectedStudy.profit_loss_usd || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
                            }`}>
                              {(selectedStudy.profit_loss_usd || 0) >= 0 ? '+' : ''}${Math.abs(selectedStudy.profit_loss_usd || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </div>
                            <div className={`text-base ${
                              (selectedStudy.profit_loss_percentage || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
                            }`}>
                              {(selectedStudy.profit_loss_percentage || 0) >= 0 ? '+' : ''}{(selectedStudy.profit_loss_percentage || 0).toFixed(2)}%
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <DialogFooter className="flex flex-col sm:flex-row gap-2">
                  {!hasAccessToStudy(selectedStudy.id) && (
                    <Button
                      onClick={() => handleUnlockStudy(selectedStudy)}
                      disabled={unlocking}
                      className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                    >
                      {unlocking ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Desbloqueando...
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4 mr-2" />
                          Desbloquear por C$ {selectedStudy.cost_credits}
                        </>
                      )}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => setSelectedStudy(null)}
                    className="flex-1 bg-slate-800/50 border-slate-700 hover:bg-slate-800 text-white"
                  >
                    Fechar
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog para preencher entry_amount antes de criar o trade */}
        <Dialog open={showEntryAmountDialog} onOpenChange={setShowEntryAmountDialog}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <GraduationCap className="w-6 h-6 text-purple-400" />
                Configurar Margem do Trade
              </DialogTitle>
            </DialogHeader>

            {selectedStudyToUnlock && (
              <div className="py-4 space-y-4">
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
                  <h3 className="text-white font-bold text-sm mb-3">{selectedStudyToUnlock.title}</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400">Par:</span>
                      <span className="text-white font-semibold ml-2">{selectedStudyToUnlock.pair}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Tipo:</span>
                      <span className={`font-semibold ml-2 ${
                        selectedStudyToUnlock.type === "BUY" ? "text-emerald-400" : "text-red-400"
                      }`}>{selectedStudyToUnlock.type}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Entrada:</span>
                      <span className="text-white font-semibold ml-2">${(selectedStudyToUnlock.entry_price || 0).toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Alavancagem:</span>
                      <span className="text-purple-400 font-semibold ml-2">{selectedStudyToUnlock.leverage || 1}x</span>
                    </div>
                    <div>
                      <span className="text-slate-400">TP:</span>
                      <span className="text-emerald-400 font-semibold ml-2">${(selectedStudyToUnlock.take_profit || 0).toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">SL:</span>
                      <span className="text-red-400 font-semibold ml-2">${(selectedStudyToUnlock.stop_loss || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300 font-semibold flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    Margem de Entrada (USD)
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="1"
                    value={entryAmountInput}
                    onChange={(e) => setEntryAmountInput(e.target.value)}
                    placeholder="Ex: 100"
                    className="bg-slate-800/50 border-slate-700 text-white h-12 text-base"
                    autoFocus
                  />
                  <p className="text-slate-400 text-xs">
                    Este será o valor de margem do trade criado na sua conta
                  </p>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                  <p className="text-blue-300 text-xs flex items-start gap-2">
                    <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    Um novo trade será criado automaticamente no seu dashboard com os dados deste estudo
                  </p>
                </div>
              </div>
            )}

            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEntryAmountDialog(false);
                  setSelectedStudyToUnlock(null);
                }}
                className="flex-1 bg-slate-800/50 border-slate-700 hover:bg-slate-800 text-white"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmUnlockAndOpen}
                disabled={unlocking}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold"
              >
                {unlocking ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <GraduationCap className="w-4 h-4 mr-2" />
                    Desbloquear e Abrir
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <Toaster />
    </div>
  );
}