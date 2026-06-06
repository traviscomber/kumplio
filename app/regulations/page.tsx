'use client';

import { useEffect, useState } from 'react';
import { TopNav } from '@/components/layout/top-nav';
import { getIndustries, searchRegulatoryFrameworks, searchRegulatoryRequirements, getRegulatoryStats } from '@/lib/services/regulatory';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, FileText, AlertTriangle } from 'lucide-react';

export default function RegulatoryDatabasePage() {
  const [industries, setIndustries] = useState<string[]>([]);
  const [selectedIndustry, setSelectedIndustry] = useState<string>('');
  const [frameworks, setFrameworks] = useState<any[]>([]);
  const [requirements, setRequirements] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load industries
        const indList = await getIndustries();
        setIndustries(indList);

        if (indList.length > 0) {
          setSelectedIndustry(indList[0]);
        }
      } catch (err) {
        console.error('[v0] Error loading industries:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    const loadIndustryData = async () => {
      if (!selectedIndustry) return;

      try {
        // Load frameworks
        const fwks = await searchRegulatoryFrameworks(selectedIndustry);
        setFrameworks(fwks);

        // Load requirements
        const reqs = await searchRegulatoryRequirements();
        const filteredReqs = reqs.filter(r =>
          fwks.some(f => f.id === r.framework_id)
        );
        setRequirements(filteredReqs);

        // Load stats
        const statsData = await getRegulatoryStats(selectedIndustry);
        setStats(statsData);
      } catch (err) {
        console.error('[v0] Error loading industry data:', err);
      }
    };

    loadIndustryData();
  }, [selectedIndustry]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <TopNav />
        <div className="container mx-auto px-6 py-8">
          <p className="text-muted-foreground">Cargando base de datos regulatoria...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="container mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold mb-2">Base de Datos Regulatoria</h1>
            <p className="text-muted-foreground">
              Explorar regulaciones, leyes y estándares de cumplimiento por industria
            </p>
          </div>

          {/* Industry Selector */}
          <div className="bg-card border border-border rounded-lg p-6">
            <label className="block text-sm font-medium mb-3">Seleccionar Industria</label>
            <div className="flex flex-wrap gap-2">
              {industries.map(industry => (
                <button
                  key={industry}
                  onClick={() => setSelectedIndustry(industry)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedIndustry === industry
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-foreground hover:bg-secondary/80'
                  }`}
                >
                  {industry}
                </button>
              ))}
            </div>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Marcos Regulatorios
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{stats.totalFrameworks}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Requisitos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{stats.totalRequirements}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Críticos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-red-600">
                    {stats.bySeverity?.critical || 0}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Altos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-orange-600">
                    {stats.bySeverity?.high || 0}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Frameworks and Requirements */}
          <Tabs defaultValue="frameworks" className="w-full">
            <TabsList>
              <TabsTrigger value="frameworks">Marcos Regulatorios</TabsTrigger>
              <TabsTrigger value="requirements">Requisitos</TabsTrigger>
            </TabsList>

            <TabsContent value="frameworks" className="space-y-4">
              {frameworks.map(framework => (
                <Card key={framework.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle>{framework.title}</CardTitle>
                        <CardDescription>{framework.description}</CardDescription>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-secondary">
                        {framework.type}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Año de promulgación: {framework.year_enacted}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="requirements" className="space-y-4">
              {requirements.map(req => (
                <Card key={req.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base">{req.title}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          Código: {req.requirement_code}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded text-xs font-medium whitespace-nowrap ${
                        req.severity === 'critical'
                          ? 'bg-red-500/10 text-red-700 dark:text-red-400'
                          : req.severity === 'high'
                          ? 'bg-orange-500/10 text-orange-700 dark:text-orange-400'
                          : req.severity === 'medium'
                          ? 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400'
                          : 'bg-green-500/10 text-green-700 dark:text-green-400'
                      }`}>
                        {req.severity.toUpperCase()}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm">{req.description}</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {req.category && (
                        <div>
                          <p className="text-muted-foreground">Categoría</p>
                          <p className="font-medium">{req.category}</p>
                        </div>
                      )}
                      {req.frequency && (
                        <div>
                          <p className="text-muted-foreground">Frecuencia</p>
                          <p className="font-medium">{req.frequency}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
