import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Download, Loader2, BarChart3, ClipboardCheck, Wrench, Car } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const Reports = () => {
  const [loading, setLoading] = useState<string | null>(null);

  // Função auxiliar para converter dados em CSV
  const convertToCSV = (headers: string[], data: string[][]): string => {
    const csvRows: string[] = [];
    
    // Adicionar headers
    csvRows.push(headers.join(","));
    
    // Adicionar dados
    data.forEach(row => {
      // Escapar vírgulas e aspas nos valores
      const escapedRow = row.map(cell => {
        const cellStr = String(cell || "");
        if (cellStr.includes(",") || cellStr.includes('"') || cellStr.includes("\n")) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      });
      csvRows.push(escapedRow.join(","));
    });
    
    return csvRows.join("\n");
  };

  // Função auxiliar para download CSV
  const downloadCSV = (csvContent: string, filename: string) => {
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" }); // BOM para Excel
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const generateChecklistsReport = async (format: "pdf" | "csv" = "pdf") => {
    setLoading("checklists");
    try {
      const { data: checklists, error } = await supabase
        .from("checklists")
        .select(`
          *,
          vehicles (placa, modelo),
          profiles (nome_completo),
          checklist_templates (nome)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Preparar dados
      const total = checklists?.length || 0;
      const ok = checklists?.filter(c => c.status === "ok").length || 0;
      const comDefeito = checklists?.filter(c => c.status === "com_defeito").length || 0;
      const pendente = checklists?.filter(c => c.status === "pendente").length || 0;

      const tableData = (checklists || []).map(cl => [
        cl.vehicles?.placa || "-",
        cl.vehicles?.modelo || "-",
        cl.profiles?.nome_completo || "-",
        cl.checklist_templates?.nome || "-",
        cl.status === "ok" ? "Aprovado" : cl.status === "com_defeito" ? "Com Defeito" : "Pendente",
        new Date(cl.created_at).toLocaleDateString("pt-BR"),
      ]);

      if (format === "csv") {
        // Gerar CSV
        const csvHeaders = ["Placa", "Modelo", "Motorista", "Template", "Status", "Data"];
        const csvContent = `Relatório de Checklists\nGerado em: ${new Date().toLocaleDateString("pt-BR")} ${new Date().toLocaleTimeString("pt-BR")}\n\nEstatísticas:\nTotal de Checklists,${total}\nAprovados,${ok}\nCom Defeito,${comDefeito}\nPendentes,${pendente}\n\n${convertToCSV(csvHeaders, tableData)}`;
        
        downloadCSV(csvContent, `relatorio_checklists_${new Date().getTime()}.csv`);
        toast.success("Relatório de Checklists (CSV) gerado com sucesso!");
        setLoading(null);
        return;
      }

      // Gerar PDF
      const doc = new jsPDF();
      
      // Título
      doc.setFontSize(18);
      doc.text("Relatório de Checklists", 14, 20);
      
      // Data de geração
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")} ${new Date().toLocaleTimeString("pt-BR")}`, 14, 28);
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      
      // Resumo
      doc.text(`Total de Checklists: ${total}`, 14, 40);
      doc.text(`Aprovados: ${ok}`, 14, 46);
      doc.text(`Com Defeito: ${comDefeito}`, 14, 52);
      doc.text(`Pendentes: ${pendente}`, 14, 58);
      
      // Tabela
      autoTable(doc, {
        startY: 65,
        head: [["Placa", "Modelo", "Motorista", "Template", "Status", "Data"]],
        body: tableData,
        theme: "striped",
        headStyles: { fillColor: [350, 65, 28], textColor: 255 },
      });

      doc.save(`relatorio_checklists_${new Date().getTime()}.pdf`);
      toast.success("Relatório de Checklists gerado com sucesso!");
    } catch (error: any) {
      console.error("Erro ao gerar relatório:", error);
      toast.error("Erro ao gerar relatório de checklists");
    } finally {
      setLoading(null);
    }
  };

  const generateDefectsReport = async (format: "pdf" | "csv" = "pdf") => {
    setLoading("defeitos");
    try {
      const { data: defects, error } = await supabase
        .from("defects")
        .select(`
          *,
          vehicles (placa, modelo)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Preparar dados
      const total = defects?.length || 0;
      const aberto = defects?.filter(d => d.status === "aberto").length || 0;
      const emAnalise = defects?.filter(d => d.status === "em_analise").length || 0;
      const resolvido = defects?.filter(d => d.status === "resolvido").length || 0;

      const tableData = (defects || []).map(d => [
        d.vehicles?.placa || "-",
        d.vehicles?.modelo || "-",
        d.descricao.substring(0, 50) + (d.descricao.length > 50 ? "..." : ""),
        d.severidade === "critico" ? "Crítico" : d.severidade === "moderado" ? "Moderado" : "Leve",
        d.status === "aberto" ? "Aberto" : d.status === "em_analise" ? "Em Análise" : "Resolvido",
        new Date(d.created_at).toLocaleDateString("pt-BR"),
      ]);

      if (format === "csv") {
        // Gerar CSV
        const csvHeaders = ["Placa", "Modelo", "Descrição", "Severidade", "Status", "Data"];
        const csvContent = `Relatório de Manutenções/Defeitos\nGerado em: ${new Date().toLocaleDateString("pt-BR")} ${new Date().toLocaleTimeString("pt-BR")}\n\nEstatísticas:\nTotal de Defeitos,${total}\nAbertos,${aberto}\nEm Análise,${emAnalise}\nResolvidos,${resolvido}\n\n${convertToCSV(csvHeaders, tableData)}`;
        
        downloadCSV(csvContent, `relatorio_defeitos_${new Date().getTime()}.csv`);
        toast.success("Relatório de Manutenções/Defeitos (CSV) gerado com sucesso!");
        setLoading(null);
        return;
      }

      // Gerar PDF
      const doc = new jsPDF();
      
      // Título
      doc.setFontSize(18);
      doc.text("Relatório de Manutenções/Defeitos", 14, 20);
      
      // Data de geração
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")} ${new Date().toLocaleTimeString("pt-BR")}`, 14, 28);
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      
      // Resumo
      doc.text(`Total de Defeitos: ${total}`, 14, 40);
      doc.text(`Abertos: ${aberto}`, 14, 46);
      doc.text(`Em Análise: ${emAnalise}`, 14, 52);
      doc.text(`Resolvidos: ${resolvido}`, 14, 58);
      
      // Tabela
      autoTable(doc, {
        startY: 65,
        head: [["Placa", "Modelo", "Descrição", "Severidade", "Status", "Data"]],
        body: tableData,
        theme: "striped",
        headStyles: { fillColor: [350, 65, 28], textColor: 255 },
      });

      doc.save(`relatorio_defeitos_${new Date().getTime()}.pdf`);
      toast.success("Relatório de Manutenções/Defeitos gerado com sucesso!");
    } catch (error: any) {
      console.error("Erro ao gerar relatório:", error);
      toast.error("Erro ao gerar relatório de defeitos");
    } finally {
      setLoading(null);
    }
  };

  const generateVehiclesReport = async (format: "pdf" | "csv" = "pdf") => {
    setLoading("veiculos");
    try {
      const { data: vehicles, error } = await supabase
        .from("vehicles")
        .select("*")
        .order("modelo", { ascending: true });

      if (error) throw error;

      // Preparar dados
      const total = vehicles?.length || 0;
      const tableData = (vehicles || []).map(v => [
        v.placa,
        v.modelo,
        v.ano,
        v.quilometragem_atual?.toLocaleString("pt-BR") || "0",
        v.chassi || "-",
        new Date(v.created_at).toLocaleDateString("pt-BR"),
      ]);

      if (format === "csv") {
        // Gerar CSV
        const csvHeaders = ["Placa", "Modelo", "Ano", "Quilometragem Atual", "Chassi", "Cadastrado em"];
        const csvContent = `Relatório de Veículos\nGerado em: ${new Date().toLocaleDateString("pt-BR")} ${new Date().toLocaleTimeString("pt-BR")}\n\nTotal de Veículos na Frota,${total}\n\n${convertToCSV(csvHeaders, tableData)}`;
        
        downloadCSV(csvContent, `relatorio_veiculos_${new Date().getTime()}.csv`);
        toast.success("Relatório de Veículos (CSV) gerado com sucesso!");
        setLoading(null);
        return;
      }

      // Gerar PDF
      const doc = new jsPDF();
      
      // Título
      doc.setFontSize(18);
      doc.text("Relatório de Veículos", 14, 20);
      
      // Data de geração
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")} ${new Date().toLocaleTimeString("pt-BR")}`, 14, 28);
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      
      // Resumo
      doc.text(`Total de Veículos na Frota: ${total}`, 14, 40);
      
      // Tabela
      autoTable(doc, {
        startY: 50,
        head: [["Placa", "Modelo", "Ano", "Quilometragem Atual", "Chassi", "Cadastrado em"]],
        body: tableData,
        theme: "striped",
        headStyles: { fillColor: [350, 65, 28], textColor: 255 },
      });

      doc.save(`relatorio_veiculos_${new Date().getTime()}.pdf`);
      toast.success("Relatório de Veículos gerado com sucesso!");
    } catch (error: any) {
      console.error("Erro ao gerar relatório:", error);
      toast.error("Erro ao gerar relatório de veículos");
    } finally {
      setLoading(null);
    }
  };

  const generateDashboardReport = async (format: "pdf" | "csv" = "pdf") => {
    setLoading("dashboard");
    try {
      const [vehiclesResult, checklistsResult, defectsResult, todayResult, allChecklistsResult] = await Promise.all([
        supabase.from("vehicles").select("id", { count: "exact" }),
        supabase.from("checklists").select("id", { count: "exact" }),
        supabase.from("defects").select("id", { count: "exact" }).eq("status", "aberto"),
        supabase
          .from("checklists")
          .select("id", { count: "exact" })
          .eq("status", "ok")
          .gte("created_at", new Date().toISOString().split("T")[0]),
        supabase.from("checklists").select("status"),
      ]);

      // Preparar dados
      const okChecklists = allChecklistsResult.data?.filter((c: any) => c.status === "ok").length || 0;
      const defeitoChecklists = allChecklistsResult.data?.filter((c: any) => c.status === "com_defeito").length || 0;
      const pendenteChecklists = allChecklistsResult.data?.filter((c: any) => c.status === "pendente").length || 0;

      if (format === "csv") {
        // Gerar CSV
        const summaryData = [
          ["Total de Veículos", String(vehiclesResult.count || 0)],
          ["Total de Checklists", String(checklistsResult.count || 0)],
          ["Checklists Aprovados", String(okChecklists)],
          ["Checklists com Defeito", String(defeitoChecklists)],
          ["Checklists Pendentes", String(pendenteChecklists)],
          ["Defeitos Abertos", String(defectsResult.count || 0)],
          ["Concluídos Hoje", String(todayResult.count || 0)],
        ];

        const csvContent = `Relatório Geral - Dashboard\nGerado em: ${new Date().toLocaleDateString("pt-BR")} ${new Date().toLocaleTimeString("pt-BR")}\n\nEstatísticas do Sistema:\n${convertToCSV(["Métrica", "Valor"], summaryData)}`;
        
        downloadCSV(csvContent, `relatorio_dashboard_${new Date().getTime()}.csv`);
        toast.success("Relatório de Dashboard (CSV) gerado com sucesso!");
        setLoading(null);
        return;
      }

      // Gerar PDF
      const doc = new jsPDF();
      
      // Título
      doc.setFontSize(20);
      doc.text("Relatório Geral - Dashboard", 14, 20);
      
      // Data de geração
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")} ${new Date().toLocaleTimeString("pt-BR")}`, 14, 28);
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.text("Visão Geral do Sistema", 14, 40);
      
      doc.setFontSize(12);
      const yStart = 50;
      let yPos = yStart;
      
      doc.text(`Total de Veículos: ${vehiclesResult.count || 0}`, 14, yPos);
      yPos += 8;
      doc.text(`Total de Checklists: ${checklistsResult.count || 0}`, 14, yPos);
      yPos += 8;
      doc.text(`Checklists Concluídos Hoje: ${todayResult.count || 0}`, 14, yPos);
      yPos += 8;
      doc.text(`Defeitos Abertos: ${defectsResult.count || 0}`, 14, yPos);
      yPos += 12;
      
      // Estatísticas detalhadas
      doc.setFontSize(14);
      doc.text("Estatísticas Detalhadas", 14, yPos);
      yPos += 8;
      
      doc.setFontSize(12);
      
      doc.text(`Checklists Aprovados: ${okChecklists}`, 14, yPos);
      yPos += 8;
      doc.text(`Checklists com Defeito: ${defeitoChecklists}`, 14, yPos);
      yPos += 8;
      doc.text(`Checklists Pendentes: ${pendenteChecklists}`, 14, yPos);
      yPos += 12;
      
      // Tabela de resumo
      const summaryData = [
        ["Total de Veículos", String(vehiclesResult.count || 0)],
        ["Total de Checklists", String(checklistsResult.count || 0)],
        ["Checklists Aprovados", String(okChecklists)],
        ["Checklists com Defeito", String(defeitoChecklists)],
        ["Checklists Pendentes", String(pendenteChecklists)],
        ["Defeitos Abertos", String(defectsResult.count || 0)],
        ["Concluídos Hoje", String(todayResult.count || 0)],
      ];

      autoTable(doc, {
        startY: yPos + 5,
        head: [["Métrica", "Valor"]],
        body: summaryData,
        theme: "striped",
        headStyles: { fillColor: [350, 65, 28], textColor: 255 },
      });

      doc.save(`relatorio_dashboard_${new Date().getTime()}.pdf`);
      toast.success("Relatório de Dashboard gerado com sucesso!");
    } catch (error: any) {
      console.error("Erro ao gerar relatório:", error);
      toast.error("Erro ao gerar relatório de dashboard");
    } finally {
      setLoading(null);
    }
  };

  const reportCards = [
    {
      title: "Relatório de Checklists",
      description: "Gere um relatório completo com todos os checklists realizados",
      icon: ClipboardCheck,
      onClick: (format: "pdf" | "csv") => generateChecklistsReport(format),
      loading: loading === "checklists",
      key: "checklists",
    },
    {
      title: "Relatório de Manutenções",
      description: "Relatório detalhado de defeitos e manutenções registradas",
      icon: Wrench,
      onClick: (format: "pdf" | "csv") => generateDefectsReport(format),
      loading: loading === "defeitos",
      key: "defeitos",
    },
    {
      title: "Relatório de Veículos",
      description: "Lista completa de veículos cadastrados na frota",
      icon: Car,
      onClick: (format: "pdf" | "csv") => generateVehiclesReport(format),
      loading: loading === "veiculos",
      key: "veiculos",
    },
    {
      title: "Relatório do Dashboard",
      description: "Visão geral e estatísticas gerais do sistema",
      icon: BarChart3,
      onClick: (format: "pdf" | "csv") => generateDashboardReport(format),
      loading: loading === "dashboard",
      key: "dashboard",
    },
  ];

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Relatórios</h1>
          <p className="text-muted-foreground">
            Gere relatórios em PDF sobre checklists, manutenções, veículos e dashboard
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          {reportCards.map((report, index) => (
            <Card key={index} className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <report.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle>{report.title}</CardTitle>
                    <CardDescription>{report.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button
                    onClick={() => report.onClick("pdf")}
                    disabled={report.loading || loading !== null}
                    className="flex-1 gap-2"
                  >
                    {report.loading && loading === report.key ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4" />
                        PDF
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => report.onClick("csv")}
                    disabled={report.loading || loading !== null}
                    variant="outline"
                    className="flex-1 gap-2"
                  >
                    {report.loading && loading === report.key ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        CSV
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Informações sobre os Relatórios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• Os relatórios podem ser gerados em formato PDF ou CSV</p>
              <p>• PDFs são ideais para visualização e impressão</p>
              <p>• CSVs são ideais para análise em planilhas (Excel, Google Sheets)</p>
              <p>• Os dados são atualizados em tempo real do banco de dados</p>
              <p>• Cada relatório inclui data e hora de geração</p>
              <p>• Relatórios podem ser compartilhados e impressos</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Reports;

