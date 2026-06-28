import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Login from './pages/Login'
import EthicsGate from './pages/EthicsGate'
import StudentInterview from './pages/StudentInterview'
import SelectFigure from './pages/SelectFigure'
import ReportDraft from './pages/ReportDraft'
import TeacherDashboard from './pages/TeacherDashboard'
import Footer from './components/Footer'

export default function App() {
  return (
    <AuthProvider>
      <div className="flex flex-col min-h-screen">
        <main className="flex-1 flex flex-col">
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/student/ethics" element={<EthicsGate />} />
            <Route path="/student/select-figure" element={<SelectFigure />} />
            <Route path="/student/interview" element={<StudentInterview />} />
            <Route path="/student/report" element={<ReportDraft />} />
            <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </AuthProvider>
  )
}
