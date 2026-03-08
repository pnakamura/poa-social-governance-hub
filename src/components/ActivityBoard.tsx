import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { tasks, type Task } from "@/data/mockData";
import { ClipboardList, Calendar, User } from "lucide-react";

const statusColumns: Task["status"][] = ["A fazer", "Em andamento", "Aguardando Aprovação", "Concluído"];

const statusColorMap: Record<Task["status"], string> = {
  "A fazer": "bg-status-todo",
  "Em andamento": "bg-status-progress",
  "Aguardando Aprovação": "bg-status-waiting",
  "Concluído": "bg-status-done",
};

const priorityBadge: Record<Task["priority"], string> = {
  Baixa: "bg-risk-low/15 text-risk-low border-risk-low/30",
  Média: "bg-risk-medium/15 text-risk-medium border-risk-medium/30",
  Alta: "bg-risk-critical/15 text-risk-critical border-risk-critical/30",
};

const ActivityBoard = () => {
  const [filterResponsible, setFilterResponsible] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");

  const responsibles = [...new Set(tasks.map((t) => t.responsible))];

  const filtered = tasks.filter((t) => {
    if (filterResponsible !== "all" && t.responsible !== filterResponsible) return false;
    if (filterPriority !== "all" && t.priority !== filterPriority) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="gradient-header rounded-t-lg">
          <CardTitle className="text-primary-foreground flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Quadro de Atividades
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 mb-6">
            <Select value={filterResponsible} onValueChange={setFilterResponsible}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Filtrar por responsável" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os responsáveis</SelectItem>
                {responsibles.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as prioridades</SelectItem>
                <SelectItem value="Alta">Alta</SelectItem>
                <SelectItem value="Média">Média</SelectItem>
                <SelectItem value="Baixa">Baixa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {statusColumns.map((status) => {
              const columnTasks = filtered.filter((t) => t.status === status);
              return (
                <div key={status} className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <div className={`w-2.5 h-2.5 rounded-full ${statusColorMap[status]}`} />
                    <h3 className="text-sm font-semibold">{status}</h3>
                    <Badge variant="secondary" className="ml-auto text-xs">{columnTasks.length}</Badge>
                  </div>
                  {columnTasks.map((task) => (
                    <Card key={task.id} className="shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium leading-tight">{task.title}</p>
                          <Badge variant="outline" className={`text-[10px] flex-shrink-0 ${priorityBadge[task.priority]}`}>
                            {task.priority}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <User className="h-3 w-3" />
                            {task.responsible}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(task.deadline).toLocaleDateString("pt-BR")}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Progresso</span>
                            <span className="font-mono font-medium">{task.progress}%</span>
                          </div>
                          <Progress value={task.progress} className="h-1.5" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {columnTasks.length === 0 && (
                    <div className="text-center text-xs text-muted-foreground py-8 border border-dashed rounded-lg">
                      Nenhuma tarefa
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivityBoard;
