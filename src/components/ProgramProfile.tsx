import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { contractInfo, baseDocuments } from "@/data/mockData";
import { FileText, Download, Target, Calendar, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";

const ProgramProfile = () => {
  const formatCurrency = (value: number, currency: string) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(value);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="gradient-header rounded-t-lg">
          <CardTitle className="text-primary-foreground flex items-center gap-2">
            <Target className="h-5 w-5" />
            Perfil do Programa
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Contrato</p>
              <p className="text-lg font-semibold">{contractInfo.number}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-1"><DollarSign className="h-3 w-3" />Valor Total (USD)</p>
              <p className="text-lg font-semibold">{formatCurrency(contractInfo.totalUSD, "USD")}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-1"><DollarSign className="h-3 w-3" />Valor Total (BRL)</p>
              <p className="text-lg font-semibold">{formatCurrency(contractInfo.totalBRL, "BRL")}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" />Vigência</p>
              <p className="text-lg font-semibold">
                {new Date(contractInfo.startDate).toLocaleDateString("pt-BR")} — {new Date(contractInfo.endDate).toLocaleDateString("pt-BR")}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Objetivos Estratégicos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {contractInfo.objectives.map((obj, i) => (
                <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-secondary">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-semibold">{i + 1}</span>
                  <p className="text-sm">{obj}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-accent" />
            Repositório de Documentos Base
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {baseDocuments.map((doc, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border hover:bg-secondary/50 transition-colors">
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">{new Date(doc.date).toLocaleDateString("pt-BR")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{doc.type}</Badge>
                  <Button variant="ghost" size="sm"><Download className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProgramProfile;
