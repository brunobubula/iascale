import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Check, ChevronLeft, ChevronRight, XOctagon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TPSLSlider({ 
  currentPrice, 
  isBuy,
  onTakeProfitSet, 
  onStopLossSet,
  takeProfitValue,
  stopLossValue,
  pair
}) {
  const [dragPosition, setDragPosition] = useState(0); // -100 a +100
  const [isDragging, setIsDragging] = useState(false);
  const [showConfirmButton, setShowConfirmButton] = useState(false);
  const [mode, setMode] = useState("takeprofit"); // "takeprofit" ou "stoploss"
  const sliderRef = useRef(null);

  const isTPSet = takeProfitValue && parseFloat(takeProfitValue) > 0;
  const isSLSet = stopLossValue && parseFloat(stopLossValue) > 0;

  // Determina qual modo está ativo
  useEffect(() => {
    if (!isTPSet) {
      setMode("takeprofit");
    } else if (!isSLSet) {
      setMode("stoploss");
    }
  }, [isTPSet, isSLSet]);

  const handleMouseDown = (e) => {
    if ((mode === "takeprofit" && isTPSet) || (mode === "stoploss" && isSLSet)) {
      return; // Não permite arrastar se já foi definido
    }
    setIsDragging(true);
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const mouseX = e.clientX;
    const deltaX = mouseX - centerX;
    const maxDelta = rect.width / 2;

    let percentage = (deltaX / maxDelta) * 100;
    
    // Zona de precisão nos primeiros ±5%
    if (Math.abs(percentage) <= 5) {
      percentage = percentage * 0.3; // Reduz sensibilidade em 70% nos primeiros 5%
    }
    
    percentage = Math.max(-100, Math.min(100, percentage));

    setDragPosition(percentage);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);

    if (Math.abs(dragPosition) > 0.1) {
      setShowConfirmButton(true);
    } else {
      setDragPosition(0);
    }
  };

  const handleTouchStart = (e) => {
    if ((mode === "takeprofit" && isTPSet) || (mode === "stoploss" && isSLSet)) {
      return;
    }
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!isDragging || !sliderRef.current) return;

    const touch = e.touches[0];
    const rect = sliderRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const touchX = touch.clientX;
    const deltaX = touchX - centerX;
    const maxDelta = rect.width / 2;

    let percentage = (deltaX / maxDelta) * 100;
    
    // Zona de precisão nos primeiros ±5%
    if (Math.abs(percentage) <= 5) {
      percentage = percentage * 0.3; // Reduz sensibilidade em 70% nos primeiros 5%
    }
    
    percentage = Math.max(-100, Math.min(100, percentage));

    setDragPosition(percentage);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    if (Math.abs(dragPosition) > 0.1) {
      setShowConfirmButton(true);
    } else {
      setDragPosition(0);
    }
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, dragPosition]);

  const calculatePrice = () => {
    if (!currentPrice || isNaN(currentPrice)) return 0;
    const price = parseFloat(currentPrice);
    const percentage = dragPosition;
    
    // LÓGICA CORRIGIDA PARA VENDA
    if (!isBuy) {
      // VENDA: Inverte a direção do cálculo
      // Esquerda (negativo) = Stop ACIMA do preço (inverte o sinal)
      // Direita (positivo) = Take ABAIXO do preço (inverte o sinal)
      const newPrice = price - (price * percentage / 100);
      return newPrice;
    } else {
      // COMPRA: Mantém a lógica original
      const newPrice = price + (price * percentage / 100);
      return newPrice;
    }
  };

  const calculatedPrice = calculatePrice();

  const handleConfirm = () => {
    const price = calculatedPrice;
    const decimals = price < 1 ? 8 : 2;

    if (dragPosition > 0) {
      // Take Profit
      onTakeProfitSet(price.toFixed(decimals));
      setMode("stoploss");
    } else if (dragPosition < 0) {
      // Stop Loss
      onStopLossSet(Math.abs(price).toFixed(decimals));
    }

    setDragPosition(0);
    setShowConfirmButton(false);
  };

  const handleReset = () => {
    if (mode === "takeprofit") {
      onTakeProfitSet("");
      setDragPosition(0);
      setShowConfirmButton(false);
    } else if (mode === "stoploss") {
      onStopLossSet("");
      setMode("takeprofit");
      setDragPosition(0);
      setShowConfirmButton(false);
    }
  };

  const handleArrowClick = (direction) => {
    const step = 0.10;
    const newPosition = dragPosition + (direction === "right" ? step : -step);
    const clampedPosition = Math.max(-100, Math.min(100, newPosition));
    setDragPosition(clampedPosition);
    setShowConfirmButton(true);
  };

  const isTPMode = dragPosition > 0 || (mode === "takeprofit" && !isTPSet);
  const isSLMode = dragPosition < 0 || (mode === "stoploss" && !isSLSet && isTPSet);

  return (
    <div className="space-y-4">
      {/* Indicador de Modo Atual */}
      <div className="flex items-center justify-center gap-2 mb-2">
        <div className={`px-3 py-1.5 rounded-lg border ${
          mode === "takeprofit" && !isTPSet
            ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
            : "bg-slate-800/30 border-slate-700/50 text-slate-500"
        }`}>
          <Target className="w-3 h-3 inline mr-1" />
          <span className="text-xs font-semibold">1. Take Profit</span>
          {isTPSet && <Check className="w-3 h-3 inline ml-1 text-emerald-400" />}
        </div>
        <div className={`px-3 py-1.5 rounded-lg border ${
          mode === "stoploss" && isTPSet && !isSLSet
            ? "bg-red-500/20 border-red-500/50 text-red-400"
            : "bg-slate-800/30 border-slate-700/50 text-slate-500"
        }`}>
          <XOctagon className="w-3 h-3 inline mr-1" />
          <span className="text-xs font-semibold">2. Stop Loss</span>
          {isSLSet && <Check className="w-3 h-3 inline ml-1 text-red-400" />}
        </div>
      </div>

      {/* Barra de Seleção */}
      <div className="relative">
        {/* Preview do Percentual - OPACIDADE 85% */}
        <AnimatePresence>
          {isDragging && Math.abs(dragPosition) > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`absolute -top-20 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg border-2 z-20 ${
                dragPosition > 0
                  ? "bg-emerald-500/85 border-emerald-400"
                  : "bg-red-500/85 border-red-400"
              }`}
            >
              <div className="text-center text-white">
                <div className="text-2xl font-black">
                  {dragPosition > 0 ? "+" : ""}{dragPosition.toFixed(2)}%
                </div>
                <div className="text-xs font-semibold mt-1">
                  ${calculatedPrice.toLocaleString('en-US', { 
                    minimumFractionDigits: calculatedPrice < 1 ? 8 : 2,
                    maximumFractionDigits: calculatedPrice < 1 ? 8 : 2
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Labels STOP e TAKE - ACIMA DA BARRA */}
        <div className="flex items-center justify-between mb-1 px-2">
          <div className="flex items-center gap-1">
            <XOctagon className="w-3.5 h-3.5 text-red-400" />
            <span className="text-xs font-bold text-red-400">STOP</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs font-bold text-emerald-400">TAKE</span>
            <Target className="w-3.5 h-3.5 text-emerald-400" />
          </div>
        </div>

        {/* Container da Barra */}
        <div
          ref={sliderRef}
          className="relative h-20 bg-slate-800/30 rounded-xl border border-slate-700/50 overflow-hidden"
        >
          {/* Linha Pontilhada Central */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px border-l-2 border-dashed border-slate-600/50"></div>

          {/* Marcações de Percentual */}
          <div className="absolute inset-0 flex items-center justify-between px-2">
            {[-100, -75, -50, -25, 0, 25, 50, 75, 100].map((mark) => (
              <div key={mark} className="flex flex-col items-center">
                <div className={`h-2 w-px ${mark === 0 ? 'bg-slate-500' : 'bg-slate-700/30'}`}></div>
                <span className="text-[8px] text-slate-600 mt-1">{mark}%</span>
              </div>
            ))}
          </div>

          {/* Preenchimento Colorido da Barra */}
          <motion.div
            className={`absolute top-0 bottom-0 ${
              dragPosition > 0
                ? "bg-gradient-to-r from-emerald-500/30 to-emerald-500/50"
                : "bg-gradient-to-r from-red-500/50 to-red-500/30"
            }`}
            style={{
              left: dragPosition > 0 ? '50%' : `calc(50% + ${dragPosition / 2}%)`,
              right: dragPosition > 0 ? `calc(50% - ${dragPosition / 2}%)` : '50%',
            }}
          />

          {/* Botão de Arraste */}
          <motion.div
            className={`absolute top-1/2 -translate-y-1/2 w-12 h-12 rounded-full cursor-grab active:cursor-grabbing flex items-center justify-center shadow-lg ${
              isDragging
                ? dragPosition > 0
                  ? "bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-500/50"
                  : "bg-gradient-to-br from-red-500 to-red-600 shadow-red-500/50"
                : (mode === "takeprofit" && !isTPSet)
                  ? "bg-gradient-to-br from-slate-600 to-slate-700"
                  : (mode === "stoploss" && !isSLSet)
                    ? "bg-gradient-to-br from-slate-600 to-slate-700"
                    : "bg-slate-700/50 cursor-not-allowed"
            } border-2 ${
              isDragging
                ? dragPosition > 0
                  ? "border-emerald-400"
                  : "border-red-400"
                : "border-slate-600"
            }`}
            style={{
              left: `calc(50% + ${dragPosition / 2}% - 24px)`,
            }}
            animate={{
              scale: isDragging ? 1.1 : 1,
            }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
          >
            {dragPosition > 0 ? (
              <Target className="w-6 h-6 text-white" />
            ) : dragPosition < 0 ? (
              <XOctagon className="w-6 h-6 text-white" />
            ) : (
              <div className="w-1 h-6 bg-slate-400 rounded-full"></div>
            )}
          </motion.div>
        </div>

        {/* Setas de Navegação + Divisor - REDUZIDAS 0.2x */}
        <div className="mt-3 flex items-center justify-center gap-2">
          <button
            onClick={() => handleArrowClick("left")}
            disabled={(mode === "stoploss" && isSLSet) || (mode === "takeprofit" && isTPSet)}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
              (mode === "stoploss" && isSLSet) || (mode === "takeprofit" && isTPSet)
                ? "bg-slate-800/30 border border-slate-700/50 text-slate-600 cursor-not-allowed"
                : "bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30"
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-slate-700/50"></div>

          <button
            onClick={() => handleArrowClick("right")}
            disabled={(mode === "takeprofit" && isTPSet) || (mode === "stoploss" && isSLSet)}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
              (mode === "takeprofit" && isTPSet) || (mode === "stoploss" && isSLSet)
                ? "bg-slate-800/30 border border-slate-700/50 text-slate-600 cursor-not-allowed"
                : "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/30"
            }`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Botão de Confirmação */}
        <AnimatePresence>
          {showConfirmButton && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mt-3 flex gap-2"
            >
              <Button
                onClick={handleConfirm}
                className={`flex-1 font-bold ${
                  dragPosition > 0
                    ? "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
                    : "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
                }`}
              >
                {dragPosition > 0 ? (
                  <>
                    <Target className="w-4 h-4 mr-2" />
                    Definir T/P {dragPosition.toFixed(2)}%
                  </>
                ) : (
                  <>
                    <XOctagon className="w-4 h-4 mr-2" />
                    Definir S/L {Math.abs(dragPosition).toFixed(2)}%
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setDragPosition(0);
                  setShowConfirmButton(false);
                }}
                className="bg-slate-800/50 border-slate-700 text-white hover:bg-slate-800"
              >
                Cancelar
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Preview dos Valores Definidos - ALTURA IGUAL AO CARD PREVISÃO (p-3) */}
        <div className="mt-4 space-y-2">
          {isTPSet && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-slate-800/30 border border-emerald-500/30 rounded-lg p-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold text-xs">Take Profit</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold text-xs">
                    ${parseFloat(takeProfitValue).toLocaleString('en-US', {
                      minimumFractionDigits: parseFloat(takeProfitValue) < 1 ? 8 : 2,
                      maximumFractionDigits: parseFloat(takeProfitValue) < 1 ? 8 : 2
                    })}
                  </span>
                  <button
                    onClick={handleReset}
                    className="text-slate-500 hover:text-red-400 text-xs font-bold w-5 h-5 flex items-center justify-center rounded hover:bg-red-500/10 transition-all"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {isSLSet && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-slate-800/30 border border-red-500/30 rounded-lg p-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XOctagon className="w-3 h-3 text-red-400" />
                  <span className="text-red-400 font-semibold text-xs">Stop Loss</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-red-400 font-bold text-xs">
                    ${parseFloat(stopLossValue).toLocaleString('en-US', {
                      minimumFractionDigits: parseFloat(stopLossValue) < 1 ? 8 : 2,
                      maximumFractionDigits: parseFloat(stopLossValue) < 1 ? 8 : 2
                    })}
                  </span>
                  <button
                    onClick={handleReset}
                    className="text-slate-500 hover:text-red-400 text-xs font-bold w-5 h-5 flex items-center justify-center rounded hover:bg-red-500/10 transition-all"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Instruções */}
        {!isTPSet || !isSLSet ? (
          <div className="mt-4 bg-slate-800/30 rounded-lg p-3 border border-slate-700/50">
            <p className="text-slate-400 text-xs text-center">
              {!isTPSet ? (
                <>
                  <Target className="w-3 h-3 inline mr-1 text-emerald-400" />
                  Arraste para a <strong className="text-emerald-400">DIREITA</strong> para definir Take Profit
                </>
              ) : !isSLSet ? (
                <>
                  <XOctagon className="w-3 h-3 inline mr-1 text-red-400" />
                  Arraste para a <strong className="text-red-400">ESQUERDA</strong> para definir Stop Loss
                </>
              ) : null}
            </p>
          </div>
        ) : (
          <div className="mt-4 bg-slate-800/30 rounded-lg p-3 border border-slate-700/50">
            <p className="text-emerald-400 text-xs text-center font-semibold">
              <Check className="w-3 h-3 inline mr-1" />
              TP e SL definidos! Clique no ✕ para redefinir.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}