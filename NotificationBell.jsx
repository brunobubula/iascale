import React, { useState, useEffect } from "react";
import { Bell, Check, X, ExternalLink, Sparkles, CreditCard, AlertTriangle, ShieldAlert, Wallet, Crown, Gift } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const ICON_MAP = {
  Bell: Bell,
  CreditCard: CreditCard,
  Sparkles: Sparkles,
  AlertTriangle: AlertTriangle,
  ShieldAlert: ShieldAlert,
  Wallet: Wallet,
  Crown: Crown,
  Gift: Gift,
  Check: Check
};

export default function NotificationBell({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: notifications = [], refetch } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const allNotifs = await base44.entities.Notification.filter(
        { user_id: user.id },
        '-created_date',
        50
      );
      return allNotifs;
    },
    enabled: !!user,
    refetchInterval: 10000, // Poll a cada 10s
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId) => 
      base44.entities.Notification.update(notificationId, { is_read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const unreadNotifs = notifications.filter(n => !n.is_read);
      await Promise.all(
        unreadNotifs.map(n => base44.entities.Notification.update(n.id, { is_read: true }))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markAsReadMutation.mutate(notification.id);
    }
    
    if (notification.link_url) {
      navigate(createPageUrl(notification.link_url));
      setIsOpen(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'border-l-red-500 bg-red-500/5';
      case 'high': return 'border-l-yellow-500 bg-yellow-500/5';
      case 'medium': return 'border-l-blue-500 bg-blue-500/5';
      default: return 'border-l-slate-500 bg-slate-800/20';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-10 h-10 rounded-full bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 flex items-center justify-center transition-all"
      >
        <Bell className="w-5 h-5 text-slate-300" />
        
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center border-2 border-slate-950"
          >
            <span className="text-white text-[10px] font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </motion.div>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-12 w-80 md:w-96 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700/50 z-50 overflow-hidden"
            >
              <div className="p-4 border-b border-slate-200 dark:border-slate-700/50 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Alertas
                </h3>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllAsReadMutation.mutate()}
                    disabled={markAllAsReadMutation.isPending}
                    className="text-blue-500 hover:text-blue-600 text-xs font-semibold"
                  >
                    Marcar todas como lida
                  </button>
                )}
              </div>

              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-50" />
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                      Nenhuma notificação
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-200 dark:divide-slate-700/50">
                    {notifications.map((notif, index) => {
                      const IconComponent = ICON_MAP[notif.icon_name] || Bell;
                      
                      return (
                        <motion.div
                          key={notif.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                          onClick={() => handleNotificationClick(notif)}
                          className={`p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all border-l-4 ${getPriorityColor(notif.priority)} ${
                            !notif.is_read ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                          }`}
                        >
                          <div className="flex gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                              !notif.is_read 
                                ? 'bg-blue-500/20 border-2 border-blue-500/50' 
                                : 'bg-slate-200 dark:bg-slate-800'
                            }`}>
                              <IconComponent className={`w-5 h-5 ${
                                notif.priority === 'critical' ? 'text-red-500' :
                                notif.priority === 'high' ? 'text-yellow-500' :
                                !notif.is_read ? 'text-blue-500' : 'text-slate-500'
                              }`} />
                              
                              {!notif.is_read && (
                                <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-white dark:border-slate-900"></div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <h4 className={`text-sm font-semibold ${
                                  !notif.is_read 
                                    ? 'text-slate-900 dark:text-white' 
                                    : 'text-slate-700 dark:text-slate-300'
                                }`}>
                                  {notif.title}
                                </h4>
                                {!notif.is_read && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                                )}
                              </div>

                              <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed mb-2">
                                {notif.message}
                              </p>

                              <div className="flex items-center justify-between">
                                <span className="text-slate-500 dark:text-slate-500 text-[10px]">
                                  {format(new Date(notif.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                </span>
                                
                                {notif.link_url && (
                                  <span className="text-blue-500 hover:text-blue-600 text-xs font-semibold flex items-center gap-1">
                                    Mais informações
                                    <ExternalLink className="w-3 h-3" />
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>

              {notifications.length > 0 && (
                <div className="p-3 border-t border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/30">
                  <button
                    onClick={() => {
                      navigate(createPageUrl("Notifications"));
                      setIsOpen(false);
                    }}
                    className="w-full text-blue-500 hover:text-blue-600 text-sm font-semibold text-center"
                  >
                    Ver todas as notificações
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}