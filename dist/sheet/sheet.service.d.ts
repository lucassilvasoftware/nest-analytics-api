/// <reference types="node" />
interface SheetEntry {
    status: string;
    dataCancelamento?: string;
    valor?: number;
    dataInicio?: string;
    dataStatus?: string;
}
export declare class SheetService {
    processSheetData(fileBuffer: Buffer): Promise<any>;
    private normalizeKey;
    calculateMRRByMonth(data: SheetEntry[]): {
        [key: string]: number;
    };
    calculateActivesByMonth(data: SheetEntry[]): {
        [key: string]: number;
    };
    compareMonthYear(monthYear1: any, monthYear2: any): 0 | 1 | -1;
    calculateChurnRateByMonth(data: SheetEntry[]): {
        [key: string]: string;
    };
    calculateNewUsersByMonth(data: any): {};
    private transformKeysToCamelCaseWithoutAccents;
    readSheetData(fileBuffer: Buffer): SheetEntry[];
    calculateMRR(data: SheetEntry[]): number;
    calculateChurnRate(data: SheetEntry[]): number;
    calculateLTV(data: SheetEntry[], mrr: number, churnRate: number): number;
    calculateAverageSubscriptionLength(data: SheetEntry[]): string;
    countActiveUsers(data: SheetEntry[]): number;
}
export {};
