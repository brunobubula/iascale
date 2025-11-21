import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useSingleCryptoPrice } from "./useCryptoPrice";
import { TrendingUp, TrendingDown, Activity, Maximize2, Minimize2, ArrowUpDown } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { motion } from "framer-motion";

const TIMEFRAMES = [
  { label: "1min", value: "1m", interval: "1m" },
  { label: "5min", value: "5m", interval: "5m" },
  { label: "15min", value: "15m", interval: "15m" },
  { label: "1h", value: "1h", interval: "1h" },
  { label: "4h", value: "4h", interval: "4h" }
];

const CHART_HEIGHTS = {
  small: 200,
  medium: 400,
  large: 600
};

// Helper para formatar preço com precisão dinâmica
const formatPriceDisplay = (price) => {
  if (!price || isNaN(price)) return "$0.00";
  const numPrice = parseFloat(price);
  
  if (numPrice < 1 && numPrice > 0) {
    return `$${numPrice.toFixed(8)}`;
  }
  
  return `$${numPrice.toLocaleString('en-US', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`;
};

export default function PriceChart({ pair, entryPrice, takeProfit, stopLoss, forceLineChart = false, showAnimatedIcon = false }) {
  const currentPriceData = useSingleCryptoPrice(pair);
  const currentPrice = currentPriceData?.price;
  const [selectedTimeframe, setSelectedTimeframe] = useState("15m");
  const [chartHeight, setChartHeight] = useState("medium");
  const [previousPrice, setPreviousPrice] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState("binance");

  useEffect(() => {
    if (currentPrice) {
      setPreviousPrice(prev => prev || currentPrice);
    }
  }, [currentPrice]);

  useEffect(() => {
    if (!pair) return;

    const fetchChartData = async () => {
      setLoading(true);
      try {
        // Tenta primeiro usar a função backend com CoinGecko Pro
        const response = await base44.functions.invoke('getChartHistoricalData', {
          pair: pair,
          timeframe: selectedTimeframe
        });

        if (response.data.success && response.data.data) {
          setChartData(response.data.data);
          setDataSource("coingecko");
          setLoading(false);
          return;
        }
      } catch (error) {
        console.warn("Erro ao buscar dados da CoinGecko Pro, usando fallback Binance:", error);
      }

      // Fallback: Binance API pública (sem autenticação)
      try {
        const symbol = pair.replace('/', '');
        const response = await fetch(
          `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${selectedTimeframe}&limit=100`
        );
        const data = await response.json();

        const formattedData = data.map((candle) => ({
          time: new Date(candle[0]).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          price: parseFloat(candle[4]),
          open: parseFloat(candle[1]),
          high: parseFloat(candle[2]),
          low: parseFloat(candle[3]),
          close: parseFloat(candle[4]),
        }));

        setChartData(formattedData);
        setDataSource("binance");
        setLoading(false);
      } catch (error) {
        console.error("Erro ao buscar dados do gráfico (fallback Binance):", error);
        setLoading(false);
      }
    };

    fetchChartData();
    const interval = setInterval(fetchChartData, 60000);

    return () => clearInterval(interval);
  }, [pair, selectedTimeframe]);

  if (!pair) {
    return (
      <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50 p-6">
        <div className="text-center py-12">
          <Activity className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">Selecione um par de moedas para visualizar o gráfico</p>
        </div>
      </Card>
    );
  }

  const priceChange = previousPrice && currentPrice 
    ? ((currentPrice - previousPrice) / previousPrice) * 100 
    : 0;
  const isPositive = priceChange >= 0;

  const entryPriceNum = entryPrice ? parseFloat(entryPrice) : null;
  const takeProfitNum = takeProfit ? parseFloat(takeProfit) : null;
  const stopLossNum = stopLoss ? parseFloat(stopLoss) : null;

  const cycleChartHeight = () => {
    if (chartHeight === "small") setChartHeight("medium");
    else if (chartHeight === "medium") setChartHeight("large");
    else setChartHeight("small");
  };

  // Calcula o domínio do YAxis para incluir todos os níveis
  const calculateYAxisDomain = () => {
    if (chartData.length === 0) return ['auto', 'auto'];
    
    const prices = chartData.map(d => d.price);
    const allPrices = [...prices];
    
    if (entryPriceNum && !isNaN(entryPriceNum)) allPrices.push(entryPriceNum);
    if (takeProfitNum && !isNaN(takeProfitNum)) allPrices.push(takeProfitNum);
    if (stopLossNum && !isNaN(stopLossNum)) allPrices.push(stopLossNum);
    
    if (allPrices.length === 0) return ['auto', 'auto'];
    
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);
    const padding = (maxPrice - minPrice) * 0.15; // 15% de padding
    
    return [minPrice - padding, maxPrice + padding];
  };

  const yAxisDomain = calculateYAxisDomain();

  return (
    <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50 overflow-hidden shadow-xl">
      <div className="p-4 md:p-6">
        {/* Header Horizontal com todos os elementos em linha */}
        <div className="flex flex-wrap items-center gap-3 md:gap-4 mb-4">
          {/* Ícone + Título do Par */}
          <div className="flex items-center gap-3">
            {showAnimatedIcon && (
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/30">
                <svg 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  className="w-6 h-6"
                >
                  <motion.path
                    d="M3 12 L8 7 L13 17 L21 4"
                    stroke="#10b981"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    animate={{
                      pathLength: [0, 1, 0],
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                </svg>
              </div>
            )}
            <div>
              <h3 className="text-lg md:text-xl font-bold text-white">{pair}</h3>
              <p className="text-slate-400 text-xs md:text-sm">
                Gráfico em Tempo Real 
                {dataSource === "coingecko" && <span className="text-emerald-400 font-semibold"> (CoinGecko Pro)</span>}
              </p>
            </div>
          </div>

          {/* Divisor */}
          <div className="hidden md:block w-px h-10 bg-slate-700/50"></div>

          {/* Preço Atual - COM 8 CASAS DECIMAIS SE < $1 */}
          <div className="flex items-center gap-3">
            <div>
              <p className="text-slate-400 text-xs">Preço Atual</p>
              <p className="text-lg md:text-xl font-bold text-white">
                {currentPrice ? formatPriceDisplay(currentPrice) : "..."}
              </p>
            </div>
            {previousPrice && currentPrice && (
              <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
                isPositive 
                  ? "bg-emerald-500/20 text-emerald-400" 
                  : "bg-red-500/20 text-red-400"
              }`}>
                {isPositive ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                <span className="font-bold text-xs">
                  {isPositive ? "+" : ""}{priceChange.toFixed(2)}%
                </span>
              </div>
            )}
          </div>

          {/* Divisor */}
          {entryPriceNum && <div className="hidden md:block w-px h-10 bg-slate-700/50"></div>}

          {/* Entrada - COM 8 CASAS DECIMAIS SE < $1 */}
          {entryPriceNum && (
            <div>
              <p className="text-blue-400 text-xs">Entrada</p>
              <p className="text-white font-bold text-sm md:text-base">{formatPriceDisplay(entryPriceNum)}</p>
            </div>
          )}

          {/* Divisor */}
          {takeProfitNum && <div className="hidden md:block w-px h-10 bg-slate-700/50"></div>}

          {/* Take Profit - COM 8 CASAS DECIMAIS SE < $1 */}
          {takeProfitNum && (
            <div>
              <p className="text-emerald-400 text-xs">Take Profit</p>
              <p className="text-white font-bold text-sm md:text-base">{formatPriceDisplay(takeProfitNum)}</p>
            </div>
          )}

          {/* Divisor */}
          {stopLossNum && <div className="hidden md:block w-px h-10 bg-slate-700/50"></div>}

          {/* Stop Loss - COM 8 CASAS DECIMAIS SE < $1 */}
          {stopLossNum && (
            <div>
              <p className="text-red-400 text-xs">Stop Loss</p>
              <p className="text-white font-bold text-sm md:text-base">{formatPriceDisplay(stopLossNum)}</p>
            </div>
          )}

          {/* Divisor */}
          <div className="hidden md:block w-px h-10 bg-slate-700/50 ml-auto"></div>

          {/* Ao Vivo */}
          <div className="flex items-center gap-2 ml-auto">
            <div className={`w-2 h-2 rounded-full animate-pulse ${
              currentPrice ? "bg-emerald-500" : "bg-slate-500"
            }`}></div>
            <span className="text-xs text-slate-400">
              {currentPrice ? "Ao vivo" : "Offline"}
            </span>
          </div>
        </div>

        {/* Cards grandes de Entrada, TP e SL - Mobile - COM 8 CASAS DECIMAIS SE < $1 */}
        {(entryPriceNum || takeProfitNum || stopLossNum) && (
          <div className="mb-4 grid grid-cols-3 gap-2 md:hidden">
            {entryPriceNum && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-2 text-center">
                <p className="text-blue-400 text-xs mb-1">Entrada</p>
                <p className="text-white font-bold text-sm">{formatPriceDisplay(entryPriceNum)}</p>
              </div>
            )}
            {takeProfitNum && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-2 text-center">
                <p className="text-emerald-400 text-xs mb-1">Take Profit</p>
                <p className="text-white font-bold text-sm">{formatPriceDisplay(takeProfitNum)}</p>
              </div>
            )}
            {stopLossNum && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2 text-center">
                <p className="text-red-400 text-xs mb-1">Stop Loss</p>
                <p className="text-white font-bold text-sm">{formatPriceDisplay(stopLossNum)}</p>
              </div>
            )}
          </div>
        )}

        {/* Controles do Gráfico */}
        <div className="mb-4 flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <p className="text-slate-400 text-xs mb-2">Tempo Gráfico</p>
            <div className="flex gap-2 flex-wrap">
              {TIMEFRAMES.map((tf) => (
                <Button
                  key={tf.value}
                  onClick={() => setSelectedTimeframe(tf.value)}
                  variant={selectedTimeframe === tf.value ? "default" : "outline"}
                  size="sm"
                  className={`${
                    selectedTimeframe === tf.value
                      ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                      : "bg-slate-800/50 border-slate-700 hover:bg-slate-800 text-slate-300"
                  } text-xs h-8`}
                >
                  {tf.label}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-slate-400 text-xs mb-2">Visualização</p>
            <div className="flex gap-2">
              <Button
                onClick={cycleChartHeight}
                variant="outline"
                size="sm"
                className="bg-slate-800/50 border-slate-700 hover:bg-slate-800 text-white h-8"
                title={`Altura: ${chartHeight === "small" ? "Pequena" : chartHeight === "medium" ? "Média" : "Grande"}`}
              >
                {chartHeight === "small" && <Minimize2 className="w-4 h-4" />}
                {chartHeight === "medium" && <ArrowUpDown className="w-4 h-4" />}
                {chartHeight === "large" && <Maximize2 className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Gráfico - COM LINHAS DESTACADAS E NÚMEROS VISÍVEIS */}
        <div className="relative bg-slate-950/50 rounded-xl overflow-hidden border border-slate-800/50">
          {loading ? (
            <div className="flex items-center justify-center" style={{ height: `${CHART_HEIGHTS[chartHeight]}px` }}>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={CHART_HEIGHTS[chartHeight]}>
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="time" stroke="#94a3b8" style={{ fontSize: '10px' }} />
                <YAxis 
                  stroke="#94a3b8" 
                  domain={yAxisDomain}
                  style={{ fontSize: '10px' }}
                  tickFormatter={(value) => {
                    if (value < 1 && value > 0) return value.toFixed(4);
                    return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  formatter={(value) => {
                    const numValue = parseFloat(value);
                    if (numValue < 1 && numValue > 0) {
                      return `$${numValue.toFixed(8)}`;
                    }
                    return `$${numValue.toLocaleString('en-US', { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })}`;
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="price" 
                  stroke="#10b981" 
                  strokeWidth={2} 
                  dot={false}
                  animationDuration={300}
                />
                
                {entryPriceNum && !isNaN(entryPriceNum) && (
                  <ReferenceLine 
                    y={entryPriceNum} 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    strokeDasharray="8 4"
                    label={{ 
                      value: `Entrada: ${formatPriceDisplay(entryPriceNum)}`, 
                      position: 'insideTopRight',
                      fill: '#ffffff',
                      fontSize: 13,
                      fontWeight: 'bold',
                      style: { 
                        backgroundColor: 'rgba(59, 130, 246, 0.9)',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        border: '1px solid rgba(59, 130, 246, 1)'
                      }
                    }}
                    ifOverflow="extendDomain"
                  />
                )}
                {takeProfitNum && !isNaN(takeProfitNum) && (
                  <ReferenceLine 
                    y={takeProfitNum} 
                    stroke="#10b981" 
                    strokeWidth={3}
                    strokeDasharray="8 4"
                    label={{ 
                      value: `Take Profit: ${formatPriceDisplay(takeProfitNum)}`, 
                      position: 'insideTopRight',
                      fill: '#ffffff',
                      fontSize: 13,
                      fontWeight: 'bold',
                      style: { 
                        backgroundColor: 'rgba(16, 185, 129, 0.9)',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        border: '1px solid rgba(16, 185, 129, 1)'
                      }
                    }}
                    ifOverflow="extendDomain"
                  />
                )}
                {stopLossNum && !isNaN(stopLossNum) && (
                  <ReferenceLine 
                    y={stopLossNum} 
                    stroke="#ef4444" 
                    strokeWidth={3}
                    strokeDasharray="8 4"
                    label={{ 
                      value: `Stop Loss: ${formatPriceDisplay(stopLossNum)}`, 
                      position: 'insideTopRight',
                      fill: '#ffffff',
                      fontSize: 13,
                      fontWeight: 'bold',
                      style: { 
                        backgroundColor: 'rgba(239, 68, 68, 0.9)',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        border: '1px solid rgba(239, 68, 68, 1)'
                      }
                    }}
                    ifOverflow="extendDomain"
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </Card>
  );
}