import { Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';

interface SheetEntry {
    status: string;
    dataCancelamento?: string;
    valor?: number;
    dataInicio?: Date;
    dataStatus?: Date;
}

@Injectable()
export class SheetService {
    async processSheetData(fileBuffer: Buffer): Promise<any> {
        try {
            const data = this.readSheetData(fileBuffer);

            const churnRate = this.calculateChurnByMonth(data);
            const ltv = this.calculateLTV(data).toFixed(2);
            const mrr = this.calculateMRR(data).toFixed(2);
            const averageSL = this.calculateAverageSubscriptionLength(data);
            const activeUsers = this.activeUsers(data);

            // Objeto JSON com as chaves e valores desejados
            const result = {
                mrr: mrr,
                churnRate: churnRate,
                ltv: ltv,
                averageSubscriptionLength: averageSL + " dias",
                activeUsers: activeUsers
            };

            return result;
        } catch (error) {
            throw new Error('Erro ao processar o arquivo enviado. Por favor, verifique se o formato do arquivo está correto e tente novamente.');
        }
    }


    readSheetData(fileBuffer: Buffer): SheetEntry[] {
        try {
            const workbook = XLSX.read(fileBuffer);
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(sheet) as any[];

            const removeAccents = (str: string) => {
                return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            };

            const parseDate = (value: string | number) => {
                if (typeof value === 'string') {
                    // Verifica se o valor é uma string no formato de data/hora
                    const dateRegex = /^\d{1,2}\/\d{1,2}\/\d{2,4} \d{1,2}:\d{1,2}$/;
                    if (dateRegex.test(value)) {
                        return new Date(value);
                    }
                } else if (typeof value === 'number') {
                    // Verifica se o valor é um número representando uma data serial do Excel
                    const referenceDate = new Date('1900-01-01');
                    const milliseconds = value * 24 * 60 * 60 * 1000;
                    return new Date(referenceDate.getTime() + milliseconds);
                }

                throw new Error('Formato de data inválido.');
            };


            const mappedData = jsonData.map(entry => {
                const mappedEntry: Partial<SheetEntry> = {};

                for (const key in entry) {
                    if (entry.hasOwnProperty(key)) {
                        let value = entry[key];
                        if (key.includes('data')) {
                            value = parseDate(value);
                        }
                        const newKey = removeAccents(key)
                            .split(' ')
                            .map((word, index) => index === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                            .join('');
                        mappedEntry[newKey] = value;
                    }
                }
                return mappedEntry as SheetEntry;
            });

            return mappedData;
        } catch (error) {
            throw new Error('Erro ao ler os dados da planilha. Certifique-se de que o arquivo enviado está no formato correto.');
        }
    }

    calculateMRR(data: SheetEntry[]): number {
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

    calculateAverageSubscriptionLength(data: SheetEntry[]): number {
        let totalDuration = 0;

        for (const entry of data) {
            if (entry.dataInicio) {
                const startDate = entry.dataInicio;
                const endDate = entry.dataCancelamento ? new Date(entry.dataCancelamento) : new Date(); // Se não houver data de cancelamento, usa a data atual
                const duration = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24); // Duração em dias
                totalDuration += duration;
            }
        }

        if (data.length === 0) {
            return 0; // Se não houver dados de assinatura, retorna 0 para evitar divisão por zero
        }

        const averageSubscriptionLength = Math.round(totalDuration / data.length); // Calcula a média do tempo de assinatura em dias
        return averageSubscriptionLength;
    }

    calculateLTV(data: SheetEntry[]): number {
        const totalRevenue = this.calculateTotalRevenue(data);
        const totalCustomers = this.calculateTotalCustomers(data);
        const churnRate = this.calculateChurnRate(data);

        const ARPU = totalRevenue / totalCustomers;
        const lifetime = 1 / churnRate;
        const LTV = ARPU * lifetime;

        return LTV;
    }

    calculateTotalRevenue(data: SheetEntry[]): number {
        let totalRevenue = 0;

        for (const entry of data) {
            if (entry.status === 'Ativa') {
                totalRevenue += entry.valor || 0;
            }
        }

        return totalRevenue;
    }

    calculateTotalCustomers(data: SheetEntry[]): number {
        let totalCustomers = 0;

        for (const entry of data) {
            if (entry.status === 'Ativa') {
                totalCustomers++;
            }
        }

        return totalCustomers;
    }

    calculateChurnRate(data: SheetEntry[]): number {
        let totalCustomers = 0;
        let churnedCustomers = 0;

        for (const entry of data) {
            if (entry.status === 'Cancelada' || entry.status === 'Trial cancelado') {
                churnedCustomers++;
            } else if (entry.status === 'Ativa') {
                totalCustomers++;
            }
        }

        const churnRate = churnedCustomers / totalCustomers;
        return churnRate;
    }

    activeUsers(data: SheetEntry[]): number {
        return data.filter(entry => entry.status === 'Ativa').length;
    }

    calculateChurnByMonth(data: SheetEntry[]): { [monthYear: string]: number } {
        const churnByMonth: { [monthYear: string]: number } = {};

        for (const entry of data) {
            const status = entry.status;
            const cancelDate = entry.dataCancelamento;

            if (status === 'Cancelada' && cancelDate || status === "Trial cancelado" && cancelDate) {
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
