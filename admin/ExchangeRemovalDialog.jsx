import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Trash2, CheckCircle2, XCircle, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

export default function ExchangeRemovalDialog({ exchange, open, onOpenChange }) {
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [confirmChecked, setConfirmChecked] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open && exchange) {
      loadEvaluation();
    } else {
      setEvaluation(null);
      setConfirmChecked(false);
    }
  }, [open, exchange]);

  const loadEvaluation = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('evaluateExchangeRemoval', { exchange });
      setEvaluation(response.data);
    } catch (error) {
      console.error("Erro ao avaliar remoção:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteMutation = useMutation({
    mutationFn: async (force) => {
      const response = await base44.functions.invoke('deleteExchange', { 
        exchange, 
        force 
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tradablePairs'] });
      queryClient.invalidateQueries({ queryKey: ['pairSyncLogs'] });
      queryClient.invalidateQueries({ queryKey: ['exchangeConnections'] });
      onOpenChange(false);
    }
  });

  const handleDelete = () => {
    const force = evaluation?.can_safely_remove === false;
    deleteMutation.mutate(force);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Trash2 className="w-6 h-6 text-red-400" />
            Excluir Corretora: {exchange}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          </div>
        ) : evaluation ? (
          <div className="space-y-6 mt-4">
            {/* Resumo */}
            <Card className="bg-slate-800/30 border-slate-700 p-4">
              <h4 className="text-white font-semibold mb-3">📊 Resumo do Impacto</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="bg-slate-900/50 rounded-lg p-3 text-center">
                  <div className="text-slate-400 mb-1">Pares</div>
                  <div className="text-white font-bold text-lg">{evaluation.summary.total_pairs}</div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-3 text-center">
                  <div className="text-slate-400 mb-1">Logs</div>
                  <div className="text-white font-bold text-lg">{evaluation.summary.sync_logs}</div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-3 text-center">
                  <div className="text-slate-400 mb-1">Agendamentos</div>
                  <div className="text-white font-bold text-lg">{evaluation.summary.schedules}</div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-3 text-center">
                  <div className="text-slate-400 mb-1">Trades Ativos</div>
                  <div className={`font-bold text-lg ${
                    evaluation.summary.active_trades > 0 ? 'text-red-400' : 'text-emerald-400'
                  }`}>
                    {evaluation.summary.active_trades}
                  </div>
                </div>
              </div>
            </Card>

            {/* Riscos */}
            {evaluation.risks.length > 0 && (
              <Card className="bg-red-500/10 border-red-500/30 p-4">
                <h4 className="text-red-400 font-semibold mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Riscos da Remoção
                </h4>
                <div className="space-y-2">
                  {evaluation.risks.map((risk, index) => (
                    <div key={index} className="bg-slate-900/50 rounded-lg p-3 border-l-4 border-red-500">
                      <div className="flex items-start gap-2 mb-1">
                        <Badge className={`${
                          risk.severity === 'high' ? 'bg-red-500/20 text-red-400' :
                          risk.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-blue-500/20 text-blue-400'
                        } text-xs`}>
                          {risk.severity.toUpperCase()}
                        </Badge>
                        <span className="text-white text-sm font-semibold flex-1">{risk.message}</span>
                      </div>
                      <p className="text-slate-400 text-xs ml-2">{risk.impact}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Benefícios */}
            <Card className="bg-emerald-500/10 border-emerald-500/30 p-4">
              <h4 className="text-emerald-400 font-semibold mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Benefícios da Remoção
              </h4>
              <div className="space-y-2">
                {evaluation.benefits.map((benefit, index) => (
                  <div key={index} className="bg-slate-900/50 rounded-lg p-3 border-l-4 border-emerald-500">
                    <p className="text-white text-sm font-semibold mb-1">{benefit.message}</p>
                    <p className="text-slate-400 text-xs">{benefit.impact}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Funções Afetadas */}
            <Card className="bg-blue-500/10 border-blue-500/30 p-4">
              <h4 className="text-blue-400 font-semibold mb-3">⚙️ Funções Backend Afetadas</h4>
              <ul className="space-y-1 text-sm text-slate-300">
                {evaluation.affected_functions.map((func, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                    <code className="text-blue-400">{func}</code>
                  </li>
                ))}
              </ul>
            </Card>

            {/* Recomendação */}
            <Card className={`${
              evaluation.can_safely_remove 
                ? 'bg-emerald-500/10 border-emerald-500/30' 
                : 'bg-red-500/10 border-red-500/30'
            } p-4`}>
              <h4 className={`font-semibold mb-2 flex items-center gap-2 ${
                evaluation.can_safely_remove ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {evaluation.can_safely_remove ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                Recomendação
              </h4>
              <p className={`text-sm ${evaluation.can_safely_remove ? 'text-emerald-300' : 'text-red-300'}`}>
                {evaluation.recommendation}
              </p>
            </Card>

            {/* Confirmação */}
            <div className="flex items-center gap-3 bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <Checkbox
                checked={confirmChecked}
                onCheckedChange={setConfirmChecked}
                id="confirm-delete"
              />
              <label htmlFor="confirm-delete" className="text-slate-300 text-sm cursor-pointer flex-1">
                Entendo os riscos e quero prosseguir com a exclusão permanente de <strong className="text-white">{exchange}</strong>
              </label>
            </div>
          </div>
        ) : null}

        <DialogFooter className="mt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="bg-slate-800/50 border-slate-700 text-white hover:bg-slate-800"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleDelete}
            disabled={!confirmChecked || deleteMutation.isPending || loading}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {deleteMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Excluindo...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir Permanentemente
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}