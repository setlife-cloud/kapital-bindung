export interface SimulatorInputs {
    annualRevenue: number;
    cogsPercentage: number; // 0-100
    inventoryValue: number;
    wip: number; // Unfertige Erzeugnisse
    receivablesDays: number; // Forderungslaufzeit
    payablesDays: number; // Verbindlichkeitenlaufzeit
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
    cash: number; // Freie Liquidität

    // KPIs
    capitalTurnover: number; // Kapitalumschlag
    inventoryTurnover: number; // Lagerumschlag
    inventoryDays: number; // Lagerdauer
    roi: number; // Return on Investment
    workingCapitalDays: number; // Working Capital in Tagen
    cashToCashCycle: number; // Cash-to-Cash Cycle
    receivablesTurnover: number; // Debitorenumschlag
    payablesTurnover: number; // Kreditorenumschlag
    riskLabel?: 'low' | 'medium' | 'high';
    riskMessage?: string;
}

export type KPIStatus = 'good' | 'neutral' | 'critical' | 'alert'; // alert for negative WC or risk
