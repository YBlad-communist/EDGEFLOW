import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext.jsx";
import { ProtectedRoute, TeacherRoute, GuestRoute } from "./components/ProtectedRoute.jsx";
import Navbar from "./components/Navbar.jsx";
import Tour from "./components/Tour.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import CoursesList from "./pages/CoursesList.jsx";
import CourseDetail from "./pages/CourseDetail.jsx";
import CourseContent from "./pages/CourseContent.jsx";
import CreateCourse from "./pages/CreateCourse.jsx";
import EditCourse from "./pages/EditCourse.jsx";
import MyCourses from "./pages/MyCourses.jsx";
import MyLearning from "./pages/MyLearning.jsx";
import Profile from "./pages/Profile.jsx";
import Settings from "./pages/Settings.jsx";
import TeacherProfileForm from "./pages/TeacherProfileForm.jsx";
import AdminPanel from "./pages/AdminPanel.jsx";
import BroadcastList from "./pages/BroadcastList.jsx";
import BroadcastDetail from "./pages/BroadcastDetail.jsx";
import CreateBroadcast from "./pages/CreateBroadcast.jsx";
import MyBroadcasts from "./pages/MyBroadcasts.jsx";
import PaymentSuccess from "./pages/PaymentSuccess.jsx";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/courses" />} />
      <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
      <Route path="/courses" element={<CoursesList />} />
      <Route path="/courses/:id" element={<CourseDetail />} />
      <Route path="/courses/:id/learn" element={<ProtectedRoute><CourseContent /></ProtectedRoute>} />
      <Route path="/create-course" element={<TeacherRoute><CreateCourse /></TeacherRoute>} />
      <Route path="/edit-course/:id" element={<TeacherRoute><EditCourse /></TeacherRoute>} />
      <Route path="/my-courses" element={<TeacherRoute><MyCourses /></TeacherRoute>} />
      <Route path="/my-learning" element={<ProtectedRoute><MyLearning /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/teacher-profile" element={<TeacherRoute><TeacherProfileForm /></TeacherRoute>} />
      <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
      <Route path="/broadcasts" element={<BroadcastList />} />
      <Route path="/broadcasts/:id" element={<ProtectedRoute><BroadcastDetail /></ProtectedRoute>} />
      <Route path="/create-broadcast" element={<TeacherRoute><CreateBroadcast /></TeacherRoute>} />
      <Route path="/my-broadcasts" element={<TeacherRoute><MyBroadcasts /></TeacherRoute>} />
      <Route path="/payment-success" element={<PaymentSuccess />} />
      <Route path="*" element={<Navigate to="/courses" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-[#0d0d1a] text-white">
          <Navbar />
          <Tour />
          <main>
            <AppRoutes />
          </main>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
