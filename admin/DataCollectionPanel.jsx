import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  Download, Rocket, Database, Zap, CheckCircle2, 
  AlertCircle, Loader2, Clock, Calendar, 
  Plus, Trash2, PlayCircle, Pause, Layers
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BulkCollectionPanel from "./BulkCollectionPanel";
import ScheduleCreationDialog from "./ScheduleCreationDialog";
import BulkScheduleDialog from "./BulkScheduleDialog";
import PairSyncManager from "./PairSyncManager";
import PairSyncReport from "./PairSyncReport";
import NewPairNotificationBanner from "./NewPairNotificationBanner";

export default function DataCollectionPanel({ krakenPairs = [], futuresPairs = [] }) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("spot");
  const [showSpotDialog, setShowSpotDialog] = useState(false);
  const [showFuturesDialog, setShowFuturesDialog] = useState(false);
  const [showBulkSpotDialog, setShowBulkSpotDialog] = useState(false);
  const [showBulkFuturesDialog, setShowBulkFuturesDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showBulkScheduleDialog, setShowBulkScheduleDialog] = useState(false);
  const [scheduleType, setScheduleType] = useState("spot");
  
  // Spot Form
  const [spotPair, setSpotPair] = useState("BTC/USDT");
  const [spotTimeframe, setSpotTimeframe] = useState("1h");
  const [spotDays, setSpotDays] = useState(7);
  
  // Futures Form
  const [futuresSymbol, setFuturesSymbol] = useState("");
  const [futuresTimeframe, setFuturesTimeframe] = useState("1h");
  const [futuresDays, setFuturesDays] = useState(7);

  const { data: schedulesData } = useQuery({
    queryKey: ['scheduledCollections'],
    queryFn: async () => {
      try {
        return await base44.entities.ScheduledCollection.list("-created_date");
      } catch (error) {
        console.error("Error loading schedules:", error);
        return [];
      }
    },
    initialData: []
  });

  const schedules = Array.isArray(schedulesData) ? schedulesData : [];

  const { data: marketDataStats } = useQuery({
    queryKey: ['marketDataStats'],
    queryFn: async () => {
      try {
        const allData = await base44.entities.MarketData.list("-created_date", 1);
        return {
          totalRecords: allData?.length || 0,
          lastUpdate: allData?.[0]?.created_date || null
        };
      } catch (error) {
        return { totalRecords: 0, lastUpdate: null };
      }
    }
  });

  const { data: futuresDataStats } = useQuery({
    queryKey: ['futuresDataStats'],
    queryFn: async () => {
      try {
        const allData = await base44.entities.FuturesMarketData.list("-created_date", 1);
        return {
          totalRecords: allData?.length || 0,
          lastUpdate: allData?.[0]?.created_date || null
        };
      } catch (error) {
        return { totalRecords: 0, lastUpdate: null };
      }
    }
  });

  const collectSpotDataMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('collectHistoricalData', {
        pair: spotPair,
        timeframe: spotTimeframe,
        days: parseInt(spotDays)
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['marketDataStats'] });
      setShowSpotDialog(false);
      alert(`✅ Coletados ${data.recordsInserted} registros para ${spotPair}`);
    },
    onError: (error) => {
      alert(`❌ Erro: ${error.message}`);
    }
  });

  const collectFuturesDataMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('collectKrakenFuturesData', {
        symbol: futuresSymbol,
        timeframe: futuresTimeframe,
        days: parseInt(futuresDays)
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['futuresDataStats'] });
      setShowFuturesDialog(false);
      alert(`✅ Coletados ${data.recordsInserted} registros de futuros`);
    },
    onError: (error) => {
      alert(`❌ Erro: ${error.message}`);
    }
  });

  const handleBulkSpotCollect = async (pairs, timeframes, days, onProgress) => {
    let current = 0;
    const total = pairs.length * timeframes.length;

    for (const pair of pairs) {
      for (const timeframe of timeframes) {
        try {
          await base44.functions.invoke('collectHistoricalData', {
            pair,
            timeframe,
            days: parseInt(days)
          });
          current++;
          onProgress(current, total);
        } catch (error) {
          console.error(`Erro coletando ${pair} ${timeframe}:`, error);
          current++;
          onProgress(current, total);
        }
      }
    }

    queryClient.invalidateQueries({ queryKey: ['marketDataStats'] });
    alert(`✅ Coleta concluída! ${total} operações realizadas.`);
  };

  const handleBulkFuturesCollect = async (symbols, timeframes, days, onProgress) => {
    let current = 0;
    const total = symbols.length * timeframes.length;

    for (const symbol of symbols) {
      for (const timeframe of timeframes) {
        try {
          await base44.functions.invoke('collectKrakenFuturesData', {
            symbol,
            timeframe,
            days: parseInt(days)
          });
          current++;
          onProgress(current, total);
        } catch (error) {
          console.error(`Erro coletando ${symbol} ${timeframe}:`, error);
          current++;
          onProgress(current, total);
        }
      }
    }

    queryClient.invalidateQueries({ queryKey: ['futuresDataStats'] });
    alert(`✅ Coleta de futuros concluída! ${total} operações realizadas.`);
  };

  const createScheduleMutation = useMutation({
    mutationFn: async (scheduleData) => {
      return await base44.entities.ScheduledCollection.create(scheduleData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduledCollections'] });
    }
  });

  const toggleScheduleMutation = useMutation({
    mutationFn: async ({ id, isActive }) => {
      return await base44.entities.ScheduledCollection.update(id, { is_active: !isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduledCollections'] });
    }
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: async (id) => {
      return await base44.entities.ScheduledCollection.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduledCollections'] });
    }
  });

  const validKrakenPairs = Array.isArray(krakenPairs) ? krakenPairs : [];
  const validFuturesPairs = Array.isArray(futuresPairs) ? futuresPairs : [];

  return (
    <div className="space-y-6">
      <NewPairNotificationBanner onNavigateToSchedules={() => setActiveTab("schedules")} />
      
      <PairSyncManager />

      {/* Relatório de Sincronização de Pares */}
      <PairSyncReport 
        onNavigateToSchedules={() => setActiveTab("schedules")} 
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/30 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-500/30 flex items-center justify-center">
              <Database className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <div className="text-blue-300 text-xs font-medium">Dados Spot</div>
              <div className="text-white font-black text-2xl">{marketDataStats?.totalRecords || 0}</div>
            </div>
          </div>
          {marketDataStats?.lastUpdate && (
            <div className="text-slate-400 text-xs mt-2">
              Última atualização: {format(new Date(marketDataStats.lastUpdate), "dd/MM HH:mm", { locale: ptBR })}
            </div>
          )}
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-500/30 flex items-center justify-center">
              <Zap className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <div className="text-purple-300 text-xs font-medium">Dados Futuros</div>
              <div className="text-white font-black text-2xl">{futuresDataStats?.totalRecords || 0}</div>
            </div>
          </div>
          {futuresDataStats?.lastUpdate && (
            <div className="text-slate-400 text-xs mt-2">
              Última atualização: {format(new Date(futuresDataStats.lastUpdate), "dd/MM HH:mm", { locale: ptBR })}
            </div>
          )}
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
          <div className="text-slate-400 text-xs mt-2">
            {schedules.length} total
          </div>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-900/50 border border-slate-800/50 p-1">
          <TabsTrigger value="spot" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">
            <Database className="w-4 h-4 mr-2" />
            Spot
          </TabsTrigger>
          <TabsTrigger value="futures" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">
            <Zap className="w-4 h-4 mr-2" />
            Futuros
          </TabsTrigger>
          <TabsTrigger value="schedules" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
            <Calendar className="w-4 h-4 mr-2" />
            Agendamentos
            {schedules.filter(s => s?.is_active).length > 0 && (
              <Badge className="ml-2 bg-emerald-500/30 text-emerald-400 text-xs">
                {schedules.filter(s => s?.is_active).length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* TAB: SPOT */}
        <TabsContent value="spot" className="mt-6 space-y-4">
          <Card className="bg-slate-900/50 border-slate-800/50 p-5">
            <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-400" />
              Coleta de Dados Spot (Kraken)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button
                onClick={() => setShowSpotDialog(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white h-auto py-4"
              >
                <Download className="w-5 h-5 mr-2" />
                Coletar Par Específico
              </Button>

              <Button
                onClick={() => setShowBulkSpotDialog(true)}
                className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white h-auto py-4"
              >
                <Rocket className="w-5 h-5 mr-2" />
                Coleta em Massa
              </Button>
            </div>

            <div className="mt-4 text-slate-400 text-sm">
              <p>• <strong className="text-white">{validKrakenPairs.length}</strong> pares disponíveis na Kraken</p>
              <p>• Use coleta em massa para sincronizar vários timeframes de uma vez</p>
            </div>
          </Card>
        </TabsContent>

        {/* TAB: FUTURES */}
        <TabsContent value="futures" className="mt-6 space-y-4">
          <Card className="bg-slate-900/50 border-slate-800/50 p-5">
            <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-400" />
              Coleta de Dados Futuros (Kraken)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button
                onClick={() => setShowFuturesDialog(true)}
                className="bg-purple-500 hover:bg-purple-600 text-white h-auto py-4"
              >
                <Download className="w-5 h-5 mr-2" />
                Coletar Símbolo Específico
              </Button>

              <Button
                onClick={() => setShowBulkFuturesDialog(true)}
                className="bg-gradient-to-r from-pink-500 to-red-600 hover:from-pink-600 hover:to-red-700 text-white h-auto py-4"
              >
                <Rocket className="w-5 h-5 mr-2" />
                Coleta em Massa
              </Button>
            </div>

            <div className="mt-4 text-slate-400 text-sm">
              <p>• <strong className="text-white">{validFuturesPairs.length}</strong> contratos futuros disponíveis</p>
              <p>• Inclui perpétuos e contratos com data fixa</p>
            </div>
          </Card>
        </TabsContent>

        {/* TAB: SCHEDULES */}
        <TabsContent value="schedules" className="mt-6 space-y-4">
          <Card className="bg-slate-900/50 border-slate-800/50 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-400" />
                Agendamentos Ativos
              </h3>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setScheduleType("spot");
                    setShowBulkScheduleDialog(true);
                  }}
                  className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-bold"
                >
                  <Layers className="w-4 h-4 mr-2" />
                  Lote Spot
                </Button>
                <Button
                  onClick={() => {
                    setScheduleType("futures");
                    setShowBulkScheduleDialog(true);
                  }}
                  className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold"
                >
                  <Layers className="w-4 h-4 mr-2" />
                  Lote Futuros
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {schedules.map((schedule) => (
                <Card key={schedule?.id} className="bg-slate-800/30 border-slate-700/50 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
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

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-slate-400">
                        <div>
                          <span className="text-slate-500">Par:</span>
                          <span className="text-white ml-1">{schedule?.pair || schedule?.symbol}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Timeframe:</span>
                          <span className="text-white ml-1">{schedule?.timeframe}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Frequência:</span>
                          <span className="text-white ml-1">{schedule?.frequency}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Execuções:</span>
                          <span className="text-white ml-1">{schedule?.total_runs || 0}</span>
                        </div>
                      </div>

                      {schedule?.last_run && (
                        <div className="text-xs text-slate-400 mt-2">
                          Última execução: {format(new Date(schedule.last_run), "dd/MM/yyyy HH:mm", { locale: ptBR })}
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

                    <div className="flex items-center gap-2">
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
                          if (confirm(`Deletar agendamento "${schedule.name}"?`)) {
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
              ))}

              {schedules.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  Nenhum agendamento criado ainda
                </div>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog: Coletar Spot Individual */}
      <Dialog open={showSpotDialog} onOpenChange={setShowSpotDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="w-5 h-5 text-blue-400" />
              Coletar Dados Spot
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-slate-300 mb-2">Par</Label>
              <Select value={spotPair} onValueChange={setSpotPair}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 max-h-60">
                  {validKrakenPairs.map(pair => (
                    <SelectItem key={pair} value={pair} className="text-white">
                      {pair}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-slate-300 mb-2">Timeframe</Label>
              <Select value={spotTimeframe} onValueChange={setSpotTimeframe}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="1m" className="text-white">1 minuto</SelectItem>
                  <SelectItem value="5m" className="text-white">5 minutos</SelectItem>
                  <SelectItem value="15m" className="text-white">15 minutos</SelectItem>
                  <SelectItem value="1h" className="text-white">1 hora</SelectItem>
                  <SelectItem value="4h" className="text-white">4 horas</SelectItem>
                  <SelectItem value="1d" className="text-white">1 dia</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-slate-300 mb-2">Dias Históricos</Label>
              <Input
                type="number"
                value={spotDays}
                onChange={(e) => setSpotDays(e.target.value)}
                className="bg-slate-800/50 border-slate-700 text-white"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSpotDialog(false)}
              className="bg-slate-800/50 border-slate-700 text-white"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => collectSpotDataMutation.mutate()}
              disabled={collectSpotDataMutation.isPending}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              {collectSpotDataMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Coletar Dados
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Coletar Futures Individual */}
      <Dialog open={showFuturesDialog} onOpenChange={setShowFuturesDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-400" />
              Coletar Dados Futuros
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-slate-300 mb-2">Símbolo</Label>
              <Select value={futuresSymbol} onValueChange={setFuturesSymbol}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue placeholder="Selecione um contrato" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 max-h-60">
                  {validFuturesPairs.map((pair, idx) => {
                    const symbol = pair?.symbol;
                    const display = pair?.displayName || pair?.pair || symbol;
                    
                    return (
                      <SelectItem key={symbol || idx} value={symbol} className="text-white">
                        {display}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-slate-300 mb-2">Timeframe</Label>
              <Select value={futuresTimeframe} onValueChange={setFuturesTimeframe}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="1m" className="text-white">1 minuto</SelectItem>
                  <SelectItem value="5m" className="text-white">5 minutos</SelectItem>
                  <SelectItem value="15m" className="text-white">15 minutos</SelectItem>
                  <SelectItem value="1h" className="text-white">1 hora</SelectItem>
                  <SelectItem value="4h" className="text-white">4 horas</SelectItem>
                  <SelectItem value="1d" className="text-white">1 dia</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-slate-300 mb-2">Dias Históricos</Label>
              <Input
                type="number"
                value={futuresDays}
                onChange={(e) => setFuturesDays(e.target.value)}
                className="bg-slate-800/50 border-slate-700 text-white"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowFuturesDialog(false)}
              className="bg-slate-800/50 border-slate-700 text-white"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => collectFuturesDataMutation.mutate()}
              disabled={collectFuturesDataMutation.isPending || !futuresSymbol}
              className="bg-purple-500 hover:bg-purple-600 text-white"
            >
              {collectFuturesDataMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Coletar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Spot */}
      <BulkCollectionPanel
        open={showBulkSpotDialog}
        onOpenChange={setShowBulkSpotDialog}
        type="spot"
        pairs={validKrakenPairs}
        onCollect={handleBulkSpotCollect}
      />

      {/* Bulk Futures */}
      <BulkCollectionPanel
        open={showBulkFuturesDialog}
        onOpenChange={setShowBulkFuturesDialog}
        type="futures"
        pairs={validFuturesPairs}
        onCollect={handleBulkFuturesCollect}
      />

      {/* Schedule Dialog */}
      <ScheduleCreationDialog
        open={showScheduleDialog}
        onOpenChange={setShowScheduleDialog}
        pairs={scheduleType === "spot" ? validKrakenPairs : validFuturesPairs}
        type={scheduleType}
        onCreate={(data) => createScheduleMutation.mutate(data)}
      />

      {/* Bulk Schedule Dialog */}
      <BulkScheduleDialog
        open={showBulkScheduleDialog}
        onOpenChange={setShowBulkScheduleDialog}
        type={scheduleType}
        pairs={scheduleType === "spot" ? validKrakenPairs : validFuturesPairs}
        onCreate={(data) => createScheduleMutation.mutate(data)}
      />
    </div>
  );
}