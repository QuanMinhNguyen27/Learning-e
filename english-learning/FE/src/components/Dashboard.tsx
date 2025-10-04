import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';
import styled from '@emotion/styled';

const Layout = styled.div`
  display: flex;
  min-height: 70vh;
  align-items: center;
  justify-content: center;
  background: #f8f9fb;
`;

const ImageSection = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 320px;
`;

const StyledImg = styled.img`
  width: 320px;
  height: 180px;
  object-fit: cover;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.08);
`;

const Card = styled.div`
  flex: 1;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.08);
  padding: 2.5rem 2rem;
  margin-left: 2rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

const NavButtons = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const NavButton = styled.button`
  background: #e6f4ea;
  color: #1abc9c;
  border: none;
  border-radius: 20px;
  padding: 0.5rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
  &.active, &:hover {
    background: #1abc9c;
    color: #fff;
  }
`;

const Welcome = styled.h2`
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  font-weight: 600;
`;

const Subtext = styled.p`
  color: #888;
  margin-bottom: 2rem;
`;

const StatsRow = styled.div`
  display: flex;
  gap: 2rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: #f8f9fb;
  border-radius: 12px;
  padding: 1.2rem 2rem;
  min-width: 160px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
`;

const StatLabel = styled.div`
  color: #888;
  font-size: 1rem;
  margin-bottom: 0.5rem;
`;

const StatValue = styled.div`
  color: #1abc9c;
  font-size: 1.5rem;
  font-weight: 700;
`;

const LogoutButton = styled.button`
  margin-top: auto;
  background: #ff4d4d;
  color: white;
  border: none;
  padding: 0.5rem 1.5rem;
  border-radius: 20px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  align-self: flex-end;
  &:hover {
    background: #ff3333;
  }
`;

const QuizProgressCard = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  color: white;
  position: relative;
  overflow: hidden;
