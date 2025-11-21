import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Download, Filter } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";

export default function EnterpriseSalesOverview({ sales, teamMembers }) {
  const [filterStatus, setFilterStatus] = useState("all");

  const filteredSales = filterStatus === "all" 
    ? sales 
    : sales.filter(s => s.status === filterStatus);

  const getTeamMemberName = (memberId) => {
    const member = teamMembers.find(m => m.id === memberId);
    return member ? member.name : "Direto";
  };

  const exportToCSV = () => {
    const headers = ["Data", "Cliente", "Email", "Produto", "Valor", "Gateway", "Status", "Vendedor"];
    const rows = filteredSales.map(s => [
      format(new Date(s.sale_date || s.created_date), "dd/MM/yyyy HH:mm", { locale: ptBR }),
      s.customer_name || "-",
      s.customer_email,
      s.product_name,
      `R$ ${s.amount.toFixed(2)}`,
      s.payment_gateway,
      s.status,
      getTeamMemberName(s.team_member_id)
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vendas_${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="space-y-4">
      <Card className="bg-slate-900/50 border-slate-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Histórico de Vendas</h2>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilterStatus(filterStatus === "all" ? "approved" : "all")}
              className="bg-slate-800 border-slate-700 text-white"
            >
              <Filter className="w-4 h-4 mr-2" />
              {filterStatus === "all" ? "Todas" : "Aprovadas"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
              className="bg-slate-800 border-slate-700 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </div>

        {filteredSales.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400">Nenhuma venda registrada ainda</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredSales.map((sale, index) => (
              <motion.div
                key={sale.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-slate-800/30 hover:bg-slate-800/50 border border-slate-700/30 rounded-lg p-4 transition-all"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-semibold truncate">{sale.customer_name || "Cliente"}</span>
                      <Badge className={`${
                        sale.status === "approved" ? "bg-emerald-500/20 text-emerald-400" :
                        sale.status === "pending" ? "bg-yellow-500/20 text-yellow-400" :
                        sale.status === "cancelled" ? "bg-red-500/20 text-red-400" :
                        "bg-purple-500/20 text-purple-400"
                      } text-xs`}>
                        {sale.status}
                      </Badge>
                    </div>
                    <p className="text-slate-400 text-sm">{sale.customer_email}</p>
                    <p className="text-slate-500 text-xs mt-1">
                      {sale.product_name} • {sale.payment_gateway} • {getTeamMemberName(sale.team_member_id)}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-emerald-400 font-bold text-lg">R$ {sale.amount.toFixed(2)}</p>
                    <p className="text-slate-500 text-xs">
                      {format(new Date(sale.sale_date || sale.created_date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}