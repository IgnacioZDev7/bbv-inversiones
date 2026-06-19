import { BrowserRouter as Router, Routes, Route } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import Unauthorized from "./pages/AuthPages/Unauthorized";
import NotFound from "./pages/OtherPage/NotFound";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import { AuthProvider } from "./context/AuthContext";
import { UIFeedbackProvider } from "./context/UIFeedbackContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import Home from "./pages/Dashboard/Home";
import CompleteProfile from "./pages/Profile/CompleteProfile";
import { CompanyDetail } from "./pages/CompanyDetail";
import ChatPage from "./pages/Chat/ChatPage";

// Admin
import { AdminDashboard, UsersManagement, CompaniesManagement, SectorsManagement, ProcessAudit } from "./pages/Admin";
import AdminCompanyDetail from "./pages/Admin/CompanyDetail";
// Analyst
import { AnalystDashboard, AnalystCompanies, FinancialReports, ManualPipeline } from "./pages/Analyst";
import Indicators from "./pages/Analyst/Indicators";
// Auditor
import { AuditorDashboard, ProcessHistory, GeneratedReports, Logs } from "./pages/Auditor";
// Investor
import { InvestorDashboard, InvestorCompanies, InvestorIndicators, Simulations, Recommendations } from "./pages/Investor";

export default function App() {
  return (
    <UIFeedbackProvider>
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Public company detail - accessible to all authenticated users */}
          <Route element={<AppLayout />}>
            <Route element={<ProtectedRoute allowedRoles={['Administrador', 'Analista', 'Auditor', 'Inversionista']} />}>
              <Route path="/" element={<Home />} />
              <Route path="/complete-profile" element={<CompleteProfile />} />
              <Route path="/company/:id" element={<CompanyDetail />} />
              <Route path="/chat" element={<ChatPage />} />
            </Route>

            {/* Admin */}
            <Route element={<ProtectedRoute allowedRoles={['Administrador']} />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<UsersManagement />} />
              <Route path="/admin/companies" element={<CompaniesManagement />} />
              <Route path="/admin/companies/:id" element={<AdminCompanyDetail />} />
              <Route path="/admin/sectors" element={<SectorsManagement />} />
              <Route path="/admin/audit" element={<ProcessAudit />} />
            </Route>

            {/* Analyst */}
            <Route element={<ProtectedRoute allowedRoles={['Analista']} />}>
              <Route path="/analyst" element={<AnalystDashboard />} />
              <Route path="/analyst/companies" element={<AnalystCompanies />} />
              <Route path="/analyst/reports" element={<FinancialReports />} />
              <Route path="/analyst/indicators" element={<Indicators />} />
              <Route path="/analyst/pipeline" element={<ManualPipeline />} />
            </Route>

            {/* Auditor */}
            <Route element={<ProtectedRoute allowedRoles={['Auditor']} />}>
              <Route path="/auditor" element={<AuditorDashboard />} />
              <Route path="/auditor/history" element={<ProcessHistory />} />
              <Route path="/auditor/reports" element={<GeneratedReports />} />
              <Route path="/auditor/logs" element={<Logs />} />
            </Route>

            {/* Investor */}
            <Route element={<ProtectedRoute allowedRoles={['Inversionista']} />}>
              <Route path="/investor" element={<InvestorDashboard />} />
              <Route path="/investor/companies" element={<InvestorCompanies />} />
              <Route path="/investor/indicators" element={<InvestorIndicators />} />
              <Route path="/investor/simulations" element={<Simulations />} />
              <Route path="/investor/recommendations" element={<Recommendations />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
    </UIFeedbackProvider>
  );
}
