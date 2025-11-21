import React, { useState, useEffect } from 'react';
import { TeacherDashboard } from './components/TeacherDashboard';
import { StudentPortal } from './components/StudentPortal';
import { GraduationCap, School, Lock } from 'lucide-react';

function App() {
  const [view, setView] = useState<'home' | 'teacher' | 'student'>('home');

  // Check hash for simple routing simulation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      // Split query params if present (e.g. #student?batch=xyz)
      const route = hash.split('?')[0];
      
      if (route === '#teacher') setView('teacher');
      else if (route === '#student') setView('student');
      else setView('home');
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Initial check

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (target: 'home' | 'teacher' | 'student') => {
    window.location.hash = target === 'home' ? '' : target;
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center cursor-pointer" onClick={() => navigate('home')}>
              <School className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900 tracking-tight">GradeSync</span>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigate('student')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${view === 'student' ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-900'}`}
              >
                Estudiantes
              </button>
              <button 
                onClick={() => navigate('teacher')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${view === 'teacher' ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-900'}`}
              >
                Docentes
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow bg-gray-50">
        {view === 'home' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-16">
              <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                <span className="block">Gestión de notas</span>
                <span className="block text-blue-600">segura y privada</span>
              </h1>
              <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
                Plataforma inteligente para la socialización de calificaciones. Los estudiantes ven solo lo suyo, los docentes mantienen el control total.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 max-w-4xl mx-auto">
              {/* Student Card */}
              <div 
                onClick={() => navigate('student')}
                className="group relative bg-white rounded-2xl shadow-sm border border-gray-200 p-8 hover:shadow-xl transition-all cursor-pointer flex flex-col items-center text-center"
              >
                <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform">
                  <GraduationCap size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Soy Estudiante</h3>
                <p className="text-gray-500">Consulta tus notas de manera privada, revisa el desglose y confirma tu aceptación.</p>
                <span className="mt-6 text-blue-600 font-medium group-hover:translate-x-1 transition-transform inline-flex items-center">
                  Consultar ahora &rarr;
                </span>
              </div>

              {/* Teacher Card */}
              <div 
                onClick={() => navigate('teacher')}
                className="group relative bg-white rounded-2xl shadow-sm border border-gray-200 p-8 hover:shadow-xl transition-all cursor-pointer flex flex-col items-center text-center"
              >
                <div className="h-16 w-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mb-6 group-hover:scale-110 transition-transform">
                  <Lock size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Soy Docente</h3>
                <p className="text-gray-500">Sube tus planillas de excel o imágenes, monitorea quien ha visto sus notas y descarga reportes.</p>
                <span className="mt-6 text-indigo-600 font-medium group-hover:translate-x-1 transition-transform inline-flex items-center">
                  Ingresar al panel &rarr;
                </span>
              </div>
            </div>
            
            <div className="mt-16 text-center text-xs text-gray-400">
              <p>Powered by Gemini AI for intelligent data extraction.</p>
              <p>Este es un entorno de demostración seguro.</p>
            </div>
          </div>
        )}

        {view === 'teacher' && <TeacherDashboard />}
        {view === 'student' && <StudentPortal />}
      </main>
    </div>
  );
}

export default App;