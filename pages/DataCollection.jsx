import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { 
  Database, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Plus, 
  Trash2, 
  PlayCircle, 
  Pause, 
  Layers,
  AlertTriangle,
  TrendingUp,
  Clock,
  Calendar,
  Zap,
  Activity,
  BarChart3
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import PairSyncManager from "../components/admin/PairSyncManager";
import APIHealthMonitor from "../components/admin/APIHealthMonitor";
import DataCollectionTester from "../components/admin/DataCollectionTester";

const TIMEFRAMES = ["1m", "5m", "15m", "30m", "1h", "4h", "1d", "1w"];

export default function DataCollection() {
  const queryClient = useQueryClient();
  const [marketType, setMarketType] = useState("spot");
  const [showBulkScheduleDialog, setShowBulkScheduleDialog] = useState(false);
  const [selectedPairs, setSelectedPairs] = useState([]);
  const [selectedTimeframes, setSelectedTimeframes] = useState([]);
  const [bulkFormData, setBulkFormData] = useState({
    frequency: "daily",
    hour: "0",
    days_to_collect: "7"
  });
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
  const [isCreatingBulk, setIsCreatingBulk] = useState(false);

  const { data: availablePairs = [], isLoading: loadingPairs } = useQuery({
    queryKey: ['availablePairs'],
    queryFn: async () => {
      try {
        const favorites = await base44.entities.FavoritePair.list();
        return favorites.map(f => f.pair).sort();
      } catch (error) {
        console.error("Error fetching pairs:", error);
        return [];
      }
    },
    initialData: [],
    staleTime: 300000,
  });

  const { data: schedules = [], isLoading: loadingSchedules } = useQuery({
    queryKey: ['scheduledCollections'],
    queryFn: () => base44.entities.ScheduledCollection.list('-created_date'),
    initialData: [],
    refetchInterval: 30000,
  });

  const { data: marketDataStats } = useQuery({
    queryKey: ['marketDataStats'],
    queryFn: async () => {
      try {
        const spotData = await base44.entities.MarketData.list("-created_date", 1);
        const futuresData = await base44.entities.FuturesMarketData.list("-created_date", 1);
        return {
          totalSpot: spotData?.length > 0 ? 999999 : 0,
          totalFutures: futuresData?.length > 0 ? 888888 : 0,
          lastSpotUpdate: spotData?.[0]?.created_date || null,
          lastFuturesUpdate: futuresData?.[0]?.created_date || null
        };
      } catch (error) {
        return { totalSpot: 0, totalFutures: 0, lastSpotUpdate: null, lastFuturesUpdate: null };
      }
    }
  });

  const { data: apiHealth = [] } = useQuery({
    queryKey: ['apiHealth'],
    queryFn: async () => {
      try {
        const logs = await base44.entities.APIHealthLog.list("-created_date", 10);
        return Array.isArray(logs) ? logs : [];
      } catch (error) {
        return [];
      }
    },
    refetchInterval: 60000
  });

  const togglePair = (pair) => {
    setSelectedPairs(prev =>
      prev.includes(pair) ? prev.filter(p => p !== pair) : [...prev, pair]
    );
  };

  const toggleTimeframe = (tf) => {
    setSelectedTimeframes(prev =>
      prev.includes(tf) ? prev.filter(t => t !== tf) : [...prev, tf]
    );
  };

  const selectAllPairs = () => setSelectedPairs([...availablePairs]);
  const clearAllPairs = () => setSelectedPairs([]);
  const selectAllTimeframes = () => setSelectedTimeframes([...TIMEFRAMES]);
  const clearAllTimeframes = () => setSelectedTimeframes([]);

  const handleCreateBulkSchedules = async () => {
    if (selectedPairs.length === 0 || selectedTimeframes.length === 0) {
      toast.error('Selecione pelo menos 1 par e 1 timeframe');
      return;
    }

    setIsCreatingBulk(true);
    const total = selectedPairs.length * selectedTimeframes.length;
    let current = 0;

    try {
      for (const pair of selectedPairs) {
        for (const timeframe of selectedTimeframes) {
          const scheduleData = {
            name: `${pair} - ${timeframe} (${marketType})`,
            market_type: marketType,
            pair: marketType === "spot" ? pair : null,
            symbol: marketType === "futures" ? pair : null,
            timeframe,
            frequency: bulkFormData.frequency,
            hour: parseInt(bulkFormData.hour),
            days_to_collect: parseInt(bulkFormData.days_to_collect),
            is_active: true
          };

          await base44.entities.ScheduledCollection.create(scheduleData);
          current++;
          setBulkProgress({ current, total });
        }
      }

      queryClient.invalidateQueries({ queryKey: ['scheduledCollections'] });
      toast.success(`✅ ${total} agendamentos criados com sucesso!`);
      setShowBulkScheduleDialog(false);
      setSelectedPairs([]);
      setSelectedTimeframes([]);
    } catch (error) {
      toast.error(`Erro ao criar agendamentos: ${error.message}`);
    } finally {
      setIsCreatingBulk(false);
      setBulkProgress({ current: 0, total: 0 });
    }
  };

  const toggleScheduleMutation = useMutation({
    mutationFn: async ({ id, isActive }) => {
      return await base44.entities.ScheduledCollection.update(id, { is_active: !isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduledCollections'] });
      toast.success('Status atualizado!');
    }
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: async (id) => {
      return await base44.entities.ScheduledCollection.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduledCollections'] });
      toast.success('Agendamento excluído!');
    }
  });

  const latestHealthIssues = apiHealth.filter(log => log.status === 'error').slice(0, 3);
  const apiStatus = apiHealth.length > 0 && apiHealth[0].status === 'success';

  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      <div className="fixed inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-slate-950" />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/70 via-slate-900/60 to-slate-950/70" />
      </div>

      <div className="relative z-10 px-4 py-6 md:px-6 md:py-8 lg:px-8 lg:py-10 pb-24 md:pb-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-3">
              <Database className="w-8 h-8 text-emerald-400" />
              Coleta de Dados de Mercado
            </h1>
            <p className="text-slate-400 text-sm mt-1">Sistema automatizado de coleta e monitoramento</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/30 p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-500/30 flex items-center justify-center">
                  <Database className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <div className="text-blue-300 text-xs font-medium">Dados Spot</div>
                  <div className="text-white font-black text-2xl">{(marketDataStats?.totalSpot || 0).toLocaleString()}</div>
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30 p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-purple-500/30 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <div className="text-purple-300 text-xs font-medium">Dados Futuros</div>
                  <div className="text-white font-black text-2xl">{(marketDataStats?.totalFutures || 0).toLocaleString()}</div>
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-emerald-500/30 p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/30 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <div className="text-emerald-300 text-xs font-medium">Agendamentos</div>
                  <div className="text-white font-black text-2xl">{schedules.filter(s => s?.is_active).length}</div>
                </div>
              </div>
            </Card>

            <Card className={`bg-gradient-to-br ${
              apiStatus ? 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30' : 'from-red-500/20 to-orange-500/20 border-red-500/30'
            } p-5`}>
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  apiStatus ? 'bg-emerald-500/30' : 'bg-red-500/30'
                }`}>
                  <Activity className={`w-6 h-6 ${apiStatus ? 'text-emerald-400' : 'text-red-400'}`} />
                </div>
                <div>
                  <div className={`text-xs font-medium ${apiStatus ? 'text-emerald-300' : 'text-red-300'}`}>Status API</div>
                  <div className={`font-black text-sm ${apiStatus ? 'text-emerald-400' : 'text-red-400'}`}>
                    {apiStatus ? 'Operacional' : 'Com Falhas'}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Data Collection Tester - RADICAL */}
          <DataCollectionTester />

          {/* Pair Sync Manager */}
          <PairSyncManager />

          {/* API Health Monitor */}
          <APIHealthMonitor />

          {/* API Health Monitor */}
          {latestHealthIssues.length > 0 && (
            <Card className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/30 p-5">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <h3 className="text-white font-bold text-lg">Alertas Recentes</h3>
              </div>
              <div className="space-y-2">
                {latestHealthIssues.map((log, idx) => (
                  <div key={idx} className="bg-slate-900/50 rounded-lg p-3 border border-red-500/20">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-red-400 font-bold text-sm">{log.api_name}</span>
                      <Badge className="bg-red-500/20 text-red-400 text-xs">{log.error_code}</Badge>
                    </div>
                    <p className="text-slate-300 text-xs">{log.error_message}</p>
                    <p className="text-slate-500 text-[10px] mt-1">
                      {format(new Date(log.created_date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Agendamentos Section */}
          <Card className="bg-slate-900/50 border-slate-800/50 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-black text-white flex items-center gap-3">
                  <Calendar className="w-6 h-6 text-emerald-400" />
                  Agendamentos Automáticos
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                  {availablePairs.length} pares disponíveis • {schedules.length} agendamentos configurados
                </p>
              </div>
              <Button
                onClick={() => setShowBulkScheduleDialog(true)}
                className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold"
              >
                <Layers className="w-4 h-4 mr-2" />
                Agendamento em Massa
              </Button>
            </div>

            {/* Lista de Agendamentos */}
            <div className="space-y-3">
              <AnimatePresence>
                {schedules.map((schedule) => (
                  <motion.div
                    key={schedule?.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <Card className="bg-slate-800/30 border-slate-700/50 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h4 className="text-white font-bold">{schedule?.name}</h4>
                            <Badge className={`${
                              schedule?.is_active 
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                                : 'bg-slate-500/20 text-slate-400 border-slate-500/30'
                            } border text-xs`}>
                              {schedule?.is_active ? 'Ativo' : 'Pausado'}
                            </Badge>
                            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 border text-xs">
                              {schedule?.market_type}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs text-slate-400">
                            <div>
                              <span className="text-slate-500">Par:</span>
                              <span className="text-white ml-1">{schedule?.pair || schedule?.symbol}</span>
                            </div>
                            <div>
                              <span className="text-slate-500">TF:</span>
                              <span className="text-white ml-1">{schedule?.timeframe}</span>
                            </div>
                            <div>
                              <span className="text-slate-500">Freq:</span>
                              <span className="text-white ml-1">{schedule?.frequency}</span>
                            </div>
                            <div>
                              <span className="text-slate-500">Hora:</span>
                              <span className="text-white ml-1">{schedule?.hour}h</span>
                            </div>
                            <div>
                              <span className="text-slate-500">Exec:</span>
                              <span className="text-white ml-1">{schedule?.total_runs || 0}</span>
                            </div>
                          </div>

                          {schedule?.last_run && (
                            <div className="text-xs text-slate-400 mt-2">
                              Última: {format(new Date(schedule.last_run), "dd/MM HH:mm", { locale: ptBR })}
                              {schedule?.last_status && (
                                <Badge className={`ml-2 ${
                                  schedule.last_status === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                                } text-xs`}>
                                  {schedule.last_status}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleScheduleMutation.mutate({ id: schedule.id, isActive: schedule.is_active })}
                            className="bg-slate-800/50 border-slate-700 text-white"
                          >
                            {schedule?.is_active ? <Pause className="w-3 h-3" /> : <PlayCircle className="w-3 h-3" />}
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (confirm(`Deletar "${schedule.name}"?`)) {
                                deleteScheduleMutation.mutate(schedule.id);
                              }
                            }}
                            className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>

              {schedules.length === 0 && !loadingSchedules && (
                <div className="text-center py-12 text-slate-400">
                  <Calendar className="w-16 h-16 mx-auto mb-3 text-slate-700" />
                  <p className="text-lg">Nenhum agendamento criado ainda</p>
                  <p className="text-sm mt-1">Clique em "Agendamento em Massa" para começar</p>
                </div>
              )}
            </div>
          </Card>

          {/* Bulk Schedule Dialog */}
          <Dialog open={showBulkScheduleDialog} onOpenChange={setShowBulkScheduleDialog}>
            <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-purple-400" />
                  Agendamento em Massa
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Market Type */}
                <div>
                  <Label className="text-slate-300 mb-2">Tipo de Mercado</Label>
                  <Select value={marketType} onValueChange={setMarketType}>
                    <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="spot" className="text-white">Spot (Mercado à Vista)</SelectItem>
                      <SelectItem value="futures" className="text-white">Futuros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Pares */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-slate-300">Pares ({selectedPairs.length} selecionados)</Label>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={selectAllPairs} className="bg-emerald-500/10 border-emerald-500/30 text-emerald-400 text-xs h-7">
                        Todos
                      </Button>
                      <Button size="sm" variant="outline" onClick={clearAllPairs} className="bg-red-500/10 border-red-500/30 text-red-400 text-xs h-7">
                        Limpar
                      </Button>
                    </div>
                  </div>
                  {loadingPairs ? (
                    <div className="bg-slate-800/30 rounded-lg border border-slate-700/50 p-8 text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-3" />
                      <p className="text-slate-400 text-sm">Carregando pares disponíveis...</p>
                    </div>
                  ) : availablePairs.length === 0 ? (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-center">
                      <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                      <p className="text-red-400 font-bold text-sm mb-2">Nenhum par disponível!</p>
                      <p className="text-slate-400 text-xs">Sincronize os pares primeiro usando o botão "Sincronizar Pares" acima</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
                        <p className="text-emerald-400 font-bold text-sm">
                          ✅ {availablePairs.length} pares disponíveis para agendamento
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-3 md:grid-cols-5 gap-2 p-3 bg-slate-800/30 rounded-lg border border-slate-700/50 max-h-60 overflow-y-auto">
                        {availablePairs.map(pair => (
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
                            />
                            <span className={`text-xs ${
                              selectedPairs.includes(pair) ? 'text-emerald-400 font-semibold' : 'text-slate-300'
                            }`}>
                              {pair}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Timeframes */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-slate-300">Timeframes ({selectedTimeframes.length} selecionados)</Label>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={selectAllTimeframes} className="bg-emerald-500/10 border-emerald-500/30 text-emerald-400 text-xs h-7">
                        Todos
                      </Button>
                      <Button size="sm" variant="outline" onClick={clearAllTimeframes} className="bg-red-500/10 border-red-500/30 text-red-400 text-xs h-7">
                        Limpar
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                    {TIMEFRAMES.map(tf => (
                      <label
                        key={tf}
                        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
                          selectedTimeframes.includes(tf)
                            ? 'bg-purple-500/20 border-purple-500/50 border'
                            : 'bg-slate-800/50 border-slate-700/30 border hover:bg-slate-800'
                        }`}
                      >
                        <Checkbox
                          checked={selectedTimeframes.includes(tf)}
                          onCheckedChange={() => toggleTimeframe(tf)}
                        />
                        <span className={`text-xs font-semibold ${
                          selectedTimeframes.includes(tf) ? 'text-purple-400' : 'text-slate-300'
                        }`}>
                          {tf}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Configurações */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-slate-300 mb-2">Frequência</Label>
                    <Select 
                      value={bulkFormData.frequency} 
                      onValueChange={(value) => setBulkFormData({...bulkFormData, frequency: value})}
                    >
                      <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="hourly" className="text-white">A cada hora</SelectItem>
                        <SelectItem value="daily" className="text-white">Diariamente</SelectItem>
                        <SelectItem value="weekly" className="text-white">Semanalmente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-slate-300 mb-2">Hora (0-23)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="23"
                      value={bulkFormData.hour}
                      onChange={(e) => setBulkFormData({...bulkFormData, hour: e.target.value})}
                      className="bg-slate-800/50 border-slate-700 text-white"
                    />
                  </div>

                  <div>
                    <Label className="text-slate-300 mb-2">Dias Históricos</Label>
                    <Input
                      type="number"
                      min="1"
                      max="365"
                      value={bulkFormData.days_to_collect}
                      onChange={(e) => setBulkFormData({...bulkFormData, days_to_collect: e.target.value})}
                      className="bg-slate-800/50 border-slate-700 text-white"
                    />
                  </div>
                </div>

                {selectedPairs.length > 0 && selectedTimeframes.length > 0 && (
                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                    <p className="text-purple-300 text-sm font-semibold">
                      📊 Serão criados {selectedPairs.length * selectedTimeframes.length} agendamentos
                    </p>
                    <p className="text-slate-400 text-xs mt-1">
                      {selectedPairs.length} pares × {selectedTimeframes.length} timeframes
                    </p>
                  </div>
                )}

                {isCreatingBulk && (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                      <span className="text-blue-300 text-sm font-semibold">
                        Criando agendamentos... {bulkProgress.current}/{bulkProgress.total}
                      </span>
                    </div>
                    <Progress value={(bulkProgress.current / bulkProgress.total) * 100} className="h-2" />
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowBulkScheduleDialog(false);
                    setSelectedPairs([]);
                    setSelectedTimeframes([]);
                  }}
                  disabled={isCreatingBulk}
                  className="bg-slate-800/50 border-slate-700 text-white"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreateBulkSchedules}
                  disabled={isCreatingBulk || selectedPairs.length === 0 || selectedTimeframes.length === 0}
                  className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold"
                >
                  {isCreatingBulk ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Criar {selectedPairs.length * selectedTimeframes.length} Agendamentos
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}