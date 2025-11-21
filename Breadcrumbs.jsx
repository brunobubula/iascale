import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ChevronRight, Home } from "lucide-react";

const PAGE_NAMES = {
  "Dashboard": "Dashboard",
  "AddSignal": "Novo Trade",
  "AITrader": "iA Trader",
  "AITraderHistory": "Histórico iA",
  "AnalisePL": "Análise P/L",
  "Portfolio": "Portfólio",
  "MyProfile": "Meu Perfil",
  "UserSettings": "Configurações",
  "AddCredito": "Adicionar Crédito",
  "SejaPRO": "Planos PRO",
  "AffiliateProgram": "Afiliados",
  "AdminMaster": "Admin Master",
  "CentralDeAjuda": "Central de Ajuda",
  "Suporte": "Suporte",
  "Mercados": "Mercados",
  "Renda20k": "Renda 20k",
  "FuturosScale": "Futuros"
};

export default function Breadcrumbs() {
  const location = useLocation();
  const pathname = location.pathname;
  
  const currentPage = pathname.split('/').pop() || 'Dashboard';
  const pageName = PAGE_NAMES[currentPage] || currentPage;

  if (currentPage === 'Dashboard') return null;

  return (
    <div className="flex items-center gap-2 text-sm mb-4">
      <Link
        to={createPageUrl("Dashboard")}
        className="flex items-center gap-1 text-slate-400 hover:text-emerald-400 transition-colors"
      >
        <Home className="w-3.5 h-3.5" />
        <span>Home</span>
      </Link>
      <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
      <span className="text-white font-semibold">{pageName}</span>
    </div>
  );
}