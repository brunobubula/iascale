import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Rocket, AlertCircle, Loader2, CheckCircle2, Database, Zap } from "lucide-react";
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

export default function BulkCollectionPanel({ 
  open, 
  onOpenChange, 
  type = "spot", 
  pairs = [], 
  onCollect 
}) {
  const [selectedPairs, setSelectedPairs] = useState([]);
  const [selectedTimeframes, setSelectedTimeframes] = useState(["1h", "4h"]);
  const [days, setDays] = useState(30);
  const [isCollecting, setIsCollecting] = useState(false);
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

  const handleCollect = async () => {
    setIsCollecting(true);
    setProgress({ current: 0, total: selectedPairs.length * selectedTimeframes.length });
    
    try {
      await onCollect(selectedPairs, selectedTimeframes, days, (current, total) => {
        setProgress({ current, total });
      });
      
      setSelectedPairs([]);
      setSelectedTimeframes(["1h", "4h"]);
      onOpenChange(false);
    } catch (error) {
      console.error("Erro na coleta:", error);
    } finally {
      setIsCollecting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="w-5 h-5 text-purple-400" />
            Coleta em Massa - {type === "spot" ? "Mercado Spot" : "Mercado Futuros"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Alertas */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-yellow-400 text-sm font-semibold mb-1">Operação de Alto Volume</p>
                <p className="text-slate-300 text-xs">
                  Esta coleta pode levar vários minutos. Selecione apenas o necessário para otimizar o tempo.
                </p>
              </div>
            </div>
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
                className="bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 text-blue-400"
              >
                {selectedPairs.length === validPairs.length ? "Desmarcar Todas" : "Selecionar Todas"}
              </Button>
            </div>

            <Card className="bg-slate-800/30 border-slate-700/50 p-4 max-h-60 overflow-y-auto">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {validPairs.map((pair, idx) => {
                  const pairValue = typeof pair === 'string' ? pair : pair?.symbol || pair?.pair;
                  const pairDisplay = typeof pair === 'string' ? pair : (pair?.displayName || pair?.pair || pair?.symbol);
                  const isSelected = selectedPairs.includes(pairValue);
                  
                  return (
                    <motion.button
                      key={pairValue || idx}
                      onClick={() => togglePair(pair)}
                      className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
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
                className="bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 text-purple-400"
              >
                {selectedTimeframes.length === TIMEFRAMES.length ? "Desmarcar Todos" : "Selecionar Todos"}
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {TIMEFRAMES.map(tf => (
                <button
                  key={tf.value}
                  onClick={() => toggleTimeframe(tf.value)}
                  className={`px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
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

          {/* Configurações */}
          <div>
            <Label className="text-slate-300 mb-2">Dias de Histórico</Label>
            <Input
              type="number"
              value={days}
              onChange={(e) => setDays(e.target.value)}
              min="1"
              max="365"
              className="bg-slate-800/50 border-slate-700 text-white"
            />
            <p className="text-slate-500 text-xs mt-1">
              Quanto mais dias, mais tempo levará a coleta
            </p>
          </div>

          {/* Resumo */}
          <Card className="bg-blue-500/10 border-blue-500/30 p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-slate-400 text-xs mb-1">Total de Operações</div>
                <div className="text-white font-black text-xl">
                  {selectedPairs.length * selectedTimeframes.length}
                </div>
              </div>
              <div>
                <div className="text-slate-400 text-xs mb-1">Tempo Estimado</div>
                <div className="text-white font-black text-xl">
                  ~{Math.ceil((selectedPairs.length * selectedTimeframes.length * 2) / 60)} min
                </div>
              </div>
            </div>
          </Card>

          {/* Progress */}
          <AnimatePresence>
            {isCollecting && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Card className="bg-slate-800/30 border-slate-700/50 p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                    <div className="flex-1">
                      <div className="text-white font-semibold mb-1">Coletando dados...</div>
                      <div className="text-slate-400 text-xs">
                        {progress.current} de {progress.total} operações concluídas
                      </div>
                    </div>
                    <div className="text-blue-400 font-black text-xl">
                      {progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0}%
                    </div>
                  </div>
                  <div className="w-full bg-slate-700/30 rounded-full h-2 overflow-hidden">
                    <motion.div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-full"
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
            disabled={isCollecting}
            className="bg-slate-800/50 border-slate-700 text-white"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleCollect}
            disabled={isCollecting || selectedPairs.length === 0 || selectedTimeframes.length === 0}
            className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white"
          >
            {isCollecting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Coletando...
              </>
            ) : (
              <>
                <Rocket className="w-4 h-4 mr-2" />
                Iniciar Coleta
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}