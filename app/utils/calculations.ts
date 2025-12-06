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
    // forderungen = umsatz / 360 * debitorentage
    const receivables = (annualRevenue / 360) * receivablesDays;

    // 3. Durchschnittlicher Lieferantenkredit (Verbindlichkeiten)
    // lieferantenschulden = wareneinsatz / 360 * kreditorentage
    const payables = (cogs / 360) * payablesDays;

    // 4. Umlaufvermögen (Lager + Forderungen)
    const currentAssets = inventoryValue + receivables;

    // 5. Working Capital
    const workingCapital = currentAssets - payables;

    // 6. Gesamtkapital
    // gesamtkapital = anlagevermoegen + working_capital
    // Fallback: if working capital is negative, do we subtract it? Specs say:
    // "Falls working_capital < 0 -> mindestens 0 setzen oder explizit 'negatives WC' zeigen."
    // For the calculation of Total Capital, usually Fixed + WC is correct even if WC is negative (means funded by payables).
    // However, specs say "mindestens 0 setzen" implies for Total Capital calculation purposes maybe?
    // Let's stick to strict addition first, but specs hint at "mindestens 0".
    // Let's assume Total Capital = Fixed + Max(0, WC) for denominator safety?
    // Actually, standard BWL: Total Capital = Fixed Assets + Current Assets ( Gross) ? Or Net?
    // Specs say: `gesamtkapital = anlagevermoegen + working_capital`.
    // If WC is negative, financing reduces capital need.
    // Warning: If Total Capital becomes <= 0, we have division by zero risk.
    const totalCapital = fixedAssets + workingCapital;

    // 7. Gewinn
    const profit = annualRevenue * (profitMargin / 100);

    // --- KPIs ---

    // 1. Kapitalumschlag
    // kapitalumschlag = umsatz / gesamtkapital
    const capitalTurnover = totalCapital > 0 ? annualRevenue / totalCapital : 0;

    // 2. Lagerumschlag
    // lagerumschlag = wareneinsatz / lagerbestand
    const inventoryTurnover = inventoryValue > 0 ? cogs / inventoryValue : 0;

    // 3. Lagerdauer
    // lagerdauer = 360 / lagerumschlag
    const inventoryDays = inventoryTurnover > 0 ? 360 / inventoryTurnover : 0;

    // 4. ROI
    // roi = gewinn / gesamtkapital
    const roi = totalCapital > 0 ? (profit / totalCapital) * 100 : 0;

    // 5. Working Capital in Tagen
    // working_capital_tage = working_capital / (umsatz / 360)
    const dailyRevenue = annualRevenue / 360;
    const workingCapitalDays = dailyRevenue > 0 ? workingCapital / dailyRevenue : 0;

    return {
        cogs,
        receivables,
        payables,
        currentAssets,
        workingCapital,
        totalCapital,
        profit,
        capitalTurnover,
        inventoryTurnover,
        inventoryDays,
        roi,
        workingCapitalDays,
    };
}

export const getKPIColor = {
    capitalTurnover: (val: number): KPIStatus => {
        if (val >= 2.0) return 'good';
        if (val >= 1.0) return 'neutral';
        return 'critical';
    },
    inventoryTurnover: (val: number): KPIStatus => {
        if (val >= 6) return 'good';
        if (val >= 3) return 'neutral';
        return 'critical';
    },
    inventoryDays: (val: number): KPIStatus => {
        if (val <= 45 && val > 0) return 'good';
        if (val <= 90 && val > 0) return 'neutral';
        return 'critical'; // > 90 or 0 (bad?) usually 0 inventory means 0 days which is good? logic adjustment: 0 turnover = 0 days in code, but actually infinite days if stock exists?
        // If inventoryValue > 0 and turnover 0 -> days infinite. Implementation returns 0.
        // Let's assume if inventory > 0, days is high.
        // For now stick to return value.
    },
    roi: (val: number): KPIStatus => {
        if (val >= 15) return 'good';
        if (val >= 8) return 'neutral';
        return 'critical';
    },
    workingCapitalDays: (val: number): KPIStatus => {
        // Green: 0-60, Yellow: 60-120, Red: >120
        // Also Red/Alert if very negative?
        if (val > 120) return 'critical';
        if (val > 60) return 'neutral';
        if (val >= 0) return 'good';
        return 'alert'; // Negative WC
    }
};
