import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, RotateCcw, Target } from "lucide-react";

export default function FuturesPositionDetails({ position, onClose, onClosePosition, onReversePosition }) {
  if (!position) return null;

  const roi = position.unrealized_pnl_percentage || 0;
  const breakEvenPrice = position.entry_price || 0;

  const quickTPLevels = [10, 15, 25, 50, 75, 100];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="bg-slate-900 border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-white font-bold text-xl">{position.symbol}</h3>
              <span className={`px-2 py-1 rounded text-xs font-bold ${
                position.side === "LONG" 
                  ? "bg-emerald-500/20 text-emerald-400" 
                  : "bg-red-500/20 text-red-400"
              }`}>
                {position.side}
              </span>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={onClose}
              className="bg-slate-800 border-slate-700 hover:bg-slate-700 text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="text-slate-400 text-xs mb-1">Símbolo</div>
              <div className="text-white font-bold">{position.symbol}</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="text-slate-400 text-xs mb-1">Tamanho da Ordem</div>
              <div className="text-white font-bold">{position.quantity}</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="text-slate-400 text-xs mb-1">Preço de Entrada</div>
              <div className="text-white font-bold">$ {position.entry_price.toFixed(2)}</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="text-slate-400 text-xs mb-1">Break Even</div>
              <div className="text-white font-bold">$ {breakEvenPrice.toFixed(2)}</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="text-slate-400 text-xs mb-1">Preço de Referência</div>
              <div className="text-white font-bold">$ {(position.mark_price || position.entry_price).toFixed(2)}</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="text-slate-400 text-xs mb-1">Preço de Liquidação</div>
              <div className="text-yellow-400 font-bold">$ {position.liquidation_price.toFixed(2)}</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="text-slate-400 text-xs mb-1">Taxa de Margem</div>
              <div className="text-white font-bold">{position.leverage}x</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="text-slate-400 text-xs mb-1">Margem</div>
              <div className="text-white font-bold">$ {position.initial_margin.toFixed(2)}</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="text-slate-400 text-xs mb-1">Ganhos e Perdas (ROI)</div>
              <div className={`font-bold ${roi >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {roi >= 0 ? '+' : ''}{roi.toFixed(2)}%
              </div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="text-slate-400 text-xs mb-1">Taxa de Financiamento</div>
              <div className="text-white font-bold">
                {position.funding_rate ? `${(position.funding_rate * 100).toFixed(4)}%` : '0.01%'}
              </div>
            </div>
          </div>

          {/* Quick TP/SL Levels */}
          <div className="mb-6">
            <div className="text-slate-300 text-sm font-semibold mb-3">Fechar em níveis de lucro:</div>
            <div className="grid grid-cols-6 gap-2">
              {quickTPLevels.map((level) => (
                <Button
                  key={level}
                  variant="outline"
                  size="sm"
                  className="bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-400 text-xs"
                >
                  {level}%
                </Button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={() => onClosePosition(position.id, 'market')}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold h-12"
            >
              <X className="w-4 h-4 mr-2" />
              Fechar Tudo (Mercado)
            </Button>

            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => onClosePosition(position.id, 'profit_target')}
                variant="outline"
                className="bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-400 font-bold"
              >
                Fechar no Lucro Alvo
              </Button>
              <Button
                onClick={() => onReversePosition(position.id)}
                variant="outline"
                className="bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20 text-blue-400 font-bold"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Inverter Posição
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}