import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import TeacherRoute from './components/TeacherRoute';

const CoursesList = lazy(() => import('./pages/CoursesList'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Profile = lazy(() => import('./pages/Profile'));
const TeacherProfileForm = lazy(() => import('./pages/TeacherProfileForm'));
const CreateBroadcast = lazy(() => import('./pages/CreateBroadcast'));
const BroadcastDetail = lazy(() => import('./pages/BroadcastDetail'));
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess'));
const Settings = lazy(() => import('./pages/Settings'));

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <Suspense fallback={<Spinner />}>
        <Routes>
          <Route path="/" element={<CoursesList />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/broadcasts/:id" element={<BroadcastDetail />} />
          <Route path="/payment/success" element={<PaymentSuccess />} />

          {/* Защищённые маршруты */}
          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/teacher/profile" element={<TeacherProfileForm />} />
          </Route>

          {/* Только для учителей с анкетой */}
          <Route element={<TeacherRoute />}>
            <Route path="/broadcasts/create" element={<CreateBroadcast />} />
          </Route>
        </Routes>
      </Suspense>
    </div>
  );
}
