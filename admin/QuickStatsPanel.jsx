import React from "react";
import { Card } from "@/components/ui/card";
import { Users, TrendingUp, DollarSign, Activity, Sparkles, MessageSquare, Brain, Crown } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function QuickStatsPanel({ allUsers }) {
  const { data: tickets = [] } = useQuery({
    queryKey: ['allTickets'],
    queryFn: () => base44.entities.SupportTicket.list("-created_date"),
    initialData: []
  });

  const { data: trades = [] } = useQuery({
    queryKey: ['allTrades'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getAllUsersTrades', {});
      return response.data?.trades || [];
    },
    initialData: []
  });

  const totalUsers = allUsers.length;
  const proUsers = allUsers.filter(u => u.is_pro).length;
  const activeUsers = allUsers.filter(u => !u.is_blocked).length;
  const totalCreditsInSystem = allUsers.reduce((sum, u) => sum + (u.account_credit_balance || 0), 0);
  
  const openTickets = tickets.filter(t => t.status === 'open').length;
  const activeTrades = trades.filter(t => t.status === 'ACTIVE').length;
  const todayTrades = trades.filter(t => {
    const created = new Date(t.created_date);
    const today = new Date();
    return created.toDateString() === today.toDateString();
  }).length;

  const stats = [
    { 
      label: "Total de Usuários", 
      value: totalUsers, 
      icon: Users, 
      color: "from-blue-500 to-cyan-600",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/30"
    },
    { 
      label: "Usuários PRO", 
      value: proUsers, 
      icon: Crown, 
      color: "from-yellow-500 to-orange-600",
      bgColor: "bg-yellow-500/10",
      borderColor: "border-yellow-500/30"
    },
    { 
      label: "Usuários Ativos", 
      value: activeUsers, 
      icon: Activity, 
      color: "from-emerald-500 to-teal-600",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/30"
    },
    { 
      label: "Créditos no Sistema", 
      value: `C$ ${totalCreditsInSystem.toFixed(0)}`, 
      icon: DollarSign, 
      color: "from-purple-500 to-pink-600",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/30"
    },
    { 
      label: "Tickets Abertos", 
      value: openTickets, 
      icon: MessageSquare, 
      color: "from-pink-500 to-rose-600",
      bgColor: "bg-pink-500/10",
      borderColor: "border-pink-500/30"
    },
    { 
      label: "Trades Ativos", 
      value: activeTrades, 
      icon: TrendingUp, 
      color: "from-indigo-500 to-purple-600",
      bgColor: "bg-indigo-500/10",
      borderColor: "border-indigo-500/30"
    },
    { 
      label: "Trades Hoje", 
      value: todayTrades, 
      icon: Sparkles, 
      color: "from-cyan-500 to-blue-600",
      bgColor: "bg-cyan-500/10",
      borderColor: "border-cyan-500/30"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Activity className="w-6 h-6 text-blue-400" />
        <h2 className="text-2xl font-bold text-white">Resumo Rápido</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className={`${stat.bgColor} border ${stat.borderColor} p-4`}>
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-slate-400 text-xs mb-1">{stat.label}</p>
              <p className="text-white font-black text-2xl">{stat.value}</p>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}