import { BrowserRouter as Router, Routes, Route } from "react-router";

import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Calendar from "./pages/Calendar";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import ProtectedRoute from "./components/ProtectedRoute";
import RoutePermissionGuard from "./components/RoutePermissionGuard";
import { AuthProvider } from './components/UserProfile/AuthProvider';

import SignIn from "./pages/AuthPages/SignIn";
import Brotthers from "./pages/brotthers/Brotthers";
import Homes from "./pages/homes/Homes";
import Groups from "./pages/groups/Groups";
import Users from "./pages/users/users";
import Newspaper from "./pages/newspaper/newspaper";
import Saints from "./pages/saint/saint";
import Tasks from "./pages/task/task";

export default function App() {
  return (
    <>
      <AuthProvider>
        <Router>
          <ScrollToTop />
          <Routes>
            <Route element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }>
              <Route element={<RoutePermissionGuard />}>
                <Route index path="/" element={<Home />} />
                <Route path="/Hermanos" element={<Brotthers />} />
                <Route path="/Fraternidades" element={<Homes />} />
                <Route path="/Grupos" element={<Groups />} />
                <Route path="/Usuarios" element={<Users />} />
                <Route path="/Noticias" element={<Newspaper />} />
                <Route path="/Santos" element={<Saints />} />
                <Route path="/Tareas" element={<Tasks />} />
                <Route path="/Calendario" element={<Calendar />} />
                <Route path="/profile" element={<UserProfiles />} />
              </Route>
            </Route>

            <Route path="/signin" element={<SignIn />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </AuthProvider>
    </>
  );
}
