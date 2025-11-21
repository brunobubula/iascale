import React from "react";
import { AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function Disclaimer() {
  return (
    <Card className="bg-gradient-to-r from-orange-900/20 to-red-900/20 border-orange-500/30 p-4 mb-6">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-2 text-xs text-slate-300">
          <p className="font-bold text-orange-400 text-sm">AVISO LEGAL IMPORTANTE - LEIA ATENTAMENTE</p>
          
          <p>
            <strong>1. Natureza Educacional:</strong> Este serviço é EXCLUSIVAMENTE educacional e de simulação. 
            Todas as análises, estudos de performance e estratégias apresentadas são baseadas em dados históricos 
            e simulações computacionais para fins de aprendizado.
          </p>
          
          <p>
            <strong>2. Não é Consultoria:</strong> Este aplicativo NÃO oferece análise ou consultoria de valores 
            mobiliários regulamentada pela CVM (Comissão de Valores Mobiliários). Não somos analistas credenciados 
            e não fornecemos recomendações personalizadas de investimento.
          </p>
          
          <p>
            <strong>3. Decisão do Usuário:</strong> A responsabilidade pela decisão final de investimento é 
            INTEGRALMENTE do usuário. Você deve realizar sua própria análise e considerar seus objetivos financeiros, 
            tolerância ao risco e situação pessoal antes de tomar qualquer decisão de investimento.
          </p>
          
          <p>
            <strong>4. Performance Passada:</strong> A performance passada simulada NÃO GARANTE resultados futuros. 
            Os mercados são voláteis e imprevisíveis. Todos os investimentos envolvem riscos, incluindo a possível 
            perda do capital investido.
          </p>
          
          <p>
            <strong>5. Uso dos Dados:</strong> Os estudos de performance e insights de dados apresentados são 
            ferramentas educacionais para auxiliar no seu aprendizado sobre mercados financeiros. Use-os como 
            referência para seus próprios estudos, nunca como ordens de compra ou venda.
          </p>
          
          <p className="text-orange-400 font-semibold">
            Ao utilizar este aplicativo, você reconhece e concorda com estes termos. Se você não concorda, 
            não utilize o serviço.
          </p>
        </div>
      </div>
    </Card>
  );
}