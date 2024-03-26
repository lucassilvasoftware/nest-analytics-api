import { SheetService } from './sheet.service';
export declare class SheetController {
    private sheetService;
    constructor(sheetService: SheetService);
    uploadAndProcessFile(file: any): Promise<any>;
}
