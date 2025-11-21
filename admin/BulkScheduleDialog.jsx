import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Calendar, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const TIMEFRAMES = [
  { value: "1m", label: "1 minuto" },
  { value: "5m", label: "5 minutos" },
  { value: "15m", label: "15 minutos" },
  { value: "30m", label: "30 minutos" },
  { value: "1h", label: "1 hora" },
  { value: "4h", label: "4 horas" },
  { value: "1d", label: "1 dia" }
];

export default function BulkScheduleDialog({ 
  open, 
  onOpenChange, 
  type = "spot",
  pairs = [],
  onCreate
}) {
  const [selectedPairs, setSelectedPairs] = useState([]);
  const [selectedTimeframes, setSelectedTimeframes] = useState(["1h"]);
  const [frequency, setFrequency] = useState("daily");
  const [hour, setHour] = useState(0);
  const [daysToCollect, setDaysToCollect] = useState(7);
  const [isCreating, setIsCreating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const validPairs = Array.isArray(pairs) ? pairs : [];

  const toggleAllPairs = () => {
    if (selectedPairs.length === validPairs.length) {
      setSelectedPairs([]);
    } else {
      setSelectedPairs(validPairs.map(p => typeof p === 'string' ? p : p?.symbol || p?.pair));
    }
  };

  const togglePair = (pair) => {
    const pairValue = typeof pair === 'string' ? pair : pair?.symbol || pair?.pair;
    if (selectedPairs.includes(pairValue)) {
      setSelectedPairs(selectedPairs.filter(p => p !== pairValue));
    } else {
      setSelectedPairs([...selectedPairs, pairValue]);
    }
  };

  const toggleAllTimeframes = () => {
    if (selectedTimeframes.length === TIMEFRAMES.length) {
      setSelectedTimeframes([]);
    } else {
      setSelectedTimeframes(TIMEFRAMES.map(tf => tf.value));
    }
  };

  const toggleTimeframe = (tf) => {
    if (selectedTimeframes.includes(tf)) {
      setSelectedTimeframes(selectedTimeframes.filter(t => t !== tf));
    } else {
      setSelectedTimeframes([...selectedTimeframes, tf]);
    }
  };

  const handleCreateSchedules = async () => {
    setIsCreating(true);
    const total = selectedPairs.length * selectedTimeframes.length;
    setProgress({ current: 0, total });

    let current = 0;

    for (const pair of selectedPairs) {
      for (const timeframe of selectedTimeframes) {
        try {
          const scheduleData = {
            name: `${pair} ${timeframe} - ${frequency}`,
            market_type: type,
            timeframe,
            frequency,
            hour,
            days_to_collect: parseInt(daysToCollect),
            is_active: true
          };

          if (type === "spot") {
            scheduleData.pair = pair;
          } else {
            scheduleData.symbol = pair;
          }

          await onCreate(scheduleData);
          current++;
          setProgress({ current, total });
        } catch (error) {
          console.error(`Erro criando agendamento ${pair} ${timeframe}:`, error);
          current++;
          setProgress({ current, total });
        }
      }
    }

    setIsCreating(false);
    alert(`✅ ${current} agendamentos criados com sucesso!`);
    setSelectedPairs([]);
    setSelectedTimeframes(["1h"]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-400" />
            Agendamentos em Lote - {type === "spot" ? "Mercado Spot" : "Mercado Futuros"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Info */}
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-emerald-400 text-sm font-semibold mb-1">Automatize sua Coleta</p>
                <p className="text-slate-300 text-xs">
                  Crie múltiplos agendamentos de uma vez e mantenha seus dados sempre atualizados automaticamente.
                </p>
              </div>
            </div>
          </div>

          {/* Configurações de Horário */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-300 mb-2">Frequência</Label>
              <Select value={frequency} onValueChange={setFrequency}>
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
              <Label className="text-slate-300 mb-2">Hora de Execução (0-23)</Label>
              <Input
                type="number"
                value={hour}
                onChange={(e) => setHour(parseInt(e.target.value) || 0)}
                min="0"
                max="23"
                className="bg-slate-800/50 border-slate-700 text-white"
              />
            </div>
          </div>

          <div>
            <Label className="text-slate-300 mb-2">Dias de Dados por Execução</Label>
            <Input
              type="number"
              value={daysToCollect}
              onChange={(e) => setDaysToCollect(e.target.value)}
              min="1"
              max="365"
              className="bg-slate-800/50 border-slate-700 text-white"
            />
          </div>

          {/* Seleção de Moedas */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-slate-300 text-base font-bold">
                Moedas ({selectedPairs.length}/{validPairs.length})
              </Label>
              <Button
                size="sm"
                onClick={toggleAllPairs}
                className="bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 text-blue-400 text-xs"
              >
                {selectedPairs.length === validPairs.length ? "Desmarcar Todas" : "✅ Selecionar Todas"}
              </Button>
            </div>

            <Card className="bg-slate-800/30 border-slate-700/50 p-4 max-h-60 overflow-y-auto">
              <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                {validPairs.map((pair, idx) => {
                  const pairValue = typeof pair === 'string' ? pair : pair?.symbol || pair?.pair;
                  const pairDisplay = typeof pair === 'string' ? pair : (pair?.displayName || pair?.pair || pair?.symbol);
                  const isSelected = selectedPairs.includes(pairValue);
                  
                  return (
                    <motion.button
                      key={pairValue || idx}
                      onClick={() => togglePair(pair)}
                      className={`px-2 py-2 rounded-lg text-xs font-bold transition-all ${
                        isSelected
                          ? 'bg-emerald-500/30 text-emerald-400 border-2 border-emerald-500/50'
                          : 'bg-slate-700/30 text-slate-400 border border-slate-600/30 hover:bg-slate-700/50'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {pairDisplay}
                    </motion.button>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Seleção de Timeframes */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-slate-300 text-base font-bold">
                Timeframes ({selectedTimeframes.length}/{TIMEFRAMES.length})
              </Label>
              <Button
                size="sm"
                onClick={toggleAllTimeframes}
                className="bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 text-purple-400 text-xs"
              >
                {selectedTimeframes.length === TIMEFRAMES.length ? "Desmarcar Todos" : "✅ Selecionar Todos"}
              </Button>
            </div>

            <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
              {TIMEFRAMES.map(tf => (
                <button
                  key={tf.value}
                  onClick={() => toggleTimeframe(tf.value)}
                  className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                    selectedTimeframes.includes(tf.value)
                      ? 'bg-purple-500/30 text-purple-400 border-2 border-purple-500/50'
                      : 'bg-slate-800/30 text-slate-400 border border-slate-700/30 hover:bg-slate-700/50'
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>

          {/* Resumo */}
          <Card className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/30 p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-slate-400 text-xs mb-1">Total de Agendamentos</div>
                <div className="text-white font-black text-2xl">
                  {selectedPairs.length * selectedTimeframes.length}
                </div>
              </div>
              <div>
                <div className="text-slate-400 text-xs mb-1">Execução</div>
                <div className="text-emerald-400 font-bold text-sm">
                  {frequency === "hourly" ? "A cada hora" : frequency === "daily" ? `Diariamente às ${hour}h` : `Semanalmente às ${hour}h`}
                </div>
              </div>
            </div>
          </Card>

          {/* Progress */}
          <AnimatePresence>
            {isCreating && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Card className="bg-slate-800/30 border-slate-700/50 p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
                    <div className="flex-1">
                      <div className="text-white font-semibold mb-1">Criando agendamentos...</div>
                      <div className="text-slate-400 text-xs">
                        {progress.current} de {progress.total} agendamentos criados
                      </div>
                    </div>
                    <div className="text-emerald-400 font-black text-xl">
                      {progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0}%
                    </div>
                  </div>
                  <div className="w-full bg-slate-700/30 rounded-full h-2 overflow-hidden">
                    <motion.div
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full"
                      initial={{ width: "0%" }}
                      animate={{ 
                        width: progress.total > 0 ? `${(progress.current / progress.total) * 100}%` : "0%" 
                      }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isCreating}
            className="bg-slate-800/50 border-slate-700 text-white"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleCreateSchedules}
            disabled={isCreating || selectedPairs.length === 0 || selectedTimeframes.length === 0}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Criando...
              </>
            ) : (
              <>
                <Calendar className="w-4 h-4 mr-2" />
                Criar {selectedPairs.length * selectedTimeframes.length} Agendamentos
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}