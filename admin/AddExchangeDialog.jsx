import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, ExternalLink, CheckCircle2, Copy, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

const EXCHANGE_GUIDES = {
  Binance: {
    name: "Binance",
    apiDocsUrl: "https://binance-docs.github.io/apidocs/spot/en/",
    setupSteps: [
      "Acesse binance.com e faça login na sua conta",
      "Vá em Account > API Management",
      "Clique em 'Create API' e escolha 'System Generated'",
      "Dê um nome à API Key (ex: ScaleCripto)",
      "Copie a API Key e Secret Key (guarde em local seguro!)",
      "Configure restrições: Enable Reading, Enable Spot & Margin Trading",
      "Adicione o IP do servidor (se aplicável) ou marque 'Unrestricted'",
      "Ative 2FA para confirmar a criação"
    ],
    envVars: ["BINANCE_API_KEY", "BINANCE_SECRET_KEY"],
    testEndpoint: "https://api.binance.com/api/v3/ticker/24hr",
    notes: [
      "⚠️ Binance possui restrições regionais em alguns países",
      "💡 Para trading real, use IPs restritos por segurança",
      "🔒 Nunca compartilhe suas keys com terceiros"
    ]
  },
  Kraken: {
    name: "Kraken",
    apiDocsUrl: "https://docs.kraken.com/rest/",
    setupSteps: [
      "Acesse kraken.com e faça login",
      "Vá em Settings > API",
      "Clique em 'Generate New Key'",
      "Dê um nome descritivo (ex: ScaleCripto Data)",
      "Selecione permissões: Query Funds, Query Open Orders & Trades",
      "NÃO marque permissões de trading se for apenas para dados",
      "Copie a API Key e Private Key imediatamente",
      "Confirme com 2FA"
    ],
    envVars: ["KRAKEN_API_KEY", "KRAKEN_SECRET_KEY"],
    testEndpoint: "https://api.kraken.com/0/public/AssetPairs",
    notes: [
      "✅ Kraken é uma das exchanges mais confiáveis",
      "💡 API gratuita com rate limits generosos",
      "🔒 Recomendado usar keys separadas para trading e dados"
    ]
  },
  Bybit: {
    name: "Bybit",
    apiDocsUrl: "https://bybit-exchange.github.io/docs/v5/intro",
    setupSteps: [
      "Acesse bybit.com e faça login",
      "Vá em Account & Security > API",
      "Clique em 'Create New Key'",
      "Escolha 'API Transaction' ou 'Read Only' (recomendado)",
      "Configure permissões: leitura de mercado e posições",
      "Defina um IP fixo ou marque 'No Restriction' (menos seguro)",
      "Copie API Key e Secret",
      "Confirme com código 2FA e email"
    ],
    envVars: ["BYBIT_API_KEY", "BYBIT_SECRET_KEY"],
    testEndpoint: "https://api.bybit.com/v5/market/tickers",
    notes: [
      "⚠️ Bybit tem restrições em alguns países (US, UK)",
      "💡 API v5 é a mais recente e estável",
      "🔒 Use Read-Only keys se não for executar trades automáticos"
    ]
  },
  CoinGecko: {
    name: "CoinGecko",
    apiDocsUrl: "https://www.coingecko.com/en/api/documentation",
    setupSteps: [
      "Acesse coingecko.com/en/api",
      "Escolha um plano (Free tem 10-30 calls/min)",
      "Crie uma conta ou faça login",
      "Acesse o Dashboard de API",
      "Copie sua API Key",
      "Não precisa de Secret Key (apenas API Key)",
      "Configure rate limits no seu código"
    ],
    envVars: ["COINGECKO_API_KEY"],
    testEndpoint: "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd",
    notes: [
      "✅ Ótima fonte de dados agregados de múltiplas exchanges",
      "💡 Plano Free é suficiente para começar",
      "📊 Fornece dados históricos e market cap"
    ]
  },
  CoinMarketCap: {
    name: "CoinMarketCap",
    apiDocsUrl: "https://coinmarketcap.com/api/documentation/v1/",
    setupSteps: [
      "Acesse pro.coinmarketcap.com",
      "Crie uma conta gratuita",
      "Vá em API Keys no dashboard",
      "Copie sua API Key (Basic plan: 10k calls/mês grátis)",
      "Leia a documentação para endpoints disponíveis",
      "Configure headers: X-CMC_PRO_API_KEY"
    ],
    envVars: ["COINMARKETCAP_API_KEY"],
    testEndpoint: "https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest",
    notes: [
      "✅ Dados de alta qualidade e confiáveis",
      "💡 10.000 calls/mês no plano gratuito",
      "📊 Excelente para ranking e market cap"
    ]
  }
};

