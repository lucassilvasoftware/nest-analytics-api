import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SheetService } from './sheet.service';

@Controller('sheets')
export class SheetController {
    constructor(private sheetService: SheetService) { }

    @Post('send')
    @UseInterceptors(FileInterceptor('file'))
    async uploadAndProcessFile(@UploadedFile() file) {
        try {
            const processedData = await this.sheetService.processSheetData(file.buffer);
            return processedData;
        } catch (error) {
            throw new Error('Error processing uploaded file');
        }
    }
}