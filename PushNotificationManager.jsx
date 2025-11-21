import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

/**
 * Componente que gerencia notificações push do navegador
 * Monitora novas notificações e dispara alerts nativos no mobile/desktop
 */
export default function PushNotificationManager({ user }) {
  const previousNotificationsRef = useRef([]);
  const hasRequestedPermission = useRef(false);

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.Notification.filter(
        { user_id: user.id },
        '-created_date',
        50
      );
    },
    enabled: !!user && (user.notifications_enabled !== false),
    refetchInterval: 5000, // Verifica a cada 5s
  });

  // Solicita permissão para notificações
  useEffect(() => {
    if (!user || user.notifications_enabled === false) return;
    if (hasRequestedPermission.current) return;

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().then(permission => {
        console.log("📱 Permissão de notificações:", permission);
      });
      hasRequestedPermission.current = true;
    }
  }, [user]);

  // Monitora novas notificações e dispara push
  useEffect(() => {
    if (!user || user.notifications_enabled === false) return;
    if (!notifications || notifications.length === 0) return;

    // Primeira execução: apenas salva as notificações atuais
    if (previousNotificationsRef.current.length === 0) {
      previousNotificationsRef.current = notifications.map(n => n.id);
      return;
    }

    // Identifica novas notificações
    const previousIds = previousNotificationsRef.current;
    const newNotifications = notifications.filter(
      notif => !previousIds.includes(notif.id)
    );

    // Dispara notificação push para cada nova notificação
    if (newNotifications.length > 0 && "Notification" in window && Notification.permission === "granted") {
      newNotifications.forEach(notif => {
        try {
          const notification = new Notification(notif.title, {
            body: notif.message,
            icon: '/icon-192.png', // Pode ser customizado
            badge: '/icon-192.png',
            tag: notif.id, // Evita duplicatas
            requireInteraction: notif.priority === 'critical' || notif.priority === 'high',
            vibrate: [200, 100, 200], // Vibração no mobile
            silent: false,
            data: {
              url: notif.link_url,
              notificationId: notif.id
            }
          });

          // Quando o usuário clica na notificação
          notification.onclick = (event) => {
            event.preventDefault();
            window.focus();
            
            if (notif.link_url) {
              window.location.href = notif.link_url;
            }
            
            notification.close();
          };

          // Auto-fechar após 10 segundos (exceto críticas)
          if (notif.priority !== 'critical') {
            setTimeout(() => notification.close(), 10000);
          }
        } catch (error) {
          console.error("Erro ao disparar notificação:", error);
        }
      });
    }

    // Atualiza referência
    previousNotificationsRef.current = notifications.map(n => n.id);
  }, [notifications, user]);

  // Este componente não renderiza nada
  return null;
}