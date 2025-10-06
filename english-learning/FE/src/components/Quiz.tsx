import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';

const Bg = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #f7f9fb 0%, #e6f0fa 100%);
  padding: 2rem 0;
`;

const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 700px;
  margin: 0 auto 2rem auto;
`;

const Bonus = styled.div`
  background: #fffbe6;
  color: #b39ddb;
  border-radius: 8px;
  padding: 0.4rem 1.2rem;
  font-weight: 600;
  font-size: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
`;

const Progress = styled.div`
  font-size: 1.1rem;
  color: #888;
  font-weight: 600;
`;

const SettingsBtn = styled.button`
  background: none;
  border: none;
  font-size: 1.3rem;
  cursor: pointer;
  color: #888;
`;

const QuestionCard = styled.div`
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.08);
  padding: 2.5rem 2rem 2rem 2rem;
  margin: 0 auto 2.5rem auto;
  max-width: 700px;
  text-align: center;
  font-size: 1.3rem;
  font-weight: 600;
`;

const Answers = styled.div`
  display: flex;
  justify-content: center;
  gap: 2rem;
  max-width: 900px;
  margin: 0 auto;
  flex-wrap: wrap;
`;

const AnswerBtn = styled.button<{selected?: boolean, correct?: boolean, wrong?: boolean}>`
  flex: 1 1 320px;
  min-width: 220px;
  min-height: 110px;
  font-size: 1.2rem;
  border-radius: 16px;
  border: none;
  margin: 1rem 0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  transition: background 0.2s, transform 0.1s, color 0.2s;
  cursor: pointer;
  background: ${({selected, correct, wrong}) =>
    correct ? '#d4edda' :
    wrong ? '#f8d7da' :
    selected ? '#e3f2fd' : '#b39ddb'};
  color: ${({selected, correct, wrong}) =>
    correct ? '#155724' :
    wrong ? '#721c24' :
    selected ? '#222' : '#fff'};
  font-weight: 600;
  &:hover { transform: scale(1.03); }
  border: ${({correct, wrong}) =>
    correct ? '2px solid #28a745' :
    wrong ? '2px solid #dc3545' : 'none'};
`;

const ResultCard = styled.div`
  text-align: center;
  padding: 2rem;
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.08);
  max-width: 500px;
  margin: 3rem auto;
`;

const ScoreDisplay = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: #1abc9c;
  margin-bottom: 1rem;
`;

const ResultMessage = styled.div`
  font-size: 1.2rem;
  color: #2c3e50;
  margin-bottom: 2rem;
