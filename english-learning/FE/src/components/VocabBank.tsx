import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import { dictionaryApi } from '../services/api';

const Container = styled.div`
  max-width: 700px;
  margin: 3rem auto;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.08);
  padding: 2.5rem 2rem;
`;

const Title = styled.h2`
  margin-bottom: 1.5rem;
`;

const SearchInput = styled.input`
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 20px;
  font-size: 1rem;
  margin-bottom: 1.5rem;
  width: 100%;
`;

const WordList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 0 2rem 0;
`;

const WordItem = styled.li`
  background: #f8f9fb;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  font-size: 1.1rem;
  border-left: 4px solid #1abc9c;
`;

const WordHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const WordTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const WordText = styled.strong`
  font-size: 1.3rem;
  color: #2c3e50;
`;

const WordActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button`
  background: #1abc9c;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 0.4rem 0.8rem;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.2s;
  &:hover {
    background: #16a085;
  }
`;

const SecondaryButton = styled(ActionButton)`
  background: #95a5a6;
  &:hover {
    background: #7f8c8d;
  }
`;

const DefinitionSection = styled.div`
  margin: 1rem 0;
  padding: 1rem;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #ecf0f1;
`;

const DefinitionTitle = styled.h4`
  color: #34495e;
  margin-bottom: 0.5rem;
  font-size: 1rem;
`;

const DefinitionText = styled.p`
  color: #2c3e50;
  line-height: 1.5;
  margin: 0.5rem 0;
`;

const ExampleText = styled.div`
  font-style: italic;
  color: #7f8c8d;
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 4px;
  border-left: 3px solid #1abc9c;
`;

const LoadingText = styled.div`
  color: #7f8c8d;
  font-style: italic;
`;

const ErrorText = styled.div`
  color: #e74c3c;
  font-size: 0.9rem;
`;

const InfoText = styled.div`
  color: #16a085;
  font-size: 0.9rem;
  font-style: italic;
`;

const AddForm = styled.form`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
`;

const AddInput = styled.input`
  flex: 1;
  min-width: 200px;
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 20px;
  font-size: 1rem;
`;

const AddButton = styled.button`
  background: #1abc9c;
  color: #fff;
  border: none;
  border-radius: 20px;
  padding: 0.5rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
  &:hover {
    background: #16a085;
  }
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

const QuizUnlockCard = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
  color: white;
  position: relative;
  overflow: hidden;
`;

const QuizUnlockContent = styled.div`
  position: relative;
  z-index: 2;
`;

const QuizUnlockTitle = styled.h3`
  margin: 0 0 1rem 0;
  font-size: 1.4rem;
  font-weight: 600;
`;

const ProgressContainer = styled.div`
  margin: 1.5rem 0;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 12px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 0.5rem;
