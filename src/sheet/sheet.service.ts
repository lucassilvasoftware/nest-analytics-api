import { Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { differenceInCalendarDays, parseISO } from 'date-fns';

interface SheetEntry {
    status: string;
    dataCancelamento?: string;
    valor?: number;
    dataInicio?: string;
    dataStatus?: string;
}

@Injectable()
export class SheetService {
    async processSheetData(fileBuffer: Buffer): Promise<any> {
        const data = this.readSheetData(fileBuffer);

        const mrr = this.calculateMRR(data);
        const churnRate = this.calculateChurnRate(data);
        const ltv = this.calculateLTV(data, mrr, churnRate);
        const averageSubscriptionLength = this.calculateAverageSubscriptionLength(data);
        const activeUsers = this.countActiveUsers(data);

        return {
            mrr: mrr.toFixed(2),
            churnRate: (churnRate * 100).toFixed(2) + '%',
            ltv: ltv.toFixed(2),
            averageSubscriptionLength: `${averageSubscriptionLength} days`,
            activeUsers: activeUsers,
        };
    }

    private normalizeKey(key: string): string {
        return key
            .normalize("NFD") 
            .replace(/[\u0300-\u036f]/g, "") 
            .toLowerCase() 
            .split(' ') 
            .map((word, index) =>
                index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1) 
            )
            .join(''); 
    }

    private transformKeysToCamelCaseWithoutAccents(obj: { [key: string]: any }): { [key: string]: any } {
        const newObj: { [key: string]: any } = {};

        Object.entries(obj).forEach(([key, value]) => {
            const normalizedKey = this.normalizeKey(key);
            newObj[normalizedKey] = value;
        });

        return newObj;
    }

    readSheetData(fileBuffer: Buffer): SheetEntry[] {
        const workbook = XLSX.read(fileBuffer);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        let jsonData = XLSX.utils.sheet_to_json(sheet, { raw: false }) as any[];

        jsonData = jsonData.map(this.transformKeysToCamelCaseWithoutAccents.bind(this));

        return jsonData as SheetEntry[];
    }
    calculateMRR(data: SheetEntry[]): number {
        return data
            .filter(entry => entry.status === 'Ativa' && entry.valor)
            .reduce((sum, { valor }) => sum + parseFloat(valor!.toString()), 0);
    }

    calculateChurnRate(data: SheetEntry[]): number {
        const totalCustomers = data.length;
        const churnedCustomers = data.filter(({ status }) => status === 'Cancelada').length;
        return totalCustomers ? churnedCustomers / totalCustomers : 0;
    }

    calculateLTV(data: SheetEntry[], mrr: number, churnRate: number): number {
        if (churnRate === 0) return 0;
        const averageRevenuePerUser = mrr / this.countActiveUsers(data);
        return averageRevenuePerUser / churnRate;
    }

    calculateAverageSubscriptionLength(data: SheetEntry[]): string {
        let totalDays = 0;
        let count = 0;

        data.forEach(entry => {
            if (entry.status === 'Ativa') {
                const startDate = new Date(entry.dataInicio);
                const endDate = entry.dataCancelamento ? new Date(entry.dataCancelamento) : new Date();

                if (startDate <= endDate) {
                    totalDays += differenceInCalendarDays(endDate, startDate);
                }

                count++;
            }
        });

        if (count === 0) return "0 days";

        const averageDays = totalDays / count;
        return `${averageDays.toFixed(0)} days`;
    }

    countActiveUsers(data: SheetEntry[]): number {
        return data.filter(({ status }) => status === 'Ativa').length;
    }
}
