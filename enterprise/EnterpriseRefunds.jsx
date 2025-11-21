import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";

export default function EnterpriseRefunds({ refunds }) {
  const totalRefunded = refunds.reduce((sum, r) => sum + (r.refund_amount || 0), 0);

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-red-500/20 to-orange-500/20 border-red-500/30 p-6">
        <div className="flex items-center gap-3 mb-2">
          <AlertTriangle className="w-6 h-6 text-red-400" />
          <h3 className="text-white font-bold text-xl">Total Reembolsado</h3>
        </div>
        <p className="text-red-400 text-3xl font-black">R$ {totalRefunded.toFixed(2)}</p>
        <p className="text-slate-400 text-sm mt-1">{refunds.length} reembolsos processados</p>
      </Card>

      <Card className="bg-slate-900/50 border-slate-800 p-6">
        <h2 className="text-2xl font-bold text-white mb-6">Histórico de Reembolsos</h2>

        {refunds.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400">Nenhum reembolso registrado</p>
          </div>
        ) : (
          <div className="space-y-2">
            {refunds.map((refund, index) => (
              <motion.div
                key={refund.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-slate-800/30 border border-slate-700/30 rounded-lg p-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-semibold">{refund.customer_name || "Cliente"}</span>
                      <Badge className={`${
                        refund.status === "processed" ? "bg-emerald-500/20 text-emerald-400" :
                        refund.status === "pending" ? "bg-yellow-500/20 text-yellow-400" :
                        "bg-red-500/20 text-red-400"
                      } text-xs`}>
                        {refund.status}
                      </Badge>
                    </div>
                    <p className="text-slate-400 text-sm">{refund.customer_email}</p>
                    <p className="text-slate-500 text-xs mt-1">{refund.product_name}</p>
                    {refund.refund_reason && (
                      <p className="text-slate-500 text-xs mt-2 italic">Motivo: {refund.refund_reason}</p>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="text-red-400 font-bold text-lg">-R$ {refund.refund_amount.toFixed(2)}</p>
                    <p className="text-slate-500 text-xs line-through">R$ {refund.original_amount.toFixed(2)}</p>
                    <p className="text-slate-500 text-xs mt-1">
                      {format(new Date(refund.refund_date || refund.created_date), "dd/MM/yyyy", { locale: ptBR })}
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