`;

const ProgressFill = styled.div<{ progress: number }>`
  height: 100%;
  background: linear-gradient(90deg, #ffd700, #ffed4e);
  width: ${props => Math.min(props.progress, 100)}%;
  transition: width 0.3s ease;
  border-radius: 6px;
`;

const ProgressText = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
  opacity: 0.9;
`;

const QuizButton = styled.button<{ disabled: boolean }>`
  background: ${props => props.disabled ? 'rgba(255, 255, 255, 0.3)' : '#ffd700'};
  color: ${props => props.disabled ? 'rgba(255, 255, 255, 0.7)' : '#333'};
  border: none;
  border-radius: 12px;
  padding: 0.8rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s;
  margin-top: 1rem;
  
  &:hover {
    transform: ${props => props.disabled ? 'none' : 'translateY(-2px)'};
    box-shadow: ${props => props.disabled ? 'none' : '0 4px 12px rgba(0,0,0,0.2)'};
  }
`;

const SparkleIcon = styled.span`
  font-size: 1.2rem;
  margin-right: 0.5rem;
`;

const ReturnBtn = styled.button`
  position: fixed;
  top: 24px;
  left: 24px;
  background: #fff;
  color: #16a085;
  border: 2px solid #16a085;
  border-radius: 12px;
  padding: 0.5rem 1.2rem;
  font-size: 1rem;
  font-weight: 600;
  z-index: 2000;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  transition: background 0.2s, color 0.2s;
  &:hover { background: #16a085; color: #fff; }
`;

type VocabWord = {
  word: string;
  definition: string;
  example: string;
  difficulty: string;
  pronunciation?: string;
  partOfSpeech?: string;
  synonyms?: string;
  // add other fields if needed
};

const VocabBank = () => {
  const [words, setWords] = useState<VocabWord[]>([]);
  const [search, setSearch] = useState('');
  const [newMeaning, setNewMeaning] = useState('');
  const [newEnDef, setNewEnDef] = useState('');
  const [newViDef, setNewViDef] = useState('');
  const [newExample, setNewExample] = useState('');
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editWord, setEditWord] = useState<VocabWord | null>(null);
  const [loadingWords, setLoadingWords] = useState<Set<number>>(new Set());
  const [apiStatus, setApiStatus] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!user) return;
    fetch(`/api/auth/vocabulary?userId=${user.id}`)
      .then(res => res.json())
      .then(data => {
        console.log('Fetched vocabulary on mount:', data);
        console.log('Words with definitions:', data.filter((word: any) => 
          word.definition && 
          word.definition !== word.word && 
          !word.definition.includes('From ') && 
          !word.definition.includes('Saved from')
        ));
        setWords(data);
      })
      .catch(() => setWords([]));
  }, []);

  // Quiz unlock logic
  const QUIZ_UNLOCK_THRESHOLD = 10; // Need 10 words to unlock quiz
  const currentWordCount = words.length;
  const progress = (currentWordCount / QUIZ_UNLOCK_THRESHOLD) * 100;
  const wordsNeeded = Math.max(0, QUIZ_UNLOCK_THRESHOLD - currentWordCount);
  const isQuizUnlocked = currentWordCount >= QUIZ_UNLOCK_THRESHOLD;

  const handleStartQuiz = () => {
    if (isQuizUnlocked) {
      navigate('/quiz');
    }
  };

  const filteredWords = words.filter(word =>
    word.word.toLowerCase().includes(search.toLowerCase())
  );

  const fetchWordDefinition = async (word: string, index: number) => {
    // Check if definition is already available and is a proper dictionary definition
    const currentWord = words[index];
    if (currentWord.definition && 
        currentWord.definition !== word && 
        !currentWord.definition.includes('From ') && 
        !currentWord.definition.includes('Saved from')) {
      // Definition is already available and looks like a proper dictionary definition, no need to fetch
      return;
    }
    
    setLoadingWords(prev => new Set(prev).add(index));
    
    try {
      const data = await dictionaryApi.getDefinition(word);
      setApiStatus('Free Dictionary API');
      
      const updatedWord: VocabWord = {
        ...words[index],
        definition: data.definition,
        word: word,
        example: words[index].example || '',
        difficulty: words[index].difficulty || 'BEGINNER',
        pronunciation: data.pronunciation || '',
        partOfSpeech: data.partOfSpeech || '',
        synonyms: data.synonyms || ''
      };
      
      const updatedWords = words.map((w, i) => i === index ? updatedWord : w);
      setWords(updatedWords);
      
      // Save the fetched definition to the backend so it persists
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      if (user) {
        try {
          console.log('Saving definition to database:', {
            word: word,
            definition: data.definition,
            pronunciation: data.pronunciation,
            partOfSpeech: data.partOfSpeech,
            synonyms: data.synonyms
          });
          
          const saveResponse = await fetch('/api/vocab', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
              word: word,
              definition: data.definition,
              example: words[index].example || '',
              difficulty: words[index].difficulty || 'BEGINNER',
              pronunciation: data.pronunciation || '',
              partOfSpeech: data.partOfSpeech || '',
              synonyms: data.synonyms || ''
            })
          });
          
          if (saveResponse.ok) {
            const savedWord = await saveResponse.json();
            console.log('Definition saved successfully to database:', savedWord);
            setApiStatus('Definition saved to database');
          } else {
            const errorData = await saveResponse.json();
            console.error('Failed to save definition to database:', errorData);
            setApiStatus('Failed to save definition to database');
          }
        } catch (saveError) {
          console.error('Could not save definition to backend:', saveError);
          setApiStatus('Error saving definition to database');
        }
      }
    } catch (error) {
      console.error('Error fetching definition:', error);
      setApiStatus('Failed to fetch definition');
    } finally {
      setLoadingWords(prev => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    console.log('Current user:', user);
    if (!user) return;

    if (
      newMeaning &&
      newExample &&
      !words.some(w => w.word === newMeaning)
    ) {
      // Fetch Free Dictionary data for the word
      let dictionaryData = null;
      try {
        const dictionaryResponse = await fetch(`/api/auth/dictionary/${encodeURIComponent(newMeaning.toLowerCase())}`);
        if (dictionaryResponse.ok) {
          dictionaryData = await dictionaryResponse.json();
        } else {
          console.log('Free Dictionary API not available, using fallback');
        }
      } catch (error) {
        console.log('Could not fetch dictionary data:', error);
      }

      const newWord = {
        userId: user.id,
        word: newMeaning,
        definition: newEnDef || dictionaryData?.definition || newMeaning,
        example: newExample,
        difficulty: 'BEGINNER',
        pronunciation: dictionaryData?.pronunciation || '',
        partOfSpeech: dictionaryData?.partOfSpeech || '',
        synonyms: dictionaryData?.synonyms || ''
      };
      console.log('Sending new word:', newWord);

      const res = await fetch('/api/auth/vocabulary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWord)
      });

      const result = await res.json();
      console.log('POST /vocabulary response:', result);

      if (res.ok) {
        // Refresh vocabulary list
        fetch(`/api/auth/vocabulary?userId=${user.id}`)
          .then(res => res.json())
          .then(data => {
            console.log('Fetched vocabulary after add:', data);
            setWords(data);
          });
        setNewMeaning('');
        setNewEnDef('');
        setNewViDef('');
        setNewExample('');
      }
    }
  };

  const pronounceWord = (word: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new window.SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    } else {
      alert('Sorry, your browser does not support speech synthesis.');
    }
  };

  const handleEdit = (idx: number) => {
    setEditIdx(idx);
    setEditWord(words[idx]);
  };

  const handleEditChange = (field: keyof VocabWord, value: string) => {
    if (!editWord) return;
    setEditWord({ ...editWord, [field]: value });
  };

  const handleEditSave = () => {
    if (editIdx === null || !editWord) return;
    const updated = words.map((w, idx) => idx === editIdx ? editWord : w);
    setWords(updated);
    localStorage.setItem('vocabBank', JSON.stringify(updated));
    setEditIdx(null);
    setEditWord(null);
  };

  const handleEditCancel = () => {
    setEditIdx(null);
    setEditWord(null);
  };

  return (
    <Container>
      <ReturnBtn onClick={()=>navigate('/dashboard')}>← Dashboard</ReturnBtn>
      <Title>Vocab Bank</Title>
      {apiStatus && (
        <InfoText style={{ textAlign: 'center', marginBottom: '1rem' }}>
          Using: {apiStatus}
        </InfoText>
      )}
      
      {/* Quiz Unlock Progress Card */}
      <QuizUnlockCard>
        <QuizUnlockContent>
          <QuizUnlockTitle>
            {isQuizUnlocked ? (
              <>
                <SparkleIcon>✨</SparkleIcon>
                Quiz Unlocked!
              </>
            ) : (
              <>
                <SparkleIcon>🎯</SparkleIcon>
                Unlock Quiz Mode
              </>
            )}
          </QuizUnlockTitle>
          
          <div style={{ opacity: 0.9, marginBottom: '1rem' }}>
            {isQuizUnlocked ? (
              'Congratulations! You have enough words to start practicing with quizzes.'
            ) : (
              `Collect ${wordsNeeded} more word${wordsNeeded !== 1 ? 's' : ''} to unlock quiz mode and test your knowledge!`
            )}
          </div>
          
          <ProgressContainer>
            <ProgressBar>
              <ProgressFill progress={progress} />
            </ProgressBar>
            <ProgressText>
              <span>{currentWordCount} / {QUIZ_UNLOCK_THRESHOLD} words</span>
              <span>{Math.round(progress)}% complete</span>
            </ProgressText>
          </ProgressContainer>
          
          <QuizButton 
            disabled={!isQuizUnlocked} 
            onClick={handleStartQuiz}
          >
            {isQuizUnlocked ? '🚀 Start Quiz' : `🔒 Need ${wordsNeeded} more word${wordsNeeded !== 1 ? 's' : ''}`}
          </QuizButton>
        </QuizUnlockContent>
      </QuizUnlockCard>
      
      <SearchInput
        type="text"
        placeholder="Search words..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <AddForm onSubmit={handleAdd}>
        <AddInput
          type="text"
          placeholder="Word"
          value={newMeaning}
          onChange={e => setNewMeaning(e.target.value)}
          required
        />
        <AddInput
          type="text"
          placeholder="English Definition (optional)"
          value={newEnDef}
          onChange={e => setNewEnDef(e.target.value)}
        />
        <AddInput
          type="text"
          placeholder="Vietnamese Definition (optional)"
          value={newViDef}
          onChange={e => setNewViDef(e.target.value)}
        />
        <AddInput
          type="text"
          placeholder="Example"
          value={newExample}
          onChange={e => setNewExample(e.target.value)}
          required
        />
        <AddButton type="submit">Add Word</AddButton>
      </AddForm>
      <WordList>
        {filteredWords.map((word, idx) => (
          <WordItem key={idx}>
            {editIdx === idx && editWord ? (
              <>
                <AddInput
                  type="text"
                  value={editWord.word}
                  onChange={e => handleEditChange('word', e.target.value)}
                  style={{ marginBottom: 4 }}
                />
                <AddInput
                  type="text"
                  value={editWord.definition || ''}
                  onChange={e => handleEditChange('definition', e.target.value)}
                  placeholder="Definition"
                  style={{ marginBottom: 4 }}
                />
                <AddInput
                  type="text"
                  value={editWord.example}
                  onChange={e => handleEditChange('example', e.target.value)}
                  placeholder="Example"
                  style={{ marginBottom: 4 }}
                />
                <ActionButton type="button" onClick={handleEditSave} style={{ marginRight: 8 }}>Save</ActionButton>
                <SecondaryButton type="button" onClick={handleEditCancel}>Cancel</SecondaryButton>
              </>
            ) : (
              <>
                <WordHeader>
                  <WordTitle>
                    <WordText>{word.word}</WordText>
                  </WordTitle>
                  <WordActions>
                    <ActionButton onClick={() => pronounceWord(word.word)}>
                      🔊
                    </ActionButton>
                    {/* Only show "Get Definition" button if definition is not available or is a placeholder */}
                    {(!word.definition || 
                      word.definition === word.word || 
                      word.definition.includes('From ') || 
                      word.definition.includes('Saved from')) ? (
                      <ActionButton onClick={() => fetchWordDefinition(word.word, idx)}>
                        {loadingWords.has(idx) ? '⏳' : '📖'}
                      </ActionButton>
                    ) : (
                      <div style={{ 
                        fontSize: '0.8rem', 
                        color: '#27ae60', 
                        fontWeight: '500',
                        padding: '0.4rem 0.8rem',
                        background: '#d5f4e6',
                        borderRadius: '8px',
                        border: '1px solid #27ae60'
                      }}>
                        ✓ Definition saved
                      </div>
                    )}
                    <SecondaryButton onClick={() => handleEdit(idx)}>
                      ✏️
                    </SecondaryButton>
                  </WordActions>
                </WordHeader>
                
                {loadingWords.has(idx) && (
                  <LoadingText>Loading definition...</LoadingText>
                )}
                
                {word.definition && (
                  <DefinitionSection>
                    <DefinitionTitle>Definition:</DefinitionTitle>
                    <DefinitionText>{word.definition}</DefinitionText>
                    {word.partOfSpeech && (
                      <DefinitionText style={{ fontStyle: 'italic', color: '#7f8c8d', marginTop: '0.5rem' }}>
                        <strong>Part of Speech:</strong> {word.partOfSpeech}
                      </DefinitionText>
                    )}
                    {word.pronunciation && (
                      <DefinitionText style={{ color: '#16a085', marginTop: '0.5rem' }}>
                        <strong>Pronunciation:</strong> /{word.pronunciation}/
                      </DefinitionText>
                    )}
                  </DefinitionSection>
                )}
                
                <ExampleText>
                  <strong>Example:</strong> {word.example}
                </ExampleText>
              </>
            )}
          </WordItem>
        ))}
      </WordList>
      <BackButton onClick={() => navigate('/dashboard')}>Back to Dashboard</BackButton>
    </Container>
  );
};

export default VocabBank; 