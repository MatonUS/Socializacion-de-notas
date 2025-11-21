import { Student, GradeStatus } from '../types';

const STORAGE_KEY = 'gradesync_data_v1';

export const saveStudents = (students: Student[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
};

export const loadStudents = (): Student[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const updateStudentStatus = (id: string, status: GradeStatus, feedback?: string) => {
  const students = loadStudents();
  const index = students.findIndex(s => s.id === id);
  if (index !== -1) {
    students[index].status = status;
    students[index].lastViewed = new Date().toISOString();
    if (feedback) {
      students[index].feedback = feedback;
    }
    saveStudents(students);
  }
};

export const exportToCSV = (students: Student[]) => {
  const headers = ['ID', 'Nombre', 'Estado', 'Fecha Visto', 'Nota Final', 'Feedback'];
  const rows = students.map(s => [
    s.id,
    s.name,
    s.status,
    s.lastViewed || 'N/A',
    s.grades.finalCut,
    s.feedback ? `"${s.feedback.replace(/"/g, '""')}"` : ''
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(r => r.join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `reporte_notas_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
