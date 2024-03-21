import { Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';

interface SheetEntry {
    status: string;
    'data cancelamento'?: string;
    valor?: number;
}

@Injectable()
export class SheetService {
    async processSheetData(fileBuffer: Buffer): Promise<any> {
        try {
            const data = this.readSheetData(fileBuffer);

            const churnRate = this.calculateChurn(data);
            const mrr = this.calculateMRR(data).toFixed(2);
            const activeUsers = this.activeUsers(data);

            return [mrr, churnRate, activeUsers];
        } catch (error) {
            console.error('Error processing uploaded file:', error);
            throw new Error('Error processing uploaded file');
        }
    }

    private readSheetData(fileBuffer: Buffer): SheetEntry[] {
        const workbook = XLSX.read(fileBuffer);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        return XLSX.utils.sheet_to_json<SheetEntry>(sheet);
    }

    private calculateMRR(data: SheetEntry[]): number {
        let totalClientesPagantes = 0;
        let receitaTotal = 0;

        for (const entry of data) {
            if (entry.status === 'Ativa') {
                totalClientesPagantes++;
                receitaTotal += entry.valor || 0;
            }
        }

        const ARPU = receitaTotal / totalClientesPagantes;
        const MRR = ARPU * totalClientesPagantes;

        return MRR;
    }

    private activeUsers(data: SheetEntry[]): number {
        return data.filter(entry => entry.status === 'Ativa').length;
    }

    private calculateChurn(data: SheetEntry[]): { [monthYear: string]: number } {
        const churnByMonth: { [monthYear: string]: number } = {};

        for (const entry of data) {
            const status = entry.status;
            const cancelDate = entry['data cancelamento'];

            if (status === 'Cancelada' && cancelDate) {
                const cancelDateObj = new Date(cancelDate);
                const monthYear = `${cancelDateObj.getFullYear()}-${(
                    cancelDateObj.getMonth() + 1
                ).toString().padStart(2, '0')}`;

                if (churnByMonth[monthYear]) {
                    churnByMonth[monthYear]++;
                } else {
                    churnByMonth[monthYear] = 1;
                }
            }
        }

        return churnByMonth;
    }

}
