import React, { useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

export default function TradingViewChart({ pair, onClose }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!pair || !containerRef.current) return;

    const symbol = pair.replace('/', '');
    
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      if (window.TradingView && containerRef.current) {
        new window.TradingView.widget({
          container_id: containerRef.current.id,
          autosize: true,
          symbol: `BINANCE:${symbol}`,
          interval: '15',
          timezone: 'America/Sao_Paulo',
          theme: 'dark',
          style: '1',
          locale: 'br',
          toolbar_bg: '#0f172a',
          enable_publishing: false,
          hide_top_toolbar: false,
          hide_side_toolbar: true,
          save_image: false,
          backgroundColor: '#0f172a',
          gridColor: '#1e293b',
          hide_legend: true,
          allow_symbol_change: false,
          studies: [],
          disabled_features: [
            'header_symbol_search',
            'header_compare',
            'header_undo_redo',
            'header_screenshot',
            'header_chart_type',
            'control_bar',
            'timeframes_toolbar',
            'edit_buttons_in_legend',
            'context_menus',
            'border_around_the_chart',
            'remove_library_container_border'
          ],
          enabled_features: ['hide_left_toolbar_by_default'],
        });
      }
    };
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [pair]);

  if (!pair) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
      className="w-full mt-8"
    >
      {/* Divisória Superior */}
      <div className="mb-8 flex items-center gap-4">
        <div className="flex-1 border-t border-slate-700/30"></div>
        <div className="flex items-center gap-2 text-slate-500 text-xs">
          <BarChart3 className="w-3 h-3" />
          <span>Gráfico do Trade</span>
        </div>
        <div className="flex-1 border-t border-slate-700/30"></div>
      </div>

      <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50 overflow-hidden shadow-xl">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="text-lg font-bold text-white">{pair}</h3>
                <p className="text-slate-400 text-xs">Gráfico TradingView</p>
              </div>
            </div>
            
            <Button
              onClick={onClose}
              variant="outline"
              size="sm"
              className="bg-slate-800/50 border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-white h-8"
            >
              <X className="w-4 h-4 mr-1" />
              Fechar
            </Button>
          </div>

          <div 
            id={`tradingview_chart_${pair.replace('/', '_')}`}
            ref={containerRef}
            className="w-full rounded-lg overflow-hidden"
            style={{ height: '500px' }}
          />
        </div>
      </Card>
    </motion.div>
  );
}