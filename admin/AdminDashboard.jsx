import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, BarChart3 } from "lucide-react";
import AnalyticsDashboard from "./AnalyticsDashboard";
import AdminQuickStats from "./AdminQuickStats";
import AdminAIAssistant from "./AdminAIAssistant";

export default function AdminDashboard({ users = [], auditLogs = [], schedules = [] }) {
  const validUsers = Array.isArray(users) ? users : [];
  const validAuditLogs = Array.isArray(auditLogs) ? auditLogs : [];
  const validSchedules = Array.isArray(schedules) ? schedules : [];

  return (
    <div className="space-y-6">
      {/* AI Assistant */}
      <AdminAIAssistant />
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-slate-900/50 border border-slate-800/50 p-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
            <TrendingUp className="w-4 h-4 mr-2" />
            Resumo Rápido
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics Completo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <AdminQuickStats users={validUsers} auditLogs={validAuditLogs} schedules={validSchedules} />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <AnalyticsDashboard users={validUsers} auditLogs={validAuditLogs} />
        </TabsContent>
      </Tabs>
    </div>
  );
}