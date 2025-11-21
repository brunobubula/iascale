import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, CheckCircle2, XCircle, Loader2, TrendingUp, AlertTriangle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function PairSyncManager() {
  const queryClient = useQueryClient();
  const [syncResult, setSyncResult] = useState(null);

  const syncMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('syncTradablePairs', {});
      return response.data;
    },
    onSuccess: (data) => {
      setSyncResult(data.stats);
      queryClient.invalidateQueries({ queryKey: ['availablePairs'] });
      queryClient.invalidateQueries({ queryKey: ['syncedPairs'] });
      
      toast.success(
        `✅ Sincronização concluída!\n` +
        `${data.stats.new_pairs_added} novos pares adicionados\n` +
        `${data.stats.obsolete_pairs_removed} pares obsoletos removidos`
      );
    },
    onError: (error) => {
      toast.error(`❌ Erro na sincronização: ${error.message}`);
    }
  });

  return (
    <Card className="bg-slate-900/50 border-slate-800/50 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-blue-400" />
            Sincronização Automática de Pares
          </h3>
          <p className="text-slate-400 text-sm mt-1">
            Mantém todos os pares atualizados automaticamente com as corretoras
          </p>
        </div>
        <Button
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold"
        >
          {syncMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Sincronizando...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Sincronizar Agora
            </>
          )}
        </Button>
      </div>

      {syncResult && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 mt-4"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
              <TrendingUp className="w-5 h-5 text-blue-400 mb-1" />
              <div className="text-2xl font-black text-white">{syncResult.total_spot_pairs}</div>
              <div className="text-xs text-slate-400">Pares Spot</div>
            </div>

            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
              <TrendingUp className="w-5 h-5 text-purple-400 mb-1" />
              <div className="text-2xl font-black text-white">{syncResult.total_futures_pairs}</div>
              <div className="text-xs text-slate-400">Pares Futuros</div>
            </div>

            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 mb-1" />
              <div className="text-2xl font-black text-white">{syncResult.new_pairs_added}</div>
              <div className="text-xs text-slate-400">Novos Adicionados</div>
            </div>

            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <XCircle className="w-5 h-5 text-red-400 mb-1" />
              <div className="text-2xl font-black text-white">{syncResult.obsolete_pairs_removed}</div>
              <div className="text-xs text-slate-400">Removidos</div>
            </div>
          </div>

          {syncResult.obsolete_pairs && syncResult.obsolete_pairs.length > 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-yellow-400 font-bold text-sm mb-2">Pares Obsoletos Removidos:</h4>
                  <div className="flex flex-wrap gap-2">
                    {syncResult.obsolete_pairs.map((pair, idx) => (
                      <Badge key={idx} className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                        {pair}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <p className="text-emerald-400 font-semibold text-sm">
                Sincronização automática a cada 30 minutos
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </Card>
  );
}