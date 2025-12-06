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
  const [showCapitalTurnoverInfo, setShowCapitalTurnoverInfo] = useState(false);
  const [showInventoryTurnoverInfo, setShowInventoryTurnoverInfo] = useState(false);
  const [showInventoryDaysInfo, setShowInventoryDaysInfo] = useState(false);
  const [showROIInfo, setShowROIInfo] = useState(false);

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
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-4">

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

          {/* LEFT COLUMN: INPUTS */}
          <div className="lg:col-span-4 space-y-4">

            {/* Group 1: Umsatz & Marge */}
            <section className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
              <div className="flex items-center gap-2 mb-3 text-brand-700">
                <TrendingUp size={18} />
                <h2 className="font-semibold text-base">Umsatz & Marge</h2>
              </div>
              <div className="space-y-4">
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
            <section className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
              <div className="flex items-center gap-2 mb-3 text-brand-700">
                <Package size={18} />
                <h2 className="font-semibold text-base">Lager & Working Capital</h2>
              </div>
              <div className="space-y-4">
                <SliderInput
                  label="Lagerbestand (Ø)"
                  value={inputs.inventoryValue}
                  onChange={(v) => updateInput('inventoryValue', v)}
                  min={10000} max={5000000} step={10000}
                  formatValue={formatCurrency}
                  description="Durchschnittlich gebundenes Kapital im Lager."
                />
                <SliderInput
                  label="Unfertige Erzeugnisse (WIP)"
                  value={inputs.wip}
                  onChange={(v) => updateInput('wip', v)}
                  min={0} max={5000000} step={50000}
                  formatValue={formatCurrency}
                  description="Wert der angefangenen Arbeiten (Work in Progress)."
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
            <section className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
              <div className="flex items-center gap-2 mb-3 text-brand-700">
                <DollarSign size={18} />
                <h2 className="font-semibold text-base">Anlagevermögen</h2>
              </div>
              <div className="space-y-4">
                <SliderInput
                  label="Anlagevermögen"
                  value={inputs.fixedAssets}
                  onChange={(v) => updateInput('fixedAssets', v)}
                  min={500000} max={20000000} step={100000}
                  formatValue={formatCurrency}
                  description="Maschinen, Gebäude, Ausstattung."
                />
              </div>
            </section>

          </div>

          {/* RIGHT COLUMN: OUTPUTS */}
          <div className="lg:col-span-8 flex flex-col gap-4">

            {/* Highlight Cards - Interpretation (Dynamic Color) */}
            <div className={cn("rounded-xl p-4 shadow-md border-l-8 transition-colors duration-300 h-auto min-h-[140px] shrink-0", interpretation.colorClass)}>
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
                <div className="relative group cursor-pointer" onClick={() => setShowCapitalTurnoverInfo(!showCapitalTurnoverInfo)}>
                  <KPICard
                    title="Kapitalumschlag"
                    value={NUMBER_FORMAT.format(results.capitalTurnover)}
                    status={getKPIColor.capitalTurnover(results.capitalTurnover)}
                    description={getKPIColor.capitalTurnover(results.capitalTurnover) === 'good' ? 'Effizient' : getKPIColor.capitalTurnover(results.capitalTurnover) === 'neutral' ? 'OK' : 'Ineffizient'}
                  />
                  {showCapitalTurnoverInfo && (
                    <div className="absolute left-0 bottom-full mb-2 w-48 p-3 bg-white rounded-lg shadow-xl border border-slate-200 z-50 animate-in fade-in slide-in-from-bottom-2">
                      <h4 className="font-bold text-slate-800 text-xs mb-1">Erklärung</h4>
                      <p className="text-xs text-slate-600 leading-snug">
                        Kapitalumschlag = <br /> Umsatz / Gesamtkapital
                      </p>
                    </div>
                  )}
                </div>
                <div className="relative group cursor-pointer" onClick={() => setShowInventoryTurnoverInfo(!showInventoryTurnoverInfo)}>
                  <KPICard
                    title="Lagerumschlag"
                    value={NUMBER_FORMAT.format(results.inventoryTurnover)}
                    status={getKPIColor.inventoryTurnover(results.inventoryTurnover)}
                    description={
                      getKPIColor.inventoryTurnover(results.inventoryTurnover) === 'alert' ? 'Zu hoch (Risiko!)' :
                        getKPIColor.inventoryTurnover(results.inventoryTurnover) === 'good' ? 'Schnell' :
                          getKPIColor.inventoryTurnover(results.inventoryTurnover) === 'neutral' ? 'OK' : 'Langsam'
                    }
                  />
                  {showInventoryTurnoverInfo && (
                    <div className="absolute left-0 bottom-full mb-2 w-64 p-3 bg-white rounded-lg shadow-xl border border-slate-200 z-50 animate-in fade-in slide-in-from-bottom-2">
                      <h4 className="font-bold text-slate-800 text-xs mb-1">Erklärung</h4>
                      <p className="text-xs text-slate-600 leading-snug mb-2">
                        Lagerumschlag = <br /> Wareneinsatz / Ø Lagerbestand
                      </p>
                      <p className="text-[10px] text-slate-500 leading-tight">
                        Zeigt, wie oft der durchschnittliche Lagerbestand pro Jahr verbraucht oder verkauft wird. Extrem hohe Werte deuten auf Lieferengpässe hin.
                      </p>
                    </div>
                  )}
                </div>
                <div className="relative group cursor-pointer" onClick={() => setShowInventoryDaysInfo(!showInventoryDaysInfo)}>
                  <KPICard
                    title="Lagerdauer"
                    value={`${results.inventoryDays.toFixed(0)} Tage`}
                    status={getKPIColor.inventoryDays(results.inventoryDays)}
                    description={
                      getKPIColor.inventoryDays(results.inventoryDays) === 'alert' ? 'Zu kurz (Risiko!)' :
                        getKPIColor.inventoryDays(results.inventoryDays) === 'good' ? 'Effizient' :
                          getKPIColor.inventoryDays(results.inventoryDays) === 'neutral' ? 'OK' : 'Sehr lang'
                    }
                  />
                  {showInventoryDaysInfo && (
                    <div className="absolute left-0 bottom-full mb-2 w-64 p-3 bg-white rounded-lg shadow-xl border border-slate-200 z-50 animate-in fade-in slide-in-from-bottom-2">
                      <h4 className="font-bold text-slate-800 text-xs mb-1">Erklärung</h4>
                      <p className="text-xs text-slate-600 leading-snug mb-2">
                        Lagerdauer = <br /> 360 / Lagerumschlag
                      </p>
                      <p className="text-[10px] text-slate-500 leading-tight">
                        Gibt an, wie viele Tage das Kapital durchschnittlich im Lager gebunden ist, bevor es wieder zu Umsatz wird.
                      </p>
                    </div>
                  )}
                </div>
                <div className="relative group cursor-pointer" onClick={() => setShowROIInfo(!showROIInfo)}>
                  <KPICard
                    title="ROI"
                    value={`${results.roi.toFixed(1)} %`}
                    status={getKPIColor.roi(results.roi)}
                    description={getKPIColor.roi(results.roi) === 'good' ? 'Stark' : getKPIColor.roi(results.roi) === 'neutral' ? 'Solid' : 'Schwach'}
                  />
                  {showROIInfo && (
                    <div className="absolute right-0 bottom-full mb-2 w-64 p-3 bg-white rounded-lg shadow-xl border border-slate-200 z-50 animate-in fade-in slide-in-from-bottom-2">
                      <h4 className="font-bold text-slate-800 text-xs mb-1">Erklärung</h4>
                      <p className="text-xs text-slate-600 leading-snug mb-2">
                        ROI = <br /> (Gewinn / Gesamtkapital) × 100
                      </p>
                      <p className="text-[10px] text-slate-500 leading-tight">
                        Return on Investment. Zeigt die Verzinsung des gesamten im Unternehmen eingesetzten Kapitals.
                      </p>
                    </div>
                  )}
                </div>
              </div>


              {/* Section 2: Kapitalstruktur Breakdown (Total Funding View) */}
              <h3 className="text-sm uppercase tracking-wider text-slate-500 font-bold mb-2 mt-4 flex items-center gap-2">
                <PieChart size={16} /> Kapitalstruktur (Finanzierung)
              </h3>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                {(() => {
                  // Model: Dynamic Base (60% of Revenue) + 1x Profit
                  // Bound = Fixed + WC
                  // Cash = (60% Revenue + 1*Profit) - Bound
                  const BASE_POOL = inputs.annualRevenue * 0.6;
                  const TOTAL_AVAILABLE = BASE_POOL + results.profit;

                  // Scaling: Use TOTAL_AVAILABLE as the 100% width base?
                  // Or max(TOTAL_AVAILABLE, Bound) to handle overflow?
                  const maxScale = Math.max(TOTAL_AVAILABLE, results.totalCapital);

                  const fixedPct = (inputs.fixedAssets / maxScale) * 100;
                  // WC consists of Inventory + WIP (no payables deduction anymore, assumed 0)
                  const wcPct = (results.workingCapital / maxScale) * 100;

                  const cashPct = (results.cash > 0) ? (results.cash / maxScale) * 100 : 0;
                  const overdraftPct = (results.cash < 0) ? (Math.abs(results.cash) / maxScale) * 100 : 0;

                  return (
                    <div className="flex h-12 w-full rounded-lg overflow-hidden mb-2 bg-slate-200 relative">
                      {/* Segment 1: Fixed Assets (Bound) - Orange/Red */}
                      <div
                        className="bg-orange-800 flex items-center justify-center text-white text-xs font-bold transition-all duration-500 overflow-hidden whitespace-nowrap px-1"
                        style={{ width: `${fixedPct}%` }}
                      >
                        {fixedPct > 15 && 'Anlagevermögen'}
                      </div>

                      {/* Segment 2: Working Capital (Bound) - Amber/Orange */}
                      <div
                        className="bg-orange-400 flex items-center justify-center text-white text-xs font-bold transition-all duration-500 overflow-hidden whitespace-nowrap px-1"
                        style={{ width: `${wcPct}%` }}
                      >
                        {wcPct > 15 && 'Umlaufvermögen'}
                      </div>

                      {/* Segment 3: Cash (Free) */}
                      {results.cash > 0 && (
                        <div
                          className="bg-emerald-500 flex items-center justify-center text-white text-xs font-bold transition-all duration-500 overflow-hidden whitespace-nowrap px-1"
                          style={{ width: `${cashPct}%` }}
                        >
                          {cashPct > 5 && 'Cash'}
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div className="flex justify-between text-xs text-slate-500 font-medium px-1 mt-2">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-700">Gebundenes Kapital: {formatCurrency(results.totalCapital)}</span>
                    <span className="text-[10px] opacity-75">Anlagen + Lager + WIP</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`font-bold ${results.cash < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {results.cash < 0 ? 'Fehlbetrag: ' : 'Verfügbares Cash: '}
                      {formatCurrency(results.cash)}
                    </span>
                    <span className="text-[10px] opacity-75">
                      Basis: {formatCurrency((inputs.annualRevenue * 0.6) + results.profit)} (60% Umsatz + Gewinn)
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 3: Weitere Details (wieder eingefügt) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
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

            {/* Presets - Moved here from footer */}
            <div className="mt-2 pt-4 border-t border-slate-200">
              <div className="flex items-center gap-4 mb-2">
                <span className="text-sm font-semibold text-slate-500 shrink-0">Szenario wählen:</span>
                <div className="flex gap-2 w-full overflow-x-auto pb-2 scrollbar-thin">
                  {INDUSTRY_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => setInputs(preset.inputs)}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors border border-slate-300 flex flex-col items-start min-w-[130px] shrink-0 text-left"
                    >
                      <span className="font-bold text-slate-900 text-xs">{preset.label}</span>
                      <span className="text-[10px] opacity-70 truncate max-w-full">{preset.description}</span>
                    </button>
                  ))}
                  <button
                    onClick={() => setInputs(DEFAULT_INPUTS)}
                    className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-500 rounded-lg text-sm font-medium transition-colors border border-slate-200 shrink-0"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
