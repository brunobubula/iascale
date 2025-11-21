import React, { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Crown, Wallet, DollarSign, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AdminUserSearch({ users = [], onUserSelect }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterPlan, setFilterPlan] = useState("all");
  const [sortBy, setSortBy] = useState("recent");

  const filteredAndSortedUsers = useMemo(() => {
    let filtered = users.filter(user => {
      const matchesSearch = 
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = filterRole === "all" || user.role === filterRole;
      
      const matchesPlan = 
        filterPlan === "all" ||
        (filterPlan === "free" && (!user.is_pro || !user.pro_plan_type || user.pro_plan_type === 'free')) ||
        (filterPlan !== "free" && user.pro_plan_type === filterPlan);

      return matchesSearch && matchesRole && matchesPlan;
    });

    // Ordenação
    if (sortBy === "recent") {
      filtered.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    } else if (sortBy === "credits_high") {
      filtered.sort((a, b) => (b.account_credit_balance || 0) - (a.account_credit_balance || 0));
    } else if (sortBy === "credits_low") {
      filtered.sort((a, b) => (a.account_credit_balance || 0) - (b.account_credit_balance || 0));
    } else if (sortBy === "limit_high") {
      filtered.sort((a, b) => (b.balance_limit_usd || 0) - (a.balance_limit_usd || 0));
    }

    return filtered;
  }, [users, searchTerm, filterRole, filterPlan, sortBy]);

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <Card className="bg-slate-900/50 border-slate-800/50 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por email ou nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-800/50 border-slate-700 text-white"
            />
          </div>

          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all" className="text-white">Todas as funções</SelectItem>
              <SelectItem value="admin" className="text-white">Apenas Admins</SelectItem>
              <SelectItem value="user" className="text-white">Apenas Usuários</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterPlan} onValueChange={setFilterPlan}>
            <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
              <Crown className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all" className="text-white">Todos os planos</SelectItem>
              <SelectItem value="free" className="text-white">FREE</SelectItem>
              <SelectItem value="pro" className="text-white">PRO</SelectItem>
              <SelectItem value="pro_plus" className="text-white">PRO+</SelectItem>
              <SelectItem value="infinity_pro" className="text-white">INFINITY PRO</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="recent" className="text-white">Mais Recentes</SelectItem>
              <SelectItem value="credits_high" className="text-white">Maior Crédito</SelectItem>
              <SelectItem value="credits_low" className="text-white">Menor Crédito</SelectItem>
              <SelectItem value="limit_high" className="text-white">Maior Limite</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Lista de Usuários */}
      <Card className="bg-slate-900/50 border-slate-800/50 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold text-lg">
            Usuários Encontrados ({filteredAndSortedUsers.length})
          </h3>
        </div>

        {filteredAndSortedUsers.length === 0 ? (
          <div className="text-center py-12">
            <Search className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            <p className="text-slate-400">Nenhum usuário encontrado</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredAndSortedUsers.map((user) => (
              <div
                key={user.id}
                onClick={() => onUserSelect && onUserSelect(user)}
                className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-3 hover:bg-slate-800/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-semibold truncate">{user.email}</span>
                      {user.role === "admin" && (
                        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                          <Crown className="w-3 h-3 mr-1" />
                          Admin
                        </Badge>
                      )}
                      {user.is_pro && (
                        <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">
                          {user.pro_plan_type?.toUpperCase() || 'PRO'}
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-slate-400">
                        <span className="text-emerald-400">C$</span> {(user.account_credit_balance || 0).toFixed(2)}
                      </div>
                      <div className="text-slate-400">
                        <span className="text-blue-400">Limite:</span> ${(user.balance_limit_usd || 2000).toLocaleString('en-US')}
                      </div>
                      <div className="text-slate-400">
                        <span className="text-purple-400">R$</span> {(user.credit_purchase_total_brl || 0).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}