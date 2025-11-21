import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Loader2,
  Zap,
  TrendingUp,
  Clock
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

const API_ENDPOINTS = [
  { name: "Kraken", endpoint: "/public/Ticker", testPair: "XXBTZUSD" },
  { name: "Binance", endpoint: "/api/v3/ticker/24hr", testPair: "BTCUSDT" },
  { name: "Bybit", endpoint: "/v5/market/tickers", testPair: "BTCUSDT" },
  { name: "CoinGecko", endpoint: "/api/v3/simple/price", testPair: "bitcoin" }
];

export default function APIHealthMonitor() {
  const queryClient = useQueryClient();
  const [testing, setTesting] = useState(false);

  const { data: healthLogs = [] } = useQuery({
    queryKey: ['apiHealthLogs'],
    queryFn: async () => {
      try {
        const logs = await base44.entities.APIHealthLog.list("-created_date", 50);
        return Array.isArray(logs) ? logs : [];
      } catch (error) {
        return [];
      }
    },
    refetchInterval: 30000
  });

  const runHealthCheckMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('monitorKrakenAPI', {});
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiHealthLogs'] });
      toast.success('✅ Verificação de saúde concluída!');
    },
    onError: (error) => {
      toast.error(`❌ Erro na verificação: ${error.message}`);
    }
  });

  const getAPIStatus = (apiName) => {
    const recentLogs = healthLogs
      .filter(log => log.api_name === apiName)
      .slice(0, 5);

    if (recentLogs.length === 0) return { status: 'unknown', uptime: 0 };

    const successCount = recentLogs.filter(log => log.status === 'success').length;
    const uptime = (successCount / recentLogs.length) * 100;

    const latestLog = recentLogs[0];
    return {
      status: latestLog.status,
      uptime,
      responseTime: latestLog.response_time_ms,
      lastCheck: latestLog.created_date,
      error: latestLog.error_message
    };
  };

  const getOverallHealth = () => {
    const statuses = API_ENDPOINTS.map(api => getAPIStatus(api.name));
    const healthyCount = statuses.filter(s => s.status === 'success').length;
    return {
      healthyCount,
      totalCount: API_ENDPOINTS.length,
      percentage: (healthyCount / API_ENDPOINTS.length) * 100
    };
  };

  const overallHealth = getOverallHealth();

  const getProblematicPairs = () => {
    const pairErrors = {};
    
    healthLogs
      .filter(log => log.status === 'error' && log.test_pair)
      .slice(0, 20)
      .forEach(log => {
        if (!pairErrors[log.test_pair]) {
          pairErrors[log.test_pair] = {
            pair: log.test_pair,
            errors: 0,
            lastError: log.error_message,
            lastCheck: log.created_date
          };
        }
        pairErrors[log.test_pair].errors++;
      });

    return Object.values(pairErrors).sort((a, b) => b.errors - a.errors).slice(0, 5);
  };

  const problematicPairs = getProblematicPairs();

  const getSolutions = () => {
    const solutions = [];

    API_ENDPOINTS.forEach(api => {
      const status = getAPIStatus(api.name);
      if (status.uptime < 80) {
        solutions.push({
          severity: 'high',
          title: `${api.name} com baixa disponibilidade (${status.uptime.toFixed(1)}%)`,
          description: status.error || 'Conexão instável',
          action: 'Verificar credenciais da API ou considerar alternativa',
          autoFixable: false
        });
      }
    });

    problematicPairs.forEach(pair => {
      if (pair.errors >= 3) {
        solutions.push({
          severity: 'medium',
          title: `Par ${pair.pair} com múltiplas falhas (${pair.errors})`,
          description: pair.lastError,
          action: 'Remover par da lista de agendamentos ou verificar símbolo',
          autoFixable: true,
          fixAction: async () => {
            const schedules = await base44.entities.ScheduledCollection.filter({ pair: pair.pair });
            for (const schedule of schedules) {
              await base44.entities.ScheduledCollection.update(schedule.id, { is_active: false });
            }
            toast.success(`Agendamentos do par ${pair.pair} desativados`);
          }
        });
      }
    });

    return solutions;
  };

  const solutions = getSolutions();

  return (
    <div className="space-y-6">
      {/* Health Overview */}
      <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/70 border-slate-800/50 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-black text-white flex items-center gap-3">
              <Activity className="w-6 h-6 text-emerald-400" />
              Status das APIs
            </h3>
            <p className="text-slate-400 text-sm mt-1">
              Monitoramento em tempo real das conexões
            </p>
          </div>
          <Button
            onClick={() => runHealthCheckMutation.mutate()}
            disabled={runHealthCheckMutation.isPending}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold"
          >
            {runHealthCheckMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Verificando...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Verificar Agora
              </>
            )}
          </Button>
        </div>

        {/* Overall Health Bar */}
        <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-700/50 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-300 font-semibold">Saúde Geral do Sistema</span>
            <span className={`font-black text-lg ${
              overallHealth.percentage >= 90 ? 'text-emerald-400' : 
              overallHealth.percentage >= 70 ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {overallHealth.percentage.toFixed(1)}%
            </span>
          </div>
          <Progress value={overallHealth.percentage} className="h-3 mb-2" />
          <p className="text-slate-400 text-xs">
            {overallHealth.healthyCount} de {overallHealth.totalCount} APIs operacionais
          </p>
        </div>

        {/* Individual API Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {API_ENDPOINTS.map((api) => {
            const status = getAPIStatus(api.name);
            
            return (
              <motion.div
                key={api.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className={`p-4 border ${
                  status.status === 'success' ? 'bg-emerald-500/5 border-emerald-500/30' :
                  status.status === 'warning' ? 'bg-yellow-500/5 border-yellow-500/30' :
                  status.status === 'error' ? 'bg-red-500/5 border-red-500/30' :
                  'bg-slate-800/30 border-slate-700/50'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {status.status === 'success' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : status.status === 'error' ? (
                        <XCircle className="w-5 h-5 text-red-400" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-yellow-400" />
                      )}
                      <h4 className="text-white font-bold">{api.name}</h4>
                    </div>
                    <Badge className={`${
                      status.status === 'success' ? 'bg-emerald-500/20 text-emerald-400' :
                      status.status === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                      status.status === 'error' ? 'bg-red-500/20 text-red-400' :
                      'bg-slate-500/20 text-slate-400'
                    } text-xs`}>
                      {status.uptime.toFixed(1)}% uptime
                    </Badge>
                  </div>

                  <div className="space-y-2 text-xs">
                    {status.responseTime && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Tempo de Resposta:</span>
                        <span className="text-white font-semibold">{status.responseTime}ms</span>
                      </div>
                    )}
                    {status.lastCheck && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Última Verificação:</span>
                        <span className="text-white font-semibold">
                          {format(new Date(status.lastCheck), "HH:mm:ss", { locale: ptBR })}
                        </span>
                      </div>
                    )}
                    {status.error && (
                      <div className="bg-red-500/10 border border-red-500/30 rounded p-2 mt-2">
                        <p className="text-red-300 text-xs">{status.error}</p>
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </Card>

      {/* Problematic Pairs Alert */}
      {problematicPairs.length > 0 && (
        <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/30 p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-6 h-6 text-yellow-400" />
            <h3 className="text-xl font-bold text-white">Pares com Problemas</h3>
          </div>
          <div className="space-y-3">
            {problematicPairs.map((pair, idx) => (
              <div key={idx} className="bg-slate-900/50 rounded-lg p-4 border border-yellow-500/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-bold">{pair.pair}</span>
                  <Badge className="bg-red-500/20 text-red-400 text-xs">
                    {pair.errors} erro{pair.errors > 1 ? 's' : ''}
                  </Badge>
                </div>
                <p className="text-slate-300 text-xs mb-2">{pair.lastError}</p>
                <p className="text-slate-500 text-[10px]">
                  Última falha: {format(new Date(pair.lastCheck), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Solutions Panel */}
      {solutions.length > 0 && (
        <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/30 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-6 h-6 text-blue-400" />
            <h3 className="text-xl font-bold text-white">Soluções Recomendadas</h3>
          </div>
          <div className="space-y-3">
            {solutions.map((solution, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`rounded-lg p-4 border ${
                  solution.severity === 'high' ? 'bg-red-500/10 border-red-500/30' :
                  solution.severity === 'medium' ? 'bg-orange-500/10 border-orange-500/30' :
                  'bg-yellow-500/10 border-yellow-500/30'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className={`w-4 h-4 ${
                        solution.severity === 'high' ? 'text-red-400' :
                        solution.severity === 'medium' ? 'text-orange-400' :
                        'text-yellow-400'
                      }`} />
                      <h4 className="text-white font-bold text-sm">{solution.title}</h4>
                      <Badge className={`text-xs ${
                        solution.severity === 'high' ? 'bg-red-500/20 text-red-400' :
                        solution.severity === 'medium' ? 'bg-orange-500/20 text-orange-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {solution.severity.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-slate-300 text-xs mb-2">{solution.description}</p>
                    <div className="bg-slate-900/50 rounded p-2">
                      <p className="text-blue-300 text-xs">
                        💡 <strong>Solução:</strong> {solution.action}
                      </p>
                    </div>
                  </div>
                  {solution.autoFixable && solution.fixAction && (
                    <Button
                      size="sm"
                      onClick={solution.fixAction}
                      className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30"
                    >
                      Corrigir
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent Logs */}
      <Card className="bg-slate-900/50 border-slate-800/50 p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-slate-400" />
          Últimos Registros
        </h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {healthLogs.slice(0, 15).map((log, idx) => (
            <div key={idx} className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/30">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  {log.status === 'success' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-red-400" />
                  )}
                  <span className="text-white font-semibold text-sm">{log.api_name}</span>
                  <span className="text-slate-500 text-xs">• {log.endpoint}</span>
                </div>
                <Badge className={`text-xs ${
                  log.status === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {log.response_time_ms ? `${log.response_time_ms}ms` : log.status}
                </Badge>
              </div>
              {log.error_message && (
                <p className="text-red-300 text-xs mt-1">{log.error_message}</p>
              )}
              <p className="text-slate-500 text-[10px] mt-1">
                {format(new Date(log.created_date), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}