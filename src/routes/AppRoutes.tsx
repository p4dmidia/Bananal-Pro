import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";
import LandingPage from "../pages/LandingPage";
import DashboardOverview from "../pages/Dashboard/Overview";
import FinancialStatement from "../pages/Financial/Statement";
import CourseCatalog from "../pages/Courses/Catalog";
import Login from "../pages/Auth/Login";
import Register from "../pages/Auth/Register";
import ForgotPassword from "../pages/Auth/ForgotPassword";
import ResetPassword from "../pages/Auth/ResetPassword";
import CoursePlayer from "../pages/Courses/Player";
import ProducerDashboard from "../pages/Courses/Producer";
import CourseDetail from "../pages/Courses/CourseDetail";
import SoilAnalysis from "../pages/Soil/SoilAnalysis";
import Inventory from "../pages/Stock/Inventory";
import Weather from "../pages/Climate/Weather";
import FarmCalendar from "../pages/Calendar/FarmCalendar";
import VisualDiagnostic from "../pages/Diagnostic/VisualDiagnostic";
import HowItWorks from "../pages/Public/HowItWorks";
import AboutUs from "../pages/Public/AboutUs";
import PublicBenefits from "../pages/Public/Benefits";
import Contact from "../pages/Public/Contact";
import Privacy from "../pages/Public/Privacy";
import Terms from "../pages/Public/Terms";
import SalesPage from "../pages/Public/SalesPage";
import Checkout from "../pages/Public/Checkout";
import { ProtectedRoute } from "../components/ProtectedRoute";
import AdminDashboard from "../pages/Admin/Dashboard";
import AdminLogin from "../pages/Admin/Login";
import AdminUsers from "../pages/Admin/Users";
import AdminFinancial from "../pages/Admin/Financial";
import AdminModeration from "../pages/Admin/Moderation";
import AdminCourses from "../pages/Admin/Courses";
import AdminSettings from "../pages/Admin/Settings";
import AdminLives from "../pages/Admin/Lives";
import AdminLibrary from "../pages/Admin/Library";
import SocialFeed from "../pages/Community/SocialFeed";
import MemberLives from "../pages/Courses/Lives";
import Library from "../pages/Library/Library";
import UserProfile from "../pages/Dashboard/UserProfile";
import NotificationsCenter from "../pages/Dashboard/NotificationsCenter";