`;

const Button = styled.button`
  background: #1abc9c;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 0.8rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
  margin: 0 0.5rem;
  &:hover { background: #16a085; }
`;

const SecondaryButton = styled(Button)`
  background: #95a5a6;
  &:hover { background: #7f8c8d; }
`;

const StatsContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 2rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
`;

const StatItem = styled.div`
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #1abc9c;
`;

const StatLabel = styled.div`
  font-size: 0.9rem;
  color: #7f8c8d;
`;

type VocabWord = {
  meaning: string;
  example: string;
  enDef?: string;
  viDef?: string;
};

type QuizQuestion = {
  word: VocabWord;
  question: string;
  options: string[];
  correctAnswer: string;
};

const Quiz = () => {
  const [words, setWords] = useState<VocabWord[]>([]);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState<Set<number>>(new Set());
  const [startTime, setStartTime] = useState<number>(0);
  const [questionStartTime, setQuestionStartTime] = useState<number>(0);
  const [questionResults, setQuestionResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!user) {
      navigate('/login');
      return;
    }
    fetch('/api/vocab', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(res => res.json())
      .then(vocabWords => {
        if (!Array.isArray(vocabWords) || vocabWords.length < 10) {
          navigate('/vocab-bank');
          return;
        }
        setWords(vocabWords);
        generateQuestions(vocabWords);
        setStartTime(Date.now());
        setQuestionStartTime(Date.now());
      });
  }, [navigate]);

  const generateQuestions = (vocabWords: VocabWord[]) => {
    const shuffled = [...vocabWords].sort(() => Math.random() - 0.5);
    const selectedWords = shuffled.slice(0, Math.min(10, shuffled.length));
    
    const quizQuestions: QuizQuestion[] = selectedWords.map((word, index) => {
      // Create different types of questions
      const questionTypes = [
        {
          question: `What does "${word.meaning}" mean?`,
          options: generateMeaningOptions(word, selectedWords),
          correctAnswer: word.enDef || word.meaning
        },
        {
          question: `Complete the sentence: "${word.example.replace(word.meaning, '_____')}"`,
          options: generateWordOptions(word, selectedWords),
          correctAnswer: word.meaning
        }
      ];
      
      const questionType = questionTypes[index % questionTypes.length];
      return {
        word,
        ...questionType
      };
    });
    
    setQuestions(quizQuestions);
  };

  const generateMeaningOptions = (correctWord: VocabWord, allWords: VocabWord[]): string[] => {
    const correct = correctWord.enDef || correctWord.meaning;
    const otherWords = allWords.filter(w => w !== correctWord);
    const shuffled = [...otherWords].sort(() => Math.random() - 0.5);
    const wrongOptions = shuffled.slice(0, 3).map(w => w.enDef || w.meaning);
    
    const options = [correct, ...wrongOptions];
    return options.sort(() => Math.random() - 0.5);
  };

  const generateWordOptions = (correctWord: VocabWord, allWords: VocabWord[]): string[] => {
    const otherWords = allWords.filter(w => w !== correctWord);
    const shuffled = [...otherWords].sort(() => Math.random() - 0.5);
    const wrongOptions = shuffled.slice(0, 3).map(w => w.meaning);
    
    const options = [correctWord.meaning, ...wrongOptions];
    return options.sort(() => Math.random() - 0.5);
  };

  const handleAnswerSelect = (answer: string) => {
    if (answered) return;
    setSelectedAnswer(answer);
  };

  const handleSubmitAnswer = () => {
    if (!selectedAnswer || answered) return;
    
    const currentQ = questions[currentQuestion];
    const isCorrect = selectedAnswer === currentQ.correctAnswer;
    const questionTimeSpent = Math.round((Date.now() - questionStartTime) / 1000);
    
    // Store question result
    const questionResult = {
      questionId: `q_${currentQuestion}_${Date.now()}`,
      question: currentQ.question,
      selectedOption: selectedAnswer,
      correctAnswer: currentQ.correctAnswer,
      isCorrect,
      timeSpent: questionTimeSpent
    };
    
    setQuestionResults(prev => [...prev, questionResult]);
    
    if (isCorrect) {
      setScore(score + 1);
      setCorrectAnswers(prev => new Set(Array.from(prev).concat(currentQuestion)));
    }
    
    setAnswered(true);
  };

  const submitQuizResults = async () => {
    try {
      setLoading(true);
      const totalTimeSpent = Math.round((Date.now() - startTime) / 1000);
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/quiz/submit-result', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          quizId: 1, // Default vocabulary quiz
          questions: questionResults,
          totalTimeSpent,
          score,
          totalQuestions: questions.length,
          quizType: 'vocabulary'
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Quiz results saved:', result);
      }
    } catch (error) {
      console.error('Error saving quiz results:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setAnswered(false);
      setQuestionStartTime(Date.now());
    } else {
      setShowResult(true);
      submitQuizResults();
    }
  };

  const handleRestartQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setAnswered(false);
    setScore(0);
    setShowResult(false);
    setCorrectAnswers(new Set());
    setQuestionResults([]);
    setStartTime(Date.now());
    setQuestionStartTime(Date.now());
    generateQuestions(words);
  };

  const handleBackToVocab = () => {
    navigate('/vocab-bank');
  };

  if (questions.length === 0) {
    return (
      <Bg>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div>Loading quiz...</div>
        </div>
      </Bg>
    );
  }

  if (showResult) {
    const percentage = Math.round((score / questions.length) * 100);
    const message = percentage >= 80 ? 'Excellent! You\'re doing great!' :
                   percentage >= 60 ? 'Good job! Keep practicing!' :
                   'Keep studying! You\'ll get better!';
    return (
      <Bg>
        <ResultCard>
          <ScoreDisplay>{score}/{questions.length}</ScoreDisplay>
          <ResultMessage>{message}</ResultMessage>
          {loading && (
            <div style={{ textAlign: 'center', margin: '1rem 0', color: '#7f8c8d' }}>
              Saving your results...
            </div>
          )}
          <div>
            <Button onClick={handleRestartQuiz}>Try Again</Button>
            <SecondaryButton onClick={handleBackToVocab}>Back to Vocab Bank</SecondaryButton>
          </div>
        </ResultCard>
      </Bg>
    );
  }

  const currentQ = questions[currentQuestion];

  return (
    <Bg>
      <TopBar>
        <Bonus>Bonus</Bonus>
        <Progress>{currentQuestion+1}/{questions.length}</Progress>
        <SettingsBtn title="Back to Dashboard" onClick={()=>navigate('/dashboard')}>⚙️</SettingsBtn>
      </TopBar>
      <QuestionCard>{currentQ.question}</QuestionCard>
      <Answers>
        {currentQ.options.map((option, index) => (
          <AnswerBtn
            key={index}
            selected={selectedAnswer === option}
            correct={answered && option === currentQ.correctAnswer}
            wrong={answered && selectedAnswer === option && option !== currentQ.correctAnswer}
            onClick={() => handleAnswerSelect(option)}
            disabled={answered}
          >
            {option}
          </AnswerBtn>
        ))}
      </Answers>
      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        {!answered ? (
          <Button 
            onClick={handleSubmitAnswer}
            disabled={!selectedAnswer}
            style={{ opacity: selectedAnswer ? 1 : 0.6 }}
          >
            Submit Answer
          </Button>
        ) : (
          <Button onClick={handleNextQuestion}>
            {currentQuestion < questions.length - 1 ? 'Next Question' : 'See Results'}
          </Button>
        )}
        <SecondaryButton onClick={handleBackToVocab} style={{ marginLeft: '1rem' }}>
          Exit Quiz
        </SecondaryButton>
      </div>
    </Bg>
  );
};

export default Quiz; 