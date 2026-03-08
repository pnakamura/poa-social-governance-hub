import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { risks, type Risk } from "@/data/mockData";
import { ShieldAlert, AlertTriangle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const getRiskLevel = (p: number, i: number): string => {
  const score = p * i;
  if (score >= 20) return "critical";
  if (score >= 12) return "high";
  if (score >= 6) return "medium";
  if (score >= 3) return "low";
  return "minimal";
};

const riskColorMap: Record<string, string> = {
  critical: "bg-risk-critical text-primary-foreground",
  high: "bg-risk-high text-primary-foreground",
  medium: "bg-risk-medium text-foreground",
  low: "bg-risk-low text-primary-foreground",
  minimal: "bg-risk-minimal text-primary-foreground",
};

const riskLabelMap: Record<string, string> = {
  critical: "Crítico",
  high: "Alto",
  medium: "Médio",
  low: "Baixo",
  minimal: "Mínimo",
};

const categoryColors: Record<string, string> = {
  Financeiro: "bg-risk-high/15 text-risk-high border-risk-high/30",
  Político: "bg-risk-critical/15 text-risk-critical border-risk-critical/30",
  Técnico: "bg-risk-minimal/15 text-risk-minimal border-risk-minimal/30",
  Ambiental: "bg-risk-low/15 text-risk-low border-risk-low/30",
  Social: "bg-primary/15 text-primary border-primary/30",
};

const RiskMatrix = () => {
  const [selectedCell, setSelectedCell] = useState<{ p: number; i: number } | null>(null);

  const getRisksInCell = (p: number, i: number) =>
    risks.filter((r) => r.probability === p && r.impact === i);

  const filteredRisks = selectedCell
    ? risks.filter((r) => r.probability === selectedCell.p && r.impact === selectedCell.i)
    : risks;

  const probLabels = ["Muito Baixa", "Baixa", "Moderada", "Alta", "Muito Alta"];
  const impactLabels = ["Insignificante", "Menor", "Moderado", "Maior", "Catastrófico"];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="gradient-header rounded-t-lg">
          <CardTitle className="text-primary-foreground flex items-center gap-2">
            <ShieldAlert className="h-5 w-5" />
            Matriz de Calor — Probabilidade × Impacto
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex gap-6">
            <div className="flex flex-col items-center">
              <span className="text-xs text-muted-foreground -rotate-90 whitespace-nowrap mb-4 origin-center translate-y-20">PROBABILIDADE →</span>
            </div>
            <div className="flex-1">
              <div className="grid grid-cols-6 gap-1">
                <div />
                {impactLabels.map((label, i) => (
                  <div key={i} className="text-center text-[10px] font-medium text-muted-foreground pb-1">{label}</div>
                ))}
                {[5, 4, 3, 2, 1].map((p) => (
                  <>
                    <div key={`label-${p}`} className="flex items-center justify-end pr-2 text-[10px] font-medium text-muted-foreground">
                      {probLabels[p - 1]}
                    </div>
                    {[1, 2, 3, 4, 5].map((i) => {
                      const level = getRiskLevel(p, i);
                      const cellRisks = getRisksInCell(p, i);
                      const isSelected = selectedCell?.p === p && selectedCell?.i === i;
                      return (
                        <div
                          key={`${p}-${i}`}
                          onClick={() => setSelectedCell(isSelected ? null : { p, i })}
                          className={`risk-cell h-14 flex items-center justify-center ${riskColorMap[level]} ${isSelected ? "ring-2 ring-foreground ring-offset-2" : ""}`}
                        >
                          {cellRisks.length > 0 && (
                            <span className="text-sm font-bold">{cellRisks.length}</span>
                          )}
                        </div>
                      );
                    })}
                  </>
                ))}
              </div>
              <div className="text-center text-xs text-muted-foreground mt-2">IMPACTO →</div>
              
              <div className="flex justify-center gap-3 mt-4">
                {Object.entries(riskLabelMap).map(([key, label]) => (
                  <div key={key} className="flex items-center gap-1">
                    <div className={`w-3 h-3 rounded-sm ${riskColorMap[key]}`} />
                    <span className="text-xs text-muted-foreground">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-5 w-5 text-risk-high" />
            Registro de Riscos
            {selectedCell && (
              <Badge variant="secondary" className="ml-2 cursor-pointer" onClick={() => setSelectedCell(null)}>
                Filtro ativo — Clique para limpar
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">ID</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-center">P</TableHead>
                <TableHead className="text-center">I</TableHead>
                <TableHead className="text-center">Nível</TableHead>
                <TableHead>Mitigação</TableHead>
                <TableHead>Proprietário</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRisks.map((risk) => {
                const level = getRiskLevel(risk.probability, risk.impact);
                return (
                  <TableRow key={risk.id}>
                    <TableCell className="font-mono text-xs">{risk.id}</TableCell>
                    <TableCell className="text-sm">{risk.description}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={categoryColors[risk.category]}>{risk.category}</Badge>
                    </TableCell>
                    <TableCell className="text-center font-mono">{risk.probability}</TableCell>
                    <TableCell className="text-center font-mono">{risk.impact}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={`${riskColorMap[level]} border-0`}>{riskLabelMap[level]}</Badge>
                    </TableCell>
                    <TableCell className="text-sm max-w-[200px]">{risk.mitigation}</TableCell>
                    <TableCell className="text-sm">{risk.owner}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default RiskMatrix;
