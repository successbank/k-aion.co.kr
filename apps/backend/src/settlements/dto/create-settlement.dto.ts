import { IsString, IsDateString } from 'class-validator';

export class CreateSettlementDto {
  @IsString()
  weekCode: string; // e.g., "2025-W03"

  @IsDateString()
  startDate: string; // ISO date string

  @IsDateString()
  endDate: string; // ISO date string
}
