import React from "react";
import { Card } from "@/components/ui/card";
import { useSingleCryptoPrice } from "./useCryptoPrice";
import { Bitcoin, TrendingUp, TrendingDown, TrendingUpDown, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";

export default function BTCPriceDisplay({ openPLData, hideBalances, setHideBalances }) {
  const btcData = useSingleCryptoPrice("BTC/USDT");
  const btcPrice = btcData?.price;
  const btcHigh = btcData?.high;
  const btcLow = btcData?.low;

  const isLive = !!btcPrice;
  const priceDisplay = btcPrice ? btcPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "...";

  const change24h = btcPrice && btcHigh && btcLow 
    ? ((btcPrice - btcLow) / btcLow) * 100
    : 0;
  const isPositive = change24h >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3 }}
      className="h-full"
    >
      <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 backdrop-blur-xl border-slate-700/50 overflow-hidden shadow-2xl h-full flex items-center">
        {/* Mobile: altura ultra compacta (p-1.5), Desktop: p-3 */}
        <div className="p-1.5 md:p-3 w-full">
          <div className="flex items-center justify-between gap-2">
            {/* Left: Icon + BTC Price */}
            <div className="flex items-center gap-1.5 md:gap-2.5 flex-1 min-w-0">
              <div className="w-6 h-6 md:w-9 md:h-9 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/30 flex-shrink-0">
                <Bitcoin className="w-3 h-3 md:w-4.5 md:h-4.5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-slate-400 text-[8px] md:text-xs leading-tight">BTC/USDT</p>
                <h2 className="text-xs md:text-lg font-bold text-white truncate leading-tight">
                  ${priceDisplay}
                </h2>
              </div>
            </div>

            {/* Right: Live Badge */}
            {isLive && (
              <div className="flex items-center gap-1 px-1.5 md:px-2 py-0.5 md:py-1 rounded-full bg-emerald-500/20 flex-shrink-0">
                <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                <span className="text-emerald-400 text-[8px] md:text-[10px] font-semibold uppercase">LIVE</span>
              </div>
            )}
          </div>

          {/* MOBILE: Divisória + P/L Aberto */}
          {openPLData && (
            <div className="md:hidden">
              <div className="border-t border-slate-700/30 my-1.5"></div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 ${
                    openPLData.totalPLUSD >= 0
                      ? "bg-gradient-to-br from-blue-500/30 to-blue-600/30"
                      : "bg-gradient-to-br from-red-500/30 to-red-600/30"
                  }`}>
                    <TrendingUpDown className="w-2.5 h-2.5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-400 text-[8px] leading-tight">P/L Aberto</p>
                    <div className="flex items-center gap-1">
                      <h3 className={`text-xs font-bold truncate leading-tight ${
                        openPLData.totalPLUSD >= 0 ? "text-emerald-400" : "text-red-400"
                      }`}>
                        {hideBalances ? "****" : `${openPLData.totalPLUSD >= 0 ? '+' : ''}$ ${Math.abs(openPLData.totalPLUSD).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      </h3>
                      <button
                        onClick={() => setHideBalances(!hideBalances)}
                        className="text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0"
                      >
                        {hideBalances ? <EyeOff className="w-2.5 h-2.5" /> : <Eye className="w-2.5 h-2.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <span className={`text-[9px] font-bold ${
                    openPLData.avgPercentage >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {openPLData.avgPercentage >= 0 ? '+' : ''}{openPLData.avgPercentage.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Bottom: 24h Change Centralizada - Desktop Only */}
          <div className="mt-2 pt-2 border-t border-slate-700/30 hidden md:block">
            <div className="flex items-center justify-center gap-1">
              {isLive ? (
                <>
                  {isPositive ? (
                    <TrendingUp className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-400 flex-shrink-0" />
                  )}
                  <p className={`text-xs font-semibold leading-tight ${
                    isPositive ? "text-emerald-400" : "text-red-400"
                  }`}>
                    {isPositive ? "+" : ""}{change24h.toFixed(2)}% nas últimas 24h
                  </p>
                </>
              ) : (
                <p className="text-slate-400 text-xs leading-tight">
                  Carregando dados...
                </p>
              )}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}