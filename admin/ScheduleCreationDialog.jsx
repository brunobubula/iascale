
import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

const TIMEFRAMES = [
  { value: "1m", label: "1 minuto" },
  { value: "5m", label: "5 minutos" },
  { value: "15m", label: "15 minutos" },
  { value: "30m", label: "30 minutos" },
  { value: "1h", label: "1 hora" },
  { value: "4h", label: "4 horas" },
  { value: "1d", label: "1 dia" }
];

export default function ScheduleCreationDialog({ open, onOpenChange, pairs = [], type = "spot", onCreate }) {
  const [name, setName] = useState("");
  const [selectedPairs, setSelectedPairs] = useState([]);
  const [selectedTimeframes, setSelectedTimeframes] = useState(["1h"]);
  const [frequency, setFrequency] = useState("daily");
  const [hour, setHour] = useState(0);
  const [daysToCollect, setDaysToCollect] = useState(7);

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

  const handleCreate = () => {
    selectedPairs.forEach(pair => {
      selectedTimeframes.forEach(timeframe => {
        const scheduleData = {
          name: `${name} - ${pair} - ${timeframe}`,
          market_type: type,
          [type === 'spot' ? 'pair' : 'symbol']: pair,
          timeframe,
          frequency,
          hour: parseInt(hour),
          days_to_collect: parseInt(daysToCollect),
          is_active: true
        };
        
        onCreate(scheduleData);
      });
    });

    setName("");
    setSelectedPairs([]);
    setSelectedTimeframes(["1h"]);
    onOpenChange(false);
  };

  const totalSchedules = selectedPairs.length * selectedTimeframes.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-emerald-400" />
            Criar Agendamentos em Lote
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <Label className="text-slate-300 mb-2">Nome Base do Agendamento</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Coleta Diária"
              className="bg-slate-800/50 border-slate-700 text-white"
            />
            <p className="text-slate-500 text-xs mt-1">
              O nome completo será: "{name} - PAR - TIMEFRAME"
            </p>
          </div>

          {/* Moedas */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-slate-300 font-bold">
                Moedas ({selectedPairs.length}/{validPairs.length})
              </Label>
              <Button
                size="sm"
                onClick={toggleAllPairs}
                className="bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 text-blue-400"
              >
                {selectedPairs.length === validPairs.length ? "Desmarcar" : "Todas"}
              </Button>
            </div>

            <Card className="bg-slate-800/30 border-slate-700/50 p-3 max-h-48 overflow-y-auto">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {validPairs.map((pair, idx) => {
                  const pairValue = typeof pair === 'string' ? pair : pair?.symbol || pair?.pair;
                  const pairDisplay = typeof pair === 'string' ? pair : (pair?.displayName || pair?.pair || pair?.symbol);
                  const isSelected = selectedPairs.includes(pairValue);
                  
                  return (
                    <button
                      key={pairValue || idx}
                      onClick={() => togglePair(pair)}
                      className={`px-2 py-1.5 rounded text-xs font-semibold transition-all ${
                        isSelected
                          ? 'bg-emerald-500/30 text-emerald-400 border border-emerald-500/50'
                          : 'bg-slate-700/30 text-slate-400 border border-slate-600/30 hover:bg-slate-700/50'
                      }`}
                    >
                      {pairDisplay}
                    </button>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Timeframes */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-slate-300 font-bold">
                Timeframes ({selectedTimeframes.length}/{TIMEFRAMES.length})
              </Label>
              <Button
                size="sm"
                onClick={toggleAllTimeframes}
                className="bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 text-purple-400"
              >
                {selectedTimeframes.length === TIMEFRAMES.length ? "Desmarcar" : "Todos"}
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {TIMEFRAMES.map(tf => (
                <button
                  key={tf.value}
                  onClick={() => toggleTimeframe(tf.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
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

          {/* Configurações de Execução */}
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
              <Label className="text-slate-300 mb-2">Horário (0-23h)</Label>
              <Input
                type="number"
                value={hour}
                onChange={(e) => setHour(e.target.value)}
                min="0"
                max="23"
                className="bg-slate-800/50 border-slate-700 text-white"
              />
            </div>

            <div className="col-span-2">
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
          </div>

          {/* Resumo Final */}
          <Card className="bg-emerald-500/10 border-emerald-500/30 p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              <div>
                <div className="text-white font-bold mb-1">
                  {totalSchedules} agendamento{totalSchedules !== 1 ? 's' : ''} será{totalSchedules !== 1 ? 'ão' : ''} criado{totalSchedules !== 1 ? 's' : ''}
                </div>
                <div className="text-slate-300 text-xs">
                  {selectedPairs.length} moeda{selectedPairs.length !== 1 ? 's' : ''} × {selectedTimeframes.length} timeframe{selectedTimeframes.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          </Card>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="bg-slate-800/50 border-slate-700 text-white"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!name || selectedPairs.length === 0 || selectedTimeframes.length === 0}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Criar {totalSchedules} Agendamento{totalSchedules !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
