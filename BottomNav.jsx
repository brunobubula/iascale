import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Home, 
  TrendingUp, 
  Sparkles, 
  User,
  BarChart3
} from "lucide-react";
import { motion } from "framer-motion";

const NAV_ITEMS = [
  {
    label: "Página Inicial",
    icon: Home,
    page: "Dashboard",
    activeColor: "emerald"
  },
  {
    label: "Mercados",
    icon: TrendingUp,
    page: "Mercados",
    activeColor: "blue"
  },
  {
    label: "Trade",
    icon: Sparkles,
    page: "AITrader",
    activeColor: "purple"
  },
  {
    label: "Ganhos",
    icon: BarChart3,
    page: "AnalisePL",
    activeColor: "yellow"
  },
  {
    label: "Perfil",
    icon: User,
    page: "MyProfile",
    activeColor: "pink"
  }
];

const getColorClasses = (color, isActive) => {
  const colors = {
    emerald: isActive ? "text-emerald-400" : "text-slate-500",
    blue: isActive ? "text-blue-400" : "text-slate-500",
    purple: isActive ? "text-purple-400" : "text-slate-500",
    yellow: isActive ? "text-yellow-400" : "text-slate-500",
    pink: isActive ? "text-pink-400" : "text-slate-500"
  };
  return colors[color] || "text-slate-500";
};

const getBgColor = (color) => {
  const colors = {
    emerald: "from-emerald-500/20 to-emerald-500/10",
    blue: "from-blue-500/20 to-blue-500/10",
    purple: "from-purple-500/20 to-purple-500/10",
    yellow: "from-yellow-500/20 to-yellow-500/10",
    pink: "from-pink-500/20 to-pink-500/10"
  };
  return colors[color] || "from-slate-500/20 to-slate-500/10";
};

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/50 shadow-2xl">
      <div className="flex items-center justify-around px-1.5 py-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === createPageUrl(item.page);

          return (
            <button
              key={item.page}
              onClick={() => navigate(createPageUrl(item.page))}
              className="flex flex-col items-center gap-0.5 flex-1 relative"
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className={`absolute -top-0.5 left-1/2 transform -translate-x-1/2 w-8 h-0.5 rounded-full bg-gradient-to-r ${getBgColor(item.activeColor)}`}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              
              <div className={`relative ${isActive ? 'scale-105' : ''} transition-transform`}>
                <Icon className={`w-5 h-5 ${getColorClasses(item.activeColor, isActive)}`} />
              </div>
              
              <span className={`text-[9px] font-medium ${
                isActive ? getColorClasses(item.activeColor, isActive) : "text-slate-500"
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}