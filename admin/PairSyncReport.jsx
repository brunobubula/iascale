import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  TrendingUp,
  Database,
  Calendar,
  ChevronRight,
  RefreshCw,
  Plus
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function PairSyncReport({ onNavigateToSchedules }) {
  const [detectingNewPairs, setDetectingNewPairs] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: allPairs = [] } = useQuery({
    queryKey: ['tradablePairs'],
    queryFn: () => base44.entities.TradablePair.list(),
    refetchInterval: 60000,
  });

  const { data: schedules = [] } = useQuery({
    queryKey: ['scheduledCollections'],
    queryFn: () => base44.entities.ScheduledCollection.list(),
  });

  const { data: syncLogs = [] } = useQuery({
    queryKey: ['pairSyncLogs'],
    queryFn: () => base44.entities.PairSyncLog.list("-created_date", 10),
  });

  const { data: newPairsData, refetch: refetchNewPairs } = useQuery({
    queryKey: ['newPairsDetection'],
    queryFn: async () => {
      const response = await base44.functions.invoke('detectNewPairs', {});
      return response.data;
    },
    enabled: false,
  });

  const detectNewPairsMutation = useMutation({
    mutationFn: async () => {
      setDetectingNewPairs(true);
      await refetchNewPairs();
      setDetectingNewPairs(false);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  // Identificar pares sem agendamento localmente
  const pairsWithoutSchedule = allPairs.filter(pair => {
    return !schedules.some(schedule => 
      schedule.pair === pair.display_name || 
      schedule.symbol === pair.symbol
    );
  });

  // Estatísticas
  const stats = {
    totalPairs: allPairs.length,
    activePairs: allPairs.filter(p => p.is_active).length,
    scheduledPairs: schedules.length,
    unscheduledPairs: pairsWithoutSchedule.length,
    recentSyncs: syncLogs.length,
    successRate: syncLogs.length > 0 
      ? ((syncLogs.filter(l => l.status === 'success').length / syncLogs.length) * 100).toFixed(1)
      : 0
  };

  // Últimas sincronizações
  const lastSyncs = syncLogs.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header com Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-4 h-4 text-blue-400" />
            <span className="text-slate-400 text-xs">Total de Pares</span>
          </div>
          <div className="text-white font-bold text-2xl">{stats.totalPairs}</div>
          <div className="text-emerald-400 text-xs mt-1">
            {stats.activePairs} ativos
          </div>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-400 text-xs">Agendados</span>
          </div>
          <div className="text-white font-bold text-2xl">{stats.scheduledPairs}</div>
          <div className="text-slate-400 text-xs mt-1">
            {((stats.scheduledPairs / stats.totalPairs) * 100).toFixed(0)}% cobertura
          </div>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <span className="text-slate-400 text-xs">Sem Coleta</span>
          </div>
          <div className="text-white font-bold text-2xl">{stats.unscheduledPairs}</div>
          <Button
            onClick={() => detectNewPairsMutation.mutate()}
            disabled={detectingNewPairs}
            size="sm"
            className="bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 w-full mt-2 h-7 text-xs"
          >
            {detectingNewPairs ? 'Detectando...' : 'Detectar'}
          </Button>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-400 text-xs">Taxa de Sucesso</span>
          </div>
          <div className="text-white font-bold text-2xl">{stats.successRate}%</div>
          <div className="text-slate-400 text-xs mt-1">
            Últimas {stats.recentSyncs} syncs
          </div>
        </Card>
      </div>

      {/* Pares Sem Agendamento */}
      {pairsWithoutSchedule.length > 0 && (
        <Card className="bg-yellow-500/10 border-yellow-500/30 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              <h4 className="text-yellow-400 font-semibold">
                Novos Pares Detectados ({pairsWithoutSchedule.length})
              </h4>
            </div>
            <Button
              onClick={onNavigateToSchedules}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agendar Coletas
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
            {pairsWithoutSchedule.slice(0, 20).map((pair) => (
              <div key={pair.id} className="bg-slate-900/50 rounded-lg p-2 border border-yellow-500/20">
                <div className="flex items-center justify-between">
                  <span className="text-white font-semibold text-sm">{pair.display_name}</span>
                  <Badge className="bg-slate-700 text-slate-300 text-xs">{pair.exchange}</Badge>
                </div>
                {pair.volume_24h && (
                  <div className="text-slate-400 text-xs mt-1">
                    Vol: ${(pair.volume_24h / 1000000).toFixed(1)}M
                  </div>
                )}
              </div>
            ))}
          </div>
          {pairsWithoutSchedule.length > 20 && (
            <p className="text-yellow-400 text-xs mt-2">
              + {pairsWithoutSchedule.length - 20} outros pares não exibidos
            </p>
          )}
        </Card>
      )}

      {/* Histórico Recente de Sincronizações */}
      <Card className="bg-slate-800/50 border-slate-700 p-4">
        <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-emerald-400" />
          Últimas Sincronizações
        </h4>
        <div className="space-y-2">
          {lastSyncs.length === 0 ? (
            <div className="text-slate-400 text-sm text-center py-4">
              Nenhuma sincronização registrada
            </div>
          ) : (
            lastSyncs.map((log) => (
              <div key={log.id} className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {log.status === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : log.status === 'partial' ? (
                      <AlertTriangle className="w-4 h-4 text-yellow-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400" />
                    )}
                    <span className="text-white font-semibold">{log.exchange}</span>
                    <Badge className={`${
                      log.status === 'success' ? 'bg-emerald-500/20 text-emerald-400' :
                      log.status === 'partial' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    } text-xs`}>
                      {log.status}
                    </Badge>
                  </div>
                  <span className="text-slate-400 text-xs">
                    {format(new Date(log.created_date), "dd/MM 'às' HH:mm", { locale: ptBR })}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-emerald-400">
                    <TrendingUp className="w-3 h-3 inline mr-1" />
                    +{log.pairs_added} novos
                  </div>
                  <div className="text-blue-400">
                    <RefreshCw className="w-3 h-3 inline mr-1" />
                    {log.pairs_updated} atualizados
                  </div>
                  <div className="text-slate-400">
                    Total: {log.total_pairs_active}
                  </div>
                </div>

                {log.error_message && (
                  <div className="mt-2 text-red-400 text-xs bg-red-500/10 rounded p-2">
                    {log.error_message}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Resultado da Detecção de Novos Pares */}
      {newPairsData?.stats && (
        <Card className="bg-blue-500/10 border-blue-500/30 p-4">
          <h4 className="text-blue-400 font-semibold mb-4">📊 Resultado da Detecção</h4>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-slate-900/50 rounded-lg p-3 text-center">
              <div className="text-slate-400 text-xs mb-1">Pares no Sistema</div>
              <div className="text-white font-bold text-xl">{newPairsData.stats.total_pairs}</div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-3 text-center">
              <div className="text-slate-400 text-xs mb-1">Sem Agendamento</div>
              <div className="text-yellow-400 font-bold text-xl">{newPairsData.stats.unscheduled_pairs}</div>
            </div>
          </div>

          {newPairsData.stats.by_exchange.map((exData) => (
            <div key={exData.exchange} className="bg-slate-900/50 rounded-lg p-3 mb-2 border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-white font-semibold">{exData.exchange}</span>
                  <Badge className="bg-yellow-500/20 text-yellow-400 text-xs">
                    {exData.count} não agendados
                  </Badge>
                </div>
                <Button
                  onClick={onNavigateToSchedules}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white h-7 text-xs"
                >
                  Agendar
                  <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
              {exData.count > 0 && (
                <div className="text-slate-400 text-xs">
                  Top pares: {exData.pairs.slice(0, 3).map(p => p.display_name).join(', ')}
                  {exData.count > 3 && ` +${exData.count - 3} mais`}
                </div>
              )}
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}