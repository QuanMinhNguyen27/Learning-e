import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';

const Container = styled.div`
  max-width: 1000px;
  margin: 2rem auto;
  padding: 0 1rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  color: #2c3e50;
  margin: 0;
`;

const BackButton = styled.button`
  background: #3498db;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  &:hover {
    background: #2980b9;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  text-align: center;
`;

const StatNumber = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 0.5rem;
`;

const StatLabel = styled.div`
  color: #7f8c8d;
  font-size: 0.9rem;
`;

const QuizList = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  overflow: hidden;
`;

const QuizItem = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid #ecf0f1;
  cursor: pointer;
  transition: background-color 0.2s;
  &:hover {
    background: #f8f9fa;
  }
  &:last-child {
    border-bottom: none;
  }
`;

const QuizHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const QuizTitle = styled.div`
  font-weight: bold;
  font-size: 1.1rem;
  color: #2c3e50;
`;

const QuizScore = styled.div<{ percentage: number }>`
  font-weight: bold;
  font-size: 1.2rem;
  color: ${props => 
    props.percentage >= 80 ? '#27ae60' : 
    props.percentage >= 60 ? '#f39c12' : '#e74c3c'
  };
`;

const QuizDetails = styled.div`
  display: flex;
  justify-content: space-between;
  color: #7f8c8d;
  font-size: 0.9rem;
`;

const LoadingSpinner = styled.div`
  text-align: center;
  padding: 2rem;
  color: #7f8c8d;
`;

const ErrorMessage = styled.div`
  background: #e74c3c;
  color: white;
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
  margin: 1rem 0;
`;

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
`;

const PageButton = styled.button<{ disabled?: boolean }>`
  background: ${props => props.disabled ? '#bdc3c7' : '#3498db'};
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  &:hover {
    background: ${props => props.disabled ? '#bdc3c7' : '#2980b9'};
  }
`;

const PageInfo = styled.div`
  color: #7f8c8d;
  font-size: 0.9rem;
`;

interface QuizResult {
  id: number;
  score: number;
  totalQuestions: number;
  timeSpent: number;
  completedAt: string;
  questionResults: QuestionResult[];
}

interface QuestionResult {
  id: number;
  questionId: string;
  question: string;
  selectedOption: string;
  correctAnswer: string;
  isCorrect: boolean;
  timeSpent: number;
}

interface QuizStats {
  totalQuizzes: number;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  averageScore: number;
  bestScore: number;
}

const QuizHistory = () => {
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [quizStats, setQuizStats] = useState<QuizStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedQuiz, setSelectedQuiz] = useState<QuizResult | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    fetchQuizData();
  }, [navigate, currentPage]);

  const fetchQuizData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch quiz history
      const historyResponse = await fetch(`/api/quiz/history?page=${currentPage}&limit=10`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!historyResponse.ok) {
        throw new Error('Failed to fetch quiz history');
      }

      const historyData = await historyResponse.json();
      setQuizResults(historyData.quizResults);
      setTotalPages(historyData.pagination.pages);

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
        });
      }
    } catch (error: any) {
      setError(error.message || 'Failed to fetch quiz data');
    } finally {
      setLoading(false);
    }
  };

  const handleQuizClick = (quiz: QuizResult) => {
    setSelectedQuiz(quiz);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Container>
        <LoadingSpinner>Loading quiz history...</LoadingSpinner>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <ErrorMessage>{error}</ErrorMessage>
        <BackButton onClick={() => navigate('/dashboard')}>Back to Dashboard</BackButton>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>Quiz History</Title>
        <BackButton onClick={() => navigate('/dashboard')}>Back to Dashboard</BackButton>
      </Header>

      {/* Statistics Overview */}
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

      {/* Quiz Results List */}
      <QuizList>
        {quizResults.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#7f8c8d' }}>
            No quiz results found. Take your first quiz to see results here!
          </div>
        ) : (
          quizResults.map((quiz) => {
            const percentage = Math.round((quiz.score / quiz.totalQuestions) * 100);
            return (
              <QuizItem key={quiz.id} onClick={() => handleQuizClick(quiz)}>
                <QuizHeader>
                  <QuizTitle>Quiz #{quiz.id}</QuizTitle>
                  <QuizScore percentage={percentage}>{percentage}%</QuizScore>
                </QuizHeader>
                <QuizDetails>
                  <span>{quiz.score}/{quiz.totalQuestions} correct</span>
                  <span>{formatTime(quiz.timeSpent)}</span>
                  <span>{formatDate(quiz.completedAt)}</span>
                </QuizDetails>
              </QuizItem>
            );
          })
        )}
      </QuizList>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination>
          <PageButton 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            Previous
          </PageButton>
          <PageInfo>
            Page {currentPage} of {totalPages}
          </PageInfo>
          <PageButton 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Next
          </PageButton>
        </Pagination>
      )}

      {/* Quiz Detail Modal */}
      {selectedQuiz && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '600px',
            maxHeight: '80vh',
            overflow: 'auto',
            width: '90%',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2>Quiz #{selectedQuiz.id} Details</h2>
              <button 
                onClick={() => setSelectedQuiz(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#7f8c8d'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span><strong>Score:</strong> {selectedQuiz.score}/{selectedQuiz.totalQuestions}</span>
                <span><strong>Percentage:</strong> {Math.round((selectedQuiz.score / selectedQuiz.totalQuestions) * 100)}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span><strong>Time:</strong> {formatTime(selectedQuiz.timeSpent)}</span>
                <span><strong>Date:</strong> {formatDate(selectedQuiz.completedAt)}</span>
              </div>
            </div>

            <div>
              <h3>Question Results:</h3>
              {selectedQuiz.questionResults.map((result, index) => (
                <div key={result.id} style={{
                  padding: '1rem',
                  marginBottom: '0.5rem',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  backgroundColor: result.isCorrect ? '#d5f4e6' : '#fadbd8'
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    Question {index + 1}: {result.question}
                  </div>
                  <div style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                    <strong>Your Answer:</strong> {result.selectedOption}
                  </div>
                  <div style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                    <strong>Correct Answer:</strong> {result.correctAnswer}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#666' }}>
                    <strong>Time Spent:</strong> {result.timeSpent}s
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Container>
  );
};

export default QuizHistory;
