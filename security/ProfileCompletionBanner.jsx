import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ProfileCompletionBanner({ user }) {
  const navigate = useNavigate();
  const [isDismissed, setIsDismissed] = useState(false);

  if (!user) return null;
  
  const isProfileComplete = user.profile_completed || (
    user.full_name && 
    user.cpf && 
    user.address && 
    user.nickname
  );

  if (isProfileComplete || isDismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border-b border-orange-500/30 px-4 py-3 sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-orange-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-bold text-sm">
                Complete seu perfil para acesso total
              </h3>
              <p className="text-slate-300 text-xs">
                Preencha seus dados pessoais para desbloquear todas as funcionalidades do app
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => navigate(createPageUrl("MyProfile"))}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm"
            >
              Completar Agora
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <button
              onClick={() => setIsDismissed(true)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}