export default function AddExchangeDialog({ open, onOpenChange }) {
  const [selectedExchange, setSelectedExchange] = useState("");
  const [activeTab, setActiveTab] = useState("select");

  const handleCopyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const guide = selectedExchange ? EXCHANGE_GUIDES[selectedExchange] : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Plus className="w-6 h-6 text-emerald-400" />
            Adicionar Nova Corretora
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-3 bg-slate-800/50">
            <TabsTrigger value="select">1. Selecionar</TabsTrigger>
            <TabsTrigger value="setup" disabled={!selectedExchange}>2. Configurar</TabsTrigger>
            <TabsTrigger value="install" disabled={!selectedExchange}>3. Instalar</TabsTrigger>
          </TabsList>

          <TabsContent value="select" className="space-y-4 mt-6">
            <p className="text-slate-400 text-sm mb-4">
              Escolha a corretora que deseja adicionar ao sistema:
            </p>
            <div className="grid grid-cols-2 gap-4">
              {Object.keys(EXCHANGE_GUIDES).map((exchange) => (
                <button
                  key={exchange}
                  onClick={() => {
                    setSelectedExchange(exchange);
                    setActiveTab("setup");
                  }}
                  className="bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/50 rounded-lg p-4 transition-all text-left"
                >
                  <h3 className="text-white font-bold text-lg mb-2">{EXCHANGE_GUIDES[exchange].name}</h3>
                  <p className="text-slate-400 text-xs">
                    Clique para ver guia de instalação
                  </p>
                </button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="setup" className="space-y-6 mt-6">
            {guide && (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-bold text-lg">Guia de Configuração: {guide.name}</h3>
                  <a
                    href={guide.apiDocsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Documentação Oficial
                  </a>
                </div>

                <Card className="bg-slate-800/30 border-slate-700 p-4">
                  <h4 className="text-emerald-400 font-semibold mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Passo a Passo
                  </h4>
                  <ol className="space-y-2">
                    {guide.setupSteps.map((step, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Badge className="bg-emerald-500/20 text-emerald-400 mt-0.5 flex-shrink-0">
                          {index + 1}
                        </Badge>
                        <span className="text-slate-300 text-sm">{step}</span>
                      </li>
                    ))}
                  </ol>
                </Card>

                <Card className="bg-yellow-500/10 border-yellow-500/30 p-4">
                  <h4 className="text-yellow-400 font-semibold mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Notas Importantes
                  </h4>
                  <ul className="space-y-2">
                    {guide.notes.map((note, index) => (
                      <li key={index} className="text-slate-300 text-sm">
                        {note}
                      </li>
                    ))}
                  </ul>
                </Card>

                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab("select")}
                    className="bg-slate-800/50 border-slate-700 text-white hover:bg-slate-800"
                  >
                    Voltar
                  </Button>
                  <Button
                    onClick={() => setActiveTab("install")}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Próximo: Instalar →
                  </Button>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="install" className="space-y-6 mt-6">
            {guide && (
              <>
                <Card className="bg-slate-800/30 border-slate-700 p-4">
                  <h4 className="text-blue-400 font-semibold mb-3">
                    Variáveis de Ambiente Necessárias
                  </h4>
                  <div className="space-y-3">
                    {guide.envVars.map((envVar) => (
                      <div key={envVar} className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                        <div className="flex items-center justify-between">
                          <code className="text-emerald-400 text-sm font-mono">{envVar}</code>
                          <button
                            onClick={() => handleCopyToClipboard(envVar)}
                            className="text-slate-400 hover:text-white transition-colors"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="bg-blue-500/10 border-blue-500/30 p-4">
                  <h4 className="text-blue-400 font-semibold mb-3">
                    📝 Como Adicionar ao Sistema
                  </h4>
                  <ol className="space-y-2 text-slate-300 text-sm">
                    <li>1. Vá em <strong className="text-white">Dashboard Base44 → Settings → Environment Variables</strong></li>
                    <li>2. Adicione cada variável com os valores obtidos da corretora</li>
                    <li>3. Salve as configurações</li>
                    <li>4. Retorne ao Admin Master → Gestão de Pares</li>
                    <li>5. Ative a corretora e execute a primeira sincronização</li>
                  </ol>
                </Card>

                <Card className="bg-emerald-500/10 border-emerald-500/30 p-4">
                  <h4 className="text-emerald-400 font-semibold mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Testar Conexão
                  </h4>
                  <p className="text-slate-300 text-sm mb-3">
                    Endpoint de teste para verificar se a API está funcionando:
                  </p>
                  <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                    <code className="text-xs text-slate-400 break-all">{guide.testEndpoint}</code>
                  </div>
                </Card>

                <div className="flex justify-between gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab("setup")}
                    className="bg-slate-800/50 border-slate-700 text-white hover:bg-slate-800"
                  >
                    ← Voltar
                  </Button>
                  <Button
                    onClick={() => {
                      window.open("https://app.base44.com/settings", "_blank");
                    }}
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                  >
                    Abrir Settings Base44
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}