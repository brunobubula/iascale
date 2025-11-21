import React from "react";
import { Card } from "@/components/ui/card";
import { Activity, Shield, TrendingUp, AlertTriangle } from "lucide-react";

export default function FuturesMetrics({ account, positions }) {
  if (!account) return null;

  const totalPositionValue = positions.reduce((sum, pos) => {
    const notional = pos.quantity * (pos.mark_price || pos.entry_price);
    return sum + notional;
  }, 0);

  const totalMaintenanceMargin = positions.reduce((sum, pos) => sum + (pos.maintenance_margin || 0), 0);
  
  const marginRatio = account.wallet_balance > 0 
    ? (account.position_margin / account.wallet_balance) * 100 
    : 0;

  const avgLiquidationDistance = positions.length > 0
    ? positions.reduce((sum, pos) => {
        const currentPrice = pos.mark_price || pos.entry_price;
        const distance = Math.abs((currentPrice - pos.liquidation_price) / currentPrice * 100);
        return sum + distance;
      }, 0) / positions.length
    : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
      <Card className="bg-slate-900/50 border-slate-800/50 p-3">
        <div className="flex items-center gap-2 mb-1">
          <Activity className="w-3 h-3 text-blue-400" />
          <span className="text-slate-400 text-xs">Rácio de Margem</span>
        </div>
        <div className={`text-lg font-bold ${
          marginRatio >= 90 ? 'text-red-400' :
          marginRatio >= 70 ? 'text-yellow-400' :
          'text-white'
        }`}>
          {marginRatio.toFixed(1)}%
        </div>
      </Card>

      <Card className="bg-slate-900/50 border-slate-800/50 p-3">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-3 h-3 text-purple-400" />
          <span className="text-slate-400 text-xs">Margem de Manutenção</span>
        </div>
        <div className="text-lg font-bold text-white">
          $ {totalMaintenanceMargin.toFixed(2)}
        </div>
      </Card>

      <Card className="bg-slate-900/50 border-slate-800/50 p-3">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-3 h-3 text-emerald-400" />
          <span className="text-slate-400 text-xs">Valor da Posição</span>
        </div>
        <div className="text-lg font-bold text-white">
          $ {totalPositionValue.toFixed(2)}
        </div>
      </Card>

      <Card className="bg-slate-900/50 border-slate-800/50 p-3">
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle className="w-3 h-3 text-yellow-400" />
          <span className="text-slate-400 text-xs">Dist. Liquidação</span>
        </div>
        <div className={`text-lg font-bold ${
          avgLiquidationDistance < 10 ? 'text-red-400' :
          avgLiquidationDistance < 20 ? 'text-yellow-400' :
          'text-emerald-400'
        }`}>
          {avgLiquidationDistance.toFixed(1)}%
        </div>
      </Card>
    </div>
  );
}