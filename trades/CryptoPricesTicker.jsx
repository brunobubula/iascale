
import React from "react";
import { Card } from "@/components/ui/card";
import { useCryptoPrice } from "./useCryptoPrice";
import { TrendingUp, Bitcoin } from "lucide-react";
import { motion } from "framer-motion";

const WATCHED_PAIRS = [
  "BTC/USDT",
  "ETH/USDT", 
  "BNB/USDT", 
  "SOL/USDT", 
  "XRP/USDT", 
  "ADA/USDT",
  "DOGE/USDT",
  "DOT/USDT",
  "AVAX/USDT",
  "MATIC/USDT",
  "LINK/USDT"
];

export default function CryptoPricesTicker() {
  const prices = useCryptoPrice(WATCHED_PAIRS);

  const getPriceDisplay = (pair) => {
    const priceData = prices[pair];
    if (!priceData || !priceData.price) return { value: "...", isLive: false };
    return { value: priceData.price.toFixed(2), isLive: true };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50 overflow-hidden shadow-xl">
        <div className="p-1.5 sm:p-2">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5">
            <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-400 flex-shrink-0" />
            <span className="text-[9px] sm:text-[10px] font-bold text-white">Cotações:</span>
          </div>
          
          <div className="flex gap-1 sm:gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {WATCHED_PAIRS.map((pair, index) => {
              const priceData = getPriceDisplay(pair);
              const symbol = pair.split('/')[0];
              const isBTC = symbol === "BTC";
              
              return (
                <motion.div
                  key={pair}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.02 }}
                  className={`flex flex-col gap-0.5 p-1 sm:p-1.5 rounded-md flex-shrink-0 min-w-[60px] sm:min-w-[65px] ${
                    isBTC 
                      ? "bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/30" 
                      : "bg-slate-800/40 border border-slate-700/30"
                  }`}
                >
                  <div className="flex items-center justify-between gap-0.5">
                    <div className="flex items-center gap-0.5 min-w-0 flex-1">
                      {isBTC && <Bitcoin className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-orange-400 flex-shrink-0" />}
                      <span className={`font-bold text-[8px] sm:text-[9px] truncate ${
                        isBTC ? "text-orange-400" : "text-slate-300"
                      }`}>{symbol}</span>
                    </div>
                    {priceData.isLive && (
                      <div className="w-0.5 h-0.5 sm:w-1 sm:h-1 rounded-full bg-emerald-500 animate-pulse flex-shrink-0"></div>
                    )}
                  </div>
                  <span className={`font-semibold text-[9px] sm:text-[10px] truncate ${
                    isBTC ? "text-white" : "text-white"
                  }`}>
                    ${priceData.value}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
