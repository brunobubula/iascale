import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { 
  Shield, AlertCircle, CheckCircle2, XCircle, 
  Loader2, BarChart3, User
} from "lucide-react";
import AuditReports from "@/components/audit/AuditReports";

export default function AuditPanel({ auditLogs = [], allUsers = [] }) {
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState(null);
  const [auditingUser, setAuditingUser] = useState(null);
  const [showAuditDialog, setShowAuditDialog] = useState(false);
  const [auditResult, setAuditResult] = useState(null);

  const validAuditLogs = Array.isArray(auditLogs) ? auditLogs : [];
  const validUsers = Array.isArray(allUsers) ? allUsers : [];

  const auditUserMutation = useMutation({
    mutationFn: async (userId) => {
      const response = await base44.functions.invoke('auditUserCredits', { userId });
      return response.data;
    },
    onSuccess: (data) => {
      setAuditResult(data);
      queryClient.invalidateQueries({ queryKey: ['auditLogs'] });
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
    }
  });

  const handleAuditUser = (user) => {
    setAuditingUser(user);
    setShowAuditDialog(true);
    auditUserMutation.mutate(user?.id);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="reports" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-slate-900/50 border border-slate-800/50 p-1">
          <TabsTrigger 
            value="reports"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500/30 data-[state=active]:to-teal-500/30 data-[state=active]:text-emerald-400"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Relatórios
          </TabsTrigger>
          <TabsTrigger 
            value="manual"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500/30 data-[state=active]:to-cyan-500/30 data-[state=active]:text-blue-400"
          >
            <User className="w-4 h-4 mr-2" />
            Auditoria Manual
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="mt-6">
          <AuditReports auditLogs={validAuditLogs} allUsers={validUsers} />
        </TabsContent>

        <TabsContent value="manual" className="mt-6">
          <Card className="bg-slate-900/50 border-slate-800/50 p-5">
            <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-400" />
              Auditoria Manual de Usuários
            </h3>
            <p className="text-slate-400 text-sm mb-4">
              Selecione um usuário para auditar manualmente seus créditos contra os pagamentos no Asaas
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {validUsers.map(user => (
                <Card 
                  key={user?.id}
                  className="bg-slate-800/30 border-slate-700/50 p-4 hover:border-blue-500/50 transition-all cursor-pointer"
                  onClick={() => handleAuditUser(user)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-semibold text-sm truncate">{user?.email}</div>
                      <div className="text-slate-400 text-xs">
                        C$ {(user?.account_credit_balance || 0).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showAuditDialog} onOpenChange={setShowAuditDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-400" />
              Auditoria de Créditos - {auditingUser?.email}
            </DialogTitle>
          </DialogHeader>

          {auditUserMutation.isPending ? (
            <div className="py-12 flex flex-col items-center justify-center">
              <Loader2 className="w-12 h-12 text-blue-400 animate-spin mb-4" />
              <p className="text-slate-300">Auditando créditos contra Asaas...</p>
            </div>
          ) : auditResult ? (
            <div className="space-y-4 py-4">
              <div className={`p-4 rounded-lg border-2 ${
                auditResult.success 
                  ? 'bg-emerald-500/10 border-emerald-500/50' 
                  : 'bg-red-500/10 border-red-500/50'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {auditResult.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400" />
                  )}
                  <span className={`font-bold ${auditResult.success ? 'text-emerald-400' : 'text-red-400'}`}>
                    {auditResult.message}
                  </span>
                </div>
              </div>

              {auditResult.auditLog && (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-slate-800/30 rounded-lg p-3">
                    <div className="text-slate-400 mb-1">Créditos Atuais</div>
                    <div className="text-white font-bold">C$ {(auditResult.auditLog.current_credits || 0).toFixed(2)}</div>
                  </div>
                  <div className="bg-slate-800/30 rounded-lg p-3">
                    <div className="text-slate-400 mb-1">Créditos Esperados</div>
                    <div className="text-white font-bold">C$ {(auditResult.auditLog.expected_credits || 0).toFixed(2)}</div>
                  </div>
                  <div className="bg-slate-800/30 rounded-lg p-3">
                    <div className="text-slate-400 mb-1">Diferença</div>
                    <div className={`font-bold ${
                      (auditResult.auditLog.credits_difference || 0) > 0 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {(auditResult.auditLog.credits_difference || 0) > 0 ? '+' : ''}C$ {(auditResult.auditLog.credits_difference || 0).toFixed(2)}
                    </div>
                  </div>
                  <div className="bg-slate-800/30 rounded-lg p-3">
                    <div className="text-slate-400 mb-1">Pagamentos Asaas</div>
                    <div className="text-white font-bold">{auditResult.auditLog.asaas_payments_found || 0}</div>
                  </div>
                </div>
              )}

              {auditResult.auditLog?.action_taken && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                  <div className="text-blue-400 text-xs font-semibold mb-1">Ação Tomada:</div>
                  <div className="text-slate-300 text-sm">{auditResult.auditLog.action_taken}</div>
                </div>
              )}
            </div>
          ) : null}

          <DialogFooter>
            <Button
              onClick={() => {
                setShowAuditDialog(false);
                setAuditResult(null);
                setAuditingUser(null);
              }}
              className="bg-slate-800 hover:bg-slate-700 text-white"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}