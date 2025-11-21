import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, TrendingUp, Sparkles, DollarSign, Shield, Crown, BarChart3, Settings, User, Gift, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

const PAGES = [
  { name: "Dashboard", icon: TrendingUp, keywords: ["home", "início", "principal", "trades"] },
  { name: "AddSignal", icon: TrendingUp, keywords: ["novo", "trade", "sinal", "criar"] },
  { name: "AITrader", icon: Sparkles, keywords: ["ia", "inteligência", "artificial", "gerar"] },
  { name: "AITraderHistory", icon: FileText, keywords: ["histórico", "ia", "sinais"] },
  { name: "AnalisePL", icon: BarChart3, keywords: ["análise", "lucro", "perda", "ganhos"] },
  { name: "Portfolio", icon: DollarSign, keywords: ["portfólio", "patrimônio", "ativos"] },
  { name: "MyProfile", icon: User, keywords: ["perfil", "conta", "dados"] },
  { name: "UserSettings", icon: Settings, keywords: ["configurações", "preferências"] },
  { name: "AddCredito", icon: DollarSign, keywords: ["crédito", "comprar", "adicionar"] },
  { name: "SejaPRO", icon: Crown, keywords: ["upgrade", "pro", "plano"] },
  { name: "AffiliateProgram", icon: Gift, keywords: ["afiliados", "indicar"] },
  { name: "AdminMaster", icon: Shield, keywords: ["admin", "administração"] },
  { name: "CentralDeAjuda", icon: FileText, keywords: ["ajuda", "suporte", "tutorial"] },
  { name: "Suporte", icon: FileText, keywords: ["suporte", "ajuda", "ticket"] },
];

export default function GlobalSearch({ open, onOpenChange }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  const { data: trades = [] } = useQuery({
    queryKey: ['trades'],
    queryFn: () => base44.entities.TradeSignal.list("-created_date"),
    initialData: [],
    enabled: open,
  });

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const searchQuery = query.toLowerCase();
    const pageResults = PAGES.filter(page => 
      page.name.toLowerCase().includes(searchQuery) ||
      page.keywords.some(k => k.includes(searchQuery))
    ).map(page => ({ ...page, type: 'page' }));

    const tradeResults = trades.filter(trade =>
      trade.pair.toLowerCase().includes(searchQuery)
    ).slice(0, 5).map(trade => ({ ...trade, type: 'trade' }));

    setResults([...pageResults.slice(0, 5), ...tradeResults]);
  }, [query, trades]);

  const handleSelect = (item) => {
    if (item.type === 'page') {
      navigate(createPageUrl(item.name));
    } else if (item.type === 'trade') {
      navigate(createPageUrl("Dashboard") + `?highlight=${item.id}`);
    }
    onOpenChange(false);
    setQuery("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl p-0">
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar páginas, funcionalidades ou trades..."
              className="pl-11 bg-slate-800/50 border-slate-700 text-white h-12 text-base"
              autoFocus
            />
          </div>
        </div>

        <AnimatePresence>
          {results.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-h-96 overflow-y-auto px-2 pb-4"
            >
              {results.map((item, index) => (
                <motion.button
                  key={item.type === 'page' ? item.name : item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => handleSelect(item)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800/50 transition-all mb-1"
                >
                  {item.type === 'page' ? (
                    <>
                      <div className="w-10 h-10 rounded-lg bg-slate-800/50 flex items-center justify-center flex-shrink-0">
                        <item.icon className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div className="text-left flex-1">
                        <div className="text-white font-semibold">{item.name}</div>
                        <div className="text-slate-400 text-xs">Página</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-lg bg-slate-800/50 flex items-center justify-center flex-shrink-0">
                        <TrendingUp className="w-5 h-5 text-blue-400" />
                      </div>
                      <div className="text-left flex-1">
                        <div className="text-white font-semibold">{item.pair}</div>
                        <div className="text-slate-400 text-xs">
                          {item.type === "BUY" ? "Compra" : "Venda"} • {item.status}
                        </div>
                      </div>
                      <div className={`text-sm font-bold ${
                        (item.profit_loss_usd || 0) >= 0 ? "text-emerald-400" : "text-red-400"
                      }`}>
                        {(item.profit_loss_usd || 0) >= 0 ? "+" : ""}$ {(item.profit_loss_usd || 0).toFixed(2)}
                      </div>
                    </>
                  )}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {query && results.length === 0 && (
          <div className="p-8 text-center">
            <Search className="w-12 h-12 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">Nenhum resultado encontrado</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}