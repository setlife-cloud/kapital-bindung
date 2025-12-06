export interface SimulatorInputs {
    annualRevenue: number;
    cogsPercentage: number; // 0-100
    inventoryValue: number;
    receivablesDays: number;
    payablesDays: number;
    fixedAssets: number;
    profitMargin: number; // 0-100
}

export interface SimulatorResults {
    // Intermediate
    cogs: number; // Wareneinsatz
    receivables: number; // Forderungen
    payables: number; // Verbindlichkeiten (Lieferantenschulden)
    currentAssets: number; // Umlaufvermögen (Lager + Forderungen)
    workingCapital: number;
    totalCapital: number;
    profit: number; // Gewinn (absolute)

    // KPIs
    capitalTurnover: number; // Kapitalumschlag
    inventoryTurnover: number; // Lagerumschlag
    inventoryDays: number; // Lagerdauer
    roi: number; // Return on Investment
    workingCapitalDays: number; // Working Capital in Tagen
}

export type KPIStatus = 'good' | 'neutral' | 'critical' | 'alert'; // alert for negative WC or similar edge cases
