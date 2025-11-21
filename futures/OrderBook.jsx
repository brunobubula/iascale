import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";

export default function OrderBook({ symbol }) {
  const [orderBook, setOrderBook] = useState({ bids: [], asks: [] });
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  useEffect(() => {
    // Converter símbolo para formato Binance
    const binanceSymbol = symbol.replace("/", "").toLowerCase();
    
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${binanceSymbol}@depth10@100ms`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.bids && data.asks) {
        setOrderBook({
          bids: data.bids.slice(0, 10).map(([price, quantity]) => ({
            price: parseFloat(price),
            quantity: parseFloat(quantity),
            total: parseFloat(price) * parseFloat(quantity)
          })),
          asks: data.asks.slice(0, 10).map(([price, quantity]) => ({
            price: parseFloat(price),
            quantity: parseFloat(quantity),
            total: parseFloat(price) * parseFloat(quantity)
          }))
        });
        setLastUpdate(Date.now());
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [symbol]);

  const maxBidQuantity = Math.max(...orderBook.bids.map(b => b.quantity), 0);
  const maxAskQuantity = Math.max(...orderBook.asks.map(a => a.quantity), 0);

  const spread = orderBook.asks[0] && orderBook.bids[0] 
    ? orderBook.asks[0].price - orderBook.bids[0].price 
    : 0;
  const spreadPercentage = orderBook.asks[0] && orderBook.bids[0]
    ? (spread / orderBook.bids[0].price) * 100
    : 0;

  return (
    <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50 h-full">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            Livro de Ofertas
          </h3>
          <div className="text-xs text-slate-500">
            {symbol}
          </div>
        </div>

        {/* Spread Info */}
        <div className="bg-slate-800/50 rounded-lg p-2 mb-3 text-center">
          <div className="text-xs text-slate-400">Spread</div>
          <div className="text-white font-bold">${spread.toFixed(2)}</div>
          <div className="text-xs text-slate-500">{spreadPercentage.toFixed(3)}%</div>
        </div>

        {/* Headers */}
        <div className="grid grid-cols-3 gap-2 text-xs text-slate-400 font-semibold mb-2 px-2">
          <div className="text-left">Preço</div>
          <div className="text-right">Quantidade</div>
          <div className="text-right">Total</div>
        </div>

        {/* Asks (Sell Orders) */}
        <div className="space-y-0.5 mb-3">
          {orderBook.asks.slice(0, 8).reverse().map((ask, index) => {
            const widthPercent = (ask.quantity / maxAskQuantity) * 100;
            return (
              <div key={`ask-${index}`} className="relative">
                <div 
                  className="absolute right-0 top-0 bottom-0 bg-red-500/10"
                  style={{ width: `${widthPercent}%` }}
                />
                <div className="relative grid grid-cols-3 gap-2 text-xs py-1 px-2 hover:bg-slate-800/50 rounded transition-colors">
                  <div className="text-red-400 font-semibold">
                    {ask.price.toFixed(2)}
                  </div>
                  <div className="text-slate-300 text-right">
                    {ask.quantity.toFixed(6)}
                  </div>
                  <div className="text-slate-400 text-right">
                    {ask.total.toFixed(2)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Current Price */}
        {orderBook.bids[0] && (
          <div className="bg-slate-800/80 rounded-lg p-2 mb-3 text-center border border-slate-700/50">
            <div className="text-xl font-black text-emerald-400">
              ${orderBook.bids[0].price.toFixed(2)}
            </div>
            <div className="text-xs text-slate-500">Preço Atual</div>
          </div>
        )}

        {/* Bids (Buy Orders) */}
        <div className="space-y-0.5">
          {orderBook.bids.slice(0, 8).map((bid, index) => {
            const widthPercent = (bid.quantity / maxBidQuantity) * 100;
            return (
              <div key={`bid-${index}`} className="relative">
                <div 
                  className="absolute right-0 top-0 bottom-0 bg-emerald-500/10"
                  style={{ width: `${widthPercent}%` }}
                />
                <div className="relative grid grid-cols-3 gap-2 text-xs py-1 px-2 hover:bg-slate-800/50 rounded transition-colors">
                  <div className="text-emerald-400 font-semibold">
                    {bid.price.toFixed(2)}
                  </div>
                  <div className="text-slate-300 text-right">
                    {bid.quantity.toFixed(6)}
                  </div>
                  <div className="text-slate-400 text-right">
                    {bid.total.toFixed(2)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-700/50 text-xs">
          <div className="flex items-center gap-1">
            <TrendingDown className="w-3 h-3 text-red-400" />
            <span className="text-slate-400">Venda</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            <span className="text-slate-400">Compra</span>
          </div>
        </div>
      </div>
    </Card>
  );
}