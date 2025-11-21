import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { TrendingUp, DollarSign, Zap, ShieldAlert, AlertTriangle, Clock, Crown } from "lucide-react";

export default function UserActivityPanel({ users = [] }) {
  const validUsers = Array.isArray(users) ? users : [];

  const { data: tradesData = [] } = useQuery({
    queryKey: ['allTrades'],
    queryFn: () => base44.asServiceRole.entities.TradeSignal.list("-created_date"),
    initialData: []
  });

  const trades = Array.isArray(tradesData) ? tradesData : [];

  // Usuários que mais lucram
  const topProfitUsers = useMemo(() => {
    const userProfits = {};
    
    trades.forEach(trade => {
      if (trade?.status !== 'ACTIVE' && trade?.created_by) {
        const profit = trade?.profit_loss_usd || 0;
        if (!userProfits[trade.created_by]) {
          userProfits[trade.created_by] = { email: trade.created_by, totalProfit: 0, trades: 0 };
        }
        userProfits[trade.created_by].totalProfit += profit;
        userProfits[trade.created_by].trades++;
      }
    });

    return Object.values(userProfits)
      .sort((a, b) => b.totalProfit - a.totalProfit)
      .slice(0, 10);
  }, [trades]);

  // Maiores compradores de créditos
  const topCreditBuyers = useMemo(() => {
    return validUsers
      .filter(u => (u?.credit_purchase_total_brl || 0) > 0)
      .sort((a, b) => (b?.credit_purchase_total_brl || 0) - (a?.credit_purchase_total_brl || 0))
      .slice(0, 10);
  }, [validUsers]);

  // Créditos consumidos
  const topCreditConsumers = useMemo(() => {
    return validUsers
      .map(u => ({
        email: u?.email,
        consumed: (u?.credits_consumed || 0),
        balance: (u?.account_credit_balance || 0)
      }))
      .filter(u => u.consumed > 0)
      .sort((a, b) => b.consumed - a.consumed)
      .slice(0, 10);
  }, [validUsers]);

  // Usuários bloqueados
  const blockedUsers = validUsers.filter(u => u?.is_blocked);

  // Usuários com problemas
  const problematicUsers = useMemo(() => {
    return validUsers.filter(u => 
      (u?.account_credit_balance || 0) < 0 || 
      u?.is_blocked ||
      (u?.failed_payment_attempts || 0) > 2
    );
  }, [validUsers]);

  return (
    <div className="space-y-6">
      {/* Top Lucros */}
      <Card className="bg-slate-900/50 border-slate-800/50 p-5">
        <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
          Top 10 Usuários Mais Lucrativos
        </h3>
        <div className="space-y-2">
          {topProfitUsers.map((user, idx) => (
            <div key={user?.email} className="bg-slate-800/30 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm">
                  #{idx + 1}
                </div>
                <div>
                  <div className="text-white font-semibold text-sm">{user?.email}</div>
                  <div className="text-slate-400 text-xs">{user?.trades} trades fechados</div>
                </div>
              </div>
              <div className={`font-black text-sm ${user?.totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {user?.totalProfit >= 0 ? '+' : ''}${user?.totalProfit.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Maiores Compradores */}
      <Card className="bg-slate-900/50 border-slate-800/50 p-5">
        <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-blue-400" />
          Top 10 Maiores Compradores de Créditos
        </h3>
        <div className="space-y-2">
          {topCreditBuyers.map((user, idx) => (
            <div key={user?.email} className="bg-slate-800/30 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white font-bold text-sm">
                  #{idx + 1}
                </div>
                <div>
                  <div className="text-white font-semibold text-sm">{user?.email}</div>
                  <div className="text-slate-400 text-xs">
                    Saldo: C${(user?.account_credit_balance || 0).toFixed(2)}
                  </div>
                </div>
              </div>
              <div className="text-blue-400 font-black text-sm">
                R${(user?.credit_purchase_total_brl || 0).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Créditos Consumidos */}
      <Card className="bg-slate-900/50 border-slate-800/50 p-5">
        <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-purple-400" />
          Top 10 Maior Consumo de Créditos
        </h3>
        <div className="space-y-2">
          {topCreditConsumers.map((user, idx) => (
            <div key={user?.email} className="bg-slate-800/30 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-sm">
                  #{idx + 1}
                </div>
                <div>
                  <div className="text-white font-semibold text-sm">{user?.email}</div>
                  <div className="text-slate-400 text-xs">
                    Saldo atual: C${user?.balance.toFixed(2)}
                  </div>
                </div>
              </div>
              <div className="text-purple-400 font-black text-sm">
                -C${user?.consumed.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Usuários Bloqueados */}
      {blockedUsers.length > 0 && (
        <Card className="bg-red-500/10 border-red-500/30 p-5">
          <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-400" />
            Usuários Bloqueados ({blockedUsers.length})
          </h3>
          <div className="space-y-2">
            {blockedUsers.map((user) => (
              <div key={user?.email} className="bg-slate-800/30 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="text-white font-semibold text-sm">{user?.email}</div>
                  <Badge className="bg-red-500/20 text-red-400 border-red-500/50">
                    Bloqueado
                  </Badge>
                </div>
                {user?.block_reason && (
                  <div className="text-slate-400 text-xs mt-1">{user.block_reason}</div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Usuários com Problemas */}
      {problematicUsers.length > 0 && (
        <Card className="bg-yellow-500/10 border-yellow-500/30 p-5">
          <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            Usuários com Problemas ({problematicUsers.length})
          </h3>
          <div className="space-y-2">
            {problematicUsers.slice(0, 10).map((user) => (
              <div key={user?.email} className="bg-slate-800/30 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-semibold text-sm">{user?.email}</div>
                    <div className="text-slate-400 text-xs">
                      {(user?.account_credit_balance || 0) < 0 && '⚠️ Saldo negativo • '}
                      {user?.is_blocked && '🚫 Bloqueado • '}
                      {(user?.failed_payment_attempts || 0) > 2 && '💳 Falhas de pagamento'}
                    </div>
                  </div>
                  <div className="text-slate-400 text-xs">
                    C${(user?.account_credit_balance || 0).toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}