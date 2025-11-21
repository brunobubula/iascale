import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Calendar, Plus, Trash2, Edit, Play, Pause, CheckCircle2, XCircle, Clock, TrendingUp, AlertCircle, Loader2, Zap, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";

const TIMEFRAMES = [
  { value: "1m", label: "1 Minuto" },
  { value: "5m", label: "5 Minutos" },
  { value: "15m", label: "15 Minutos" },
  { value: "30m", label: "30 Minutos" },
  { value: "1h", label: "1 Hora" },
  { value: "4h", label: "4 Horas" },
  { value: "1d", label: "1 Dia" },
  { value: "1w", label: "1 Semana" }
];



const FREQUENCIES = [
  { value: "hourly", label: "A cada hora", icon: Clock },
  { value: "daily", label: "Diariamente", icon: Calendar },
  { value: "weekly", label: "Semanalmente", icon: TrendingUp }
];

export default function ScheduledCollections() {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [selectedPairs, setSelectedPairs] = useState([]);
  const [selectedTimeframes, setSelectedTimeframes] = useState(["1h"]);
  const [formData, setFormData] = useState({
    frequency: "daily",
    hour: "0",
    days_to_collect: "7",
    is_active: true
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ['scheduledCollections'],
    queryFn: () => base44.entities.ScheduledCollection.list('-created_date'),
    initialData: [],
    refetchInterval: 30000,
  });

  const { data: availablePairs = [] } = useQuery({
    queryKey: ['availablePairs'],
    queryFn: async () => {
      try {
        const favorites = await base44.entities.FavoritePair.list();
        return favorites.map(f => f.pair).sort();
      } catch (error) {
        console.error("Error fetching pairs:", error);
        return ["BTC/USDT", "ETH/USDT", "BNB/USDT", "SOL/USDT"];
      }
    },
    initialData: ["BTC/USDT", "ETH/USDT"],
    staleTime: 300000,
  });

  if (user && user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50 p-8 max-w-md text-center">
          <XCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <h2 className="text-2xl font-bold text-white mb-2">Acesso Negado</h2>
          <p className="text-slate-400">Apenas administradores podem acessar esta página.</p>
        </Card>
      </div>
    );
  }

  const createBulkSchedulesMutation = useMutation({
    mutationFn: async (schedulesData) => {
      const promises = schedulesData.map(data => 
        base44.entities.ScheduledCollection.create(data)
      );
      return await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduledCollections'] });
      setShowDialog(false);
      resetForm();
    },
  });

  const updateScheduleMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ScheduledCollection.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduledCollections'] });
      setShowDialog(false);
      resetForm();
    },
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: (id) => base44.entities.ScheduledCollection.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduledCollections'] });
    },
  });

  const toggleScheduleMutation = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.ScheduledCollection.update(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduledCollections'] });
    },
  });

  const runNowMutation = useMutation({
    mutationFn: async () => {
      return await base44.functions.invoke("runScheduledCollections");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduledCollections'] });
    },
  });

  const resetForm = () => {
    setSelectedPairs([]);
    setSelectedTimeframes(["1h"]);
    setFormData({
      frequency: "daily",
      hour: "0",
      days_to_collect: "7",
      is_active: true
    });
    setEditingSchedule(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (editingSchedule) {
      // Edição de agendamento único (modo antigo)
      const scheduleData = {
        name: `${selectedPairs[0]} - ${selectedTimeframes[0]} (${FREQUENCIES.find(f => f.value === formData.frequency)?.label})`,
        pair: selectedPairs[0],
        timeframe: selectedTimeframes[0],
        frequency: formData.frequency,
        hour: parseInt(formData.hour),
        days_to_collect: parseInt(formData.days_to_collect),
        is_active: formData.is_active,
        last_status: "pending"
      };
      updateScheduleMutation.mutate({ id: editingSchedule.id, data: scheduleData });
    } else {
      // Criação em massa
      const schedulesData = [];
      
      for (const pair of selectedPairs) {
        for (const timeframe of selectedTimeframes) {
          schedulesData.push({
            name: `${pair} - ${timeframe} (${FREQUENCIES.find(f => f.value === formData.frequency)?.label})`,
            pair: pair,
            timeframe: timeframe,
            frequency: formData.frequency,
            hour: parseInt(formData.hour),
            days_to_collect: parseInt(formData.days_to_collect),
            is_active: formData.is_active,
            last_status: "pending",
            total_runs: 0,
            success_runs: 0
          });
        }
      }

      createBulkSchedulesMutation.mutate(schedulesData);
    }
  };

  const handleEdit = (schedule) => {
    setEditingSchedule(schedule);
    setSelectedPairs([schedule.pair]);
    setSelectedTimeframes([schedule.timeframe]);
    setFormData({
      frequency: schedule.frequency,
      hour: schedule.hour.toString(),
      days_to_collect: schedule.days_to_collect.toString(),
      is_active: schedule.is_active
    });
    setShowDialog(true);
  };

  const handleDelete = (id) => {
    if (confirm("Tem certeza que deseja excluir este agendamento?")) {
      deleteScheduleMutation.mutate(id);
    }
  };

  const handleToggle = (id, currentStatus) => {
    toggleScheduleMutation.mutate({ id, is_active: !currentStatus });
  };

  const togglePair = (pair) => {
    setSelectedPairs(prev => 
      prev.includes(pair) 
        ? prev.filter(p => p !== pair)
        : [...prev, pair]
    );
  };

  const toggleTimeframe = (timeframe) => {
    setSelectedTimeframes(prev => 
      prev.includes(timeframe) 
        ? prev.filter(t => t !== timeframe)
        : [...prev, timeframe]
    );
  };

  const selectAllPairs = () => {
    setSelectedPairs([...availablePairs]);
  };

  const clearAllPairs = () => {
    setSelectedPairs([]);
  };

  const selectAllTimeframes = () => {
    setSelectedTimeframes(TIMEFRAMES.map(t => t.value));
  };

  const clearAllTimeframes = () => {
    setSelectedTimeframes([]);
  };

  const totalSchedulesToCreate = selectedPairs.length * selectedTimeframes.length;

  const activeSchedules = schedules.filter(s => s.is_active).length;
  const successRate = schedules.length > 0 && schedules.some(s => s.total_runs > 0)
    ? ((schedules.reduce((sum, s) => sum + (s.success_runs || 0), 0) / 
        schedules.reduce((sum, s) => sum + (s.total_runs || 0), 0)) * 100).toFixed(1)
    : 0;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white">
                  Coletas Agendadas
                </h1>
                <p className="text-slate-400 mt-1">Automatize a coleta de dados históricos</p>
              </div>
            </div>

            <Button
              onClick={() => {
                resetForm();
                setShowDialog(true);
              }}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Agendamento
            </Button>
          </div>
        </motion.div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-slate-400 text-xs">Taxa de Sucesso</p>
                <h3 className="text-white text-xl font-bold">{successRate}%</h3>
              </div>
            </div>
          </Card>

          <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-slate-400 text-xs">Agendamentos Ativos</p>
                <h3 className="text-white text-xl font-bold">{activeSchedules}</h3>
              </div>
            </div>
          </Card>

          <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-slate-400 text-xs">Total de Execuções</p>
                <h3 className="text-white text-xl font-bold">
                  {schedules.reduce((sum, s) => sum + (s.total_runs || 0), 0)}
                </h3>
              </div>
            </div>
          </Card>
        </div>

        {/* Botão de Execução Manual */}
        <div className="mb-6">
          <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30 backdrop-blur-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="text-white font-semibold">Executar Todas as Coletas Agora</h3>
                  <p className="text-slate-400 text-sm">Força a execução de todos os agendamentos ativos</p>
                </div>
              </div>
              <Button
                onClick={() => runNowMutation.mutate()}
                disabled={runNowMutation.isPending || activeSchedules === 0}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
              >
                {runNowMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Executando...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Executar Agora
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>

        {/* Lista de Agendamentos */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-slate-500" />
          </div>
        ) : schedules.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <Calendar className="w-16 h-16 mx-auto mb-4 text-slate-600" />
            <h3 className="text-xl font-semibold text-white mb-2">Nenhum Agendamento Configurado</h3>
            <p className="text-slate-400 mb-6">Crie seu primeiro agendamento para automatizar a coleta de dados</p>
            <Button
              onClick={() => setShowDialog(true)}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Agendamento
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            <AnimatePresence>
              {schedules.map((schedule, index) => {
                const FrequencyIcon = FREQUENCIES.find(f => f.value === schedule.frequency)?.icon || Clock;
                
                return (
                  <motion.div
                    key={schedule.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className={`${
                      schedule.is_active 
                        ? 'bg-slate-900/50 border-slate-800/50' 
                        : 'bg-slate-900/30 border-slate-800/30 opacity-60'
                    } backdrop-blur-xl`}>
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-start gap-3 flex-1">
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                              schedule.last_status === 'success'
                                ? 'bg-emerald-500/20'
                                : schedule.last_status === 'error'
                                ? 'bg-red-500/20'
                                : 'bg-slate-700/20'
                            }`}>
                              <FrequencyIcon className={`w-6 h-6 ${
                                schedule.last_status === 'success'
                                  ? 'text-emerald-400'
                                  : schedule.last_status === 'error'
                                  ? 'text-red-400'
                                  : 'text-slate-400'
                              }`} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-white font-bold text-lg">{schedule.name}</h3>
                                {schedule.is_active ? (
                                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 border">
                                    Ativo
                                  </Badge>
                                ) : (
                                  <Badge className="bg-slate-700/20 text-slate-400 border-slate-700/30 border">
                                    Pausado
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-sm text-slate-400">
                                <span>{schedule.pair}</span>
                                <span>•</span>
                                <span>{schedule.timeframe}</span>
                                <span>•</span>
                                <span>{FREQUENCIES.find(f => f.value === schedule.frequency)?.label}</span>
                                {schedule.frequency !== 'hourly' && (
                                  <>
                                    <span>•</span>
                                    <span>às {schedule.hour}h</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Switch
                              checked={schedule.is_active}
                              onCheckedChange={() => handleToggle(schedule.id, schedule.is_active)}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(schedule)}
                              className="text-slate-400 hover:text-white"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(schedule.id)}
                              className="text-slate-400 hover:text-red-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Estatísticas */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                          <div className="bg-slate-800/30 rounded-lg p-3">
                            <p className="text-slate-500 text-xs mb-1">Execuções</p>
                            <p className="text-white font-bold">{schedule.total_runs || 0}</p>
                          </div>
                          <div className="bg-slate-800/30 rounded-lg p-3">
                            <p className="text-slate-500 text-xs mb-1">Sucessos</p>
                            <p className="text-emerald-400 font-bold">{schedule.success_runs || 0}</p>
                          </div>
                          <div className="bg-slate-800/30 rounded-lg p-3">
                            <p className="text-slate-500 text-xs mb-1">Período</p>
                            <p className="text-white font-bold">{schedule.days_to_collect} dias</p>
                          </div>
                          <div className="bg-slate-800/30 rounded-lg p-3">
                            <p className="text-slate-500 text-xs mb-1">Taxa</p>
                            <p className="text-white font-bold">
                              {schedule.total_runs > 0 
                                ? `${((schedule.success_runs / schedule.total_runs) * 100).toFixed(0)}%`
                                : '-'}
                            </p>
                          </div>
                        </div>

                        {/* Última Execução */}
                        {schedule.last_run && (
                          <div className={`p-3 rounded-lg border ${
                            schedule.last_status === 'success'
                              ? 'bg-emerald-500/5 border-emerald-500/20'
                              : schedule.last_status === 'error'
                              ? 'bg-red-500/5 border-red-500/20'
                              : 'bg-slate-700/5 border-slate-700/20'
                          }`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {schedule.last_status === 'success' ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                ) : schedule.last_status === 'error' ? (
                                  <XCircle className="w-4 h-4 text-red-400" />
                                ) : (
                                  <Clock className="w-4 h-4 text-slate-400" />
                                )}
                                <span className="text-slate-400 text-sm">Última execução:</span>
                              </div>
                              <span className="text-white text-sm font-medium">
                                {format(new Date(schedule.last_run), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              </span>
                            </div>
                            {schedule.last_error && (
                              <div className="mt-2 text-red-400 text-xs">
                                Erro: {schedule.last_error}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6"
        >
          <Card className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 backdrop-blur-xl border-purple-500/30 p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-2">Como Configurar a Execução Automática</h3>
                <p className="text-slate-300 text-sm leading-relaxed mb-3">
                  Os agendamentos criados aqui precisam ser executados por um serviço externo (cron job).
                  Configure um cron para chamar a função <code className="bg-slate-800 px-2 py-0.5 rounded text-purple-400">runScheduledCollections</code> periodicamente.
                </p>
                <div className="bg-slate-800/50 rounded-lg p-3 text-xs text-slate-300 font-mono">
                  <p className="mb-2"><strong className="text-purple-400">Exemplo de configuração:</strong></p>
                  <p>• Frequência horária: Executar a cada 1 hora</p>
                  <p>• Frequência diária: Executar 1x por dia na hora configurada</p>
                  <p>• Frequência semanal: Executar aos domingos na hora configurada</p>
                </div>
                <p className="text-yellow-400 text-sm mt-3 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Use o botão "Executar Agora" para testar seus agendamentos manualmente
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Dialog de Criar/Editar - COM SELEÇÃO MÚLTIPLA */}
      <Dialog open={showDialog} onOpenChange={(open) => {
        if (!open) resetForm();
        setShowDialog(open);
      }}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-400" />
              {editingSchedule ? 'Editar Agendamento' : 'Criar Agendamentos em Massa'}
            </DialogTitle>
            {!editingSchedule && totalSchedulesToCreate > 0 && (
              <div className="mt-2">
                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 border">
                  {totalSchedulesToCreate} agendamento(s) será(ão) criado(s)
                </Badge>
              </div>
            )}
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Seleção de Pares */}
            {!editingSchedule && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-300 font-semibold">Pares de Moedas</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={selectAllPairs}
                      className="bg-slate-800/50 border-slate-700 hover:bg-slate-800 text-white text-xs h-7"
                    >
                      Selecionar Todos
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={clearAllPairs}
                      className="bg-slate-800/50 border-slate-700 hover:bg-slate-800 text-white text-xs h-7"
                    >
                      Limpar
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 p-3 bg-slate-800/30 rounded-lg border border-slate-700/50 max-h-60 overflow-y-auto">
                  {availablePairs.length === 0 ? (
                    <p className="col-span-full text-center text-slate-400 text-sm py-4">
                      Nenhum par disponível. Sincronize os pares primeiro.
                    </p>
                  ) : (
                    availablePairs.map(pair => (
                      <label
                        key={pair}
                        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
                          selectedPairs.includes(pair)
                            ? 'bg-emerald-500/20 border-emerald-500/50 border'
                            : 'bg-slate-800/50 border-slate-700/30 border hover:bg-slate-800'
                        }`}
                      >
                        <Checkbox
                          checked={selectedPairs.includes(pair)}
                          onCheckedChange={() => togglePair(pair)}
                          className="border-slate-600"
                        />
                        <span className={`text-sm ${
                          selectedPairs.includes(pair) ? 'text-emerald-400 font-semibold' : 'text-slate-300'
                        }`}>
                          {pair}
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Seleção de Timeframes */}
            {!editingSchedule && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-300 font-semibold">Timeframes</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={selectAllTimeframes}
                      className="bg-slate-800/50 border-slate-700 hover:bg-slate-800 text-white text-xs h-7"
                    >
                      Selecionar Todos
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={clearAllTimeframes}
                      className="bg-slate-800/50 border-slate-700 hover:bg-slate-800 text-white text-xs h-7"
                    >
                      Limpar
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
                  {TIMEFRAMES.map(tf => (
                    <label
                      key={tf.value}
                      className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
                        selectedTimeframes.includes(tf.value)
                          ? 'bg-blue-500/20 border-blue-500/50 border'
                          : 'bg-slate-800/50 border-slate-700/30 border hover:bg-slate-800'
                      }`}
                    >
                      <Checkbox
                        checked={selectedTimeframes.includes(tf.value)}
                        onCheckedChange={() => toggleTimeframe(tf.value)}
                        className="border-slate-600"
                      />
                      <span className={`text-sm ${
                        selectedTimeframes.includes(tf.value) ? 'text-blue-400 font-semibold' : 'text-slate-300'
                      }`}>
                        {tf.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Configurações Gerais */}
            <div className="space-y-4 p-4 bg-slate-800/20 rounded-lg border border-slate-700/30">
              <h4 className="text-white font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-400" />
                Configurações de Execução
              </h4>

              <div className="space-y-2">
                <Label className="text-slate-300">Frequência</Label>
                <Select value={formData.frequency} onValueChange={(value) => setFormData(prev => ({ ...prev, frequency: value }))}>
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {FREQUENCIES.map(freq => (
                      <SelectItem key={freq.value} value={freq.value} className="text-white">
                        {freq.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.frequency !== 'hourly' && (
                <div className="space-y-2">
                  <Label className="text-slate-300">Hora de Execução (0-23)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="23"
                    value={formData.hour}
                    onChange={(e) => setFormData(prev => ({ ...prev, hour: e.target.value }))}
                    className="bg-slate-800/50 border-slate-700 text-white"
                  />
                  <p className="text-xs text-slate-500">
                    {formData.frequency === 'daily' ? 'Executará todos os dias neste horário' : 'Executará aos domingos neste horário'}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-slate-300">Dias de Dados a Coletar</Label>
                <Input
                  type="number"
                  min="1"
                  max="365"
                  value={formData.days_to_collect}
                  onChange={(e) => setFormData(prev => ({ ...prev, days_to_collect: e.target.value }))}
                  className="bg-slate-800/50 border-slate-700 text-white"
                />
                <p className="text-xs text-slate-500">
                  A cada execução, coletará os últimos {formData.days_to_collect} dias de dados
                </p>
              </div>
            </div>

            {/* Preview do que será criado */}
            {!editingSchedule && totalSchedulesToCreate > 0 && (
              <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/30 rounded-lg p-4 border">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <h4 className="text-emerald-400 font-semibold">
                    Resumo: {totalSchedulesToCreate} agendamento(s) serão criados
                  </h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-800/50 rounded p-2">
                    <span className="text-slate-400">Pares selecionados:</span>
                    <p className="text-white font-semibold mt-1">
                      {selectedPairs.join(", ")}
                    </p>
                  </div>
                  <div className="bg-slate-800/50 rounded p-2">
                    <span className="text-slate-400">Timeframes selecionados:</span>
                    <p className="text-white font-semibold mt-1">
                      {selectedTimeframes.join(", ")}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowDialog(false);
                  resetForm();
                }}
                className="flex-1 bg-slate-800/50 border-slate-700 hover:bg-slate-800 text-white"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={
                  createBulkSchedulesMutation.isPending || 
                  updateScheduleMutation.isPending ||
                  (!editingSchedule && (selectedPairs.length === 0 || selectedTimeframes.length === 0))
                }
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
              >
                {createBulkSchedulesMutation.isPending || updateScheduleMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    {editingSchedule 
                      ? 'Atualizar' 
                      : `Criar ${totalSchedulesToCreate} Agendamento(s)`
                    }
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}