import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, Lock, AlertTriangle, CheckCircle2, Loader2, Key } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminSecurityGate({ user, onAuthenticated }) {
  const [securityCode, setSecurityCode] = useState("");
  const [sessionToken, setSessionToken] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [blocked, setBlocked] = useState(false);

  // Verificar sessão existente
  const { data: existingSession } = useQuery({
    queryKey: ['adminSession', user?.email],
    queryFn: async () => {
      const sessions = await base44.entities.AdminSession.filter({
        admin_email: user.email,
        is_active: true
      });
      
      if (sessions && sessions.length > 0) {
        const session = sessions[0];
        const expiresAt = new Date(session.expires_at);
        
        if (expiresAt > new Date() && session.two_factor_verified) {
          return session;
        }
      }
      return null;
    },
    enabled: !!user?.email,
  });

  useEffect(() => {
    if (existingSession) {
      setSessionToken(existingSession.session_token);
      onAuthenticated(existingSession);
    }
  }, [existingSession]);

  const verifySecurityMutation = useMutation({
    mutationFn: async () => {
      // Código de segurança hardcoded (em produção, use 2FA real)
      const ADMIN_CODE = "SCALE2025";
      
      if (securityCode !== ADMIN_CODE) {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        
        // Log falha
        await base44.entities.AdminSecurityLog.create({
          admin_email: user.email,
          action_type: "login_failed",
          action_details: { attempts: newAttempts },
          risk_level: newAttempts >= 3 ? "high" : "medium",
          blocked: newAttempts >= 5
        });
        
        if (newAttempts >= 5) {
          setBlocked(true);
          throw new Error("Conta bloqueada por múltiplas tentativas falhas");
        }
        
        throw new Error("Código de segurança incorreto");
      }

      // Criar sessão
      const token = `${user.email}-${Date.now()}-${Math.random().toString(36)}`;
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos
      
      const session = await base44.entities.AdminSession.create({
        admin_email: user.email,
        session_token: token,
        is_active: true,
        expires_at: expiresAt.toISOString(),
        last_activity: new Date().toISOString(),
        two_factor_verified: true,
        device_fingerprint: navigator.userAgent
      });

      // Log sucesso
      await base44.entities.AdminSecurityLog.create({
        admin_email: user.email,
        action_type: "login_success",
        action_details: { session_id: session.id },
        risk_level: "low"
      });

      return session;
    },
    onSuccess: (session) => {
      setSessionToken(session.session_token);
      onAuthenticated(session);
    }
  });

  if (blocked) {
    return (
      <div className="fixed inset-0 bg-slate-950 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="bg-slate-900/95 backdrop-blur-xl border-red-500/50 p-8 max-w-md text-center">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-400" />
            <h2 className="text-2xl font-bold text-red-400 mb-2">Acesso Bloqueado</h2>
            <p className="text-slate-300 mb-4">
              Múltiplas tentativas falhadas. Entre em contato com o super admin.
            </p>
            <Button
              onClick={() => base44.auth.logout()}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Sair
            </Button>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-950 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <Card className="bg-slate-900/95 backdrop-blur-xl border-yellow-500/50 p-8 max-w-md">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Verificação de Segurança</h2>
            <p className="text-slate-400 text-sm">
              Área restrita - Admin Master
            </p>
            <p className="text-yellow-400 text-xs mt-2">
              {user?.email}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-slate-300 text-sm mb-2 block flex items-center gap-2">
                <Key className="w-4 h-4" />
                Código de Segurança
              </label>
              <Input
                type="password"
                value={securityCode}
                onChange={(e) => setSecurityCode(e.target.value.toUpperCase())}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && securityCode) {
                    verifySecurityMutation.mutate();
                  }
                }}
                placeholder="Digite o código..."
                className="bg-slate-800/50 border-slate-700 text-white text-center text-lg tracking-widest"
                autoFocus
              />
              {attempts > 0 && (
                <p className="text-red-400 text-xs mt-2">
                  ⚠️ Tentativa {attempts}/5 falhou
                </p>
              )}
            </div>

            <Button
              onClick={() => verifySecurityMutation.mutate()}
              disabled={verifySecurityMutation.isPending || !securityCode || blocked}
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white font-bold h-12"
            >
              {verifySecurityMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Verificando...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Acessar Admin Master
                </>
              )}
            </Button>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-xs text-blue-300 text-center">
              <Shield className="w-4 h-4 mx-auto mb-1 text-blue-400" />
              Todas as ações são registradas e auditadas
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}