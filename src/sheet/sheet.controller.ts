import { Controller, Get } from '@nestjs/common';
import { SheetService } from './sheet.service';

@Controller("sheets")
export class SheetController {
    constructor(private sheetService: SheetService) {}

    @Get("ping")
    getRoute() {
        return this.sheetService.sendSheet();
    }
}
