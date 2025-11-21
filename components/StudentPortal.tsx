import React, { useState, useEffect } from 'react';
import { loadStudents, updateStudentStatus } from '../services/storageService';
import { generateEncouragingMessage } from '../services/geminiService';
import { Student, GradeStatus } from '../types';
import { Search, CheckCircle, XCircle, AlertTriangle, LogOut, ThumbsUp, ThumbsDown, Lock, ArrowRight } from 'lucide-react';

export const StudentPortal: React.FC = () => {
  const [searchName, setSearchName] = useState('');
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [aiMessage, setAiMessage] = useState<string>("");
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [urlBatchId, setUrlBatchId] = useState<string | null>(null);
  const [batchError, setBatchError] = useState(false);

  useEffect(() => {
    // Parse query parameters from hash (e.g., #student?batch=xyz)
    const hash = window.location.hash;
    if (hash.includes('?')) {
      const queryString = hash.split('?')[1];
      const params = new URLSearchParams(queryString);
      const batch = params.get('batch');
      if (batch) {
        setUrlBatchId(batch);
      }
    }
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchName.trim()) return;

    const students = loadStudents();
    
    // Filter by batch if URL param exists (Strict mode)
    // If no batch ID is in URL, we allow searching all (demo mode), but in production you'd want strictness.
    let filteredStudents = students;
    if (urlBatchId) {
        filteredStudents = students.filter(s => s.batchId === urlBatchId);
        // If batch ID exists in URL but matches nothing in local storage
        if (filteredStudents.length === 0) {
            setBatchError(true);
            setHasSearched(true);
            setCurrentStudent(null);
            return;
        } else {
            setBatchError(false);
        }
    }

    // Improved search logic: Case insensitive, trim, and check if parts of the name match
    const searchClean = searchName.toLowerCase().trim();
    const found = filteredStudents.find(s => {
        const dbName = s.name.toLowerCase().trim();
        return dbName === searchClean || dbName.includes(searchClean);
    });
    
    if (found) {
      setCurrentStudent(found);
      if (found.status === GradeStatus.PENDING) {
          updateStudentStatus(found.id, GradeStatus.VIEWED);
      }
      const msg = await generateEncouragingMessage(found.name, Number(found.grades.finalCut));
      setAiMessage(msg);
    } else {
      setCurrentStudent(null);
    }
    setHasSearched(true);
  };

  const handleAction = (accept: boolean) => {
    if (!currentStudent) return;
    
    if (accept) {
      updateStudentStatus(currentStudent.id, GradeStatus.ACCEPTED);
      setCurrentStudent(prev => prev ? ({...prev, status: GradeStatus.ACCEPTED}) : null);
    } else {
      setShowRejectForm(true);
    }
  };

  const submitRejection = () => {
    if (!currentStudent) return;
    updateStudentStatus(currentStudent.id, GradeStatus.REJECTED, rejectReason);
    setCurrentStudent(prev => prev ? ({...prev, status: GradeStatus.REJECTED, feedback: rejectReason}) : null);
    setShowRejectForm(false);
  };

  const resetSearch = () => {
    setSearchName('');
    setCurrentStudent(null);
    setHasSearched(false);
    setRejectReason('');
    setShowRejectForm(false);
    setAiMessage('');
  };

  // Exact styling matches for the requested visual
  const yellowHeader = "bg-[#ffc000] text-black"; // Vibrant yellow
  const blueHeader = "bg-[#00b0f0] text-black"; // Vibrant Cyan/Blue

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 min-h-[80vh] flex items-center justify-center">
      {!currentStudent ? (
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 text-center w-full max-w-lg animate-fade-in">
          <div className="mb-6 flex justify-center">
             <div className="bg-blue-100 p-4 rounded-full text-blue-600">
                <Lock size={32} />
             </div>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Portal de Notas</h1>
          <p className="text-gray-500 mb-8">
             {urlBatchId 
               ? "Has ingresado al portal seguro de tu curso. Digita tu nombre para ver tus notas privadas." 
               : "Ingresa tu nombre completo tal como aparece en la lista de clase."}
          </p>
          
          {urlBatchId && !batchError && (
             <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-50 text-green-700 text-sm font-medium mb-8 border border-green-200">
                <CheckCircle size={14} /> Enlace Seguro Validado
             </div>
          )}

          <form onSubmit={handleSearch} className="max-w-md mx-auto relative">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input
                type="text"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="block w-full pl-11 pr-4 py-4 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm text-gray-900"
                placeholder="Nombre completo..."
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="mt-6 w-full flex justify-center items-center gap-2 py-4 px-6 border border-transparent text-base font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg hover:shadow-blue-200 transition-all transform hover:-translate-y-0.5"
            >
              Consultar Mis Notas <ArrowRight size={18} />
            </button>
          </form>

          {hasSearched && !currentStudent && !batchError && (
            <div className="mt-6 p-4 bg-red-50 border border-red-100 text-red-800 rounded-xl flex items-start gap-3 animate-fade-in text-left">
              <AlertTriangle size={20} className="shrink-0 mt-0.5" />
              <div>
                 <p className="font-bold">Estudiante no encontrado</p>
                 <p className="text-sm opacity-90">Verifica que estés escribiendo tu nombre exactamente como aparece en la lista.</p>
              </div>
            </div>
          )}

          {batchError && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-100 text-yellow-800 rounded-xl flex items-start gap-3 animate-fade-in text-left">
              <AlertTriangle size={20} className="shrink-0 mt-0.5" />
              <div>
                 <p className="font-bold">Enlace Expirado o Inválido</p>
                 <p className="text-sm opacity-90">Este enlace corresponde a un grupo de notas que ya no está disponible o fue actualizado. Contacta a tu docente.</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200 w-full animate-fade-in">
          {/* Header */}
          <div className="bg-slate-900 text-white p-6 flex justify-between items-start md:items-center gap-4">
             <div>
                <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Estudiante</div>
                <h2 className="text-2xl md:text-3xl font-bold leading-tight">{currentStudent.name}</h2>
                {aiMessage && <p className="text-blue-200 text-sm mt-2 italic border-l-2 border-blue-500 pl-3">"{aiMessage}"</p>}
             </div>
             <button 
                onClick={resetSearch} 
                className="text-slate-400 hover:text-white hover:bg-slate-800 p-2 rounded-lg transition-all flex flex-col items-center text-xs gap-1"
             >
                <LogOut size={20} />
                <span>Salir</span>
             </button>
          </div>

          {/* Grades Content */}
          <div className="p-6 md:p-8">
             <div className="mb-8 flex items-center justify-between border-b border-gray-100 pb-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <div className="w-2 h-6 bg-blue-600 rounded-full"></div>
                    Boletín de Notas
                </h3>
                <div className="text-sm font-medium">
                   {currentStudent.status === GradeStatus.ACCEPTED ? 
                      <span className="flex items-center gap-1 text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100"><CheckCircle size={14} /> Aceptado</span> : 
                    currentStudent.status === GradeStatus.REJECTED ?
                      <span className="flex items-center gap-1 text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-100"><XCircle size={14} /> Inconformidad</span> :
                      <span className="flex items-center gap-1 text-gray-500 bg-gray-100 px-3 py-1 rounded-full"><Lock size={14} /> Privado</span>
                   }
                </div>
             </div>

             {/* The Grades Table simulating the image structure */}
             {/* We use a specific layout to mimic the user's screenshot: Yellow block, Blue block */}
             <div className="overflow-hidden rounded-xl border-2 border-gray-800 mb-8 shadow-lg">
               <div className="grid grid-cols-1 md:grid-cols-3 text-center divide-y-2 md:divide-y-0 md:divide-x-2 divide-gray-800 bg-white">
                 
                 {/* Yellow Section: Trabajo Final */}
                 <div className="md:col-span-2 flex flex-col">
                    <div className={`${yellowHeader} py-3 font-extrabold text-lg uppercase tracking-wider border-b-2 border-gray-800`}>
                        Trabajo Final
                    </div>
                    <div className="grid grid-cols-3 h-full divide-x-2 divide-gray-800">
                      <div className="p-4 flex flex-col justify-center items-center bg-[#fffbf0]">
                        <div className="text-xs text-gray-600 font-bold uppercase mb-2">Avances</div>
                        <div className="text-3xl font-black text-gray-900">{currentStudent.grades.advances}</div>
                      </div>
                      <div className="p-4 flex flex-col justify-center items-center bg-[#fffbf0]">
                        <div className="text-xs text-gray-600 font-bold uppercase mb-2">Réplica</div>
                        <div className="text-3xl font-black text-gray-900">{currentStudent.grades.replica}</div>
                      </div>
                      <div className="p-4 flex flex-col justify-center items-center bg-[#fffbf0]">
                        <div className="text-xs text-gray-600 font-bold uppercase mb-2">Informe</div>
                        <div className="text-3xl font-black text-gray-900">{currentStudent.grades.report}</div>
                      </div>
                    </div>
                 </div>

                 {/* Blue Section: Final Grades */}
                 <div className="md:col-span-1 flex flex-col">
                    <div className={`${blueHeader} py-3 font-extrabold text-lg uppercase tracking-wider border-b-2 border-gray-800`}>
                        Nota Final Corte I
                    </div>
                    <div className="grid grid-cols-2 h-full divide-x-2 divide-gray-800">
                       <div className="p-4 flex flex-col justify-center items-center bg-[#f0faff]">
                          <div className="text-xs text-gray-600 font-bold uppercase mb-2">15%</div>
                          <div className="text-3xl font-black text-gray-900">{currentStudent.grades.final15}</div>
                       </div>
                       <div className="p-4 flex flex-col justify-center items-center bg-[#f0faff]">
                          <div className="text-xs text-gray-600 font-bold uppercase mb-2">20%</div>
                          <div className="text-3xl font-black text-gray-900">{currentStudent.grades.final20}</div>
                       </div>
                    </div>
                 </div>
               </div>

               {/* Total Footer */}
               <div className="bg-gray-800 text-white p-5 flex justify-between items-center border-t-2 border-gray-800">
                  <span className="font-bold uppercase tracking-widest text-sm md:text-base text-gray-300">Nota Definitiva del Corte</span>
                  <div className="flex items-center gap-2">
                     <span className={`text-4xl md:text-5xl font-black ${Number(currentStudent.grades.finalCut) >= 3 ? 'text-green-400' : 'text-red-400'}`}>
                        {currentStudent.grades.finalCut}
                     </span>
                  </div>
               </div>
             </div>

             {/* Action Buttons */}
             {currentStudent.status !== GradeStatus.ACCEPTED && currentStudent.status !== GradeStatus.REJECTED && !showRejectForm && (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <button 
                    onClick={() => handleAction(false)}
                    className="flex items-center justify-center gap-3 py-4 px-6 border-2 border-red-100 bg-white text-red-600 rounded-xl font-bold hover:bg-red-50 hover:border-red-200 transition-all"
                  >
                    <ThumbsDown size={20} />
                    No Acepto / Reclamo
                  </button>
                  <button 
                    onClick={() => handleAction(true)}
                    className="flex items-center justify-center gap-3 py-4 px-6 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all transform hover:-translate-y-1"
                  >
                    <ThumbsUp size={20} />
                    Acepto mis notas
                  </button>
               </div>
             )}

             {showRejectForm && (
               <div className="mt-2 bg-red-50 p-6 rounded-xl border border-red-100 animate-fade-in">
                 <h4 className="font-bold text-red-900 mb-3 text-lg">Registrar Inconformidad</h4>
                 <p className="text-sm text-red-700 mb-3">Por favor, indica el motivo por el cual no estás de acuerdo con tu nota. Esto será notificado a tu docente.</p>
                 <textarea 
                    className="w-full p-4 rounded-lg border border-red-200 focus:ring-2 focus:ring-red-500 focus:border-transparent text-base mb-4 shadow-sm"
                    rows={3}
                    placeholder="Escribe aquí tu observación..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    autoFocus
                 />
                 <div className="flex justify-end gap-3">
                   <button 
                    onClick={() => setShowRejectForm(false)}
                    className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 bg-white border border-gray-200 rounded-lg"
                   >
                     Cancelar
                   </button>
                   <button 
                    onClick={submitRejection}
                    disabled={!rejectReason.trim()}
                    className="px-5 py-2.5 bg-red-600 text-white text-sm rounded-lg font-bold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                   >
                     Enviar Reclamo
                   </button>
                 </div>
               </div>
             )}

             {(currentStudent.status === GradeStatus.ACCEPTED || currentStudent.status === GradeStatus.REJECTED) && (
               <div className={`mt-6 p-6 rounded-2xl text-center font-medium flex flex-col items-center gap-3 border ${
                 currentStudent.status === GradeStatus.ACCEPTED ? 'bg-green-50 text-green-800 border-green-100' : 'bg-red-50 text-red-800 border-red-100'
               } animate-fade-in`}>
                 <div className={`p-3 rounded-full ${currentStudent.status === GradeStatus.ACCEPTED ? 'bg-green-100' : 'bg-red-100'}`}>
                    {currentStudent.status === GradeStatus.ACCEPTED ? <CheckCircle size={32} /> : <XCircle size={32} />}
                 </div>
                 <h4 className="text-lg font-bold">{currentStudent.status === GradeStatus.ACCEPTED ? '¡Gracias! Has aceptado tus notas.' : 'Reclamo Registrado'}</h4>
                 <p className="text-sm opacity-80 max-w-md">
                    {currentStudent.status === GradeStatus.ACCEPTED 
                        ? "Se ha notificado a tu docente que estás conforme con tu calificación." 
                        : "Tu docente revisará tu observación: " + (currentStudent.feedback || "")}
                 </p>
                 <button onClick={resetSearch} className="mt-2 text-sm underline opacity-70 hover:opacity-100">
                    Volver al inicio
                 </button>
               </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
};