"use client";

import { useState, useMemo } from "react";
import { DEFAULT_INPUTS, calculateResults, getKPIColor, INDUSTRY_PRESETS } from "./utils/calculations";
import { SimulatorInputs } from "./types";
import { SliderInput } from "./components/SliderInput";
import { KPICard } from "./components/KPICard";
import { LayoutDashboard, TrendingUp, DollarSign, Package, Clock, BarChart3, Info, PieChart } from "lucide-react";
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

  // Interpretation Logic with consolidated status (Multi-Message)
  const getInterpretation = () => {
    let status: 'good' | 'neutral' | 'critical' = 'good';

    // Collect all relevant messages
    const messages: { title: string; text: string; type: 'critical' | 'neutral' | 'good' }[] = [];

    // 1. Critical Risks
    if (results.riskLabel === 'high') {
      status = 'critical';
      messages.push({
        type: 'critical',
        title: "Kritisches Risiko: Lagerbestand",
        text: results.riskMessage || "Kritischer Lagerbestand."
      });
    }

    if (getKPIColor.roi(results.roi) === 'critical') {
      if (status !== 'critical') status = 'critical'; // Upgrade status
      messages.push({
        type: 'critical',
        title: "Kritisch: Niedriger ROI",
        text: "Der Return on Investment ist zu niedrig."
      });
    }

    if (getKPIColor.inventoryDays(results.inventoryDays) === 'critical') {
      if (status !== 'critical') status = 'critical';
      messages.push({
        type: 'critical',
        title: "Kritisch: Lange Lagerdauer",
        text: "Kapital ist zu lange im Lager gebunden."
      });
    }

    // 2. Warnings / Neutral
    if (results.workingCapital < 0) {
      if (status === 'good') status = 'neutral';
      messages.push({
        type: 'neutral',
        title: "Achtung: Negatives Working Capital",
        text: "Umlaufvermögen wird über Lieferanten finanziert."
      });
    }

    if (results.riskLabel === 'medium') {
      if (status === 'good') status = 'neutral';
      messages.push({
        type: 'neutral',
        title: "Warnung: Flexibilität",
        text: results.riskMessage || "Geringer Puffer."
      });
    }

    if (getKPIColor.capitalTurnover(results.capitalTurnover) === 'critical') {
      if (status === 'good') status = 'neutral';
      messages.push({
        type: 'neutral',
        title: "Ineffizienz",
        text: "Kapitalumschlag ist langsam."
      });
    }

    // 3. Good News (only if not overwhelmed by criticals, or allows mix?)
    // User wants mixed signals allowed.
    if (getKPIColor.roi(results.roi) === 'good') {
      messages.push({
        type: 'good',
        title: "Starker ROI",
        text: "Deine Rentabilität ist ausgezeichnet."
      });
    }
    if (getKPIColor.inventoryTurnover(results.inventoryTurnover) === 'good' && results.riskLabel === 'low') {
      messages.push({
        type: 'good',
        title: "Effizientes Lager",
        text: "Schneller Lagerumschlag."
      });
    }

    // Fallback if empty
    if (messages.length === 0) {
      messages.push({
        type: 'good',
        title: "Ausgewogen",
        text: "Deine aktuellen Einstellungen führen zu einer soliden Kapitalstruktur."
      });
    }

    // Sort messages: Critical first, then Neutral, then Good.
    // Pick top 2.
    const priority = { critical: 0, neutral: 1, good: 2 };
    messages.sort((a, b) => priority[a.type] - priority[b.type]);

    const displayMessages = messages.slice(0, 2);

    // Determine Container Color based on overall status
    let colorClass = "bg-emerald-100 border-emerald-300 text-emerald-900";
    let iconColor = "text-emerald-700";

    if (status === 'critical') {
      colorClass = "bg-red-100 border-red-300 text-red-900";
      iconColor = "text-red-700";
    } else if (status === 'neutral') {
      colorClass = "bg-amber-100 border-amber-300 text-amber-900";
      iconColor = "text-amber-700";
    }

    return { displayMessages, colorClass, iconColor, status };
  };

  const interpretation = getInterpretation();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* LEFT COLUMN: INPUTS */}
          <div className="lg:col-span-4 space-y-4">

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
                  min={500000} max={30000000} step={100000}
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
                  min={0} max={5000000} step={50000}
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
                  min={500000} max={10000000} step={100000}
                  formatValue={formatCurrency}
                  description="Maschinen, Gebäude, Ausstattung."
                />
              </div>
            </section>

          </div>

          {/* RIGHT COLUMN: OUTPUTS */}
          <div className="lg:col-span-8 space-y-6">

            {/* Highlight Cards - Interpretation (Dynamic Color) */}
            <div className={cn("rounded-xl p-6 shadow-md border-l-8 transition-colors duration-300 h-48 overflow-hidden", interpretation.colorClass)}>
              <div className="flex flex-col gap-4 h-full justify-center">
                {interpretation.displayMessages.map((msg, idx) => (
                  <div key={idx} className="flex items-start gap-4">
                    <div>
                      <h3 className={cn("text-lg font-bold leading-tight",
                        msg.type === 'critical' ? 'text-red-800' :
                          msg.type === 'good' ? 'text-emerald-800' : 'text-amber-800'
                      )}>{msg.title}</h3>
                      <p className={cn("leading-snug text-sm mt-1 font-medium",
                        msg.type === 'critical' ? 'text-red-700/90' :
                          msg.type === 'good' ? 'text-emerald-700/90' : 'text-amber-700/90'
                      )}>
                        {msg.text}
                      </p>
                    </div>
                  </div>
                ))}
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


              {/* Section 2: Kapitalstruktur Breakdown (Total Funding View) */}
              <h3 className="text-sm uppercase tracking-wider text-slate-500 font-bold mb-4 mt-8 flex items-center gap-2">
                <PieChart size={16} /> Kapitalstruktur (Finanzierung)
              </h3>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                {(() => {
                  // Gross Assets = The total "stuff" we have (Fixed + Inventory + Receivables)
                  const grossAssets = inputs.fixedAssets + results.currentAssets;
                  // Funding Sources:
                  // 1. Payables (Supplier Credit) -> "Free" (No Interest/Equity needed)
                  // 2. Net Capital Required (Total Capital) -> "Bound" (Needs Equity/Debt)

                  const freePct = (results.payables / grossAssets) * 100;
                  const boundPct = (results.totalCapital / grossAssets) * 100;

                  // Inside Bound, distinguish Fixed vs Net WC for context
                  // If WC > 0: Bound = Fixed + NetWC
                  // If WC < 0: Bound = Fixed - Released, so Bound is purely Fixed (and smaller than Fixed)

                  const isWCPositive = results.workingCapital > 0;
                  const fixedInBoundPct = isWCPositive
                    ? (inputs.fixedAssets / grossAssets) * 100
                    : boundPct; // If WC < 0, Bound is entirely Fixed (and less than original Fixed)

                  const wcInBoundPct = isWCPositive
                    ? (results.workingCapital / grossAssets) * 100
                    : 0;

                  return (
                    <div className="flex h-12 w-full rounded-lg overflow-hidden mb-2 bg-slate-200 relative">
                      {/* Segment 1: Fixed Assets (Bound) */}
                      <div
                        className="bg-blue-600 flex items-center justify-center text-white text-xs font-bold transition-all duration-500 overflow-hidden whitespace-nowrap px-1"
                        style={{ width: `${fixedInBoundPct}%` }}
                      >
                        {fixedInBoundPct > 15 && 'Anlagevermögen'}
                      </div>

                      {/* Segment 2: Net WC (Bound) - Only if WC Positive */}
                      {isWCPositive && (
                        <div
                          className="bg-amber-500 flex items-center justify-center text-white text-xs font-bold transition-all duration-500 overflow-hidden whitespace-nowrap px-1"
                          style={{ width: `${wcInBoundPct}%` }}
                        >
                          {wcInBoundPct > 15 && 'Umlaufvermögen'}
                        </div>
                      )}

                      {/* Segment 3: Payables (Free) */}
                      <div
                        className="bg-emerald-500 flex items-center justify-center text-white text-xs font-bold transition-all duration-500 overflow-hidden whitespace-nowrap px-1"
                        style={{ width: `${freePct}%` }}
                      >
                        {freePct > 5 && 'Cash'}
                      </div>
                    </div>
                  );
                })()}

                <div className="flex justify-between text-xs text-slate-500 font-medium px-1 mt-2">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-700">Gebunden: {formatCurrency(results.totalCapital)}</span>
                    <span className="text-[10px] opacity-75">Finanziert durch Bank/Eigenkapital</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="font-bold text-emerald-600">Frei: {formatCurrency(results.payables)}</span>
                    <span className="text-[10px] opacity-75">Finanziert durch Lieferanten</span>
                  </div>
                </div>
              </div>

              {/* Section 3: Weitere Kennzahlen (Cash Cycle) - Moved to bottom */}
              <h3 className="text-sm uppercase tracking-wider text-slate-500 font-bold mb-4 mt-8 flex items-center gap-2">
                <Clock size={16} /> Weitere Kennzahlen (Cash Cycle)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

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
      </main>

      {/* Preset Selector Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-lg z-40">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm font-semibold text-slate-500">
            Szenario wählen:
          </div>
          <div className="flex gap-3 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
            {INDUSTRY_PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => setInputs(preset.inputs)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors border border-slate-300 flex flex-col items-start min-w-[140px]"
              >
                <span className="font-bold text-slate-900">{preset.label}</span>
                <span className="text-[10px] opacity-70 truncate max-w-full">{preset.description}</span>
              </button>
            ))}
            <button
              onClick={() => setInputs(DEFAULT_INPUTS)}
              className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-500 rounded-lg text-sm font-medium transition-colors border border-slate-200"
            >
              Reset
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
