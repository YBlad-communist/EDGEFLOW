import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import TeacherRoute from './components/TeacherRoute';

const CoursesList = lazy(() => import('./pages/CoursesList'));
const CourseDetail = lazy(() => import('./pages/CourseDetail'));
const CourseContent = lazy(() => import('./pages/CourseContent'));
const CreateCourse = lazy(() => import('./pages/CreateCourse'));
const EditCourse = lazy(() => import('./pages/EditCourse'));
const MyCourses = lazy(() => import('./pages/MyCourses'));
const MyLearning = lazy(() => import('./pages/MyLearning'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Profile = lazy(() => import('./pages/Profile'));
const TeacherProfileForm = lazy(() => import('./pages/TeacherProfileForm'));
const CreateBroadcast = lazy(() => import('./pages/CreateBroadcast'));
const BroadcastList = lazy(() => import('./pages/BroadcastList'));
const BroadcastDetail = lazy(() => import('./pages/BroadcastDetail'));
const MyBroadcasts = lazy(() => import('./pages/MyBroadcasts'));
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess'));
const Settings = lazy(() => import('./pages/Settings'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));

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
          <Route path="/courses" element={<CoursesList />} />
          <Route path="/courses/:id" element={<CourseDetail />} />
          <Route path="/courses/:id/content" element={<CourseContent />} />
          <Route path="/courses/:id/edit" element={<EditCourse />} />
          <Route path="/broadcasts" element={<BroadcastList />} />
          <Route path="/broadcasts/:id" element={<BroadcastDetail />} />
          <Route path="/payment/success" element={<PaymentSuccess />} />

          {/* Защищённые маршруты */}
          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/teacher/profile" element={<TeacherProfileForm />} />
            <Route path="/my-courses" element={<MyCourses />} />
            <Route path="/my-learning" element={<MyLearning />} />
            <Route path="/my-broadcasts" element={<MyBroadcasts />} />
            <Route path="/create-course" element={<CreateCourse />} />
            <Route path="/admin" element={<AdminPanel />} />
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
