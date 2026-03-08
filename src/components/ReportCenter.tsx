import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileBarChart, Download, FileSpreadsheet, Calendar } from "lucide-react";

interface ReportTemplate {
  type: "Quinzenal" | "Mensal" | "Semestral";
  focus: string;
  sections: string[];
}

const templates: ReportTemplate[] = [
  {
    type: "Quinzenal",
    focus: "Tarefas e evolução física imediata",
    sections: ["Status das atividades em andamento", "Progresso físico por componente", "Pendências e bloqueios", "Próximos passos (15 dias)"],
  },
  {
    type: "Mensal",
    focus: "Execução financeira e atualização da Matriz de Riscos",
    sections: ["Execução financeira acumulada", "Desembolsos do período", "Atualização da Matriz de Riscos", "Análise de desvios orçamentários", "Projeções de desembolso"],
  },
  {
    type: "Semestral",
    focus: "Indicadores de impacto e cumprimento de Covenants",
    sections: ["Indicadores de resultado e impacto", "Cumprimento de cláusulas contratuais", "Análise de sustentabilidade", "Lições aprendidas", "Plano de ação para o próximo semestre"],
  },
];

const ReportCenter = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("2025-Q1");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="gradient-header rounded-t-lg">
          <CardTitle className="text-primary-foreground flex items-center gap-2">
            <FileBarChart className="h-5 w-5" />
            Central de Relatórios
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Período:</span>
            </div>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2025-Q1">1º Trimestre 2025</SelectItem>
                <SelectItem value="2025-Q2">2º Trimestre 2025</SelectItem>
                <SelectItem value="2024-S2">2º Semestre 2024</SelectItem>
                <SelectItem value="2024-S1">1º Semestre 2024</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {templates.map((tpl) => (
              <Card key={tpl.type} className="border-2 hover:border-accent transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{`Relatório ${tpl.type}`}</CardTitle>
                    <Badge variant="secondary">{tpl.type}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{tpl.focus}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Seções incluídas</p>
                    <ul className="space-y-1">
                      {tpl.sections.map((s, i) => (
                        <li key={i} className="text-xs flex items-start gap-2">
                          <span className="w-1 h-1 rounded-full bg-accent mt-1.5 flex-shrink-0" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" className="flex-1 gap-1">
                      <Download className="h-3 w-3" /> PDF
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 gap-1">
                      <FileSpreadsheet className="h-3 w-3" /> Excel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportCenter;