`;

const QuizProgressTitle = styled.h4`
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const QuizProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
`;

const QuizProgressFill = styled.div<{ progress: number }>`
  height: 100%;
  background: linear-gradient(90deg, #ffd700, #ffed4e);
  width: ${props => Math.min(props.progress, 100)}%;
  transition: width 0.3s ease;
  border-radius: 4px;
`;

const QuizProgressText = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  opacity: 0.9;
`;

const QuizButton = styled.button<{ disabled: boolean }>`
  background: ${props => props.disabled ? 'rgba(255, 255, 255, 0.3)' : '#ffd700'};
  color: ${props => props.disabled ? 'rgba(255, 255, 255, 0.7)' : '#333'};
  border: none;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s;
  margin-top: 0.8rem;
  
  &:hover {
    transform: ${props => props.disabled ? 'none' : 'translateY(-1px)'};
    box-shadow: ${props => props.disabled ? 'none' : '0 2px 8px rgba(0,0,0,0.2)'};
  }
`;

const getInitial = (name: string) => name ? name[0].toUpperCase() : '?';

const Dashboard = () => {
  const [user, setUser] = useState<{ email: string, name?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vocabWords, setVocabWords] = useState<any[]>([]);
  const [quizStats, setQuizStats] = useState<any>(null);
  const navigate = useNavigate();

  // Quiz unlock logic
  const QUIZ_UNLOCK_THRESHOLD = 10;
  const currentWordCount = vocabWords.length;
  const progress = (currentWordCount / QUIZ_UNLOCK_THRESHOLD) * 100;
  const wordsNeeded = Math.max(0, QUIZ_UNLOCK_THRESHOLD - currentWordCount);
  const isQuizUnlocked = currentWordCount >= QUIZ_UNLOCK_THRESHOLD;

  useEffect(() => {
    const token = localStorage.getItem('token');
    const fetchUserAndVocab = async () => {
      try {
        // Fetch user info
        const response = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          setUser(data.data);
          
          // Fetch vocab for this user
          const vocabRes = await fetch(`/api/auth/vocabulary?userId=${data.data.id}`);
          const vocabContentType = vocabRes.headers.get('content-type');
          if (vocabContentType && vocabContentType.includes('application/json')) {
            const vocabData = await vocabRes.json();
            setVocabWords(Array.isArray(vocabData) ? vocabData : []);
          } else {
            const text = await vocabRes.text();
            setError('Vocab API did not return JSON: ' + text);
          }

          // Fetch quiz statistics
          try {
            const quizRes = await fetch('/api/quiz/stats', {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            if (quizRes.ok) {
              const quizData = await quizRes.json();
              setQuizStats(quizData);
            }
          } catch (quizError) {
            console.log('Quiz stats not available yet');
          }
        } else {
          const text = await response.text();
          setError('User API did not return JSON: ' + text);
        }
      } catch (error: any) {
        setError(error?.message || 'Error fetching user data.');
      } finally {
        setLoading(false);
      }
    };
    fetchUserAndVocab();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleStartQuiz = () => {
    if (isQuizUnlocked) {
      navigate('/quiz');
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '3rem', fontSize: '1.2rem' }}>Loading dashboard...</div>;
  }

  if (error) {
    return <div style={{ color: 'red', textAlign: 'center', marginTop: '3rem', fontSize: '1.2rem' }}>{error}</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#fafbfc' }}>
      <nav style={{ position: 'relative', height: 80 }}>
        {/* No navigation or profile button */}
      </nav>
      <Layout>
        <ImageSection>
          <StyledImg src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80" alt="Dashboard Visual" />
        </ImageSection>
        <Card>
          <NavButtons>
            <NavButton className="active">Dashboard</NavButton>
            <NavButton onClick={() => navigate('/profile')}>Profile</NavButton>
            <NavButton onClick={() => navigate('/vocab-bank')}>Vocab Bank</NavButton>
            <NavButton onClick={() => navigate('/watching')}>Watching</NavButton>
            <NavButton onClick={() => navigate('/quiz')}>Quiz</NavButton>
            <NavButton onClick={() => navigate('/quiz-history')}>Quiz History</NavButton>
            <NavButton onClick={() => navigate('/flashcard')}>Flashcard</NavButton>
          </NavButtons>
          <Welcome>Welcome back {user.name || user.email.split('@')[0]}! <span role="img" aria-label="wave">👋</span></Welcome>
          <Subtext>Check your stats and vocabulary progress</Subtext>
          <StatsRow>
            <StatCard>
              <StatLabel>Vocabulary Words</StatLabel>
              <StatValue>{vocabWords.length}</StatValue>
            </StatCard>
            <StatCard>
              <StatLabel>Quizzes Taken</StatLabel>
              <StatValue>{quizStats?.totalQuizzes || 0}</StatValue>
            </StatCard>
            <StatCard>
              <StatLabel>Quiz Accuracy</StatLabel>
              <StatValue>{quizStats?.accuracy || 0}%</StatValue>
            </StatCard>
            <StatCard>
              <StatLabel>Average Score</StatLabel>
              <StatValue>{quizStats?.averageScore || 0}</StatValue>
            </StatCard>
          </StatsRow>
          
          {/* Quiz Progress Card */}
          <QuizProgressCard>
            <QuizProgressTitle>
              {isQuizUnlocked ? (
                <>
                  <span role="img" aria-label="unlocked">✨</span>
                  Quiz Unlocked!
                </>
              ) : (
                <>
                  <span role="img" aria-label="target">🎯</span>
                  Unlock Quiz Mode
                </>
              )}
            </QuizProgressTitle>
            
            <div style={{ opacity: 0.9, marginBottom: '0.8rem', fontSize: '0.9rem' }}>
              {isQuizUnlocked ? (
                'Ready to test your vocabulary knowledge!'
              ) : (
                `Collect ${wordsNeeded} more word${wordsNeeded !== 1 ? 's' : ''} to unlock quiz mode`
              )}
            </div>
            
            <QuizProgressBar>
              <QuizProgressFill progress={progress} />
            </QuizProgressBar>
            <QuizProgressText>
              <span>{currentWordCount} / {QUIZ_UNLOCK_THRESHOLD} words</span>
              <span>{Math.round(progress)}% complete</span>
            </QuizProgressText>
            
            <QuizButton 
              disabled={!isQuizUnlocked} 
              onClick={handleStartQuiz}
            >
              {isQuizUnlocked ? '🚀 Start Quiz' : `🔒 Need ${wordsNeeded} more`}
            </QuizButton>
          </QuizProgressCard>

          {/* Recent Quiz Results */}
          {quizStats && quizStats.recentQuizzes && quizStats.recentQuizzes.length > 0 && (
            <QuizProgressCard style={{ marginTop: '1.5rem' }}>
              <QuizProgressTitle>
                <span role="img" aria-label="chart">📊</span>
                Recent Quiz Results
              </QuizProgressTitle>
              <div style={{ marginTop: '1rem' }}>
                {quizStats.recentQuizzes.slice(0, 3).map((quiz: any, index: number) => (
                  <div key={quiz.id} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '0.5rem 0',
                    borderBottom: index < 2 ? '1px solid #e0e0e0' : 'none'
                  }}>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                        Quiz #{quizStats.totalQuizzes - index}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#666' }}>
                        {new Date(quiz.completedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ 
                        fontWeight: 'bold', 
                        color: quiz.percentage >= 80 ? '#27ae60' : quiz.percentage >= 60 ? '#f39c12' : '#e74c3c'
                      }}>
                        {quiz.percentage}%
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#666' }}>
                        {quiz.score}/{quiz.totalQuestions}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {quizStats.improvement !== 0 && (
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '0.5rem', 
                  backgroundColor: quizStats.improvement > 0 ? '#d5f4e6' : '#fadbd8',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  textAlign: 'center'
                }}>
                  {quizStats.improvement > 0 ? '📈' : '📉'} 
                  {quizStats.improvement > 0 ? 'Improving' : 'Declining'} by {Math.abs(quizStats.improvement)}%
                </div>
              )}
            </QuizProgressCard>
          )}
          
          <LogoutButton onClick={handleLogout}>Logout</LogoutButton>
        </Card>
      </Layout>
    </div>
  );
};

export default Dashboard; 