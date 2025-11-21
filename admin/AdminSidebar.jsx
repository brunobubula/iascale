import React from "react";
import { Shield, Users, Database, FileText, MessageSquare, Brain, Palette, TrendingUp, LayoutDashboard, Crown, Package, Coins } from "lucide-react";
import { motion } from "framer-motion";

const menuItems = [
  { id: "overview", label: "Dashboard", icon: LayoutDashboard, color: "blue" },
  { id: "quick_stats", label: "Estatísticas", icon: TrendingUp, color: "emerald" },
  { id: "users", label: "Usuários", icon: Users, color: "cyan" },
  { id: "pairs", label: "Gestão de Pares", icon: Coins, color: "teal" },
  { id: "eduzz", label: "PackCréditos", icon: Package, color: "green" },
  { id: "admins", label: "Admins Auxiliares", icon: Shield, color: "purple" },
  { id: "plans", label: "Gestão de Planos", icon: Crown, color: "yellow" },
  { id: "support", label: "Suporte", icon: MessageSquare, color: "pink" },
  { id: "ai_training", label: "Treinamento IA", icon: Brain, color: "indigo" },
  { id: "data", label: "Coleta de Dados", icon: Database, color: "orange" },
  { id: "audit", label: "Auditoria", icon: FileText, color: "red" },
  { id: "site_editor", label: "Editor do Site", icon: Palette, color: "rose" }
];

const colorClasses = {
  emerald: "bg-emerald-500/20 text-emerald-400 border-emerald-500/50",
  blue: "bg-blue-500/20 text-blue-400 border-blue-500/50",
  cyan: "bg-cyan-500/20 text-cyan-400 border-cyan-500/50",
  teal: "bg-teal-500/20 text-teal-400 border-teal-500/50",
  green: "bg-green-500/20 text-green-400 border-green-500/50",
  yellow: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
  pink: "bg-pink-500/20 text-pink-400 border-pink-500/50",
  purple: "bg-purple-500/20 text-purple-400 border-purple-500/50",
  indigo: "bg-indigo-500/20 text-indigo-400 border-indigo-500/50",
  orange: "bg-orange-500/20 text-orange-400 border-orange-500/50",
  rose: "bg-rose-500/20 text-rose-400 border-rose-500/50",
  red: "bg-red-500/20 text-red-400 border-red-500/50"
};

export default function AdminSidebar({ activeTab, setActiveTab }) {
  return (
    <div className="w-64 bg-slate-900/50 backdrop-blur-xl border-r border-slate-800/50 flex flex-col h-full">
      <div className="p-6 border-b border-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center shadow-lg">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg">Admin Master</h2>
            <p className="text-slate-400 text-xs">Controle Total</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {menuItems.map((item) => (
          <motion.button
            key={item.id}
            whileHover={{ x: 4 }}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === item.id
                ? `${colorClasses[item.color]} border shadow-lg`
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-semibold text-sm">{item.label}</span>
          </motion.button>
        ))}
      </div>

      <div className="p-4 border-t border-slate-800/50">
        <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-400 font-bold text-xs">Sessão Segura</span>
          </div>
          <p className="text-slate-400 text-xs">Autenticado com sucesso</p>
        </div>
      </div>
    </div>
  );
}