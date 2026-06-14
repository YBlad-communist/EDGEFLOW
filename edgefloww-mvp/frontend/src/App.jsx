import { Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Navbar from "./components/Navbar.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import CoursesList from "./pages/CoursesList.jsx";
import CourseDetail from "./pages/CourseDetail.jsx";
import CreateCourse from "./pages/CreateCourse.jsx";
import MyCourses from "./pages/MyCourses.jsx";
import MyLearning from "./pages/MyLearning.jsx";
import WatchLesson from "./pages/WatchLesson.jsx";
import AdminPanel from "./pages/AdminPanel.jsx";
import { api, setToken, clearToken } from "./api.js";

function RequireAdmin({ user, children }) {
  if (!user?.isAdmin) return <Navigate to="/" />;
  return children;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = localStorage.getItem("eftoken");
    if (t) {
      setToken(t);
      api("/api/auth/me").then(setUser).catch(() => clearToken()).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) return <div className="page text-center" style={{ paddingTop: 100 }}><h2>⚡</h2><p>Loading...</p></div>;
  if (!user) return <Routes>
    <Route path="/login" element={<Login onLogin={setUser} />} />
    <Route path="/register" element={<Register onRegister={setUser} />} />
    <Route path="*" element={<Navigate to="/login" />} />
  </Routes>;

  return <>
    <Navbar user={user} onLogout={() => { clearToken(); setUser(null); }} />
    <div className="page">
      <Routes>
        <Route path="/" element={<CoursesList user={user} />} />
        <Route path="/course/:id" element={<CourseDetail user={user} />} />
        <Route path="/course/:id/lesson/:lessonId" element={<WatchLesson user={user} />} />
        {user.role === "author" && <Route path="/create" element={<CreateCourse user={user} />} />}
        {user.role === "author" && <Route path="/my-courses" element={<MyCourses user={user} />} />}
        <Route path="/my-learning" element={<MyLearning user={user} />} />
        <Route path="/admin" element={<RequireAdmin user={user}><AdminPanel user={user} /></RequireAdmin>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  </>;
}
