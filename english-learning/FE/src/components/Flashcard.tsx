import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { useNavigate } from 'react-router-dom';
import { dictionaryApi } from '../services/api';

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

const Bg = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #f7f9fb 0%, #e6f0fa 100%);
  padding: 2rem 0;
`;

const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 600px;
  margin: 0 auto 2rem auto;
`;

const Progress = styled.div`
  font-size: 1.1rem;
  color: #888;
`;

const SettingsBtn = styled.button`
  background: none;
  border: none;
  font-size: 1.3rem;
  cursor: pointer;
  color: #888;
`;

const FlashcardContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 320px;
`;

const Card = styled.div<{flipped: boolean}>`
  width: 380px;
  height: 220px;
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  font-weight: 500;
  position: relative;
  perspective: 1000px;
  cursor: pointer;
  transition: box-shadow 0.2s;
  user-select: none;
  transform-style: preserve-3d;
  transition: transform 0.6s;
  transform: ${props => props.flipped ? 'rotateY(180deg)' : 'none'};
`;

const CardFace = styled.div<{back?: boolean}>`
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 18px;
  background: #fff;
  color: #222;
  font-size: 1.3rem;
  padding: 1.5rem;
  box-sizing: border-box;
  ${props => props.back && `transform: rotateY(180deg); background: #f7f9fb; color: #764ba2;`}
