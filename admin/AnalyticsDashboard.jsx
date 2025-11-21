import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { 
  Users, DollarSign, TrendingUp, ShoppingCart, MapPin, 
  Activity, Crown, CreditCard, Calendar, UserPlus, XCircle, Zap
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format, startOfDay, subDays, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AnalyticsDashboard({ users = [] }) {
  const validUsers = Array.isArray(users) ? users : [];

  const { data: upgradesData = [] } = useQuery({
    queryKey: ['planUpgrades'],
    queryFn: () => base44.entities.PlanUpgrade.list("-created_date", 100),
    initialData: []
  });

  const { data: abandonedCartsData = [] } = useQuery({
    queryKey: ['abandonedCarts'],
    queryFn: () => base44.entities.CreditPurchaseAttempt.filter({ status: "abandoned" }, "-created_date"),
    initialData: []
  });

  // Contagem de planos ativos
  const planCounts = useMemo(() => {
    const counts = {
      free: 0,
      pro: 0,
      pro_plus: 0,
      infinity_pro: 0,
      enterprise: 0
    };

    validUsers.forEach(user => {
      const isPro = user?.is_pro || false;
      const proExpiration = user?.pro_expiration_date ? new Date(user.pro_expiration_date) : null;
      const isProActive = isPro && (!proExpiration || proExpiration > new Date());
      
      if (isProActive) {
        const planType = user?.pro_plan_type || 'pro';
        if (counts[planType] !== undefined) {
          counts[planType]++;
        }
      } else {
        counts.free++;
      }
    });

    return counts;
  }, [validUsers]);

  // Upgrades do mês atual
  const currentMonthUpgrades = useMemo(() => {
    const monthStart = startOfMonth(new Date());
    const monthEnd = endOfMonth(new Date());
    
    const upgrades = Array.isArray(upgradesData) ? upgradesData : [];
    return upgrades.filter(u => {
      if (!u?.created_date) return false;
      const date = new Date(u.created_date);
      return date >= monthStart && date <= monthEnd;
    });
  }, [upgradesData]);

  // Cadastros por período
  const signupsByPeriod = useMemo(() => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = subDays(new Date(), 29 - i);
      return {
        date: format(date, 'dd/MM'),
        dateObj: startOfDay(date),
        count: 0
      };
    });

    validUsers.forEach(user => {
      if (user?.created_date) {
        const userDate = startOfDay(new Date(user.created_date));
        const dayData = last30Days.find(d => d.dateObj.getTime() === userDate.getTime());
        if (dayData) dayData.count++;
      }
    });

    return last30Days;
  }, [validUsers]);

  // Usuários por estado/cidade
  const usersByLocation = useMemo(() => {
    const states = {};
    validUsers.forEach(user => {
      const state = user?.state || "Não informado";
      if (!states[state]) states[state] = 0;
      states[state]++;
    });
    
    return Object.entries(states)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [validUsers]);

  // Compras de crédito por pacote
  const creditPurchases = useMemo(() => {
    const packages = {
      '50': { name: 'C$50', value: 0, revenue: 0 },
      '100': { name: 'C$100', value: 0, revenue: 0 },
      '200': { name: 'C$200', value: 0, revenue: 0 },
      '500': { name: 'C$500', value: 0, revenue: 0 },
      '1000': { name: 'C$1000', value: 0, revenue: 0 }
    };

    validUsers.forEach(user => {
      const credits = user?.account_credit_balance || 0;
      const spent = user?.credit_purchase_total_brl || 0;
      
      if (credits >= 1000) {
        packages['1000'].value++;
        packages['1000'].revenue += spent;
      } else if (credits >= 500) {
        packages['500'].value++;
        packages['500'].revenue += spent;
      } else if (credits >= 200) {
        packages['200'].value++;
        packages['200'].revenue += spent;
      } else if (credits >= 100) {
        packages['100'].value++;
        packages['100'].revenue += spent;
      } else if (credits >= 50) {
        packages['50'].value++;
        packages['50'].revenue += spent;
      }
    });

    return Object.values(packages).filter(p => p.value > 0);
  }, [validUsers]);

  // Planos mais comprados
  const planDistribution = useMemo(() => {
    const plans = {
      'free': { name: 'Free', value: planCounts.free, color: '#94a3b8' },
      'pro': { name: 'PRO', value: planCounts.pro, color: '#3b82f6' },
      'pro_plus': { name: 'PRO+', value: planCounts.pro_plus, color: '#8b5cf6' },
      'infinity_pro': { name: 'INFINITY PRO', value: planCounts.infinity_pro, color: '#10b981' },
      'enterprise': { name: 'ENTERPRISE', value: planCounts.enterprise, color: '#f59e0b' }
    };

    return Object.values(plans);
  }, [planCounts]);

  // Revenue por período
  const revenueByPeriod = useMemo(() => {
    const last12Months = Array.from({ length: 12 }, (_, i) => {
      const date = subDays(new Date(), (11 - i) * 30);
      return {
        month: format(date, 'MMM', { locale: ptBR }),
        credits: 0,
        plans: 0,
        total: 0
      };
    });

    validUsers.forEach(user => {
      const credits = user?.credit_purchase_total_brl || 0;
      const planRevenue = user?.is_pro ? 49.90 : 0;
      
      if (user?.created_date) {
        const monthIndex = Math.floor((new Date() - new Date(user.created_date)) / (30 * 24 * 60 * 60 * 1000));
        if (monthIndex >= 0 && monthIndex < 12) {
          const idx = 11 - monthIndex;
          last12Months[idx].credits += credits;
          last12Months[idx].plans += planRevenue;
          last12Months[idx].total += credits + planRevenue;
        }
      }
    });

    return last12Months;
  }, [validUsers]);

  // Formas de pagamento
  const paymentMethods = [
    { name: 'PIX', value: 65, color: '#10b981' },
    { name: 'Cartão', value: 25, color: '#3b82f6' },
    { name: 'Boleto', value: 10, color: '#8b5cf6' }
  ];

  // Estatísticas Gerais
  const totalRevenue = validUsers.reduce((sum, u) => sum + (u?.credit_purchase_total_brl || 0), 0);
  const avgRevenuePerUser = validUsers.length > 0 ? totalRevenue / validUsers.length : 0;
  const proUsers = validUsers.filter(u => u?.is_pro).length;
  const conversionRate = validUsers.length > 0 ? (proUsers / validUsers.length) * 100 : 0;
  const abandonedCarts = Array.isArray(abandonedCartsData) ? abandonedCartsData.length : 0;

  return (
    <div className="space-y-6">
      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/30 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-500/30 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <div className="text-blue-300 text-xs font-medium">Total Usuários</div>
              <div className="text-white font-black text-2xl">{validUsers.length}</div>
            </div>
          </div>
          <div className="text-slate-400 text-xs mt-2">
            {proUsers} PRO ({conversionRate.toFixed(1)}%)
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-emerald-500/30 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/30 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="text-emerald-300 text-xs font-medium">Receita Total</div>
              <div className="text-white font-black text-2xl">R$ {totalRevenue.toFixed(0)}</div>
            </div>
          </div>
          <div className="text-slate-400 text-xs mt-2">
            Média: R$ {avgRevenuePerUser.toFixed(2)}/usuário
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-500/30 flex items-center justify-center">
              <Zap className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <div className="text-purple-300 text-xs font-medium">Upgrades (Mês)</div>
              <div className="text-white font-black text-2xl">{currentMonthUpgrades.length}</div>
            </div>
          </div>
          <div className="text-slate-400 text-xs mt-2">
            {currentMonthUpgrades.filter(u => u?.to_plan === 'infinity_pro').length} INFINITY PRO
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/20 to-orange-500/20 border-red-500/30 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-red-500/30 flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <div className="text-red-300 text-xs font-medium">Carrinhos Abandonados</div>
              <div className="text-white font-black text-2xl">{abandonedCarts}</div>
            </div>
          </div>
          <div className="text-slate-400 text-xs mt-2">
            Última semana
          </div>
        </Card>
      </div>

      {/* Contadores de Planos Ativos */}
      <Card className="bg-slate-900/50 border-slate-800/50 p-5">
        <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
          <Crown className="w-5 h-5 text-yellow-400" />
          Planos Ativos no Sistema
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-slate-800/30 rounded-lg p-4 text-center">
            <div className="text-slate-400 text-xs mb-1">FREE</div>
            <div className="text-white font-black text-2xl">{planCounts.free}</div>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-center">
            <div className="text-blue-400 text-xs mb-1">PRO</div>
            <div className="text-white font-black text-2xl">{planCounts.pro}</div>
          </div>
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 text-center">
            <div className="text-purple-400 text-xs mb-1">PRO+</div>
            <div className="text-white font-black text-2xl">{planCounts.pro_plus}</div>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 text-center">
            <div className="text-emerald-400 text-xs mb-1">INFINITY PRO</div>
            <div className="text-white font-black text-2xl">{planCounts.infinity_pro}</div>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-center">
            <div className="text-yellow-400 text-xs mb-1">ENTERPRISE</div>
            <div className="text-white font-black text-2xl">{planCounts.enterprise}</div>
          </div>
        </div>
      </Card>

      {/* Upgrades do Mês */}
      {currentMonthUpgrades.length > 0 && (
        <Card className="bg-slate-900/50 border-slate-800/50 p-5">
          <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-400" />
            Upgrades deste Mês ({currentMonthUpgrades.length})
          </h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {currentMonthUpgrades.map((upgrade) => (
              <div key={upgrade?.id} className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium text-sm truncate">{upgrade?.user_email}</div>
                    <div className="text-slate-400 text-xs">
                      {format(new Date(upgrade?.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right mr-2">
                      <div className="text-xs text-slate-500">{upgrade?.from_plan || 'free'} →</div>
                      <div className={`text-sm font-bold ${
                        upgrade?.to_plan === 'infinity_pro' ? 'text-emerald-400' :
                        upgrade?.to_plan === 'enterprise' ? 'text-yellow-400' :
                        upgrade?.to_plan === 'pro_plus' ? 'text-purple-400' :
                        'text-blue-400'
                      }`}>
                        {upgrade?.to_plan?.toUpperCase()}
                      </div>
                    </div>
                    {upgrade?.price_paid_brl && (
                      <div className="text-emerald-400 font-bold text-sm">
                        R$ {upgrade.price_paid_brl.toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cadastros por Dia */}
        <Card className="bg-slate-900/50 border-slate-800/50 p-5">
          <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            Cadastros Últimos 30 Dias
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={signupsByPeriod}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '11px' }} />
              <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                labelStyle={{ color: '#f1f5f9' }}
              />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} name="Cadastros" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Usuários por Estado */}
        <Card className="bg-slate-900/50 border-slate-800/50 p-5">
          <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-400" />
            Top 10 Estados
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={usersByLocation} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis type="number" stroke="#94a3b8" style={{ fontSize: '12px' }} />
              <YAxis dataKey="name" type="category" stroke="#94a3b8" style={{ fontSize: '11px' }} width={100} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
              />
              <Bar dataKey="value" fill="#10b981" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Distribuição de Planos */}
        <Card className="bg-slate-900/50 border-slate-800/50 p-5">
          <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <Crown className="w-5 h-5 text-purple-400" />
            Distribuição de Planos
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={planDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {planDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Formas de Pagamento */}
        <Card className="bg-slate-900/50 border-slate-800/50 p-5">
          <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-400" />
            Métodos de Pagamento
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={paymentMethods}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {paymentMethods.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Receita ao Longo do Tempo */}
      <Card className="bg-slate-900/50 border-slate-800/50 p-5">
        <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
          Receita nos Últimos 12 Meses
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={revenueByPeriod}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="month" stroke="#94a3b8" style={{ fontSize: '12px' }} />
            <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
              formatter={(value) => `R$ ${value.toFixed(2)}`}
            />
            <Legend />
            <Bar dataKey="credits" stackId="a" fill="#3b82f6" name="Créditos" radius={[0, 0, 0, 0]} />
            <Bar dataKey="plans" stackId="a" fill="#8b5cf6" name="Planos" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Pacotes de Crédito */}
      <Card className="bg-slate-900/50 border-slate-800/50 p-5">
        <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-blue-400" />
          Pacotes de Crédito Mais Vendidos
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={creditPurchases}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="name" stroke="#94a3b8" style={{ fontSize: '12px' }} />
            <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
              formatter={(value, name) => [
                name === 'value' ? `${value} vendas` : `R$ ${value.toFixed(2)}`,
                name === 'value' ? 'Vendas' : 'Receita'
              ]}
            />
            <Legend />
            <Bar dataKey="value" fill="#3b82f6" name="Vendas" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Carrinhos Abandonados */}
      {abandonedCarts > 0 && (
        <Card className="bg-slate-900/50 border-slate-800/50 p-5">
          <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-400" />
            Compras Abandonadas ({abandonedCarts})
          </h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {abandonedCartsData.slice(0, 10).map((attempt) => (
              <div key={attempt?.id} className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium text-sm truncate">{attempt?.user_email}</div>
                    <div className="text-slate-400 text-xs">
                      Pacote: C$ {attempt?.package_amount} • R$ {attempt?.package_price_brl?.toFixed(2)}
                    </div>
                  </div>
                  <div className="text-red-400 font-bold text-sm">
                    Abandonado
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}