import { SimulatorInputs, SimulatorResults, KPIStatus } from "../types";

export const DEFAULT_INPUTS: SimulatorInputs = {
    annualRevenue: 3000000,
    cogsPercentage: 50,
    inventoryValue: 600000,
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

    // 4. Umlaufvermögen (Lager + Forderungen)
    const currentAssets = inventoryValue + receivables;

    // 5. Working Capital
    const workingCapital = currentAssets - payables;

    // 6. Gesamtkapital
    const totalCapital = fixedAssets + workingCapital;

    // 7. Base Profit
    const profit = annualRevenue * (profitMargin / 100);

    // --- KPIs Calculations (Order matters for dependency) ---

    // 1. Lagerumschlag
    const inventoryTurnover = inventoryValue > 0 ? cogs / inventoryValue : 0;

    // 2. Lagerdauer
    const inventoryDays = inventoryTurnover > 0 ? 360 / inventoryTurnover : 0;

    // 3. Capital Turnover
    const capitalTurnover = totalCapital > 0 ? annualRevenue / totalCapital : 0;

    // 4. Working Capital Days
    const dailyRevenue = annualRevenue / 360;
    const workingCapitalDays = dailyRevenue > 0 ? workingCapital / dailyRevenue : 0;

    // --- New KPIs (User Request 8) ---
    // Cash-to-Cash Cycle = Inventory Days + Receivables Days - Payables Days
    const cashToCashCycle = inventoryDays + receivablesDays - payablesDays;

    // Receivables Turnover = Revenue / Receivables (or 360 / Days)
    const receivablesTurnover = receivables > 0 ? annualRevenue / receivables : 0;
    // Payables Turnover = COGS / Payables (or 360 / Days)
    const payablesTurnover = payables > 0 ? cogs / payables : 0;


    // --- Risk & Logic Adjustments for "Low Stock" ---
    // User Requirement: 
    // - Clear negative effects of low stock (Costs, Flexibility)
    // - Harder to find "optimal mix"

    let riskLabel: 'low' | 'medium' | 'high' = 'low';
    let riskMessage = '';

    let adjustedProfit = profit;

    // Risk Logic: High Inventory Turnover (> 10) OR Low Value (< 10% of COGS or fixed threshold)
    if (inventoryTurnover > 10 || (cogs > 0 && inventoryValue < cogs * 0.05)) {
        // Critical: High Supplier Costs penalty (e.g. +5% COGS effectively)
        const penalty = cogs * 0.05;
        adjustedProfit -= penalty;
        riskLabel = 'high';
        riskMessage = "Warnung: Lagerbestand kritisch niedrig! Hohe Lieferantenkosten (Sonderfahrten) und Produktionsausfälle senken den Gewinn.";
    } else if (inventoryTurnover > 6) {
        // Warning: Flexibility issues
        // Minor penalty? Or just visual warning?
        // Let's add slight cost penalty for "rush orders"
        const penalty = cogs * 0.01;
        adjustedProfit -= penalty;
        riskLabel = 'medium';
        riskMessage = "Achtung: Geringer Puffer. Flexibilität eingeschränkt, leicht erhöhte Beschaffungskosten.";
    }

    // 5. ROI (Adjusted with penalty)
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
        riskMessage
    };
}

export const getKPIColor = {
    capitalTurnover: (val: number): KPIStatus => {
        if (val >= 2.0) return 'good';
        if (val >= 1.0) return 'neutral';
        return 'critical';
    },
    inventoryTurnover: (val: number): KPIStatus => {
        // Modified Logic: Too high turnover is now "Risk"!
        // 6-10: Green (Efficient but safe)
        // 3-6: Yellow (Bit slow, capital bound)
        // <3: Red (Dead capital)
        // >10: Red (Risk of stockout!)
        if (val > 10) return 'alert';
        if (val >= 6) return 'good';
        if (val >= 3) return 'neutral';
        return 'critical';
    },
    inventoryDays: (val: number): KPIStatus => {
        if (val <= 10 && val > 0) return 'alert'; // < 10 days stock is risky
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
    // New KPIs Colors
    cashToCashCycle: (val: number): KPIStatus => {
        if (val < 0) return 'good'; // Negative is usually good (supplier financed)
        if (val < 45) return 'good';
        if (val < 90) return 'neutral';
        return 'critical';
    }
};

export const INDUSTRY_PRESETS: { label: string; description: string; inputs: SimulatorInputs }[] = [
    {
        label: "Handelsbetrieb",
        description: "Hoher Warenumschlag, geringe Anlagen, schlanke Struktur.",
        inputs: {
            annualRevenue: 10000000, // Higher volume
            cogsPercentage: 75, // Lower margin trade
            inventoryValue: 800000, // Fast turnover (~9.3)
            receivablesDays: 20, // B2C/B2B Mix
            payablesDays: 45, // Power over suppliers
            fixedAssets: 500000, // Warehouse/IT
            profitMargin: 3, // Thin margin
        }
    },
    {
        label: "Serienfertiger",
        description: "Skaleneffekte, hohe Anlagenintensität, aber effizient.",
        inputs: {
            annualRevenue: 25000000, // High Volume (Scale)
            cogsPercentage: 60,
            inventoryValue: 3000000, // Turnover ~5 (Buffer)
            receivablesDays: 30, // Standard
            payablesDays: 30,
            fixedAssets: 8000000, // Heavy Machinery
            profitMargin: 9, // Efficiency gains -> Good Profit
        }
    },
    {
        label: "Projektfertiger",
        description: "Hohe Komplexität, lange Bindung in unfertigen Erzeugnissen (WIP).",
        inputs: {
            annualRevenue: 8000000, // Lower volume (Custom)
            cogsPercentage: 55,
            inventoryValue: 3500000, // Very High WIP -> low turnover
            receivablesDays: 60, // Milestone payments slow
            payablesDays: 20, // Suppliers want fast pay
            fixedAssets: 2000000, // Workshop/Engineering
            profitMargin: 11, // Higher margin, but eaten by capital cost
        }
    }
];
