import React from "react";
import { Card } from "@/components/ui/card";
import { Shield, Users, AlertTriangle, DollarSign, Activity, Clock, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Badge } from "@/components/ui/badge";

export default function AdminQuickStats({ users = [], auditLogs = [], schedules = [] }) {
  const navigate = useNavigate();

  const validUsers = Array.isArray(users) ? users : [];
  const validAuditLogs = Array.isArray(auditLogs) ? auditLogs : [];
  const validSchedules = Array.isArray(schedules) ? schedules : [];

  const totalUsers = validUsers.length;
  const usersWithCredits = validUsers.filter(u => (u?.account_credit_balance || 0) > 0).length;
  const totalCreditsInSystem = validUsers.reduce((sum, u) => sum + (u?.account_credit_balance || 0), 0);
  const totalRevenue = validUsers.reduce((sum, u) => sum + (u?.credit_purchase_total_brl || 0), 0);

  const pendingAudits = validAuditLogs.filter(a => a?.status === 'pending_review');
  const criticalAudits = validAuditLogs.filter(a => 
    a?.status === 'pending_review' && 
    (a?.action_taken?.includes('phantom') || a?.asaas_payments_found === 0)
  );
  const recentAudits = validAuditLogs.slice(0, 5);

  const activeSchedules = validSchedules.filter(s => s?.is_active).length;
  const totalScheduleRuns = validSchedules.reduce((sum, s) => sum + (s?.total_runs || 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/30 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-blue-500/30 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <div className="text-blue-300 text-xs font-medium">Total Usuários</div>
              <div className="text-white font-black text-2xl">{totalUsers}</div>
            </div>
          </div>
          <div className="text-slate-400 text-xs">
            {usersWithCredits} com créditos ativos
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-emerald-500/30 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/30 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="text-emerald-300 text-xs font-medium">Receita Total</div>
              <div className="text-white font-black text-2xl">R$ {totalRevenue.toFixed(0)}</div>
            </div>
          </div>
          <div className="text-slate-400 text-xs">
            C$ {totalCreditsInSystem.toFixed(0)} em créditos
          </div>
        </Card>

        <Card 
          className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-500/30 p-5 cursor-pointer hover:border-yellow-500/50 transition-all"
          onClick={() => navigate(createPageUrl("RecuperarPagamentos"))}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-yellow-500/30 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <div className="text-yellow-300 text-xs font-medium">Auditorias Pendentes</div>
              <div className="text-white font-black text-2xl">{pendingAudits.length}</div>
            </div>
          </div>
          <div className="text-slate-400 text-xs">
            {criticalAudits.length} críticas
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-purple-500/30 flex items-center justify-center">
              <Activity className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <div className="text-purple-300 text-xs font-medium">Agendamentos</div>
              <div className="text-white font-black text-2xl">{activeSchedules}</div>
            </div>
          </div>
          <div className="text-slate-400 text-xs">
            {totalScheduleRuns} execuções totais
          </div>
        </Card>
      </div>

      {recentAudits.length > 0 && (
        <Card className="bg-slate-900/50 border-slate-800/50 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              Atividade Recente de Auditoria
            </h3>
            <button
              onClick={() => navigate(createPageUrl("RecuperarPagamentos"))}
              className="text-blue-400 hover:text-blue-300 text-sm font-medium"
            >
              Ver Todas →
            </button>
          </div>
          <div className="space-y-2">
            {recentAudits.map((audit) => (
              <div
                key={audit?.id}
                className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-3 hover:bg-slate-800/50 transition-colors cursor-pointer"
                onClick={() => navigate(createPageUrl("RecuperarPagamentos"))}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      audit?.status === 'pending_review' ? 'bg-yellow-400 animate-pulse' :
                      audit?.status === 'validated' ? 'bg-emerald-400' :
                      audit?.status === 'rejected' ? 'bg-red-400' :
                      'bg-purple-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium text-sm truncate">{audit?.user_email}</div>
                      <div className="text-slate-400 text-xs">{audit?.action_taken}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`text-right ${(audit?.credits_difference || 0) > 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                      <div className="font-bold text-sm">
                        {(audit?.credits_difference || 0) > 0 ? '+' : ''}C$ {Math.abs(audit?.credits_difference || 0).toFixed(2)}
                      </div>
                    </div>
                    <Badge className={`${
                      audit?.audit_type === 'realtime' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                      audit?.audit_type === 'scheduled' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
                      'bg-blue-500/20 text-blue-400 border-blue-500/30'
                    } border text-xs`}>
                      {audit?.audit_type}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card 
          className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30 p-5 cursor-pointer hover:border-purple-500/50 transition-all"
          onClick={() => navigate(createPageUrl("RecuperarPagamentos"))}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/30 flex items-center justify-center">
              <Shield className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-white font-bold">Auditoria de Créditos</h3>
              <p className="text-purple-300 text-xs">Sistema de validação</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm">Ir para painel →</span>
            {criticalAudits.length > 0 && (
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30 border animate-pulse">
                {criticalAudits.length} crítico(s)
              </Badge>
            )}
          </div>
        </Card>

        <Card 
          className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/30 p-5 cursor-pointer hover:border-blue-500/50 transition-all"
          onClick={() => navigate(createPageUrl("EnterpriseDashboard"))}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/30 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-white font-bold">Enterprise Dashboard</h3>
              <p className="text-blue-300 text-xs">Vendas e métricas</p>
            </div>
          </div>
          <span className="text-slate-400 text-sm">Ir para dashboard →</span>
        </Card>
      </div>
    </div>
  );
}