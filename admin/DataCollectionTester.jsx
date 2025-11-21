import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { 
  FlaskConical, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  TrendingUp, 
  AlertTriangle,
  Database,
  Activity,
  Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const TIMEFRAMES = ["1m", "5m", "15m", "30m", "1h", "4h", "1d", "1w"];

export default function DataCollectionTester() {
  const [testPair, setTestPair] = useState("BTC/USDT");
  const [testTimeframe, setTestTimeframe] = useState("1h");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleRunTest = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const response = await base44.functions.invoke('testDataCollection', {
        pair: testPair,
        timeframe: testTimeframe
      });

      setTestResult(response.data);
    } catch (error) {
      setTestResult({
        overall_status: 'ERROR',
        error: error.message,
        recommendations: ['❌ Erro ao executar teste. Verifique console.']
      });
    } finally {
      setTesting(false);
    }
  };

  const getStatusColor = (status) => {
    if (status === 'SUCCESS') return 'emerald';
    if (status === 'PARTIAL_FAILURE') return 'yellow';
    return 'red';
  };

  const statusColor = testResult ? getStatusColor(testResult.overall_status) : 'slate';

  return (
    <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border-slate-700/50 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg">
          <FlaskConical className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-white">Teste de Coleta de Dados</h2>
          <p className="text-slate-400 text-sm">Validação completa do sistema em 5 etapas</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <Label className="text-slate-300 mb-2">Par de Teste</Label>
          <Input
            value={testPair}
            onChange={(e) => setTestPair(e.target.value.toUpperCase())}
            placeholder="BTC/USDT"
            className="bg-slate-800/50 border-slate-700 text-white"
          />
        </div>

        <div>
          <Label className="text-slate-300 mb-2">Timeframe</Label>
          <Select value={testTimeframe} onValueChange={setTestTimeframe}>
            <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              {TIMEFRAMES.map(tf => (
                <SelectItem key={tf} value={tf} className="text-white">{tf}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button
        onClick={handleRunTest}
        disabled={testing || !testPair || !testTimeframe}
        className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-bold mb-6"
      >
        {testing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Executando Testes...
          </>
        ) : (
          <>
            <FlaskConical className="w-4 h-4 mr-2" />
            Executar Bateria de Testes
          </>
        )}
      </Button>

      <AnimatePresence>
        {testResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* Status Geral */}
            <Card className={`bg-${statusColor}-500/10 border-${statusColor}-500/30 p-4`}>
              <div className="flex items-center gap-3">
                {testResult.overall_status === 'SUCCESS' ? (
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                ) : testResult.overall_status === 'PARTIAL_FAILURE' ? (
                  <AlertTriangle className="w-8 h-8 text-yellow-400" />
                ) : (
                  <XCircle className="w-8 h-8 text-red-400" />
                )}
                <div>
                  <h3 className={`text-xl font-black text-${statusColor}-400`}>
                    {testResult.overall_status === 'SUCCESS' ? '✅ SUCESSO TOTAL' : 
                     testResult.overall_status === 'PARTIAL_FAILURE' ? '⚠️ SUCESSO PARCIAL' : 
                     '❌ FALHA'}
                  </h3>
                  <p className="text-slate-300 text-sm">
                    Teste executado para {testPair} ({testTimeframe})
                  </p>
                </div>
              </div>
            </Card>

            {/* Validação de Par */}
            <Card className="bg-slate-800/30 border-slate-700/50 p-4">
              <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-400" />
                Teste 1 & 2: Validação de Par
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className={`rounded-lg p-3 border ${
                  testResult.pair_validation?.binance?.available 
                    ? 'bg-emerald-500/10 border-emerald-500/30' 
                    : 'bg-red-500/10 border-red-500/30'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {testResult.pair_validation?.binance?.available ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400" />
                    )}
                    <span className={`font-bold text-sm ${
                      testResult.pair_validation?.binance?.available ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      Binance
                    </span>
                  </div>
                  {testResult.pair_validation?.binance?.available && (
                    <div className="text-xs text-slate-300 space-y-1">
                      <div>Preço: ${testResult.pair_validation.binance.current_price?.toFixed(2)}</div>
                      <div>Vol 24h: ${(testResult.pair_validation.binance.volume_24h || 0).toLocaleString()}</div>
                      <div className={`${
                        (testResult.pair_validation.binance.price_change_24h || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        24h: {(testResult.pair_validation.binance.price_change_24h || 0).toFixed(2)}%
                      </div>
                    </div>
                  )}
                </div>

                <div className={`rounded-lg p-3 border ${
                  testResult.pair_validation?.kraken?.available 
                    ? 'bg-emerald-500/10 border-emerald-500/30' 
                    : 'bg-red-500/10 border-red-500/30'
                }`}>
                  <div className="flex items-center gap-2">
                    {testResult.pair_validation?.kraken?.available ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400" />
                    )}
                    <span className={`font-bold text-sm ${
                      testResult.pair_validation?.kraken?.available ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      Kraken
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Coleta de Dados */}
            <Card className={`p-4 border ${
              testResult.data_collection?.success 
                ? 'bg-emerald-500/10 border-emerald-500/30' 
                : 'bg-red-500/10 border-red-500/30'
            }`}>
              <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                <Database className="w-4 h-4 text-purple-400" />
                Teste 3: Coleta de Dados Históricos
              </h4>
              {testResult.data_collection?.success ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-bold text-lg">{testResult.data_collection.candlesReceived} candles coletados</span>
                  </div>
                  {testResult.data_collection.firstCandle && (
                    <div className="bg-slate-900/50 rounded-lg p-3 text-xs space-y-1">
                      <div className="text-slate-400">Primeiro Candle:</div>
                      <div className="text-white">
                        Data: {new Date(testResult.data_collection.firstCandle.timestamp).toLocaleString('pt-BR')}
                      </div>
                      <div className="grid grid-cols-4 gap-2 mt-2">
                        <div>
                          <div className="text-slate-500">Open</div>
                          <div className="text-white font-semibold">${testResult.data_collection.firstCandle.open}</div>
                        </div>
                        <div>
                          <div className="text-slate-500">High</div>
                          <div className="text-white font-semibold">${testResult.data_collection.firstCandle.high}</div>
                        </div>
                        <div>
                          <div className="text-slate-500">Low</div>
                          <div className="text-white font-semibold">${testResult.data_collection.firstCandle.low}</div>
                        </div>
                        <div>
                          <div className="text-slate-500">Close</div>
                          <div className="text-white font-semibold">${testResult.data_collection.firstCandle.close}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-400">
                  <XCircle className="w-5 h-5" />
                  <span className="text-sm">{testResult.data_collection?.error || 'Falha desconhecida'}</span>
                </div>
              )}
            </Card>

            {/* Entidade + Escrita */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className={`p-4 border ${
                testResult.database_entity?.success 
                  ? 'bg-emerald-500/10 border-emerald-500/30' 
                  : 'bg-red-500/10 border-red-500/30'
              }`}>
                <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-400" />
                  Teste 4: Entidade
                </h4>
                {testResult.database_entity?.success ? (
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="font-bold">OK</span>
                    </div>
                    <div className="text-slate-300">
                      {testResult.database_entity.recordsInDB} registros no banco
                    </div>
                    {testResult.database_entity.latestRecord && (
                      <div className="bg-slate-900/50 rounded p-2 mt-2">
                        <div className="text-slate-400">Último: {new Date(testResult.database_entity.latestRecord.timestamp).toLocaleString('pt-BR')}</div>
                        <div className="text-white font-semibold">${testResult.database_entity.latestRecord.close}</div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-400 text-xs">
                    <XCircle className="w-4 h-4" />
                    <span>{testResult.database_entity?.error || 'Falha'}</span>
                  </div>
                )}
              </Card>

              <Card className={`p-4 border ${
                testResult.write_test?.success 
                  ? 'bg-emerald-500/10 border-emerald-500/30' 
                  : 'bg-red-500/10 border-red-500/30'
              }`}>
                <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  Teste 5: Escrita
                </h4>
                {testResult.write_test?.success ? (
                  <div className="flex items-center gap-2 text-emerald-400 text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="font-bold">{testResult.write_test.message}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-400 text-xs">
                    <XCircle className="w-4 h-4" />
                    <span>{testResult.write_test?.error || 'Falha'}</span>
                  </div>
                )}
              </Card>
            </div>

            {/* Recomendações */}
            {testResult.recommendations && testResult.recommendations.length > 0 && (
              <Card className="bg-blue-500/10 border-blue-500/30 p-4">
                <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                  Recomendações
                </h4>
                <div className="space-y-2">
                  {testResult.recommendations.map((rec, idx) => (
                    <div key={idx} className="text-slate-300 text-sm flex items-start gap-2">
                      <span className="text-blue-400 font-bold">•</span>
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}