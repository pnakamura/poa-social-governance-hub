import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, ShieldAlert, ClipboardList, MessageSquare, FileBarChart, Info } from "lucide-react";
import DashboardOverview from "@/components/DashboardOverview";
import ProgramProfile from "@/components/ProgramProfile";
import RiskMatrix from "@/components/RiskMatrix";
import ActivityBoard from "@/components/ActivityBoard";
import CriticalAnalysis from "@/components/CriticalAnalysis";
import ReportCenter from "@/components/ReportCenter";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="gradient-header border-b">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-primary-foreground tracking-tight">
                POA+SOCIAL BID
              </h1>
              <p className="text-primary-foreground/70 text-sm">
                Plataforma de Gestão e Governança
              </p>
            </div>
            <div className="text-right text-primary-foreground/70 text-xs">
              <p>Contrato BRL-5234/OC-BR</p>
              <p>Atualizado em {new Date().toLocaleDateString("pt-BR")}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-6">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid grid-cols-3 md:grid-cols-6 h-auto gap-1 bg-secondary p-1">
            <TabsTrigger value="dashboard" className="gap-1.5 text-xs">
              <LayoutDashboard className="h-3.5 w-3.5" /> Dashboard
            </TabsTrigger>
            <TabsTrigger value="programa" className="gap-1.5 text-xs">
              <Info className="h-3.5 w-3.5" /> Programa
            </TabsTrigger>
            <TabsTrigger value="riscos" className="gap-1.5 text-xs">
              <ShieldAlert className="h-3.5 w-3.5" /> Riscos
            </TabsTrigger>
            <TabsTrigger value="atividades" className="gap-1.5 text-xs">
              <ClipboardList className="h-3.5 w-3.5" /> Atividades
            </TabsTrigger>
            <TabsTrigger value="analise" className="gap-1.5 text-xs">
              <MessageSquare className="h-3.5 w-3.5" /> Análise
            </TabsTrigger>
            <TabsTrigger value="relatorios" className="gap-1.5 text-xs">
              <FileBarChart className="h-3.5 w-3.5" /> Relatórios
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard"><DashboardOverview /></TabsContent>
          <TabsContent value="programa"><ProgramProfile /></TabsContent>
          <TabsContent value="riscos"><RiskMatrix /></TabsContent>
          <TabsContent value="atividades"><ActivityBoard /></TabsContent>
          <TabsContent value="analise"><CriticalAnalysis /></TabsContent>
          <TabsContent value="relatorios"><ReportCenter /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
