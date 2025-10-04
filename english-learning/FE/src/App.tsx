import React, { ReactNode, useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';
import VocabBank from './components/VocabBank';
import Watching from './components/Watching';
import Quiz from './components/Quiz';
import QuizHistory from './components/QuizHistory';
import Flashcard from './components/Flashcard';
import Landing from './components/Landing';
import Navbar from './components/Navbar';
import './App.css';

const PrivateRoute = ({ children }: { children: ReactNode }) => {
  const token = localStorage.getItem('token');
  return token ? <>{children}</> : <Navigate to="/login" replace />;
};

function HideNavbarWrapper({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const hide = pathname.startsWith('/login') || pathname.startsWith('/register');
  return <>
    {!hide && <Navbar />}
    {children}
  </>;
}

export default function App() {
  // Optional: keep user in localStorage fresh
  const [ready, setReady] = useState(true);
  useEffect(() => { setReady(true); }, []);
  if (!ready) return null;

  const HomeGate = () => localStorage.getItem('token') ? <Navigate to="/dashboard" replace /> : <Landing />;

  return (
    <HideNavbarWrapper>
      <Routes>
        <Route path="/" element={<HomeGate />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/vocab-bank" element={<PrivateRoute><VocabBank /></PrivateRoute>} />
        <Route path="/watching" element={<PrivateRoute><Watching /></PrivateRoute>} />
        <Route path="/quiz" element={<PrivateRoute><Quiz /></PrivateRoute>} />
        <Route path="/quiz-history" element={<PrivateRoute><QuizHistory /></PrivateRoute>} />
        <Route path="/flashcard" element={<PrivateRoute><Flashcard /></PrivateRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HideNavbarWrapper>
  );
}
