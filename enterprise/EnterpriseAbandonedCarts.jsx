import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function EnterpriseAbandonedCarts({ carts }) {
  const queryClient = useQueryClient();

  const updateCartMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AbandonedCart.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['abandonedCarts'] });
    },
  });

  const handleContact = (cart) => {
    updateCartMutation.mutate({
      id: cart.id,
      data: {
        status: "contacted",
        recovery_attempts: (cart.recovery_attempts || 0) + 1,
        last_contact_date: new Date().toISOString(),
      }
    });
  };

  const activeOrContactedCarts = carts.filter(c => c.status === "abandoned" || c.status === "contacted");

  return (
    <div className="space-y-4">
      <Card className="bg-slate-900/50 border-slate-800 p-6">
        <h2 className="text-2xl font-bold text-white mb-6">Carrinhos Abandonados</h2>

        {activeOrContactedCarts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400">Nenhum carrinho abandonado no momento</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeOrContactedCarts.map((cart, index) => (
              <motion.div
                key={cart.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="bg-slate-800/30 border-slate-700/50 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-white font-semibold">{cart.customer_name || "Cliente"}</h3>
                      <p className="text-slate-400 text-sm">{cart.product_name}</p>
                    </div>
                    <Badge className={`${
                      cart.status === "abandoned" ? "bg-orange-500/20 text-orange-400" :
                      cart.status === "contacted" ? "bg-blue-500/20 text-blue-400" :
                      cart.status === "recovered" ? "bg-emerald-500/20 text-emerald-400" :
                      "bg-red-500/20 text-red-400"
                    } text-xs`}>
                      {cart.status}
                    </Badge>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                      <Mail className="w-3 h-3" />
                      <span>{cart.customer_email}</span>
                    </div>
                    {cart.customer_phone && (
                      <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <Phone className="w-3 h-3" />
                        <span>{cart.customer_phone}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">
                        Abandonado: {format(new Date(cart.abandoned_at || cart.created_date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </span>
                      <span className="text-emerald-400 font-bold">R$ {cart.cart_value.toFixed(2)}</span>
                    </div>
                    {cart.recovery_attempts > 0 && (
                      <p className="text-slate-500 text-xs">
                        Tentativas de contato: {cart.recovery_attempts}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleContact(cart)}
                      disabled={updateCartMutation.isPending}
                      className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30"
                    >
                      <MessageCircle className="w-3 h-3 mr-1" />
                      Marcar Contato
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(`mailto:${cart.customer_email}`, '_blank')}
                      className="bg-slate-800 border-slate-700 text-white"
                    >
                      <Mail className="w-3 h-3" />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}