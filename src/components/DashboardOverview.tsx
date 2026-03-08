import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { kpis, tasks, risks } from "@/data/mockData";
import { TrendingUp, DollarSign, ShieldAlert, ClipboardList, Target, BarChart3 } from "lucide-react";

const kpiCards = [
  { label: "Execução Financeira", value: kpis.financialExecution, icon: DollarSign, suffix: "%" },
  { label: "Execução Física", value: kpis.physicalExecution, icon: TrendingUp, suffix: "%" },
  { label: "Taxa de Desembolso", value: kpis.disbursementRate, icon: BarChart3, suffix: "%" },
  { label: "Tarefas no Prazo", value: kpis.tasksOnTrack, icon: ClipboardList, suffix: "%" },
  { label: "Riscos Ativos", value: kpis.activeRisks, icon: ShieldAlert, suffix: "" },
  { label: "Riscos Críticos", value: kpis.criticalRisks, icon: Target, suffix: "" },
];

const DashboardOverview = () => {
  const tasksByStatus = {
    "A fazer": tasks.filter((t) => t.status === "A fazer").length,
    "Em andamento": tasks.filter((t) => t.status === "Em andamento").length,
    "Aguardando Aprovação": tasks.filter((t) => t.status === "Aguardando Aprovação").length,
    "Concluído": tasks.filter((t) => t.status === "Concluído").length,
  };

  const risksByCategory = risks.reduce((acc, r) => {
    acc[r.category] = (acc[r.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpiCards.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <kpi.icon className="h-4 w-4 text-accent" />
                <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{kpi.label}</span>
              </div>
              <p className="text-2xl font-bold">{kpi.value}{kpi.suffix}</p>
              {kpi.suffix === "%" && <Progress value={kpi.value} className="h-1 mt-2" />}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-accent" />
              Distribuição de Tarefas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(tasksByStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="text-sm">{status}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-secondary rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-accent transition-all"
                      style={{ width: `${(count / tasks.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-mono font-semibold w-6 text-right">{count}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-risk-high" />
              Riscos por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(risksByCategory).map(([cat, count]) => (
              <div key={cat} className="flex items-center justify-between">
                <span className="text-sm">{cat}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-secondary rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-risk-high transition-all"
                      style={{ width: `${(count / risks.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-mono font-semibold w-6 text-right">{count}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardOverview;
