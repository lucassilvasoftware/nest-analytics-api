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
            console.error('Error processing uploaded file:', error);
            throw new Error('Erro ao processar o arquivo enviado. Por favor, verifique se o formato do arquivo está correto e tente novamente.');
        }
    }
}