import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Target, Plus, Edit2, Trash2, Bell, CheckCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";

export default function GoalsManager({ currentProfit }) {
  const [showDialog, setShowDialog] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    target_amount: "",
    period: "monthly",
    alert_percentage: 80,
    color: "#10b981"
  });

  const queryClient = useQueryClient();

  const { data: goals = [] } = useQuery({
    queryKey: ['tradingGoals'],
    queryFn: () => base44.entities.TradingGoal.filter({ status: "active" }),
    initialData: []
  });

  const createGoalMutation = useMutation({
    mutationFn: (data) => base44.entities.TradingGoal.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tradingGoals'] });
      setShowDialog(false);
      resetForm();
    }
  });

  const updateGoalMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TradingGoal.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tradingGoals'] });
      setShowDialog(false);
      resetForm();
    }
  });

  const deleteGoalMutation = useMutation({
    mutationFn: (id) => base44.entities.TradingGoal.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tradingGoals'] });
    }
  });

  const resetForm = () => {
    setFormData({
      name: "",
      target_amount: "",
      period: "monthly",
      alert_percentage: 80,
      color: "#10b981"
    });
    setEditingGoal(null);
  };

  const handleSubmit = () => {
    const data = {
      ...formData,
      target_amount: parseFloat(formData.target_amount),
      current_amount: currentProfit,
      start_date: new Date().toISOString(),
      status: "active"
    };

    if (editingGoal) {
      updateGoalMutation.mutate({ id: editingGoal.id, data });
    } else {
      createGoalMutation.mutate(data);
    }
  };

  const handleEdit = (goal) => {
    setEditingGoal(goal);
    setFormData({
      name: goal.name,
      target_amount: goal.target_amount.toString(),
      period: goal.period,
      alert_percentage: goal.alert_percentage,
      color: goal.color
    });
    setShowDialog(true);
  };

  const colors = [
    { value: "#10b981", label: "Verde" },
    { value: "#3b82f6", label: "Azul" },
    { value: "#8b5cf6", label: "Roxo" },
    { value: "#f59e0b", label: "Laranja" },
    { value: "#ef4444", label: "Vermelho" }
  ];

  return (
    <>
      <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Metas de Trading</h2>
              <p className="text-sm text-slate-400">Configure e monitore seus objetivos</p>
            </div>
          </div>
          <Button
            onClick={() => setShowDialog(true)}
            size="sm"
            className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Meta
          </Button>
        </div>

        <div className="space-y-4">
          <AnimatePresence>
            {goals.map((goal, index) => {
              const percentage = Math.min((currentProfit / goal.target_amount) * 100, 100);
              const isCompleted = percentage >= 100;
              const shouldAlert = goal.alert_enabled && percentage >= goal.alert_percentage && !isCompleted;

              return (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-white font-bold">{goal.name}</h3>
                        {isCompleted && (
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                        )}
                        {shouldAlert && (
                          <Bell className="w-4 h-4 text-yellow-400 animate-pulse" />
                        )}
                      </div>
                      <p className="text-xs text-slate-400">
                        Período: {goal.period === "daily" ? "Diário" : goal.period === "weekly" ? "Semanal" : "Mensal"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(goal)}
                        className="h-8 w-8 text-slate-400 hover:text-white"
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteGoalMutation.mutate(goal.id)}
                        className="h-8 w-8 text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Progresso</span>
                      <span className="text-white font-bold">
                        ${currentProfit.toFixed(2)} / ${goal.target_amount.toFixed(2)}
                      </span>
                    </div>
                    <Progress value={percentage} className="h-2" style={{ '--progress-color': goal.color }} />
                    <div className="text-right text-xs text-slate-500">
                      {percentage.toFixed(1)}% completo
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {goals.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma meta definida ainda</p>
              <p className="text-sm">Crie sua primeira meta para começar!</p>
            </div>
          )}
        </div>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-yellow-400" />
              {editingGoal ? "Editar Meta" : "Nova Meta de Trading"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label className="text-slate-300">Nome da Meta</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Meta Mensal de Janeiro"
                className="bg-slate-800/50 border-slate-700 text-white"
              />
            </div>

            <div>
              <Label className="text-slate-300">Valor Alvo (USD)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.target_amount}
                onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                placeholder="1000.00"
                className="bg-slate-800/50 border-slate-700 text-white"
              />
            </div>

            <div>
              <Label className="text-slate-300">Período</Label>
              <Select value={formData.period} onValueChange={(value) => setFormData({ ...formData, period: value })}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="daily" className="text-white">Diário</SelectItem>
                  <SelectItem value="weekly" className="text-white">Semanal</SelectItem>
                  <SelectItem value="monthly" className="text-white">Mensal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-slate-300">Alerta em {formData.alert_percentage}%</Label>
              <Input
                type="range"
                min="50"
                max="95"
                step="5"
                value={formData.alert_percentage}
                onChange={(e) => setFormData({ ...formData, alert_percentage: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>

            <div>
              <Label className="text-slate-300">Cor</Label>
              <div className="grid grid-cols-5 gap-2">
                {colors.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    className={`h-10 rounded-lg border-2 ${
                      formData.color === color.value ? "border-white" : "border-transparent"
                    }`}
                    style={{ backgroundColor: color.value }}
                  />
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDialog(false);
                resetForm();
              }}
              className="bg-slate-800/50 border-slate-700 hover:bg-slate-800 text-white"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.name || !formData.target_amount}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
            >
              {editingGoal ? "Atualizar" : "Criar Meta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}