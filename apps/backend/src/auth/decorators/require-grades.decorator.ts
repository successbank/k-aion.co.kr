import { SetMetadata } from '@nestjs/common';

export const GRADES_KEY = 'grades';
export const RequireGrades = (...grades: string[]) => SetMetadata(GRADES_KEY, grades);
