import { Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';

@Injectable()
export class SheetService {
    sendSheet(): string{ 
        return "Retorno API!";
    }
}