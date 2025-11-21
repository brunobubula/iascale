import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bell, CheckCircle, Trash2, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ICON_MAP = {
  Bell, CheckCircle, Wallet: () => <span>💰</span>, Crown: () => <span>👑</span>,
  ShieldAlert: () => <span>🚫</span>, Gift: () => <span>🎁</span>
};

export default function Notifications() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = React.useState("all");

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.Notification.filter({ user_id: user.id }, '-created_date');
    },
    enabled: !!user
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { is_read: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] })
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] })
  });

  const filteredNotifications = filter === "unread" 
    ? notifications.filter(n => !n.is_read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("Dashboard"))}
            className="bg-slate-800/50 border-slate-700 hover:bg-slate-800 text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white">Notificações</h1>
            <p className="text-slate-400 text-sm mt-1">
              {unreadCount > 0 ? `${unreadCount} não lida(s)` : 'Tudo em dia'}
            </p>
          </div>
        </div>

        <Tabs value={filter} onValueChange={setFilter} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-900/50 border border-slate-800/50 p-1 mb-6">
            <TabsTrigger value="all">
              Todas ({notifications.length})
            </TabsTrigger>
            <TabsTrigger value="unread">
              Não Lidas ({unreadCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={filter}>
            <div className="space-y-2">
              {filteredNotifications.length === 0 ? (
                <Card className="bg-slate-900/50 border-slate-800/50 p-12 text-center">
                  <Bell className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">Nenhuma notificação</p>
                </Card>
              ) : (
                filteredNotifications.map((notif, index) => {
                  const Icon = ICON_MAP[notif.icon_name] || Bell;
                  
                  return (
                    <motion.div
                      key={notif.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <Card className={`bg-slate-900/50 border-slate-800/50 p-4 ${
                        !notif.is_read ? 'border-l-4 border-l-blue-500' : ''
                      }`}>
                        <div className="flex gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                            !notif.is_read ? 'bg-blue-500/20' : 'bg-slate-800/50'
                          }`}>
                            <Icon className="w-5 h-5 text-blue-400" />
                          </div>

                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h3 className="text-white font-semibold">{notif.title}</h3>
                              {!notif.is_read && (
                                <Badge className="bg-blue-500 text-white text-xs">Nova</Badge>
                              )}
                            </div>
                            
                            <p className="text-slate-400 text-sm mb-3">{notif.message}</p>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500 text-xs">
                                {format(new Date(notif.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              </span>

                              <div className="flex items-center gap-2">
                                {!notif.is_read && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => markAsReadMutation.mutate(notif.id)}
                                    className="text-blue-400 hover:text-blue-300 h-7 text-xs"
                                  >
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Marcar como lida
                                  </Button>
                                )}
                                
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => deleteNotificationMutation.mutate(notif.id)}
                                  className="text-red-400 hover:text-red-300 h-7 text-xs"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}