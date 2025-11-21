import React, { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Filter, BarChart3, TrendingUp, AlertTriangle, CheckCircle2, XCircle, Calendar } from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format, startOfMonth, endOfMonth, subMonths, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AuditReports({ auditLogs = [], allUsers = [] }) {
  const [filters, setFilters] = useState({
    startDate: format(subMonths(new Date(), 3), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    userId: 'all',
    auditType: 'all',
    status: 'all'
  });

  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      const logDate = parseISO(log.created_date);
      const start = new Date(filters.startDate);
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);

      const dateMatch = logDate >= start && logDate <= end;
      const userMatch = filters.userId === 'all' || log.user_id === filters.userId;
      const typeMatch = filters.auditType === 'all' || log.audit_type === filters.auditType;
      const statusMatch = filters.status === 'all' || log.status === filters.status;

      return dateMatch && userMatch && typeMatch && statusMatch;
    });
  }, [auditLogs, filters]);

  // Estatísticas
  const stats = useMemo(() => {
    const total = filteredLogs.length;
    const pending = filteredLogs.filter(l => l.status === 'pending_review').length;
    const validated = filteredLogs.filter(l => l.status === 'validated').length;
    const rejected = filteredLogs.filter(l => l.status === 'rejected').length;
    const autoCorrected = filteredLogs.filter(l => l.status === 'auto_corrected').length;
    
    const totalIssuesValue = filteredLogs.reduce((sum, l) => sum + Math.abs(l.credits_difference || 0), 0);
    
    return { total, pending, validated, rejected, autoCorrected, totalIssuesValue };
  }, [filteredLogs]);

  // Dados para gráfico de linha (tendência ao longo do tempo)
  const trendData = useMemo(() => {
    const monthlyData = {};
    
    filteredLogs.forEach(log => {
      const month = format(parseISO(log.created_date), 'MMM/yy', { locale: ptBR });
      if (!monthlyData[month]) {
        monthlyData[month] = {
          month,
          total: 0,
          pendente: 0,
          validado: 0,
          rejeitado: 0,
          autoCorrigido: 0
        };
      }
      monthlyData[month].total++;
      if (log.status === 'pending_review') monthlyData[month].pendente++;
      if (log.status === 'validated') monthlyData[month].validado++;
      if (log.status === 'rejected') monthlyData[month].rejeitado++;
      if (log.status === 'auto_corrected') monthlyData[month].autoCorrigido++;
    });

    return Object.values(monthlyData).sort((a, b) => {
      const [monthA, yearA] = a.month.split('/');
      const [monthB, yearB] = b.month.split('/');
      return new Date(`20${yearA}-${monthA}-01`) - new Date(`20${yearB}-${monthB}-01`);
    });
  }, [filteredLogs]);

  // Dados para gráfico de pizza (tipos de auditoria)
  const auditTypeData = useMemo(() => {
    const types = {
      manual: { name: 'Manual', value: 0, color: '#3b82f6' },
      scheduled: { name: 'Agendada', value: 0, color: '#8b5cf6' },
      realtime: { name: 'Tempo Real', value: 0, color: '#10b981' }
    };

    filteredLogs.forEach(log => {
      if (types[log.audit_type]) types[log.audit_type].value++;
    });

    return Object.values(types).filter(t => t.value > 0);
  }, [filteredLogs]);

  // Dados para gráfico de barras (tipos de problemas)
  const issueTypeData = useMemo(() => {
    const issues = {
      phantom: { name: 'Créditos Fantasma', value: 0 },
      excess: { name: 'Excesso de Créditos', value: 0 },
      missing: { name: 'Falta de Créditos', value: 0 },
      noIssues: { name: 'Sem Problemas', value: 0 }
    };

    filteredLogs.forEach(log => {
      if (log.action_taken?.includes('phantom')) issues.phantom.value++;
      else if (log.action_taken?.includes('excess')) issues.excess.value++;
      else if (log.action_taken?.includes('missing')) issues.missing.value++;
      else if (log.action_taken?.includes('no_issues')) issues.noIssues.value++;
    });

    return Object.values(issues);
  }, [filteredLogs]);

  const exportToCSV = () => {
    const headers = [
      'Data',
      'Email',
      'Tipo',
      'Status',
      'Créditos Atual',
      'Créditos Esperado',
      'Diferença',
      'Pagamentos',
      'Ação',
      'Revisado Por',
      'Notas'
    ];

    const rows = filteredLogs.map(log => [
      format(parseISO(log.created_date), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
      log.user_email,
      log.audit_type,
      log.status,
      log.current_credits?.toFixed(2) || '0.00',
      log.expected_credits?.toFixed(2) || '0.00',
      log.credits_difference?.toFixed(2) || '0.00',
      log.asaas_payments_found || 0,
      log.action_taken || '',
      log.reviewed_by || '',
      log.notes || ''
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `auditoria_creditos_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card className="bg-slate-900/50 border-slate-800/50 p-5">
        <div className="flex items-center gap-3 mb-4">
          <Filter className="w-5 h-5 text-purple-400" />
          <h3 className="text-white font-bold text-lg">Filtros de Relatório</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Data Início</label>
            <Input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({...filters, startDate: e.target.value})}
              className="bg-slate-800/50 border-slate-700 text-white"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Data Fim</label>
            <Input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({...filters, endDate: e.target.value})}
              className="bg-slate-800/50 border-slate-700 text-white"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Usuário</label>
            <Select value={filters.userId} onValueChange={(v) => setFilters({...filters, userId: v})}>
              <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 max-h-60">
                <SelectItem value="all" className="text-white">Todos</SelectItem>
                {allUsers.map(user => (
                  <SelectItem key={user.id} value={user.id} className="text-white">
                    {user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Tipo</label>
            <Select value={filters.auditType} onValueChange={(v) => setFilters({...filters, auditType: v})}>
              <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all" className="text-white">Todos</SelectItem>
                <SelectItem value="manual" className="text-white">Manual</SelectItem>
                <SelectItem value="scheduled" className="text-white">Agendada</SelectItem>
                <SelectItem value="realtime" className="text-white">Tempo Real</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Status</label>
            <Select value={filters.status} onValueChange={(v) => setFilters({...filters, status: v})}>
              <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all" className="text-white">Todos</SelectItem>
                <SelectItem value="pending_review" className="text-white">Pendente</SelectItem>
                <SelectItem value="validated" className="text-white">Validado</SelectItem>
                <SelectItem value="rejected" className="text-white">Rejeitado</SelectItem>
                <SelectItem value="auto_corrected" className="text-white">Auto-corrigido</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4">
          <Button
            onClick={exportToCSV}
            disabled={filteredLogs.length === 0}
            className="bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV ({filteredLogs.length})
          </Button>
          
          <Button
            onClick={() => setFilters({
              startDate: format(subMonths(new Date(), 3), 'yyyy-MM-dd'),
              endDate: format(new Date(), 'yyyy-MM-dd'),
              userId: 'all',
              auditType: 'all',
              status: 'all'
            })}
            variant="outline"
            className="bg-slate-800/50 border-slate-700 text-white"
          >
            Limpar Filtros
          </Button>
        </div>
      </Card>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/30 p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-blue-300">Total</span>
          </div>
          <div className="text-2xl font-black text-white">{stats.total}</div>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-500/30 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <span className="text-xs text-yellow-300">Pendente</span>
          </div>
          <div className="text-2xl font-black text-white">{stats.pending}</div>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-emerald-500/30 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-emerald-300">Validado</span>
          </div>
          <div className="text-2xl font-black text-white">{stats.validated}</div>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/20 to-red-600/20 border-red-500/30 p-4">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-4 h-4 text-red-400" />
            <span className="text-xs text-red-300">Rejeitado</span>
          </div>
          <div className="text-2xl font-black text-white">{stats.rejected}</div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-purple-300">Auto</span>
          </div>
          <div className="text-2xl font-black text-white">{stats.autoCorrected}</div>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border-orange-500/30 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-orange-400" />
            <span className="text-xs text-orange-300">Valor Total</span>
          </div>
          <div className="text-lg font-black text-white">C$ {stats.totalIssuesValue.toFixed(2)}</div>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tendência ao Longo do Tempo */}
        <Card className="bg-slate-900/50 border-slate-800/50 p-5">
          <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            Tendência Mensal
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#94a3b8" style={{ fontSize: '12px' }} />
              <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                labelStyle={{ color: '#f1f5f9' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line type="monotone" dataKey="total" stroke="#8b5cf6" strokeWidth={2} name="Total" />
              <Line type="monotone" dataKey="pendente" stroke="#f59e0b" strokeWidth={2} name="Pendente" />
              <Line type="monotone" dataKey="validado" stroke="#10b981" strokeWidth={2} name="Validado" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Tipos de Problemas */}
        <Card className="bg-slate-900/50 border-slate-800/50 p-5">
          <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            Tipos de Problemas
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={issueTypeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" style={{ fontSize: '11px' }} />
              <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                labelStyle={{ color: '#f1f5f9' }}
              />
              <Bar dataKey="value" fill="#ef4444" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Distribuição por Tipo de Auditoria */}
        {auditTypeData.length > 0 && (
          <Card className="bg-slate-900/50 border-slate-800/50 p-5">
            <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              Tipos de Auditoria
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={auditTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {auditTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>

      {/* Tabela de Registros */}
      <Card className="bg-slate-900/50 border-slate-800/50 p-5">
        <h3 className="text-white font-bold text-lg mb-4">Registros Filtrados ({filteredLogs.length})</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-2 text-slate-400 font-semibold">Data</th>
                <th className="text-left py-3 px-2 text-slate-400 font-semibold">Email</th>
                <th className="text-left py-3 px-2 text-slate-400 font-semibold">Tipo</th>
                <th className="text-left py-3 px-2 text-slate-400 font-semibold">Status</th>
                <th className="text-right py-3 px-2 text-slate-400 font-semibold">Diferença</th>
                <th className="text-right py-3 px-2 text-slate-400 font-semibold">Pagtos</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.slice(0, 50).map((log) => (
                <tr key={log.id} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                  <td className="py-2 px-2 text-slate-300">
                    {format(parseISO(log.created_date), 'dd/MM/yy HH:mm', { locale: ptBR })}
                  </td>
                  <td className="py-2 px-2 text-white font-medium">{log.user_email}</td>
                  <td className="py-2 px-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      log.audit_type === 'manual' ? 'bg-blue-500/20 text-blue-400' :
                      log.audit_type === 'scheduled' ? 'bg-purple-500/20 text-purple-400' :
                      'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {log.audit_type}
                    </span>
                  </td>
                  <td className="py-2 px-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      log.status === 'pending_review' ? 'bg-yellow-500/20 text-yellow-400' :
                      log.status === 'validated' ? 'bg-emerald-500/20 text-emerald-400' :
                      log.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                      'bg-purple-500/20 text-purple-400'
                    }`}>
                      {log.status === 'pending_review' ? 'Pendente' :
                       log.status === 'validated' ? 'Validado' :
                       log.status === 'rejected' ? 'Rejeitado' : 'Auto'}
                    </span>
                  </td>
                  <td className={`py-2 px-2 text-right font-bold ${
                    log.credits_difference > 0 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {log.credits_difference > 0 ? '+' : ''}C$ {log.credits_difference?.toFixed(2) || '0.00'}
                  </td>
                  <td className="py-2 px-2 text-right text-slate-300">{log.asaas_payments_found || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredLogs.length > 50 && (
            <p className="text-slate-400 text-xs text-center mt-3">
              Mostrando 50 de {filteredLogs.length} registros. Use os filtros ou exporte para ver todos.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}