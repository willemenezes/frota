import { useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Car, ClipboardCheck, AlertTriangle, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalVehicles: 0,
    totalChecklists: 0,
    openDefects: 0,
    completedToday: 0,
  });
  const [recentDefects, setRecentDefects] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    const [vehiclesResult, checklistsResult, defectsResult, todayResult] = await Promise.all([
      supabase.from("vehicles").select("id", { count: "exact" }),
      supabase.from("checklists").select("id", { count: "exact" }),
      supabase.from("defects").select("id", { count: "exact" }).eq("status", "aberto"),
      supabase
        .from("checklists")
        .select("id", { count: "exact" })
        .eq("status", "ok")
        .gte("created_at", new Date().toISOString().split("T")[0]),
    ]);

    setStats({
      totalVehicles: vehiclesResult.count || 0,
      totalChecklists: checklistsResult.count || 0,
      openDefects: defectsResult.count || 0,
      completedToday: todayResult.count || 0,
    });

    const { data: defects } = await supabase
      .from("defects")
      .select(`
        *,
        vehicles (placa, modelo)
      `)
      .order("created_at", { ascending: false })
      .limit(5);

    setRecentDefects(defects || []);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critico":
        return "destructive";
      case "moderado":
        return "warning";
      default:
        return "secondary";
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral do sistema de gestão de frota
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total de Veículos"
            value={stats.totalVehicles}
            icon={Car}
          />
          <StatsCard
            title="Checklists Realizados"
            value={stats.totalChecklists}
            icon={ClipboardCheck}
          />
          <StatsCard
            title="Defeitos Abertos"
            value={stats.openDefects}
            icon={AlertTriangle}
          />
          <StatsCard
            title="Concluídos Hoje"
            value={stats.completedToday}
            icon={CheckCircle}
            trend="+12% vs ontem"
            trendUp
          />
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Defeitos Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {recentDefects.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhum defeito registrado
              </p>
            ) : (
              <div className="space-y-4">
                {recentDefects.map((defect) => (
                  <div
                    key={defect.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={getSeverityColor(defect.severidade)}>
                          {defect.severidade}
                        </Badge>
                        <span className="font-medium">
                          {defect.vehicles?.placa} - {defect.vehicles?.modelo}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {defect.descricao}
                      </p>
                    </div>
                    <Badge variant={defect.status === "aberto" ? "destructive" : "success"}>
                      {defect.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard;
