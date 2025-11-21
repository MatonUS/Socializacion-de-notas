import React, { useState, useRef, useEffect } from 'react';
import { parseGradesImage } from '../services/geminiService';
import { saveStudents, loadStudents, exportToCSV } from '../services/storageService';
import { Student, GradeStatus } from '../types';
import { Upload, FileText, Download, Users, CheckCircle, XCircle, Clock, AlertCircle, Link as LinkIcon, Copy, Check, RefreshCw, Trash2 } from 'lucide-react';

export const TeacherDashboard: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'monitor'>('monitor');
  const [batchId, setBatchId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loaded = loadStudents();
    setStudents(loaded);
    // Attempt to retrieve the batch ID from the first student record if available
    if (loaded.length > 0 && loaded[0].batchId) {
      setBatchId(loaded[0].batchId);
    }
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        const base64Content = base64data.split(',')[1];
        
        try {
            const parsedData = await parseGradesImage(base64Content);
            const newBatchId = crypto.randomUUID().substring(0, 8); // Shorter, cleaner ID
            
            const newStudents: Student[] = parsedData.students.map((s) => ({
              id: crypto.randomUUID(),
              batchId: newBatchId,
              name: s.name,
              grades: {
                advances: s.advances,
                replica: s.replica,
                report: s.report,
                final15: s.final15,
                final20: s.final20,
                finalCut: s.finalCut
              },
              status: GradeStatus.PENDING
            }));
    
            setStudents(newStudents);
            setBatchId(newBatchId);
            saveStudents(newStudents);
            setActiveTab('monitor');
        } catch (err) {
            setError("Error al analizar la imagen. Asegúrate de usar una imagen clara de la tabla.");
        } finally {
            setLoading(false);
        }
      };
    } catch (e) {
      setError("Error de lectura de archivo.");
      setLoading(false);
    }
  };

  const clearData = () => {
    if (confirm('¿Estás seguro de borrar los datos actuales? Esto eliminará las notas cargadas.')) {
        setStudents([]);
        setBatchId(null);
        saveStudents([]);
        setActiveTab('upload');
    }
  }

  const copyToClipboard = () => {
    if (!batchId) return;
    const url = `${window.location.origin}${window.location.pathname}#student?batch=${batchId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const stats = {
    total: students.length,
    accepted: students.filter(s => s.status === GradeStatus.ACCEPTED).length,
    rejected: students.filter(s => s.status === GradeStatus.REJECTED).length,
    viewed: students.filter(s => s.status !== GradeStatus.PENDING).length,
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Panel Docente</h2>
          <p className="text-gray-500">Gestiona y socializa las notas de tus estudiantes</p>
        </div>
        <div className="flex space-x-2">
             <button 
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors ${activeTab === 'upload' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border'}`}
          >
            <Upload size={18} /> Cargar Notas
          </button>
          <button 
            onClick={() => setActiveTab('monitor')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors ${activeTab === 'monitor' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border'}`}
          >
            <Users size={18} /> Monitoreo
          </button>
        </div>
      </header>

      {activeTab === 'upload' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center animate-fade-in">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600">
              <FileText size={40} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Sube una captura de las notas</h3>
            <p className="text-gray-500 mb-8">
              Sube una imagen (PNG/JPG) o captura de pantalla de tu Excel. El sistema identificará las columnas (Avances, Réplica, Informe) automáticamente.
            </p>
            
            <input 
              type="file" 
              ref={fileInputRef}
              className="hidden" 
              accept="image/*"
              onChange={handleFileUpload}
            />
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex justify-center items-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            >
              {loading ? (
                <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
              ) : (
                <>
                  <Upload size={20} /> Seleccionar Imagen
                </>
              )}
            </button>
            
            {error && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center justify-center gap-2">
                <AlertCircle size={16} /> {error}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'monitor' && (
        <div className="space-y-6 animate-fade-in">
          {/* Link Generation Section */}
          {batchId ? (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-6 flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm">
               <div className="flex items-start gap-4">
                  <div className="p-3 bg-white rounded-full text-blue-600 shadow-sm mt-1">
                    <LinkIcon size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg">Enlace de Consulta para Estudiantes</h4>
                    <p className="text-sm text-gray-600 mb-2">Comparte este enlace. Los estudiantes solo podrán ver su propia nota al ingresar su nombre.</p>
                    <div className="text-xs text-gray-500 bg-white/50 px-2 py-1 rounded inline-block border border-gray-200">
                        ID del Lote: <span className="font-mono font-bold text-gray-700">{batchId}</span>
                    </div>
                  </div>
               </div>
               <div className="flex flex-col w-full md:w-auto gap-2">
                  <div className="flex items-center gap-2 w-full md:w-auto">
                      <div className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-500 font-mono truncate w-full md:w-[320px] select-all shadow-inner">
                        {`${window.location.origin}${window.location.pathname}#student?batch=${batchId}`}
                      </div>
                      <button 
                        onClick={copyToClipboard}
                        className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-bold transition-all shadow-sm ${copied ? 'bg-green-600 text-white transform scale-105' : 'bg-blue-600 text-white hover:bg-blue-700 hover:-translate-y-0.5'}`}
                      >
                        {copied ? <Check size={18} /> : <Copy size={18} />}
                        {copied ? 'Copiado' : 'Copiar'}
                      </button>
                  </div>
               </div>
            </div>
          ) : (
             <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 text-yellow-800 flex items-center gap-3">
                <AlertCircle size={20} />
                <p>No hay notas cargadas activas. Sube una imagen para generar un enlace.</p>
             </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Total Estudiantes</div>
              <div className="text-3xl font-bold text-gray-800">{stats.total}</div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Vistas Confirmadas</div>
              <div className="text-3xl font-bold text-blue-600">{stats.viewed}</div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Notas Aceptadas</div>
              <div className="text-3xl font-bold text-green-600">{stats.accepted}</div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Reclamos / Rechazos</div>
              <div className="text-3xl font-bold text-red-600">{stats.rejected}</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-200">
            <button 
              onClick={clearData}
              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <Trash2 size={16} /> Borrar Datos y Reiniciar
            </button>
            <button 
              onClick={() => exportToCSV(students)}
              disabled={students.length === 0}
              className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:text-blue-600 hover:border-blue-300 text-sm font-bold flex items-center gap-2 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={18} /> Descargar Reporte Excel
            </button>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                  <tr>
                    <th scope="col" className="px-6 py-4">Nombre Estudiante</th>
                    <th scope="col" className="px-6 py-4 text-center">Estado Socialización</th>
                    <th scope="col" className="px-6 py-4 text-center">Nota Final</th>
                    <th scope="col" className="px-6 py-4 text-center">Último Acceso</th>
                    <th scope="col" className="px-6 py-4">Observaciones del Estudiante</th>
                  </tr>
                </thead>
                <tbody>
                  {students.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
                        <FileText size={32} className="opacity-20" />
                        No hay datos cargados. Sube una imagen primero.
                      </td>
                    </tr>
                  ) : (
                    students.map((student) => (
                      <tr key={student.id} className="bg-white border-b hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-gray-900">{student.name}</td>
                        <td className="px-6 py-4 text-center">
                          {student.status === GradeStatus.PENDING && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200"><Clock size={12} /> Pendiente</span>}
                          {student.status === GradeStatus.VIEWED && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100"><Users size={12} /> Visto</span>}
                          {student.status === GradeStatus.ACCEPTED && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100"><CheckCircle size={12} /> Aceptado</span>}
                          {student.status === GradeStatus.REJECTED && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100"><XCircle size={12} /> Rechazado</span>}
                        </td>
                        <td className="px-6 py-4 text-center">
                            <span className={`font-bold px-2 py-1 rounded ${Number(student.grades.finalCut) >= 3 ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'}`}>
                                {student.grades.finalCut}
                            </span>
                        </td>
                        <td className="px-6 py-4 text-center text-xs text-gray-500">
                          {student.lastViewed ? new Date(student.lastViewed).toLocaleString('es-CO') : '-'}
                        </td>
                        <td className="px-6 py-4 truncate max-w-xs text-xs italic text-gray-500">
                          {student.feedback ? `"${student.feedback}"` : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};