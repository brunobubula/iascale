import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  RefreshCw, 
  Search, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle,
  CheckCircle2,
  Clock,
  Activity,
  Filter,
  X,
  Eye,
  BarChart3,
  Database,
  Zap,
  Power,
  PowerOff,
  Plus,
  Trash2
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import AddExchangeDialog from "./AddExchangeDialog";
import ExchangeRemovalDialog from "./ExchangeRemovalDialog";

export default function PairManagementPanel() {
  const [searchQuery, setSearchQuery] = useState("");
  const [exchangeFilter, setExchangeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("volume");
  const [selectedPair, setSelectedPair] = useState(null);
  const [disableExchangeDialog, setDisableExchangeDialog] = useState(null);
  const [disableReason, setDisableReason] = useState("");
  const [showAddExchangeDialog, setShowAddExchangeDialog] = useState(false);
  const [exchangeToRemove, setExchangeToRemove] = useState(null);
  const queryClient = useQueryClient();

  const { data: pairs = [], isLoading: loadingPairs } = useQuery({
    queryKey: ['tradablePairs'],
    queryFn: () => base44.entities.TradablePair.list("-last_sync_date"),
    refetchInterval: 60000,
  });

  const { data: syncLogs = [] } = useQuery({
    queryKey: ['pairSyncLogs'],
    queryFn: () => base44.entities.PairSyncLog.list("-created_date", 50),
    refetchInterval: 30000,
  });

  const { data: exchangeConnections = [] } = useQuery({
    queryKey: ['exchangeConnections'],
    queryFn: () => base44.entities.ExchangeConnection.list(),
    refetchInterval: 30000,
  });

  const toggleExchangeMutation = useMutation({
    mutationFn: ({ exchange, is_enabled, disabled_reason }) => 
      base44.functions.invoke('toggleExchangeConnection', { exchange, is_enabled, disabled_reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exchangeConnections'] });
      queryClient.invalidateQueries({ queryKey: ['pairSyncLogs'] });
      setDisableExchangeDialog(null);
      setDisableReason("");
    }
  });

  const syncMutation = useMutation({
    mutationFn: (exchange) => {
      if (exchange === 'all') {
        return base44.functions.invoke('syncAllPairs', {});
      }
      return base44.functions.invoke(`sync${exchange}Pairs`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tradablePairs'] });
      queryClient.invalidateQueries({ queryKey: ['pairSyncLogs'] });
    }
  });

  const filteredPairs = pairs.filter(pair => {
    const matchesSearch = pair.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         pair.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesExchange = exchangeFilter === "all" || pair.exchange === exchangeFilter;
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && pair.is_active) ||
                         (statusFilter === "inactive" && !pair.is_active) ||
                         (statusFilter === "trending" && pair.is_trending);
    return matchesSearch && matchesExchange && matchesStatus;
  });

  const sortedPairs = [...filteredPairs].sort((a, b) => {
    switch (sortBy) {
      case "volume":
        return (b.volume_24h || 0) - (a.volume_24h || 0);
      case "change":
        return (b.price_change_24h || 0) - (a.price_change_24h || 0);
      case "name":
        return a.display_name.localeCompare(b.display_name);
      default:
        return 0;
    }
  });

  const stats = {
    total: pairs.length,
    active: pairs.filter(p => p.is_active).length,
    inactive: pairs.filter(p => !p.is_active).length,
    trending: pairs.filter(p => p.is_trending).length,
    byExchange: {
      Binance: pairs.filter(p => p.exchange === 'Binance' && p.is_active).length,
      Kraken: pairs.filter(p => p.exchange === 'Kraken' && p.is_active).length,
      Bybit: pairs.filter(p => p.exchange === 'Bybit' && p.is_active).length,
    }
  };

  const recentNewPairs = pairs
    .filter(p => p.first_seen_date && new Date(p.first_seen_date) > new Date(Date.now() - 24 * 60 * 60 * 1000))
    .length;

  const recentDeactivated = pairs
    .filter(p => p.deactivated_date && new Date(p.deactivated_date) > new Date(Date.now() - 24 * 60 * 60 * 1000))
    .length;

  const getExchangeStatus = (exchange) => {
    const conn = exchangeConnections.find(c => c.exchange === exchange);
    return conn || { is_enabled: true, status: 'active' };
  };

  return (
    <div className="space-y-6">
      {/* Status das Corretoras */}
      <Card className="bg-slate-800/50 border-slate-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Power className="w-4 h-4 text-emerald-400" />
            Status das Corretoras
          </h3>
          <Button
            onClick={() => setShowAddExchangeDialog(true)}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Corretora
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['Binance', 'Kraken', 'Bybit'].map((exchange) => {
            const status = getExchangeStatus(exchange);
            const isEnabled = status.is_enabled !== false;
            const hasError = status.status === 'error';
            
            return (
              <div key={exchange} className={`bg-slate-900/50 rounded-lg p-4 border ${
                !isEnabled ? 'border-red-500/30' : hasError ? 'border-yellow-500/30' : 'border-emerald-500/30'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      !isEnabled ? 'bg-red-500' : hasError ? 'bg-yellow-500' : 'bg-emerald-500'
                    }`}></div>
                    <span className="text-white font-semibold">{exchange}</span>
                  </div>
                  {!isEnabled ? (
                    <Badge className="bg-red-500/20 text-red-400 text-xs">Desativada</Badge>
                  ) : hasError ? (
                    <Badge className="bg-yellow-500/20 text-yellow-400 text-xs">Erro</Badge>
                  ) : (
                    <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">Ativa</Badge>
                  )}
                </div>

                {status.last_error && (
                  <p className="text-red-400 text-xs mb-2">{status.last_error}</p>
                )}

                {status.disabled_reason && (
                  <p className="text-slate-400 text-xs mb-2">{status.disabled_reason}</p>
                )}

                <div className="flex gap-2">
                  {isEnabled ? (
                    <>
                      <Button
                        onClick={() => setDisableExchangeDialog(exchange)}
                        size="sm"
                        className="flex-1 bg-red-500/20 text-red-400 hover:bg-red-500/30"
                      >
                        <PowerOff className="w-3 h-3 mr-1" />
                        Desativar
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        onClick={() => toggleExchangeMutation.mutate({ 
                          exchange, 
                          is_enabled: true, 
                          disabled_reason: null 
                        })}
                        size="sm"
                        className="flex-1 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                      >
                        <Power className="w-3 h-3 mr-1" />
                        Reativar
                      </Button>
                      <Button
                        onClick={() => setExchangeToRemove(exchange)}
                        size="sm"
                        className="flex-1 bg-red-600/20 text-red-400 hover:bg-red-600/30"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Excluir
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-slate-800/50 border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Database className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-slate-400 text-xs">Total de Pares</p>
              <p className="text-white font-bold text-xl">{stats.total}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-slate-400 text-xs">Ativos</p>
              <p className="text-white font-bold text-xl">{stats.active}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-slate-400 text-xs">Inativos</p>
              <p className="text-white font-bold text-xl">{stats.inactive}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-slate-400 text-xs">Em Alta (24h)</p>
              <p className="text-white font-bold text-xl">{stats.trending}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-slate-400 text-xs">Novos (24h)</p>
              <p className="text-white font-bold text-xl">{recentNewPairs}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="bg-slate-800/50 border-slate-700 p-4">
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          Pares por Corretora
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-900/50 rounded-lg p-3">
            <p className="text-slate-400 text-xs mb-1">Binance</p>
            <p className="text-white font-bold text-lg">{stats.byExchange.Binance}</p>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-3">
            <p className="text-slate-400 text-xs mb-1">Kraken</p>
            <p className="text-white font-bold text-lg">{stats.byExchange.Kraken}</p>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-3">
            <p className="text-slate-400 text-xs mb-1">Bybit</p>
            <p className="text-white font-bold text-lg">{stats.byExchange.Bybit}</p>
          </div>
        </div>
      </Card>

      <Card className="bg-slate-800/50 border-slate-700 p-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            Gerenciamento de Pares
          </h3>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => syncMutation.mutate('all')}
              disabled={syncMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              size="sm"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
              Sincronizar Todas
            </Button>
            <Button
              onClick={() => syncMutation.mutate('Binance')}
              disabled={syncMutation.isPending}
              variant="outline"
              className="border-slate-700 text-white hover:bg-slate-700"
              size="sm"
            >
              Binance
            </Button>
            <Button
              onClick={() => syncMutation.mutate('Kraken')}
              disabled={syncMutation.isPending}
              variant="outline"
              className="border-slate-700 text-white hover:bg-slate-700"
              size="sm"
            >
              Kraken
            </Button>
            <Button
              onClick={() => syncMutation.mutate('Bybit')}
              disabled={syncMutation.isPending}
              variant="outline"
              className="border-slate-700 text-white hover:bg-slate-700"
              size="sm"
            >
              Bybit
            </Button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar par..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-900/50 border-slate-700 text-white"
            />
          </div>

          <Select value={exchangeFilter} onValueChange={setExchangeFilter}>
            <SelectTrigger className="w-full md:w-[150px] bg-slate-900/50 border-slate-700 text-white">
              <SelectValue placeholder="Corretora" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all" className="text-white">Todas</SelectItem>
              <SelectItem value="Binance" className="text-white">Binance</SelectItem>
              <SelectItem value="Kraken" className="text-white">Kraken</SelectItem>
              <SelectItem value="Bybit" className="text-white">Bybit</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[150px] bg-slate-900/50 border-slate-700 text-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all" className="text-white">Todos</SelectItem>
              <SelectItem value="active" className="text-white">Ativos</SelectItem>
              <SelectItem value="inactive" className="text-white">Inativos</SelectItem>
              <SelectItem value="trending" className="text-white">Em Alta</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full md:w-[150px] bg-slate-900/50 border-slate-700 text-white">
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="volume" className="text-white">Volume 24h</SelectItem>
              <SelectItem value="change" className="text-white">Variação 24h</SelectItem>
              <SelectItem value="name" className="text-white">Nome</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loadingPairs ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
          </div>
        ) : (
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {sortedPairs.map((pair) => (
              <motion.div
                key={pair.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-slate-900/50 rounded-lg p-3 hover:bg-slate-900/70 transition-colors cursor-pointer"
                onClick={() => setSelectedPair(pair)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold">{pair.display_name}</span>
                      <Badge className={`${
                        pair.is_active 
                          ? 'bg-emerald-500/20 text-emerald-400' 
                          : 'bg-red-500/20 text-red-400'
                      } text-xs`}>
                        {pair.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                      {pair.is_trending && (
                        <Badge className="bg-yellow-500/20 text-yellow-400 text-xs">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          Em Alta
                        </Badge>
                      )}
                    </div>
                    <span className="text-slate-400 text-sm">{pair.exchange}</span>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-slate-400 text-xs">Preço</p>
                      <p className="text-white font-semibold">${pair.current_price?.toFixed(2) || '-'}</p>
                    </div>

                    <div className="text-right">
                      <p className="text-slate-400 text-xs">24h</p>
                      <p className={`font-semibold ${
                        (pair.price_change_24h || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {(pair.price_change_24h || 0) >= 0 ? '+' : ''}{pair.price_change_24h?.toFixed(2) || '0.00'}%
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-slate-400 text-xs">Volume 24h</p>
                      <p className="text-white font-semibold">
                        ${(pair.volume_24h || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </p>
                    </div>

                    <Eye className="w-4 h-4 text-slate-500" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </Card>

      <Card className="bg-slate-800/50 border-slate-700 p-4">
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-400" />
          Histórico de Sincronizações (50 mais recentes)
        </h3>
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {syncLogs.map((log) => (
            <div key={log.id} className="bg-slate-900/50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg ${
                    log.status === 'success' ? 'bg-emerald-500/20' : 'bg-red-500/20'
                  } flex items-center justify-center`}>
                    {log.status === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{log.exchange}</p>
                    <p className="text-slate-400 text-xs">
                      {format(new Date(log.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-emerald-400 text-xs">+{log.pairs_added || 0} novos</p>
                    <p className="text-blue-400 text-xs">~{log.pairs_updated || 0} atualizados</p>
                  </div>
                  {log.pairs_deactivated > 0 && (
                    <div className="text-right">
                      <p className="text-red-400 text-xs">-{log.pairs_deactivated} removidos</p>
                    </div>
                  )}
                  <div className="text-right">
                    <p className="text-slate-400 text-xs">{log.execution_time_ms}ms</p>
                  </div>
                </div>
              </div>
              {log.error_message && (
                <p className="text-red-400 text-xs mt-2">{log.error_message}</p>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Dialog open={!!selectedPair} onOpenChange={() => setSelectedPair(null)}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl">
          {selectedPair && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl flex items-center gap-2">
                  {selectedPair.display_name}
                  <Badge className={`${
                    selectedPair.is_active 
                      ? 'bg-emerald-500/20 text-emerald-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {selectedPair.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <p className="text-slate-400 text-xs mb-1">Corretora</p>
                    <p className="text-white font-semibold">{selectedPair.exchange}</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <p className="text-slate-400 text-xs mb-1">Símbolo</p>
                    <p className="text-white font-semibold">{selectedPair.symbol}</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <p className="text-slate-400 text-xs mb-1">Preço Atual</p>
                    <p className="text-white font-semibold">${selectedPair.current_price?.toFixed(2) || '-'}</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <p className="text-slate-400 text-xs mb-1">Variação 24h</p>
                    <p className={`font-semibold ${
                      (selectedPair.price_change_24h || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {(selectedPair.price_change_24h || 0) >= 0 ? '+' : ''}{selectedPair.price_change_24h?.toFixed(2) || '0.00'}%
                    </p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <p className="text-slate-400 text-xs mb-1">Volume 24h</p>
                    <p className="text-white font-semibold">
                      ${(selectedPair.volume_24h || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <p className="text-slate-400 text-xs mb-1">Alta 24h / Baixa 24h</p>
                    <p className="text-white font-semibold text-xs">
                      ${selectedPair.high_24h?.toFixed(2) || '-'} / ${selectedPair.low_24h?.toFixed(2) || '-'}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-800/50 rounded-lg p-3">
                  <p className="text-slate-400 text-xs mb-2">Datas</p>
                  <div className="space-y-1 text-xs">
                    {selectedPair.first_seen_date && (
                      <p className="text-white">
                        <span className="text-slate-400">Adicionado:</span>{' '}
                        {format(new Date(selectedPair.first_seen_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    )}
                    {selectedPair.last_sync_date && (
                      <p className="text-white">
                        <span className="text-slate-400">Última Sincronização:</span>{' '}
                        {format(new Date(selectedPair.last_sync_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    )}
                    {selectedPair.deactivated_date && (
                      <p className="text-red-400">
                        <span className="text-slate-400">Desativado:</span>{' '}
                        {format(new Date(selectedPair.deactivated_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Desativação de Exchange */}
      <Dialog open={!!disableExchangeDialog} onOpenChange={() => setDisableExchangeDialog(null)}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PowerOff className="w-5 h-5 text-red-400" />
              Desativar {disableExchangeDialog}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <p className="text-slate-300 text-sm">
              Ao desativar esta corretora, a sincronização automática de pares será interrompida. 
              Os pares existentes permanecerão no sistema mas não serão mais atualizados.
            </p>

            <div>
              <label className="text-slate-400 text-sm mb-2 block">Motivo da Desativação</label>
              <Input
                placeholder="Ex: Restrição regional, erro de API..."
                value={disableReason}
                onChange={(e) => setDisableReason(e.target.value)}
                className="bg-slate-800/50 border-slate-700 text-white"
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setDisableExchangeDialog(null);
                setDisableReason("");
              }}
              className="bg-slate-800/50 border-slate-700 text-white hover:bg-slate-800"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                toggleExchangeMutation.mutate({
                  exchange: disableExchangeDialog,
                  is_enabled: false,
                  disabled_reason: disableReason || 'Desativado pelo administrador'
                });
              }}
              disabled={toggleExchangeMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {toggleExchangeMutation.isPending ? 'Desativando...' : 'Desativar Corretora'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AddExchangeDialog 
        open={showAddExchangeDialog} 
        onOpenChange={setShowAddExchangeDialog} 
      />

      <ExchangeRemovalDialog
        exchange={exchangeToRemove}
        onOpenChange={(open) => !open && setExchangeToRemove(null)}
        onConfirm={() => {
          // Aqui você pode adicionar lógica adicional após a remoção
          setExchangeToRemove(null);
        }}
      />
    </div>
  );
}