function AuthCallbackHandler() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && (hash.includes("access_token=") || hash.includes("type=signup") || hash.includes("type=recovery"))) {
      console.log("AuthCallbackHandler: Token de autenticação detectado no hash:", hash);
      const isRecovery = hash.includes("type=recovery") || location.pathname === "/auth/reset-password";

      const timer = setTimeout(() => {
        const cleanPath = window.location.pathname;
        window.history.replaceState({}, document.title, cleanPath);

        if (isRecovery) {
          console.log("AuthCallbackHandler: Redirecionando para formulário de redefinição de senha");
          navigate("/auth/reset-password", { replace: true });
          return;
        }

        const savedTarget = localStorage.getItem("auth_redirect_target") || sessionStorage.getItem("auth_redirect_target");
        if (savedTarget) {
          localStorage.removeItem("auth_redirect_target");
          sessionStorage.removeItem("auth_redirect_target");
          console.log("AuthCallbackHandler: Navegando para o destino salvo:", savedTarget);
          navigate(savedTarget, { replace: true });
          return;
        }

        // Se estiver em telas de auth ou na raiz, direciona para o dashboard
        if (
          location.pathname === "/" || 
          location.pathname === "" || 
          location.pathname === "/auth/login" || 
          location.pathname === "/auth/register"
        ) {
          console.log("AuthCallbackHandler: Redirecionando usuário para /dashboard");
          navigate("/dashboard", { replace: true });
        }
      }, 100);

      return () => clearTimeout(timer);
    } else if (hash && hash.includes("error_description=")) {
      const params = new URLSearchParams(hash.replace("#", "?"));
      const errorMsg = params.get("error_description") || "Erro na autenticação.";
      toast.error(decodeURIComponent(errorMsg));
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [navigate, location]);

  return null;
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <AuthCallbackHandler />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/vendas" element={<SalesPage />} />
        <Route path="/como-funciona" element={<HowItWorks />} />
        <Route path="/sobre" element={<AboutUs />} />
        <Route path="/beneficios" element={<PublicBenefits />} />
        <Route path="/contato" element={<Contact />} />
        <Route path="/politica-de-privacidade" element={<Privacy />} />
        <Route path="/termos-de-uso" element={<Terms />} />
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/register" element={<Register />} />
        <Route path="/auth/forgot-password" element={<ForgotPassword />} />
        <Route path="/auth/reset-password" element={<ResetPassword />} />
        <Route path="/checkout/:slug?" element={<Checkout />} />
        
        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<ProtectedRoute adminOnly={true}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/usuarios" element={<ProtectedRoute adminOnly={true}><AdminUsers /></ProtectedRoute>} />
        <Route path="/admin/financeiro" element={<ProtectedRoute allowedRoles={["admin", "partner", "pj"]}><AdminFinancial /></ProtectedRoute>} />
        <Route path="/admin/moderacao" element={<ProtectedRoute allowedRoles={["admin", "partner", "pj"]}><AdminModeration /></ProtectedRoute>} />
        <Route path="/admin/cursos" element={<ProtectedRoute adminOnly={true}><AdminCourses /></ProtectedRoute>} />
        <Route path="/admin/cursos/detalhes/:id" element={<ProtectedRoute adminOnly={true}><CourseDetail /></ProtectedRoute>} />
        <Route path="/admin/config" element={<ProtectedRoute adminOnly={true}><AdminSettings /></ProtectedRoute>} />
        <Route path="/admin/lives" element={<ProtectedRoute adminOnly={true}><AdminLives /></ProtectedRoute>} />
        <Route path="/admin/biblioteca" element={<ProtectedRoute adminOnly={true}><AdminLibrary /></ProtectedRoute>} />
        
        {/* User Protected Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardOverview /></ProtectedRoute>} />
        <Route path="/comunidade" element={<ProtectedRoute><SocialFeed /></ProtectedRoute>} />
        <Route path="/financeiro" element={<ProtectedRoute><FinancialStatement /></ProtectedRoute>} />
        <Route path="/cursos" element={<ProtectedRoute><CourseCatalog /></ProtectedRoute>} />
        <Route path="/cursos/detalhes/:id" element={<ProtectedRoute><CourseDetail /></ProtectedRoute>} />
        <Route path="/cursos/player/:id" element={<ProtectedRoute><CoursePlayer /></ProtectedRoute>} />
        <Route path="/cursos/produtor" element={<ProtectedRoute><ProducerDashboard /></ProtectedRoute>} />
        <Route path="/lives" element={<ProtectedRoute><MemberLives /></ProtectedRoute>} />
        <Route path="/biblioteca" element={<ProtectedRoute><Library /></ProtectedRoute>} />
        <Route path="/perfil" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
        <Route path="/configuracoes" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
        <Route path="/notificacoes" element={<ProtectedRoute><NotificationsCenter /></ProtectedRoute>} />
        
        {/* Novas Rotas Agrícolas do Banana PRO */}
        <Route path="/solo" element={<ProtectedRoute><SoilAnalysis /></ProtectedRoute>} />
        <Route path="/estoque" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
        <Route path="/clima" element={<ProtectedRoute><Weather /></ProtectedRoute>} />
        <Route path="/calendario" element={<ProtectedRoute><FarmCalendar /></ProtectedRoute>} />
        <Route path="/diagnostico" element={<ProtectedRoute><VisualDiagnostic /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
