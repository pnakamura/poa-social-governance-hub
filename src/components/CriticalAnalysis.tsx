import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { criticalNotes, recommendations, type CriticalNote, type Recommendation } from "@/data/mockData";
import { MessageSquare, Lightbulb, Plus, AlertCircle } from "lucide-react";

const urgencyColors: Record<string, string> = {
  Alta: "border-l-risk-critical bg-risk-critical/5",
  Média: "border-l-risk-medium bg-risk-medium/5",
  Baixa: "border-l-risk-low bg-risk-low/5",
};

const urgencyBadge: Record<string, string> = {
  Alta: "bg-risk-critical/15 text-risk-critical border-risk-critical/30",
  Média: "bg-risk-medium/15 text-risk-medium border-risk-medium/30",
  Baixa: "bg-risk-low/15 text-risk-low border-risk-low/30",
};

const CriticalAnalysis = () => {
  const [notes, setNotes] = useState<CriticalNote[]>(criticalNotes);
  const [newNote, setNewNote] = useState("");
  const [selectedComponent, setSelectedComponent] = useState("Componente 1");

  const addNote = () => {
    if (!newNote.trim()) return;
    const note: CriticalNote = {
      id: `N${notes.length + 1}`,
      component: selectedComponent,
      note: newNote,
      author: "Usuário",
      date: new Date().toISOString().split("T")[0],
    };
    setNotes([note, ...notes]);
    setNewNote("");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="gradient-header rounded-t-lg">
          <CardTitle className="text-primary-foreground flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Análise Crítica por Componente
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="flex gap-3">
            <Select value={selectedComponent} onValueChange={setSelectedComponent}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Componente 1">Componente 1</SelectItem>
                <SelectItem value="Componente 2">Componente 2</SelectItem>
                <SelectItem value="Componente 3">Componente 3</SelectItem>
              </SelectContent>
            </Select>
            <Textarea
              placeholder="Insira sua análise crítica..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="min-h-[60px]"
            />
            <Button onClick={addNote} className="self-end">
              <Plus className="h-4 w-4 mr-1" /> Adicionar
            </Button>
          </div>

          <div className="space-y-3">
            {notes.map((note) => (
              <div key={note.id} className="p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary">{note.component}</Badge>
                  <span className="text-xs text-muted-foreground">{new Date(note.date).toLocaleDateString("pt-BR")}</span>
                  <span className="text-xs text-muted-foreground ml-auto">por {note.author}</span>
                </div>
                <p className="text-sm">{note.note}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lightbulb className="h-5 w-5 text-risk-medium" />
            Recomendações de Ação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map((rec) => (
              <div key={rec.id} className={`p-4 rounded-lg border-l-4 ${urgencyColors[rec.urgency]}`}>
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  <h4 className="text-sm font-semibold">{rec.title}</h4>
                  <Badge variant="outline" className={`ml-auto text-[10px] ${urgencyBadge[rec.urgency]}`}>{rec.urgency}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{rec.description}</p>
                <Badge variant="secondary" className="mt-2 text-[10px]">{rec.component}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CriticalAnalysis;
