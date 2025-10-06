import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';

const ProfileContainer = styled.div`
  max-width: 800px;
  margin: 2rem auto;
  padding: 0 1rem;
`;

const ProfileCard = styled.div`
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.08);
  padding: 2.5rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 2rem;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin: 2rem 0;
  width: 100%;
`;

const StatCard = styled.div`
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 12px;
  text-align: center;
  border: 1px solid #e9ecef;
`;

const StatNumber = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: #1abc9c;
  margin-bottom: 0.5rem;
`;

const StatLabel = styled.div`
  color: #7f8c8d;
  font-size: 0.9rem;
`;

const QuizHistoryCard = styled.div`
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.08);
  padding: 2rem;
  width: 100%;
`;

const SectionTitle = styled.h3`
  color: #2c3e50;
  margin: 0 0 1rem 0;
  font-size: 1.3rem;
`;

const RecentQuizItem = styled.div`
  padding: 1rem;
  border-bottom: 1px solid #ecf0f1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  &:last-child {
    border-bottom: none;
  }
`;

const QuizScore = styled.div<{ percentage: number }>`
  font-weight: bold;
  font-size: 1.1rem;
  color: ${props => 
    props.percentage >= 80 ? '#27ae60' : 
    props.percentage >= 60 ? '#f39c12' : '#e74c3c'
  };
`;

const ViewAllButton = styled.button`
  background: #1abc9c;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  margin-top: 1rem;
  &:hover {
    background: #16a085;
  }
`;

const Avatar = styled.div`
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: #e6f4ea;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  color: #1abc9c;
  margin-bottom: 1.5rem;
`;

const Name = styled.h2`
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  font-weight: 600;
`;

const Email = styled.p`
  color: #888;
  margin-bottom: 2rem;
`;

const BackButton = styled.button`
  background: #e6f4ea;
  color: #1abc9c;
  border: none;
  border-radius: 20px;
  padding: 0.5rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
  &:hover {
    background: #1abc9c;
    color: #fff;
  }
`;

interface QuizStats {
  totalQuizzes: number;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  averageScore: number;
  bestScore: number;
  recentQuizzes: Array<{
    id: number;
    score: number;
    totalQuestions: number;
    completedAt: string;
    percentage: number;
  }>;
}

const Profile = () => {
  const [user, setUser] = useState<{ email: string, name?: string } | null>(null);
  const [quizStats, setQuizStats] = useState<QuizStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const fetchData = async () => {
      try {
        // Fetch user data
        const userResponse = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUser(userData.user || userData.data);
        }

        // Fetch quiz statistics
        const statsResponse = await fetch('/api/quiz/stats', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setQuizStats({
            totalQuizzes: statsData.totalQuizzes,
            totalQuestions: statsData.totalQuestions,
            correctAnswers: statsData.correctAnswers,
            accuracy: statsData.accuracy,
            averageScore: statsData.averageScore,
            bestScore: statsData.bestScore,
            recentQuizzes: statsData.recentQuizzes || []
          });
        }
      } catch (err) {
        setError('Error fetching profile data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) return <ProfileContainer>Loading profile...</ProfileContainer>;
  if (error) return <ProfileContainer style={{ color: 'red' }}>{error}</ProfileContainer>;
  if (!user) return null;

  return (
    <ProfileContainer>
      <ProfileCard>
        <Avatar>{user.name ? user.name[0].toUpperCase() : user.email[0].toUpperCase()}</Avatar>
        <Name>{user.name || user.email.split('@')[0]}</Name>
        <Email>{user.email}</Email>
        <BackButton onClick={() => navigate('/dashboard')}>Back to Dashboard</BackButton>
      </ProfileCard>

      {/* Quiz Statistics */}
      {quizStats && (
        <StatsGrid>
          <StatCard>
            <StatNumber>{quizStats.totalQuizzes}</StatNumber>
            <StatLabel>Total Quizzes</StatLabel>
          </StatCard>
          <StatCard>
            <StatNumber>{quizStats.accuracy}%</StatNumber>
            <StatLabel>Overall Accuracy</StatLabel>
          </StatCard>
          <StatCard>
            <StatNumber>{quizStats.averageScore}</StatNumber>
            <StatLabel>Average Score</StatLabel>
          </StatCard>
          <StatCard>
            <StatNumber>{quizStats.bestScore}</StatNumber>
            <StatLabel>Best Score</StatLabel>
          </StatCard>
        </StatsGrid>
      )}

      {/* Recent Quiz History */}
      {quizStats && quizStats.recentQuizzes.length > 0 && (
        <QuizHistoryCard>
          <SectionTitle>Recent Quiz Results</SectionTitle>
          {quizStats.recentQuizzes.slice(0, 5).map((quiz) => (
            <RecentQuizItem key={quiz.id}>
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                  Quiz #{quiz.id}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#7f8c8d' }}>
                  {quiz.score}/{quiz.totalQuestions} correct • {formatDate(quiz.completedAt)}
                </div>
              </div>
              <QuizScore percentage={quiz.percentage}>
                {quiz.percentage}%
              </QuizScore>
            </RecentQuizItem>
          ))}
          <ViewAllButton onClick={() => navigate('/quiz-history')}>
            View All Quiz History
          </ViewAllButton>
        </QuizHistoryCard>
      )}

      {/* No quiz data message */}
      {quizStats && quizStats.totalQuizzes === 0 && (
        <QuizHistoryCard>
          <SectionTitle>Quiz History</SectionTitle>
          <div style={{ textAlign: 'center', padding: '2rem', color: '#7f8c8d' }}>
            <p>You haven't taken any quizzes yet!</p>
            <p>Start learning by taking your first quiz.</p>
            <ViewAllButton onClick={() => navigate('/quiz')}>
              Take Your First Quiz
            </ViewAllButton>
          </div>
        </QuizHistoryCard>
      )}
    </ProfileContainer>
  );
};

export default Profile; 