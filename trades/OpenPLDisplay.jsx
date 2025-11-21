import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCryptoPrice } from "./useCryptoPrice";

export default function OpenPLDisplay({ trades = [] }) {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch (error) {
        return null;
      }
    },
  });

  const validTrades = Array.isArray(trades) ? trades : [];
  const activeTrades = validTrades.filter(t => t?.status === "ACTIVE");

  const activePairs = [...new Set(activeTrades.map(t => t?.pair).filter(Boolean))];
  const realtimePrices = useCryptoPrice(activePairs);

  const calculateOpenPL = () => {
    let totalOpenPL = 0;

    activeTrades.forEach(trade => {
      const isBuy = trade?.type === "BUY";
      const leverage = trade?.leverage || 1;
      const entryAmount = trade?.entry_amount || 0;
      const totalOperatedValue = entryAmount * leverage;
      const entry = trade?.entry_price || 0;

      const realtimePrice = realtimePrices[trade?.pair]?.price;
      const current = realtimePrice || trade?.current_price || trade?.entry_price || 0;

      if (entry !== 0) {
        let profitLoss = 0;
        if (isBuy) {
          profitLoss = ((current - entry) / entry) * 100;
        } else {
          profitLoss = ((entry - current) / entry) * 100;
        }

        const profitLossUSD = (profitLoss / 100) * totalOperatedValue;
        totalOpenPL += profitLossUSD;
      }
    });

    return totalOpenPL;
  };

  const openPL = calculateOpenPL();
  const openPLPercentage = user?.initial_balance && user.initial_balance > 0
    ? ((openPL / user.initial_balance) * 100).toFixed(2)
    : 0;
  const isOpenPLPositive = openPL >= 0;

  const formattedOpenPL = Math.abs(openPL).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  if (activeTrades.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {isOpenPLPositive ? (
        <TrendingUp className="w-4 h-4 text-emerald-400" />
      ) : (
        <TrendingDown className="w-4 h-4 text-red-400" />
      )}
      
      <span className="text-slate-400 text-sm font-medium whitespace-nowrap">P/L Aberto:</span>
      
      <span className={`text-sm font-bold ${
        isOpenPLPositive ? 'text-emerald-400' : 'text-red-400'
      }`}>
        {isOpenPLPositive ? '+' : ''}{formattedOpenPL} {isOpenPLPositive ? '+' : ''}{openPLPercentage}%
      </span>
    </div>
  );
}