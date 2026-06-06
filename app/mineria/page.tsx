'use client';

import { useEffect, useState } from 'react';
import { TopNav } from '@/components/layout/top-nav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CheckCircle2, Clock, FileText } from 'lucide-react';
import { LEY_21800_REQUIREMENTS, getMiningCategoryStats, getRequirementsByCategory } from '@/lib/services/mineria';

export default function MineriaModulePage() {
  const [selectedCategory, setSelectedCategory] = useState<'seguridad' | 'salud' | 'ambiente' | 'reporte' | 'capacitacion'>('seguridad');
  const [requirements, setRequirements] = useState<any[]>([]);

  useEffect(() => {
    const reqs = getRequirementsByCategory(selectedCategory);
    setRequirements(reqs);
  }, [selectedCategory]);

  const categories = [
    { key: 'seguridad', label: 'Seguridad Minera', icon: AlertTriangle, color: 'text-red-600' },
    { key: 'salud', label: 'Salud Ocupacional', icon: FileText, color: 'text-orange-600' },
    { key: 'ambiente', label: 'Ambiente', icon: FileText, color: 'text-green-600' },
    { key: 'reporte', label: 'Reportes', icon: FileText, color: 'text-blue-600' },
    { key: 'capacitacion', label: 'Capacitación', icon: FileText, color: 'text-purple-600' },
  ];

  const stats = {
    seguridad: LEY_21800_REQUIREMENTS.filter(r => r.category === 'seguridad').length,
    salud: LEY_21800_REQUIREMENTS.filter(r => r.category === 'salud').length,
    ambiente: LEY_21800_REQUIREMENTS.filter(r => r.category === 'ambiente').length,
    reporte: LEY_21800_REQUIREMENTS.filter(r => r.category === 'reporte').length,
    capacitacion: LEY_21800_REQUIREMENTS.filter(r => r.category === 'capacitacion').length,
  };

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="container mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="mb-8">
            <div className="inline-block px-3 py-1 bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-full text-sm font-medium mb-3">
              Ley 21.800 de Seguridad Minera
            </div>
            <h1 className="text-4xl font-bold mb-2">Módulo de Minería</h1>
            <p className="text-muted-foreground max-w-2xl">
              Sistema especializado de cumplimiento normativo para empresas mineras en Chile.
              Monitorea la conformidad con Ley 21.800 y regulaciones asociadas.
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {categories.map(cat => (
              <Card key={cat.key} className="cursor-pointer hover:border-primary transition-colors" onClick={() => setSelectedCategory(cat.key as any)}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <cat.icon className={`w-4 h-4 ${cat.color}`} />
                    {cat.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{stats[cat.key as keyof typeof stats]}</p>
                  <p className="text-xs text-muted-foreground mt-1">requisitos</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Info Boxes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-red-500/5 border-red-500/20">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  Penalidades por Incumplimiento
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>• Faltas leves: 1 a 50 UTA</p>
                <p>• Faltas graves: 51 a 200 UTA</p>
                <p>• Cierre temporal o definitivo de operaciones</p>
                <p>• Multas según DL 701</p>
              </CardContent>
            </Card>

            <Card className="bg-blue-500/5 border-blue-500/20">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                  Beneficios del Cumplimiento
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>• Reducción de accidentes y lesiones</p>
                <p>• Mayor eficiencia operacional</p>
                <p>• Acceso a financiamiento preferencial</p>
                <p>• Mejor relación con comunidades</p>
              </CardContent>
            </Card>
          </div>

          {/* Category Requirements */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Requisitos por Categoría</h2>

            {/* Category Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
              {categories.map(cat => (
                <button
                  key={cat.key}
                  onClick={() => setSelectedCategory(cat.key as any)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedCategory === cat.key
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary hover:bg-secondary/80 text-foreground'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Requirements List */}
            <div className="space-y-4">
              {requirements.map(req => (
                <Card key={req.code}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-base">{req.title}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">Código: {req.code}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="px-3 py-1 rounded text-xs font-medium bg-secondary">
                          {req.frequency}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm">{req.description}</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground font-medium mb-1">Tipos de Evidencia</p>
                        <div className="flex flex-wrap gap-1">
                          {req.evidenceType.map((type: string) => (
                            <span key={type} className="px-2 py-1 bg-secondary rounded text-xs">
                              {type.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      </div>

                      {req.penalty && (
                        <div>
                          <p className="text-xs text-muted-foreground font-medium mb-1">Penalidad por Incumplimiento</p>
                          <p className="text-sm font-medium text-red-600">{req.penalty}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Resource Card */}
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Recursos y Documentos
              </CardTitle>
              <CardDescription>
                Acceso a guías, plantillas y documentación oficial
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <a href="#" className="p-4 rounded-lg border border-border hover:bg-secondary transition-colors">
                  <p className="font-medium text-sm">Guía de Cumplimiento</p>
                  <p className="text-xs text-muted-foreground mt-1">Ley 21.800</p>
                </a>
                <a href="#" className="p-4 rounded-lg border border-border hover:bg-secondary transition-colors">
                  <p className="font-medium text-sm">Plantilla de Plan SGS</p>
                  <p className="text-xs text-muted-foreground mt-1">Descargable</p>
                </a>
                <a href="#" className="p-4 rounded-lg border border-border hover:bg-secondary transition-colors">
                  <p className="font-medium text-sm">Contacto SERNAGEOMIN</p>
                  <p className="text-xs text-muted-foreground mt-1">Autoridad reguladora</p>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
