export enum GradeStatus {
  PENDING = 'PENDING',
  VIEWED = 'VIEWED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

export interface GradeDetail {
  advances: number | string;
  replica: number | string;
  report: number | string;
  final15: number | string;
  final20: number | string;
  finalCut: number | string;
}

export interface Student {
  id: string;
  batchId?: string;
  name: string;
  grades: GradeDetail;
  status: GradeStatus;
  feedback?: string;
  lastViewed?: string;
}

export interface ParsedDataResponse {
  students: Array<{
    name: string;
    advances: number;
    replica: number;
    report: number;
    final15: number;
    final20: number;
    finalCut: number;
  }>;
}