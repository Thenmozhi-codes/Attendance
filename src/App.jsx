import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth";
import { AttendanceProvider } from "./lib/attendance";
import Shell from "./components/Shell";
import Login from "./pages/Login";
import Home from "./pages/Home";
import History from "./pages/History";
import Leave from "./pages/Leave";
import Requests from "./pages/Requests";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/admin/Dashboard";
import Approvals from "./pages/admin/Approvals";
import Employees from "./pages/admin/Employees";
import Reports from "./pages/admin/Reports";

function Guard() {
  const { user } = useAuth(), loc = useLocation();
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  return <AttendanceProvider><Shell /></AttendanceProvider>;
}

const Landing = () => (useAuth().user.role === "admin" ? <AdminDashboard /> : <Home />);
const Only = ({ role, children }) => (useAuth().user.role === role ? children : <Navigate to="/" replace />);

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<Guard />}>
          <Route index element={<Landing />} />
          <Route path="history" element={<Only role="employee"><History /></Only>} />
          <Route path="leave" element={<Only role="employee"><Leave /></Only>} />
          <Route path="requests" element={<Only role="employee"><Requests /></Only>} />
          <Route path="approvals" element={<Only role="admin"><Approvals /></Only>} />
          <Route path="employees" element={<Only role="admin"><Employees /></Only>} />
          <Route path="reports" element={<Only role="admin"><Reports /></Only>} />
          <Route path="profile" element={<Profile />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
