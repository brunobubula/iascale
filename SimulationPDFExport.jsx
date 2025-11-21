import React from "react";
import { Card } from "@/components/ui/card";
import { TrendingUp, DollarSign, Percent, Calendar, BarChart3 } from "lucide-react";

export default function SimulationPDFExport({ 
  capital, 
  monthlyReturn, 
  selectedPeriod, 
  finalBalance, 
  totalGain, 
  totalReturnPercentage,
  projectionData 
}) {
  return (
    <div 
      id="pdf-export-content"
      className="w-[1200px] h-auto bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-12"
      style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
    >
      {/* Header com Logo e Branding */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-2xl">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690c0c0bc7d291a071fd4ad2/1563eb5a8_Art-ScaleCriptoiA-LOGO7mini.png"
              alt="Scale Logo"
              className="w-14 h-14"
              style={{ filter: 'brightness(0) invert(1)' }}
            />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white mb-1">ScaleCripto</h1>
            <p className="text-purple-300 text-base font-semibold flex items-center gap-1">
              iA Geradora de Sinais 
              <span className="text-white text-lg">★★★★★</span>
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-slate-400 text-xs">Relatório gerado em</div>
          <div className="text-white font-semibold text-sm">{new Date().toLocaleDateString('pt-BR')}</div>
        </div>
      </div>

      {/* Título Principal */}
      <div className="text-center mb-6">
        <h2 className="text-slate-300 text-lg mb-2">Simulação de Juros Compostos</h2>
        <div className="text-6xl font-black text-emerald-400 mb-1">
          $ {finalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <p className="text-slate-400 text-sm">Projeção em {selectedPeriod} meses</p>
      </div>

      {/* Métricas Principais - Compacto */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        <div className="bg-slate-800/50 border border-blue-500/30 rounded-xl p-3 text-center">
          <DollarSign className="w-6 h-6 text-blue-400 mx-auto mb-1" />
          <div className="text-slate-400 text-[10px] mb-1">Capital Inicial</div>
          <div className="text-lg font-black text-white">
            $ {capital.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-slate-800/50 border border-purple-500/30 rounded-xl p-3 text-center">
          <Percent className="w-6 h-6 text-purple-400 mx-auto mb-1" />
          <div className="text-slate-400 text-[10px] mb-1">Retorno Mensal</div>
          <div className="text-lg font-black text-purple-400">
            {monthlyReturn.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
          </div>
        </div>

        <div className="bg-slate-800/50 border border-emerald-500/30 rounded-xl p-3 text-center">
          <Calendar className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
          <div className="text-slate-400 text-[10px] mb-1">Período</div>
          <div className="text-lg font-black text-white">
            {selectedPeriod}m
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/50 rounded-xl p-3 text-center">
          <TrendingUp className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
          <div className="text-slate-400 text-[10px] mb-1">Ganho Total</div>
          <div className="text-lg font-black text-emerald-400">
            $ {totalGain.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/50 rounded-xl p-3 text-center">
          <Percent className="w-6 h-6 text-purple-400 mx-auto mb-1" />
          <div className="text-slate-400 text-[10px] mb-1">ROI Total</div>
          <div className="text-lg font-black text-purple-400">
            +{totalReturnPercentage.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
          </div>
        </div>
      </div>

      {/* Resumo Mensal Compacto */}
      <div className="mb-6">
        <h3 className="text-base font-black text-white mb-3 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-blue-400" />
          Resumo Mensal
        </h3>
        <div className="grid grid-cols-6 gap-2">
          {projectionData.slice(0, Math.min(selectedPeriod + 1, 12)).map((item, idx) => (
            <div key={idx} className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-2 text-center">
              <div className="text-slate-400 text-[9px] mb-0.5">M{item.month}</div>
              <div className="text-white font-bold text-[11px]">
                $ {(item.balance / 1000).toFixed(1)}k
              </div>
              {item.month > 0 && (
                <div className="text-emerald-400 text-[9px] mt-0.5">
                  +{((item.gain / item.balance) * 100).toFixed(1)}%
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Explicação Juros Compostos - Compacto */}
      <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-xl p-4 mb-4">
        <h3 className="text-sm font-bold text-white mb-2">💡 Como Funcionam os Juros Compostos</h3>
        <p className="text-slate-300 text-xs leading-relaxed">
          Com <strong className="text-purple-400">{monthlyReturn}% ao mês</strong>, seu capital inicial de{' '}
          <strong className="text-white">$ {capital.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
          {' '}cresce exponencialmente para{' '}
          <strong className="text-emerald-400">$ {finalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
          {' '}em apenas <strong className="text-white">{selectedPeriod} meses</strong>. 
          Ganho total: <strong className="text-emerald-400">$ {totalGain.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
          {' '}({totalReturnPercentage.toFixed(2)}% ROI). 
          A chave está em reinvestir os lucros mensais!
        </p>
      </div>

      {/* Footer */}
      <div className="text-center pt-4 border-t border-slate-700/50">
        <div className="text-purple-300 text-sm font-bold mb-1">Powered by</div>
        <div className="text-2xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-purple-500 bg-clip-text text-transparent">
          ScaleCripto.com
        </div>
        <p className="text-slate-500 text-xs mt-1">iA Institucional de Trading</p>
      </div>
    </div>
  );
}