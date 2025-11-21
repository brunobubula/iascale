import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Bell, Plus, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import DynamicPairSelector from "./DynamicPairSelector";
import { useCryptoPrice } from "./trades/useCryptoPrice";

export default function PairAlertManager({ hideExchangeNames = false }) {
  const [showDialog, setShowDialog] = useState(false);
  const [selectedPair, setSelectedPair] = useState("");
  const [alertName, setAlertName] = useState("");
  const [conditionType, setConditionType] = useState("price_above");
  const [targetValue, setTargetValue] = useState("");
  const [notificationType, setNotificationType] = useState("push");
  
  const queryClient = useQueryClient();

  const { data: alerts = [] } = useQuery({
    queryKey: ['pairAlerts'],
    queryFn: () => base44.entities.PairAlert.list("-created_date"),
    refetchInterval: 30000,
  });

  // Buscar preços em tempo real dos pares com alertas
  const alertPairs = [...new Set(alerts.map(a => a.pair_display_name))];
  const realtimePrices = useCryptoPrice(alertPairs);

  const createAlertMutation = useMutation({
    mutationFn: (data) => base44.entities.PairAlert.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pairAlerts'] });
      setShowDialog(false);
      resetForm();
    }
  });

  const deleteAlertMutation = useMutation({
    mutationFn: (id) => base44.entities.PairAlert.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pairAlerts'] });
    }
  });

  const toggleAlertMutation = useMutation({
    mutationFn: ({ id, is_active }) => 
      base44.entities.PairAlert.update(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pairAlerts'] });
    }
  });

  const resetForm = () => {
    setSelectedPair("");
    setAlertName("");
    setConditionType("price_above");
    setTargetValue("");
    setNotificationType("push");
  };

  const handleCreate = () => {
    if (!selectedPair || !alertName || !targetValue) return;

    createAlertMutation.mutate({
      pair_symbol: selectedPair.replace('/', ''),
      pair_display_name: selectedPair,
      alert_name: alertName,
      condition_type: conditionType,
      target_value: parseFloat(targetValue),
      notification_type: notificationType,
      is_active: true
    });
  };

  const getConditionLabel = (type) => {
    switch (type) {
      case 'price_above': return 'Preço acima de';
      case 'price_below': return 'Preço abaixo de';
      case 'change_24h_above': return 'Variação 24h acima de';
      case 'change_24h_below': return 'Variação 24h abaixo de';
      default: return type;
    }
  };

  return (
    <div className="space-y-4">
      <Card className="bg-slate-800/50 border-slate-700 p-3 md:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-emerald-400" />
            <h3 className="text-white font-semibold text-sm md:text-base">Meus Alertas de Pares</h3>
          </div>
          <Button
            onClick={() => setShowDialog(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Alerta
          </Button>
        </div>

        <div className="space-y-2">
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              Nenhum alerta configurado
            </div>
          ) : (
            alerts.map((alert) => {
              const realtimePrice = realtimePrices[alert.pair_display_name]?.price;
              const currentPrice = realtimePrice || 0;
              
              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/30 hover:bg-slate-900/70 transition-all"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-white font-semibold text-sm">{alert.pair_display_name}</span>
                        <Badge className={`${
                          alert.is_active 
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                            : 'bg-slate-700 text-slate-400'
                        } border text-xs`}>
                          {alert.is_active ? 'Ativo' : 'Pausado'}
                        </Badge>
                      </div>
                      <p className="text-slate-400 text-xs mb-1">
                        {alert.alert_name} • {getConditionLabel(alert.condition_type)}{' '}
                        {alert.condition_type.includes('price') ? `$${alert.target_value.toFixed(8)}` : `${alert.target_value}%`}
                      </p>
                      {currentPrice > 0 && (
                        <p className="text-emerald-400 text-xs font-semibold">
                          Preço atual: ${currentPrice.toFixed(8)}
                        </p>
                      )}
                      {alert.times_triggered > 0 && (
                        <p className="text-yellow-400 text-xs mt-1">
                          Disparado {alert.times_triggered}x
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => toggleAlertMutation.mutate({ 
                          id: alert.id, 
                          is_active: !alert.is_active 
                        })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          alert.is_active
                            ? "bg-slate-700 text-white hover:bg-slate-600"
                            : "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30"
                        }`}
                      >
                        {alert.is_active ? 'Pausar' : 'Ativar'}
                      </button>
                      <button
                        onClick={() => deleteAlertMutation.mutate(alert.id)}
                        className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all border border-red-500/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-emerald-400" />
              Novo Alerta de Par
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <label className="text-slate-400 text-sm mb-2 block">Nome do Alerta</label>
              <Input
                placeholder="Ex: BTC acima de 100k"
                value={alertName}
                onChange={(e) => setAlertName(e.target.value)}
                className="bg-slate-800/50 border-slate-700 text-white"
              />
            </div>

            <div>
              <label className="text-slate-400 text-sm mb-2 block">Par de Moedas</label>
              <DynamicPairSelector
                value={selectedPair}
                onChange={setSelectedPair}
                showMetrics={true}
                hideExchangeNames={hideExchangeNames}
              />
            </div>

            <div>
              <label className="text-slate-400 text-sm mb-2 block">Condição</label>
              <Select value={conditionType} onValueChange={setConditionType}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="price_above" className="text-white">Preço acima de</SelectItem>
                  <SelectItem value="price_below" className="text-white">Preço abaixo de</SelectItem>
                  <SelectItem value="change_24h_above" className="text-white">Variação 24h acima de</SelectItem>
                  <SelectItem value="change_24h_below" className="text-white">Variação 24h abaixo de</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-slate-400 text-sm mb-2 block">
                Valor Alvo {conditionType.includes('price') ? '($)' : '(%)'}
              </label>
              <Input
                type="number"
                step="0.01"
                placeholder={conditionType.includes('price') ? "100000" : "10"}
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                className="bg-slate-800/50 border-slate-700 text-white"
              />
            </div>

            <div>
              <label className="text-slate-400 text-sm mb-2 block">Tipo de Notificação</label>
              <Select value={notificationType} onValueChange={setNotificationType}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="push" className="text-white">Apenas Push</SelectItem>
                  <SelectItem value="email" className="text-white">Apenas Email</SelectItem>
                  <SelectItem value="both" className="text-white">Push + Email</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              className="bg-slate-800/50 border-slate-700 text-white hover:bg-slate-800"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!selectedPair || !alertName || !targetValue || createAlertMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {createAlertMutation.isPending ? 'Criando...' : 'Criar Alerta'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}