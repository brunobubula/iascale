import React from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Plus, Edit3, Sparkles, LifeBuoy, DollarSign, LogIn } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";

export default function GuestTopBanner() {
  const navigate = useNavigate();

  return (
    <div className="w-full bg-gradient-to-r from-purple-900/30 via-pink-900/20 to-purple-900/30 backdrop-blur-xl border-b border-purple-500/20 px-4 py-3 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Logo e Nome */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690c0c0bc7d291a071fd4ad2/8e9c15dbe_Art-ScaleCriptoiA-LOGO6mini.png"
            alt="Scale Logo"
            className="w-8 h-8 rounded-lg flex-shrink-0"
          />
          <div className="min-w-0 hidden sm:block">
            <h1 className="text-white font-bold text-sm leading-tight truncate">
              Scale Cripto iA
            </h1>
            <p className="text-purple-300 text-xs leading-tight truncate">
              Monitore seus trades em tempo real
            </p>
          </div>
        </div>

        {/* Botões de Navegação - Desktop */}
        <div className="hidden md:flex items-center gap-2">
          {/* Dropdown + Sinal */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/70 text-white h-8"
              >
                <Plus className="w-3.5 h-3.5 mr-2" />
                Sinal
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-slate-800 border-slate-700">
              <DropdownMenuItem
                onClick={() => navigate(createPageUrl("AddSignal"))}
                className="text-white hover:bg-slate-700 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 mr-2 text-emerald-400" />
                <div className="text-xs">Sinal Manual</div>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigate(createPageUrl("AITrader"))}
                className="text-white hover:bg-slate-700 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 mr-2 text-purple-400" />
                <div className="text-xs">Sinal iA</div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            onClick={() => navigate(createPageUrl("UpgradeRenda20k"))}
            size="sm"
            variant="outline"
            className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/70 text-white h-8"
          >
            <DollarSign className="w-3.5 h-3.5 mr-2" />
            Renda 20k
          </Button>

          <Button
            onClick={() => navigate(createPageUrl("CentralDeAjuda"))}
            size="sm"
            variant="outline"
            className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/70 text-white h-8"
          >
            <LifeBuoy className="w-3.5 h-3.5 mr-2" />
            Suporte
          </Button>
        </div>

        {/* Botões de Navegação - Mobile */}
        <div className="flex md:hidden items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/70 text-white h-8 px-2"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-slate-800 border-slate-700">
              <DropdownMenuItem
                onClick={() => navigate(createPageUrl("AddSignal"))}
                className="text-white hover:bg-slate-700 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 mr-2 text-emerald-400" />
                <div className="text-xs">Manual</div>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigate(createPageUrl("AITrader"))}
                className="text-white hover:bg-slate-700 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 mr-2 text-purple-400" />
                <div className="text-xs">iA</div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            onClick={() => navigate(createPageUrl("UpgradeRenda20k"))}
            size="sm"
            variant="outline"
            className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/70 text-white h-8 px-2"
          >
            <DollarSign className="w-4 h-4" />
          </Button>

          <Button
            onClick={() => navigate(createPageUrl("CentralDeAjuda"))}
            size="sm"
            variant="outline"
            className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/70 text-white h-8 px-2"
          >
            <LifeBuoy className="w-4 h-4" />
          </Button>
        </div>

        {/* Botão de Login - Animado */}
        <motion.div
          animate={{
            boxShadow: [
              "0 0 0 0 rgba(168, 85, 247, 0)",
              "0 0 0 4px rgba(168, 85, 247, 0.2)",
              "0 0 0 0 rgba(168, 85, 247, 0)",
            ]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="rounded-lg"
        >
          <Button
            onClick={() => base44.auth.redirectToLogin()}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold shadow-lg shadow-purple-500/30 h-8 text-xs px-3 sm:px-4"
          >
            <LogIn className="w-3.5 h-3.5 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Entrar</span>
            <span className="sm:hidden">Login</span>
          </Button>
        </motion.div>
      </div>
    </div>
  );
}