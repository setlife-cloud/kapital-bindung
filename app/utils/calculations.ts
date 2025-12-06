import { SimulatorInputs, SimulatorResults, KPIStatus } from "../types";

export const DEFAULT_INPUTS: SimulatorInputs = {
    annualRevenue: 3000000,
    cogsPercentage: 50,
    inventoryValue: 600000,
    wip: 200000,
    receivablesDays: 30,
    payablesDays: 20,
    fixedAssets: 2000000,
    profitMargin: 8,
};

export function calculateResults(inputs: SimulatorInputs): SimulatorResults {
    const {
        annualRevenue,
        cogsPercentage,
        inventoryValue,
        wip,
        receivablesDays,
        payablesDays,
        fixedAssets,
        profitMargin,
    } = inputs;

    // 1. Wareneinsatz (COGS)
    const cogs = annualRevenue * (cogsPercentage / 100);

    // 2. Durchschnittlicher Forderungsbestand
    const receivables = (annualRevenue / 360) * receivablesDays;

    // 3. Durchschnittlicher Lieferantenkredit (Verbindlichkeiten)
    const payables = (cogs / 360) * payablesDays;

    // 4. Umlaufvermögen (Lager + WIP + Folgerungen)
    const currentAssets = inventoryValue + wip + receivables;

    // 5. Working Capital (Umlaufvermögen - Verbindlichkeiten)
    const workingCapital = currentAssets - payables;

    // 6. Gesamtkapital
    const totalCapital = fixedAssets + workingCapital;

    // 7. Base Profit
    const profit = annualRevenue * (profitMargin / 100);

    // 8. Cash / Liquidität (Total Budget Model)
    // User requested: Higher profit -> Higher available cash.
    const TOTAL_LIQUIDITY_POOL = 12000000; // 12 Mio € Base Funding
    const cash = (TOTAL_LIQUIDITY_POOL + profit) - totalCapital;

    // --- KPIs Calculations ---

    // 1. Lagerumschlag
    const inventoryTurnover = inventoryValue > 0 ? cogs / inventoryValue : 0;

    // 2. Lagerdauer
    const inventoryDays = inventoryTurnover > 0 ? 360 / inventoryTurnover : 0;

    // 3. Capital Turnover
    const capitalTurnover = totalCapital > 0 ? annualRevenue / totalCapital : 0;

    // 4. Working Capital Days
    const dailyRevenue = annualRevenue / 360;
    const workingCapitalDays = dailyRevenue > 0 ? workingCapital / dailyRevenue : 0;

    // Levers
    const receivablesTurnover = receivables > 0 ? annualRevenue / receivables : 0;
    const payablesTurnover = payables > 0 ? cogs / payables : 0;
    const cashToCashCycle = inventoryDays + receivablesDays - payablesDays;


    // --- Risk & Logic Adjustments ---
    let riskLabel: 'low' | 'medium' | 'high' = 'low';
    let riskMessage = '';

    let adjustedProfit = profit;

    // Risk Logic
    if (inventoryTurnover > 10 || (cogs > 0 && inventoryValue < cogs * 0.05)) {
        const penalty = cogs * 0.05;
        adjustedProfit -= penalty;
        riskLabel = 'high';
        riskMessage = "Warnung: Lagerbestand kritisch niedrig! Hohe Lieferantenkosten und Produktionsausfälle senken den Gewinn.";
    } else if (inventoryTurnover > 6) {
        const penalty = cogs * 0.01;
        adjustedProfit -= penalty;
        riskLabel = 'medium';
        riskMessage = "Achtung: Geringer Puffer. Flexibilität eingeschränkt, leicht erhöhte Beschaffungskosten.";
    }

    const roi = totalCapital > 0 ? (adjustedProfit / totalCapital) * 100 : 0;

    return {
        cogs,
        receivables,
        payables,
        currentAssets,
        workingCapital,
        totalCapital,
        profit: adjustedProfit,
        capitalTurnover,
        inventoryTurnover,
        inventoryDays,
        roi,
        workingCapitalDays,
        cashToCashCycle,
        receivablesTurnover,
        payablesTurnover,
        riskLabel,
        riskMessage,
        cash
    };
}

export const getKPIColor = {
    capitalTurnover: (val: number): KPIStatus => {
        if (val >= 2.0) return 'good';
        if (val >= 1.0) return 'neutral';
        return 'critical';
    },
    inventoryTurnover: (val: number): KPIStatus => {
        if (val > 10) return 'alert';
        if (val >= 6) return 'good';
        if (val >= 3) return 'neutral';
        return 'critical';
    },
    inventoryDays: (val: number): KPIStatus => {
        if (val <= 10 && val > 0) return 'alert';
        if (val <= 45 && val > 0) return 'good';
        if (val <= 90 && val > 0) return 'neutral';
        return 'critical';
    },
    roi: (val: number): KPIStatus => {
        if (val >= 15) return 'good';
        if (val >= 8) return 'neutral';
        return 'critical';
    },
    workingCapitalDays: (val: number): KPIStatus => {
        if (val > 120) return 'critical';
        if (val > 60) return 'neutral';
        if (val >= 0) return 'good';
        return 'alert';
    },
    cashToCashCycle: (val: number): KPIStatus => {
        if (val < 0) return 'good';
        if (val < 45) return 'good';
        if (val < 90) return 'neutral';
        return 'critical';
    }
};

export const INDUSTRY_PRESETS: { label: string; description: string; inputs: SimulatorInputs }[] = [
    {
        label: "Handelsbetrieb",
        description: "Hoher Warenumschlag, geringe Anlagen.",
        inputs: {
            annualRevenue: 5000000,
            cogsPercentage: 70,
            inventoryValue: 400000,
            wip: 0,
            receivablesDays: 14,
            payablesDays: 30,
            fixedAssets: 500000,
            profitMargin: 4,
        }
    },
    {
        label: "Serienfertiger",
        description: "Ausgewogene Struktur, mittlere Anlagen.",
        inputs: {
            annualRevenue: 12000000,
            cogsPercentage: 55,
            inventoryValue: 1500000,
            wip: 500000,
            receivablesDays: 30,
            payablesDays: 30,
            fixedAssets: 4000000,
            profitMargin: 8,
        }
    },
    {
        label: "Projektfertiger",
        description: "Hohes WIP, geringer Umschlag.",
        inputs: {
            annualRevenue: 8000000,
            cogsPercentage: 45,
            inventoryValue: 800000,
            wip: 2000000,
            receivablesDays: 60,
            payablesDays: 20,
            fixedAssets: 1500000,
            profitMargin: 6,
        }
    }
];