`;

const Actions = styled.div`
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin-top: 2rem;
`;

const ActionBtn = styled.button`
  background: #1abc9c;
  color: #fff;
  border: none;
  border-radius: 12px;
  padding: 0.7rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;
  &:hover { background: #16a085; transform: translateY(-2px); }
`;

const NavBtn = styled(ActionBtn)`
  background: #b39ddb;
  &:hover { background: #9575cd; }
`;

const Flashcard = () => {
  const [words, setWords] = useState<any[]>([]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<Set<number>>(new Set());
  const [review, setReview] = useState<Set<number>>(new Set());
  const [loadingDefinition, setLoadingDefinition] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!user) return;
    fetch(`/api/auth/vocabulary?userId=${user.id}`)
      .then(res => res.json())
      .then(data => {
        console.log('Flashcard: Fetched vocabulary on mount:', data);
        console.log('Flashcard: Words with definitions:', data.filter((word: any) => 
          word.definition && 
          word.definition !== word.word && 
          !word.definition.includes('From ') && 
          !word.definition.includes('Saved from')
        ));
        setWords(Array.isArray(data) ? data : []);
      });
  }, []);

  if (words.length === 0) {
    return <Bg><div style={{textAlign:'center',marginTop:'4rem'}}>No words in your vocab bank yet.</div></Bg>;
  }

  const word = words[idx];

  const handleFlip = () => setFlipped(f => !f);
  const handlePrev = () => { setIdx(i => Math.max(0, i-1)); setFlipped(false); };
  const handleNext = () => { setIdx(i => Math.min(words.length-1, i+1)); setFlipped(false); };
  const handleKnown = () => setKnown(prev => new Set(Array.from(prev).concat(idx)));
  const handleReview = () => setReview(prev => new Set(Array.from(prev).concat(idx)));

  const fetchDefinition = async () => {
    if (!word.word) return;
    
    // Check if definition is already available and is a proper dictionary definition
    if (word.definition && 
        word.definition !== word.word && 
        !word.definition.includes('From ') && 
        !word.definition.includes('Saved from')) {
      // Definition is already saved and looks like a proper dictionary definition, no need to fetch
      return;
    }
    
    setLoadingDefinition(true);
    try {
      const data = await dictionaryApi.getDefinition(word.word);
      const updatedWords = words.map((w, i) => 
        i === idx ? { ...w, definition: data.definition, partOfSpeech: data.partOfSpeech } : w
      );
      setWords(updatedWords);
      
      // Save the fetched definition to the backend so it persists
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      if (user) {
        try {
          console.log('Saving definition to database:', {
            word: word.word,
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
              word: word.word,
              definition: data.definition,
              example: word.example || '',
              difficulty: word.difficulty || 'BEGINNER',
              pronunciation: data.pronunciation || '',
              partOfSpeech: data.partOfSpeech || '',
              synonyms: data.synonyms || ''
            })
          });
          
          if (saveResponse.ok) {
            const savedWord = await saveResponse.json();
            console.log('Definition saved successfully to database:', savedWord);
          } else {
            const errorData = await saveResponse.json();
            console.error('Failed to save definition to database:', errorData);
          }
        } catch (saveError) {
          console.error('Could not save definition to backend:', saveError);
        }
      }
    } catch (error) {
      console.error('Error fetching definition:', error);
    } finally {
      setLoadingDefinition(false);
    }
  };

  return (
    <Bg>
      <ReturnBtn onClick={()=>navigate('/dashboard')}>← Dashboard</ReturnBtn>
      <TopBar>
        <Progress>{idx+1} / {words.length}</Progress>
        <SettingsBtn title="Back to Dashboard" onClick={()=>navigate('/dashboard')}>⚙️</SettingsBtn>
      </TopBar>
      <FlashcardContainer>
        <Card flipped={flipped} onClick={handleFlip} title="Click to flip">
          <CardFace>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                {word.word || word.meaning}
              </div>
              {word.partOfSpeech && (
                <div style={{ fontSize: '0.9rem', color: '#7f8c8d', fontStyle: 'italic' }}>
                  {word.partOfSpeech}
                </div>
              )}
              {word.pronunciation && (
                <div style={{ fontSize: '0.8rem', color: '#16a085', marginTop: '0.3rem' }}>
                  /{word.pronunciation}/
                </div>
              )}
              <div style={{ marginTop: '1rem' }}>
                {/* Only show "Get Definition" button if definition is not available or is a placeholder */}
                {(!word.definition || 
                  word.definition === word.word || 
                  word.definition.includes('From ') || 
                  word.definition.includes('Saved from')) && (
                  <ActionBtn 
                    onClick={(e) => { e.stopPropagation(); fetchDefinition(); }}
                    disabled={loadingDefinition}
                    style={{ 
                      background: loadingDefinition ? '#95a5a6' : '#1abc9c',
                      fontSize: '0.9rem',
                      padding: '0.5rem 1rem'
                    }}
                  >
                    {loadingDefinition ? '⏳' : '📖'} Get Definition
                  </ActionBtn>
                )}
                {/* Show indicator when definition is already available and is a proper dictionary definition */}
                {(word.definition && 
                  word.definition !== word.word && 
                  !word.definition.includes('From ') && 
                  !word.definition.includes('Saved from')) && (
                  <div style={{ 
                    fontSize: '0.8rem', 
                    color: '#27ae60', 
                    marginTop: '0.5rem',
                    fontWeight: '500'
                  }}>
                    ✓ Definition available
                  </div>
                )}
              </div>
            </div>
          </CardFace>
          <CardFace back>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.8rem' }}>
                Definition
              </div>
              <div style={{ fontSize: '1rem', marginBottom: '0.8rem' }}>
                {word.definition || word.enDef || 'No definition available.'}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#7f8c8d', fontStyle: 'italic' }}>
                Example: {word.example || 'No example available.'}
              </div>
            </div>
          </CardFace>
        </Card>
      </FlashcardContainer>
      <Actions>
        <NavBtn onClick={handlePrev} disabled={idx===0}>←</NavBtn>
        <ActionBtn onClick={handleKnown} style={{background:'#16a085'}}>Known</ActionBtn>
        <ActionBtn onClick={handleReview} style={{background:'#ffd700', color:'#333'}}>Review</ActionBtn>
        <NavBtn onClick={handleNext} disabled={idx===words.length-1}>→</NavBtn>
      </Actions>
    </Bg>
  );
};

export default Flashcard; 