"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SheetService = void 0;
const common_1 = require("@nestjs/common");
const XLSX = require("xlsx");
const date_fns_1 = require("date-fns");
let SheetService = class SheetService {
    async processSheetData(fileBuffer) {
        const data = this.readSheetData(fileBuffer);
        const mrr = this.calculateMRR(data);
        const churnRate = this.calculateChurnRate(data);
        const ltv = this.calculateLTV(data, mrr, churnRate);
        const averageSubscriptionLength = this.calculateAverageSubscriptionLength(data);
        const activeUsers = this.countActiveUsers(data);
        const newUsersByMonth = this.calculateNewUsersByMonth(data);
        const mrrByMonth = this.calculateMRRByMonth(data);
        const churnByMonth = this.calculateChurnRateByMonth(data);
        const usersByMonth = this.calculateActivesByMonth(data);
        return {
            churnRate: (churnRate * 100).toFixed(2) + '%',
            ltv: ltv.toFixed(2),
            averageSubscriptionLength: `${averageSubscriptionLength}`,
            activeUsers: activeUsers,
            newUsersByMonth: newUsersByMonth,
            mrrByMonth: mrrByMonth,
            churnByMonth: churnByMonth,
            usersByMonth: usersByMonth
        };
    }
    normalizeKey(key) {
        return key
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .split(' ')
            .map((word, index) => index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1))
            .join('');
    }
    calculateMRRByMonth(data) {
        let dataMonths = [
            "01-2022", "02-2022", "03-2022", "04-2022", "05-2022", "06-2022",
            "07-2022", "08-2022", "09-2022", "10-2022", "11-2022", "12-2022",
            "01-2023", "02-2023", "03-2023", "04-2023", "05-2023", "06-2023",
            "07-2023", "08-2023", "09-2023"
        ];
        let dataMonthsObject = {};
        dataMonths.forEach(monthYear => {
            dataMonthsObject[monthYear] = 0;
        });
        data.forEach(entry => {
            const endDate = entry.dataCancelamento ? new Date(entry.dataCancelamento) : new Date('2023-09-30T00:00:00.000Z');
            const monthYearCancel = (0, date_fns_1.format)(endDate, 'MM-yyyy');
            if (entry.status === 'Ativa' || entry.status === 'Upgrade') {
                Object.keys(dataMonthsObject).forEach(month => {
                    dataMonthsObject[month] += entry.valor;
                });
            }
            else {
                Object.keys(dataMonthsObject).forEach(month => {
                    const comparisonResult = this.compareMonthYear(month, monthYearCancel);
                    if (comparisonResult < 0) {
                        dataMonthsObject[month] += entry.valor;
                    }
                });
            }
        });
        Object.keys(dataMonthsObject).forEach(month => {
            dataMonthsObject[month] = dataMonthsObject[month].toFixed(2);
        });
        return dataMonthsObject;
    }
    calculateActivesByMonth(data) {
        let dataMonths = [
            "01-2022", "02-2022", "03-2022", "04-2022", "05-2022", "06-2022",
            "07-2022", "08-2022", "09-2022", "10-2022", "11-2022", "12-2022",
            "01-2023", "02-2023", "03-2023", "04-2023", "05-2023", "06-2023",
            "07-2023", "08-2023", "09-2023", "10-2023", "11-2023", "12-2023"
        ];
        let dataMonthsObject = {};
        dataMonths.forEach(monthYear => {
            dataMonthsObject[monthYear] = 0;
        });
        data.forEach(entry => {
            const endDate = entry.dataCancelamento ? new Date(entry.dataCancelamento) : new Date('2023-09-30T00:00:00.000Z');
            const monthYearCancel = (0, date_fns_1.format)(endDate, 'MM-yyyy');
            if (entry.status === 'Ativa' || entry.status === 'Upgrade') {
                Object.keys(dataMonthsObject).forEach(month => {
                    dataMonthsObject[month] += 1;
                });
            }
            else {
                Object.keys(dataMonthsObject).forEach(month => {
                    const comparisonResult = this.compareMonthYear(month, monthYearCancel);
                    if (comparisonResult < 0) {
                        dataMonthsObject[month] += 1;
                    }
                });
            }
        });
        Object.keys(dataMonthsObject).forEach(month => {
            dataMonthsObject[month] = dataMonthsObject[month];
        });
        return dataMonthsObject;
    }
    compareMonthYear(monthYear1, monthYear2) {
        const parts1 = monthYear1.split('-');
        const month1 = parseInt(parts1[0], 10);
        const year1 = parseInt(parts1[1], 10);
        const parts2 = monthYear2.split('-');
        const month2 = parseInt(parts2[0], 10);
        const year2 = parseInt(parts2[1], 10);
        if (year1 < year2)
            return -1;
        if (year1 > year2)
            return 1;
        if (month1 < month2)
            return -1;
        if (month1 > month2)
            return 1;
        return 0;
    }
    calculateChurnRateByMonth(data) {
        const churnByMonth = {};
        const activeAtStart = {};
        data.forEach(entry => {
            if (entry.dataInicio) {
                const date = new Date(entry.dataInicio);
                const monthYear = `${date.getMonth() + 1}-${date.getFullYear()}`;
                activeAtStart[monthYear] = (activeAtStart[monthYear] || 0) + 1;
            }
        });
        data.forEach(entry => {
            if (entry.status === 'Cancelada' && entry.dataStatus) {
                const date = new Date(entry.dataStatus);
                const monthYear = `${date.getMonth() + 1}-${date.getFullYear()}`;
                churnByMonth[monthYear] = (churnByMonth[monthYear] || 0) + 1;
            }
        });
        const churnRateByMonth = {};
        Object.keys(churnByMonth).forEach(monthYear => {
            const churnRate = (churnByMonth[monthYear] / (activeAtStart[monthYear] || 1)) * 100;
            churnRateByMonth[monthYear] = churnRate.toFixed(2) + '%';
        });
        return churnRateByMonth;
    }
    calculateNewUsersByMonth(data) {
        let newUserCountsByMonth = {};
        data.forEach(entry => {
            if (entry.dataInicio) {
                const startDate = new Date(entry.dataInicio);
                const month = (startDate.getMonth() + 1).toString().padStart(2, '0');
                const year = startDate.getFullYear();
                const monthYear = `${month}-${year}`;
                if (!newUserCountsByMonth[monthYear]) {
                    newUserCountsByMonth[monthYear] = 0;
                }
                newUserCountsByMonth[monthYear] += 1;
            }
        });
        return newUserCountsByMonth;
    }
    transformKeysToCamelCaseWithoutAccents(obj) {
        const newObj = {};
        Object.entries(obj).forEach(([key, value]) => {
            const normalizedKey = this.normalizeKey(key);
            newObj[normalizedKey] = value;
        });
        return newObj;
    }
    readSheetData(fileBuffer) {
        const workbook = XLSX.read(fileBuffer);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        let jsonData = XLSX.utils.sheet_to_json(sheet, { raw: false });
        jsonData = jsonData.map(obj => {
            const transformedObj = this.transformKeysToCamelCaseWithoutAccents(obj);
            if (transformedObj.quantidadeCobrancas !== undefined) {
                transformedObj.quantidadeCobrancas = parseInt(transformedObj.quantidadeCobrancas, 10);
            }
            if (transformedObj.valor !== undefined) {
                transformedObj.valor = parseFloat(transformedObj.valor);
            }
            return transformedObj;
        });
        return jsonData;
    }
    calculateMRR(data) {
        return data
            .filter(entry => entry.status === 'Ativa' && entry.valor)
            .reduce((sum, { valor }) => sum + parseFloat(valor.toString()), 0);
    }
    calculateChurnRate(data) {
        const totalCustomers = data.length;
        const churnedCustomers = data.filter(({ status }) => status === 'Cancelada').length;
        return totalCustomers ? churnedCustomers / totalCustomers : 0;
    }
    calculateLTV(data, mrr, churnRate) {
        if (churnRate === 0)
            return 0;
        const averageRevenuePerUser = mrr / this.countActiveUsers(data);
        return averageRevenuePerUser / churnRate;
    }
    calculateAverageSubscriptionLength(data) {
        let totalDays = 0;
        let count = 0;
        data.forEach(entry => {
            if (entry.status === 'Ativa') {
                const startDate = new Date(entry.dataInicio);
                const endDate = entry.dataCancelamento ? new Date(entry.dataCancelamento) : new Date();
                if (startDate <= endDate) {
                    totalDays += (0, date_fns_1.differenceInCalendarDays)(endDate, startDate);
                }
                count++;
            }
        });
        if (count === 0)
            return "0 dias";
        const averageDays = totalDays / count;
        return `${averageDays.toFixed(0)} dias`;
    }
    countActiveUsers(data) {
        return data.filter(({ status }) => status === 'Ativa').length + 1;
    }
};
exports.SheetService = SheetService;
exports.SheetService = SheetService = __decorate([
    (0, common_1.Injectable)()
], SheetService);
//# sourceMappingURL=sheet.service.js.map