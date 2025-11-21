import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Calendar, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function NewPairNotificationBanner({ onNavigateToSchedules }) {
  const [dismissed, setDismissed] = React.useState(false);
  const queryClient = useQueryClient();

  const { data: allPairs = [] } = useQuery({
    queryKey: ['tradablePairs'],
    queryFn: () => base44.entities.TradablePair.list(),
  });

  const { data: schedules = [] } = useQuery({
    queryKey: ['scheduledCollections'],
    queryFn: () => base44.entities.ScheduledCollection.list(),
  });

  const pairsWithoutSchedule = allPairs.filter(pair => {
    return !schedules.some(schedule => 
      schedule.pair === pair.display_name || 
      schedule.symbol === pair.symbol
    );
  });

  const hasNewPairs = pairsWithoutSchedule.length > 0;

  if (!hasNewPairs || dismissed) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
      >
        <Card className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border-yellow-500/50 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-white font-bold text-sm mb-1">
                  🔔 {pairsWithoutSchedule.length} Novo(s) Par(es) Detectado(s)
                </h4>
                <p className="text-yellow-200 text-xs">
                  Pares sincronizados sem coleta de dados configurada. Configure agendamentos para manter dados atualizados.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={onNavigateToSchedules}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Configurar Agendamentos
              </Button>
              <button
                onClick={() => setDismissed(true)}
                className="p-2 rounded-lg hover:bg-slate-800/50 transition-colors"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}