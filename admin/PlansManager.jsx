import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Crown, Plus, Edit, Trash2, Save, X, TrendingUp, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function PlansManager() {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [newBenefit, setNewBenefit] = useState("");
  
  const queryClient = useQueryClient();

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['planConfigurations'],
    queryFn: () => base44.entities.PlanConfiguration.list(),
    initialData: [],
  });

  const createPlanMutation = useMutation({
    mutationFn: (planData) => base44.entities.PlanConfiguration.create(planData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planConfigurations'] });
      toast.success("Plano criado!");
      setShowEditDialog(false);
      setEditingPlan(null);
    },
    onError: (error) => {
      toast.error("Erro ao criar plano: " + error.message);
    }
  });

  const updatePlanMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PlanConfiguration.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planConfigurations'] });
      toast.success("Plano atualizado!");
      setShowEditDialog(false);
      setEditingPlan(null);
    },
    onError: (error) => {
      toast.error("Erro ao atualizar plano: " + error.message);
    }
  });

  const deletePlanMutation = useMutation({
    mutationFn: (id) => base44.entities.PlanConfiguration.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planConfigurations'] });
      toast.success("Plano removido!");
    },
    onError: (error) => {
      toast.error("Erro ao remover plano: " + error.message);
    }
  });

  const handleEditPlan = (plan) => {
    setEditingPlan(plan || {
      plan_id: "",
      plan_name: "",
      plan_tagline: "",
      monthly_price: 0,
      promotional_price: 0,
      is_promotional: false,
      promotional_end_date: "",
      is_recommended: false,
      is_active: true,
      display_order: plans.length,
      benefits: [],
      limits: {
        total_trades: -1,
        active_trades: -1,
        ai_trader_uses: -1
      },
      gradient_colors: {
        from: "from-blue-500",
        to: "to-cyan-600"
      },
      icon_color: "text-blue-400"
    });
    setShowEditDialog(true);
  };

  const handleSavePlan = () => {
    if (!editingPlan.plan_id || !editingPlan.plan_name || editingPlan.monthly_price <= 0) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (editingPlan.id) {
      updatePlanMutation.mutate({ id: editingPlan.id, data: editingPlan });
    } else {
      createPlanMutation.mutate(editingPlan);
    }
  };

  const handleAddBenefit = () => {
    if (newBenefit.trim()) {
      setEditingPlan({
        ...editingPlan,
        benefits: [...(editingPlan.benefits || []), newBenefit.trim()]
      });
      setNewBenefit("");
    }
  };

  const handleRemoveBenefit = (index) => {
    const newBenefits = [...editingPlan.benefits];
    newBenefits.splice(index, 1);
    setEditingPlan({ ...editingPlan, benefits: newBenefits });
  };

  const handleDeletePlan = (planId) => {
    if (window.confirm("Tem certeza que deseja remover este plano?")) {
      deletePlanMutation.mutate(planId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900/50 border-slate-800/50 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Gestão de Planos PRO</h2>
              <p className="text-slate-400 text-sm">Configure planos, benefícios e promoções</p>
            </div>
          </div>

          <Button
            onClick={() => handleEditPlan(null)}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Plano
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`bg-slate-800/50 border-slate-700/50 p-4 hover:border-slate-600 transition-all ${
                !plan.is_active ? 'opacity-50' : ''
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-bold text-lg">{plan.plan_name}</h3>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEditPlan(plan)}
                      className="p-1.5 rounded-lg hover:bg-slate-700/50 text-blue-400 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeletePlan(plan.id)}
                      className="p-1.5 rounded-lg hover:bg-slate-700/50 text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-slate-400 text-xs mb-3">{plan.plan_tagline}</p>

                <div className="flex items-baseline gap-2 mb-3">
                  {plan.is_promotional ? (
                    <>
                      <span className="text-slate-500 line-through text-sm">
                        R$ {plan.monthly_price?.toFixed(2)}
                      </span>
                      <span className="text-2xl font-black text-emerald-400">
                        R$ {plan.promotional_price?.toFixed(2)}
                      </span>
                    </>
                  ) : (
                    <span className="text-2xl font-black text-white">
                      R$ {plan.monthly_price?.toFixed(2)}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-1 mb-3">
                  {plan.is_recommended && (
                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50 text-xs">
                      ⭐ Recomendado
                    </Badge>
                  )}
                  {plan.is_promotional && (
                    <Badge className="bg-red-500/20 text-red-400 border-red-500/50 text-xs">
                      🔥 Promoção
                    </Badge>
                  )}
                  {!plan.is_active && (
                    <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/50 text-xs">
                      Inativo
                    </Badge>
                  )}
                </div>

                <div className="text-xs text-slate-500 space-y-1">
                  <div>ID: {plan.plan_id}</div>
                  <div>Benefícios: {plan.benefits?.length || 0}</div>
                  <div>Ordem: {plan.display_order}</div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-400" />
              {editingPlan?.id ? "Editar Plano" : "Novo Plano"}
            </DialogTitle>
          </DialogHeader>

          {editingPlan && (
            <div className="space-y-4 py-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300">ID do Plano</Label>
                  <Input
                    value={editingPlan.plan_id}
                    onChange={(e) => setEditingPlan({...editingPlan, plan_id: e.target.value})}
                    placeholder="ex: pro, infinity_pro"
                    className="bg-slate-800/50 border-slate-700 text-white"
                  />
                </div>

                <div>
                  <Label className="text-slate-300">Nome do Plano</Label>
                  <Input
                    value={editingPlan.plan_name}
                    onChange={(e) => setEditingPlan({...editingPlan, plan_name: e.target.value})}
                    placeholder="ex: PRO"
                    className="bg-slate-800/50 border-slate-700 text-white"
                  />
                </div>
              </div>

              <div>
                <Label className="text-slate-300">Slogan</Label>
                <Input
                  value={editingPlan.plan_tagline}
                  onChange={(e) => setEditingPlan({...editingPlan, plan_tagline: e.target.value})}
                  placeholder="Descrição curta"
                  className="bg-slate-800/50 border-slate-700 text-white"
                />
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300">Preço Mensal (R$)</Label>
                  <Input
                    type="number"
                    value={editingPlan.monthly_price}
                    onChange={(e) => setEditingPlan({...editingPlan, monthly_price: parseFloat(e.target.value)})}
                    className="bg-slate-800/50 border-slate-700 text-white"
                  />
                </div>

                <div>
                  <Label className="text-slate-300">Preço Promocional (R$)</Label>
                  <Input
                    type="number"
                    value={editingPlan.promotional_price || 0}
                    onChange={(e) => setEditingPlan({...editingPlan, promotional_price: parseFloat(e.target.value)})}
                    className="bg-slate-800/50 border-slate-700 text-white"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-3 bg-slate-800/30 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-300">Em Promoção</Label>
                  <Switch
                    checked={editingPlan.is_promotional}
                    onCheckedChange={(checked) => setEditingPlan({...editingPlan, is_promotional: checked})}
                  />
                </div>

                {editingPlan.is_promotional && (
                  <div>
                    <Label className="text-slate-300">Data Fim Promoção</Label>
                    <Input
                      type="date"
                      value={editingPlan.promotional_end_date || ""}
                      onChange={(e) => setEditingPlan({...editingPlan, promotional_end_date: e.target.value})}
                      className="bg-slate-800/50 border-slate-700 text-white"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Label className="text-slate-300">Plano Recomendado</Label>
                  <Switch
                    checked={editingPlan.is_recommended}
                    onCheckedChange={(checked) => setEditingPlan({...editingPlan, is_recommended: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-slate-300">Ativo</Label>
                  <Switch
                    checked={editingPlan.is_active}
                    onCheckedChange={(checked) => setEditingPlan({...editingPlan, is_active: checked})}
                  />
                </div>

                <div>
                  <Label className="text-slate-300">Ordem de Exibição</Label>
                  <Input
                    type="number"
                    value={editingPlan.display_order}
                    onChange={(e) => setEditingPlan({...editingPlan, display_order: parseInt(e.target.value)})}
                    className="bg-slate-800/50 border-slate-700 text-white"
                  />
                </div>
              </div>

              {/* Limits */}
              <div className="space-y-3 bg-slate-800/30 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">Limites (-1 = Ilimitado)</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-slate-300 text-xs">Trades Totais</Label>
                    <Input
                      type="number"
                      value={editingPlan.limits?.total_trades || -1}
                      onChange={(e) => setEditingPlan({
                        ...editingPlan,
                        limits: { ...editingPlan.limits, total_trades: parseInt(e.target.value) }
                      })}
                      className="bg-slate-800/50 border-slate-700 text-white"
                    />
                  </div>

                  <div>
                    <Label className="text-slate-300 text-xs">Trades Ativos</Label>
                    <Input
                      type="number"
                      value={editingPlan.limits?.active_trades || -1}
                      onChange={(e) => setEditingPlan({
                        ...editingPlan,
                        limits: { ...editingPlan.limits, active_trades: parseInt(e.target.value) }
                      })}
                      className="bg-slate-800/50 border-slate-700 text-white"
                    />
                  </div>

                  <div>
                    <Label className="text-slate-300 text-xs">IA Trader/mês</Label>
                    <Input
                      type="number"
                      value={editingPlan.limits?.ai_trader_uses || -1}
                      onChange={(e) => setEditingPlan({
                        ...editingPlan,
                        limits: { ...editingPlan.limits, ai_trader_uses: parseInt(e.target.value) }
                      })}
                      className="bg-slate-800/50 border-slate-700 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Benefits */}
              <div className="space-y-3">
                <Label className="text-slate-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  Benefícios
                </Label>
                
                <div className="flex gap-2">
                  <Input
                    value={newBenefit}
                    onChange={(e) => setNewBenefit(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddBenefit()}
                    placeholder="Digite um benefício"
                    className="flex-1 bg-slate-800/50 border-slate-700 text-white"
                  />
                  <Button
                    onClick={handleAddBenefit}
                    className="bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-400"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {editingPlan.benefits?.map((benefit, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-slate-800/50 rounded-lg px-3 py-2 border border-slate-700/30"
                    >
                      <span className="text-slate-300 text-sm">{benefit}</span>
                      <button
                        onClick={() => handleRemoveBenefit(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              className="bg-slate-800/50 border-slate-700 text-white"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSavePlan}
              disabled={createPlanMutation.isPending || updatePlanMutation.isPending}
              className="bg-gradient-to-r from-emerald-500 to-teal-600"
            >
              <Save className="w-4 h-4 mr-2" />
              Salvar Plano
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}