import { BrowserRouter as Router, Routes, Route } from "react-router";

import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import ProtectedRoute from "./components/ProtectedRoute";
import RoutePermissionGuard from "./components/RoutePermissionGuard";
import { AuthProvider } from './components/UserProfile/AuthProvider';


/**Vistas del sistema de tipo Administrador */
import SignIn from "./pages/AuthPages/SignIn";
import Brotthers  from "./pages/Brotthers/Brotthers";
import Homes from "./pages/homes/Homes";
import Groups from "./pages/groups/Groups";
import Users from "./pages/users/Users";
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
            {/* Dashboard Layout - PROTEGIDO */}
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
                <Route path="/blank" element={<Blank />} />
                <Route path="/form-elements" element={<FormElements />} />
                <Route path="/basic-tables" element={<BasicTables />} />
                <Route path="/alerts" element={<Alerts />} />
                <Route path="/avatars" element={<Avatars />} />
                <Route path="/badge" element={<Badges />} />
                <Route path="/buttons" element={<Buttons />} />
                <Route path="/images" element={<Images />} />
                <Route path="/videos" element={<Videos />} />
                <Route path="/line-chart" element={<LineChart />} />
                <Route path="/bar-chart" element={<BarChart />} />
              </Route>
            </Route>

            {/* Auth Layout - PÚBLICAS */}
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />

            {/* Fallback Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </AuthProvider>
    </>
  );
}