import React from "react";
import { Card } from "@/components/ui/card";
import { useCryptoPrice } from "./useCryptoPrice";
import { Bitcoin, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

const WATCHED_PAIRS = ["BTC/USDT", "ETH/USDT", "BNB/USDT", "SOL/USDT", "XRP/USDT", "ADA/USDT"];

export default function CryptoPrices() {
  const prices = useCryptoPrice(WATCHED_PAIRS);

  const getPriceDisplay = (pair) => {
    const price = prices[pair];
    if (!price) return { value: "...", isLive: false };
    return { value: price.toFixed(2), isLive: true };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50 overflow-hidden shadow-xl">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Cotações ao Vivo</h3>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {WATCHED_PAIRS.map((pair, index) => {
              const priceData = getPriceDisplay(pair);
              const symbol = pair.split('/')[0];
              const isBTC = pair === "BTC/USDT";
              
              return (
                <motion.div
                  key={pair}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl flex-shrink-0 ${
                    isBTC 
                      ? "bg-gradient-to-r from-orange-500/20 to-amber-500/20 border-2 border-orange-500/40"
                      : "bg-slate-800/30 border border-slate-700/30"
                  } min-w-[140px]`}
                >
                  {isBTC && (
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Bitcoin className="w-5 h-5 text-white" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-bold text-sm ${isBTC ? "text-orange-400" : "text-slate-300"}`}>
                        {symbol}
                      </span>
                      {priceData.isLive && (
                        <div className={`w-1.5 h-1.5 rounded-full ${isBTC ? "bg-orange-400" : "bg-emerald-500"} animate-pulse`}></div>
                      )}
                    </div>
                    <div className={`font-semibold text-base ${isBTC ? "text-white" : "text-white"}`}>
                      {priceData.value}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}