"use client";

import { useState, useMemo } from "react";
import { DEFAULT_INPUTS, calculateResults, getKPIColor } from "./utils/calculations";
import { SimulatorInputs } from "./types";
import { SliderInput } from "./components/SliderInput";
import { KPICard } from "./components/KPICard";
import { LayoutDashboard, TrendingUp, DollarSign, Package, Clock, BarChart3, Info } from "lucide-react";
import { cn } from "./utils/cn";

const CURRENCY_FORMAT = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

const NUMBER_FORMAT = new Intl.NumberFormat('de-DE', {
  maximumFractionDigits: 1,
});

export default function Simulator() {
  const [inputs, setInputs] = useState<SimulatorInputs>(DEFAULT_INPUTS);

  const results = useMemo(() => calculateResults(inputs), [inputs]);

  const updateInput = (key: keyof SimulatorInputs, value: number) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  const formatCurrency = (val: number) => {
    if (val >= 1000000) return (val / 1000000).toFixed(1).replace('.', ',') + " Mio €";
    if (val >= 1000) return (val / 1000).toFixed(0) + " T€";
    return CURRENCY_FORMAT.format(val);
  };

  // Quick Interpretation Text
  const getInterpretation = () => {
    // Simple logic based on specs
    if (getKPIColor.inventoryTurnover(results.inventoryTurnover) === 'critical') {
      return {
        title: "Hohe Lagerbestände!",
        text: "Dein Lager wird relativ selten umgeschlagen. Es ist viel Kapital in Vorräten gebunden – Ansatzpunkt: Lagerbestand reduzieren oder Beschaffung optimieren."
      };
    }
    if (getKPIColor.roi(results.roi) === 'critical') {
      return {
        title: "Niedriger ROI!",
        text: "Der Return on Investment ist kritisch. Prüfe, ob du das eingesetzte Kapital (Anlagevermögen + WC) reduzieren oder die Marge erhöhen kannst."
      };
    }
    if (getKPIColor.workingCapitalDays(results.workingCapitalDays) === 'critical') {
      return {
        title: "Liquidität gebunden!",
        text: "Dein Working Capital bindet für lange Zeit Mittel. Kürzere Debitorenziele oder längere Kreditorenziele könnten die Liquidität verbessern."
      };
    }
    return {
      title: "Solide Kennzahlen",
      text: "Deine aktuellen Einstellungen führen zu einer soliden Kapitalstruktur und Rentabilität. Experimentiere weiter!"
    };
  };

  const interpretation = getInterpretation();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-brand-600 text-white p-2 rounded-lg">
              <LayoutDashboard size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 leading-none">Kapitalbindung-Simulator</h1>
              <p className="text-xs text-slate-500 mt-1">Interaktives Modell für Lehrzwecke</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-sm text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
            <Info size={16} />
            <span>Verändere die Parameter links, um die Auswirkungen zu sehen.</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* LEFT COLUMN: INPUTS */}
          <div className="lg:col-span-4 space-y-8">

            {/* Group 1: Umsatz & Marge */}
            <section className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
              <div className="flex items-center gap-2 mb-6 text-brand-700">
                <TrendingUp size={20} />
                <h2 className="font-semibold text-lg">Umsatz & Marge</h2>
              </div>
              <div className="space-y-6">
                <SliderInput
                  label="Jahresumsatz"
                  value={inputs.annualRevenue}
                  onChange={(v) => updateInput('annualRevenue', v)}
                  min={500000} max={10000000} step={100000}
                  formatValue={formatCurrency}
                  description="Gesamter Erlös aus Verkäufen pro Jahr."
                />
                <SliderInput
                  label="Materialquote"
                  value={inputs.cogsPercentage}
                  onChange={(v) => updateInput('cogsPercentage', v)}
                  min={20} max={80} step={1} unit="%"
                  description="Anteil der Materialkosten am Umsatz."
                />
                <SliderInput
                  label="Umsatzrendite"
                  value={inputs.profitMargin}
                  onChange={(v) => updateInput('profitMargin', v)}
                  min={2} max={25} step={0.5} unit="%"
                  description="Gewinnanteil am Umsatz (Profit Margin)."
                />
              </div>
            </section>

            {/* Group 2: Lager & WC */}
            <section className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
              <div className="flex items-center gap-2 mb-6 text-brand-700">
                <Package size={20} />
                <h2 className="font-semibold text-lg">Lager & Working Capital</h2>
              </div>
              <div className="space-y-6">
                <SliderInput
                  label="Lagerbestand (Ø)"
                  value={inputs.inventoryValue}
                  onChange={(v) => updateInput('inventoryValue', v)}
                  min={0} max={2000000} step={50000}
                  formatValue={formatCurrency}
                  description="Durchschnittlich gebundenes Kapital im Lager."
                />
                <SliderInput
                  label="Debitorenziel"
                  value={inputs.receivablesDays}
                  onChange={(v) => updateInput('receivablesDays', v)}
                  min={0} max={90} step={1} unit=" Tage"
                  description="Wie lange Kunden Zeit haben, um zu zahlen."
                />
                <SliderInput
                  label="Kreditorenziel"
                  value={inputs.payablesDays}
                  onChange={(v) => updateInput('payablesDays', v)}
                  min={0} max={90} step={1} unit=" Tage"
                  description="Wie lange wir uns Zeit lassen, Lieferanten zu bezahlen."
                />
              </div>
            </section>

            {/* Group 3: Anlagevermögen */}
            <section className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
              <div className="flex items-center gap-2 mb-6 text-brand-700">
                <DollarSign size={20} />
                <h2 className="font-semibold text-lg">Anlagevermögen</h2>
              </div>
              <div className="space-y-6">
                <SliderInput
                  label="Anlagevermögen"
                  value={inputs.fixedAssets}
                  onChange={(v) => updateInput('fixedAssets', v)}
                  min={500000} max={8000000} step={100000}
                  formatValue={formatCurrency}
                  description="Maschinen, Gebäude, Ausstattung."
                />
              </div>
            </section>

          </div>

          {/* RIGHT COLUMN: OUTPUTS */}
          <div className="lg:col-span-8 space-y-6">

            {/* Highlight Cards - Interpretation */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                  <Info className="text-brand-300" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-1">{interpretation.title}</h3>
                  <p className="text-slate-300 leading-relaxed text-sm lg:text-base">
                    {interpretation.text}
                  </p>
                </div>
              </div>
            </div>

            {/* Section 1: Effizienz & Kennzahlen */}
            <div>
              <h3 className="text-sm uppercase tracking-wider text-slate-500 font-bold mb-4 flex items-center gap-2">
                <BarChart3 size={16} /> Effizienz & Rentabilität
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4">
                <KPICard
                  title="Kapitalumschlag"
                  value={NUMBER_FORMAT.format(results.capitalTurnover)}
                  status={getKPIColor.capitalTurnover(results.capitalTurnover)}
                  description={getKPIColor.capitalTurnover(results.capitalTurnover) === 'good' ? 'Effizient' : getKPIColor.capitalTurnover(results.capitalTurnover) === 'neutral' ? 'OK' : 'Ineffizient'}
                />
                <KPICard
                  title="Lagerumschlag"
                  value={NUMBER_FORMAT.format(results.inventoryTurnover)}
                  status={getKPIColor.inventoryTurnover(results.inventoryTurnover)}
                  description={getKPIColor.inventoryTurnover(results.inventoryTurnover) === 'good' ? 'Schnell' : 'Langsam'}
                />
                <KPICard
                  title="Lagerdauer"
                  value={`${results.inventoryDays.toFixed(0)} Tage`}
                  status={getKPIColor.inventoryDays(results.inventoryDays)}
                  description={getKPIColor.inventoryDays(results.inventoryDays) === 'critical' ? 'Sehr lang' : 'OK'}
                />
                <KPICard
                  title="ROI"
                  value={`${results.roi.toFixed(1)} %`}
                  status={getKPIColor.roi(results.roi)}
                  description="Return on Invest"
                />
              </div>
            </div>

            {/* Section 2: Kapitalstruktur Breakdown */}
            <div>
              <h3 className="text-sm uppercase tracking-wider text-slate-500 font-bold mb-4 mt-8 flex items-center gap-2">
                <DollarSign size={16} /> Kapitalstruktur
              </h3>

              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                  <div className="text-center pt-4 md:pt-0">
                    <div className="text-slate-500 text-sm mb-1 uppercase font-semibold">Umlaufvermögen</div>
                    <div className="text-2xl font-bold text-slate-900">{formatCurrency(results.currentAssets)}</div>
                    <div className="text-xs text-slate-400 mt-1">Lager + Forderungen</div>
                  </div>
                  <div className="text-center pt-4 md:pt-0">
                    <div className="text-slate-500 text-sm mb-1 uppercase font-semibold">Working Capital</div>
                    <div className={cn("text-2xl font-bold", results.workingCapital < 0 ? "text-red-600" : "text-brand-600")}>
                      {formatCurrency(results.workingCapital)}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      {results.workingCapitalDays.toFixed(0)} Tage Umsatz
                    </div>
                  </div>
                  <div className="text-center pt-4 md:pt-0">
                    <div className="text-slate-500 text-sm mb-1 uppercase font-semibold">Gesamtkapital</div>
                    <div className="text-2xl font-bold text-slate-900">{formatCurrency(results.totalCapital)}</div>
                    <div className="text-xs text-slate-400 mt-1">Gebunden im Unternehmen</div>
                  </div>
                </div>

                {/* Simple Bar Visualization */}
                <div className="mt-8 pt-8 border-t border-slate-100">
                  <h4 className="text-sm font-semibold mb-4 text-slate-700">Verteilung Gesamtkapital</h4>
                  <div className="h-12 w-full bg-slate-100 rounded-full flex overflow-hidden">
                    {/* Fixed Assets */}
                    <div
                      className="h-full bg-slate-400 flex items-center justify-center text-white text-xs font-bold transition-all duration-500"
                      style={{ width: `${(inputs.fixedAssets / results.totalCapital) * 100}%` }}
                    >
                      {((inputs.fixedAssets / results.totalCapital) * 100) > 10 && 'Anlage'}
                    </div>
                    {/* Working Capital (simplified for visual, WC is part of Funding not strict asset breakdown, mostly Assets = Fixed + Current. WC is a specific metric. 
                               Let's visualize Assets instead: Fixed + Current Assets.
                               But we want to show Capital Used.
                               Let's show Fixed Assets + Net Working Capital? No, that equals Total Capital (simplified).
                            */}
                    <div
                      className="h-full bg-brand-500 flex items-center justify-center text-white text-xs font-bold transition-all duration-500"
                      style={{ width: `${(results.workingCapital / results.totalCapital) * 100}%` }}
                    >
                      {((results.workingCapital / results.totalCapital) * 100) > 10 && 'Working Cap'}
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 mt-2 px-1">
                    <span>Anlagevermögen</span>
                    <span>Working Capital</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Additional Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="text-xs text-slate-500 mb-1">Gewinn</div>
                <div className="font-mono text-lg font-bold text-slate-700">{formatCurrency(results.profit)}</div>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="text-xs text-slate-500 mb-1">Forderungen</div>
                <div className="font-mono text-lg font-bold text-slate-700">{formatCurrency(results.receivables)}</div>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="text-xs text-slate-500 mb-1">Verbindlichk.</div>
                <div className="font-mono text-lg font-bold text-slate-700">{formatCurrency(results.payables)}</div>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="text-xs text-slate-500 mb-1">Wareneinsatz</div>
                <div className="font-mono text-lg font-bold text-slate-700">{formatCurrency(results.cogs)}</div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
