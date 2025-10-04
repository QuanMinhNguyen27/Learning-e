# English Learning Platform - Complete Code Explanation

## Project Overview
This document provides a comprehensive explanation of the codebase from Frontend (React/TypeScript) to Backend (Node.js/Express) for the English Learning Platform.

---

## 🎯 **Frontend Architecture (React + TypeScript)**

### **1. Main Application Structure**

#### **App.tsx - Application Entry Point**
```typescript
// Main routing and authentication wrapper
export default function App() {
  const HomeGate = () => localStorage.getItem('token') ? 
    <Navigate to="/dashboard" replace /> : <Landing />;

  return (
    <HideNavbarWrapper>
      <Routes>
        <Route path="/" element={<HomeGate />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/vocab-bank" element={<PrivateRoute><VocabBank /></PrivateRoute>} />
        <Route path="/watching" element={<PrivateRoute><Watching /></PrivateRoute>} />
        <Route path="/quiz" element={<PrivateRoute><Quiz /></PrivateRoute>} />
        <Route path="/flashcard" element={<PrivateRoute><Flashcard /></PrivateRoute>} />
      </Routes>
    </HideNavbarWrapper>
  );
}
```

**Key Features:**
- **Private Routes**: JWT token validation for protected pages
- **Conditional Navigation**: Redirects authenticated users to dashboard
- **Dynamic Navbar**: Hides navbar on login/register pages

#### **Authentication System**
```typescript
const PrivateRoute = ({ children }: { children: ReactNode }) => {
  const token = localStorage.getItem('token');
  return token ? <>{children}</> : <Navigate to="/login" replace />;
};
```

---

### **2. Core Components**

#### **Dashboard.tsx - Main User Interface**
```typescript
const Dashboard = () => {
  const [user, setUser] = useState<{ email: string, name?: string } | null>(null);
  const [vocabWords, setVocabWords] = useState<any[]>([]);
  const [quizStats, setQuizStats] = useState<any>(null);

  // Quiz unlock logic
  const QUIZ_UNLOCK_THRESHOLD = 10;
  const currentWordCount = vocabWords.length;
  const progress = (currentWordCount / QUIZ_UNLOCK_THRESHOLD) * 100;
  const isQuizUnlocked = currentWordCount >= QUIZ_UNLOCK_THRESHOLD;

  useEffect(() => {
    const fetchUserAndVocab = async () => {
      // Fetch user info
      const response = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setUser(data.data);
      
      // Fetch vocabulary
      const vocabRes = await fetch(`/api/auth/vocabulary?userId=${data.data.id}`);
      const vocabData = await vocabRes.json();
      setVocabWords(Array.isArray(vocabData) ? vocabData : []);
    };
    fetchUserAndVocab();
  }, []);
};
```

**Features:**
- **Progress Tracking**: Visual progress bar for quiz unlocking
- **Statistics Display**: Vocabulary count, quiz scores, accuracy
- **Gamification**: Unlock system requiring 10 words
- **Real-time Updates**: Fetches latest user data and progress

#### **VocabBank.tsx - Vocabulary Management**
```typescript
const VocabBank = () => {
  const [words, setWords] = useState<VocabWord[]>([]);
  const [search, setSearch] = useState('');
  const [loadingWords, setLoadingWords] = useState<Set<number>>(new Set());

  const fetchWordDefinition = async (word: string, index: number) => {
    setLoadingWords(prev => new Set(prev).add(index));
    
    try {
      const data = await dictionaryApi.getDefinition(word);
      const updatedWord: VocabWord = {
        ...words[index],
        definition: data.definition,
        pronunciation: data.pronunciation || '',
        partOfSpeech: data.partOfSpeech || '',
        synonyms: data.synonyms || ''
      };
      
      const updatedWords = words.map((w, i) => i === index ? updatedWord : w);
      setWords(updatedWords);
      
      // Save to backend
      await fetch('/api/vocab', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updatedWord)
      });
    } catch (error) {
      console.error('Error fetching definition:', error);
    } finally {
      setLoadingWords(prev => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
    }
  };
};
```

**Features:**
- **Dictionary Integration**: Free Dictionary API for definitions
- **Search Functionality**: Filter words by search term
- **Pronunciation**: Web Speech API integration
- **CRUD Operations**: Add, edit, delete vocabulary words
- **Progress Tracking**: Quiz unlock progress display

#### **Watching.tsx - Multimedia Learning**
```typescript
const Watching = () => {
  const [selected, setSelected] = useState<number | null>(null);
  const [selectedText, setSelectedText] = useState('');
  const [showSave, setShowSave] = useState(false);

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        if (lyricsRef.current && lyricsRef.current.contains(range.commonAncestorContainer)) {
          const text = selection.toString().trim();
          setSelectedText(text);
          setShowSave(!!text);
        }
      }
    };
    document.addEventListener('mouseup', handleSelection);
    return () => document.removeEventListener('mouseup', handleSelection);
  }, []);

  const handleSave = async () => {
    if (selectedText) {
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      
      // Find example sentence
      let example = 'Saved from video';
      if (selected !== null) {
        const item = filteredItems[selected];
        const sentences = item.lyrics.match(/[^.!?\n]+[.!?\n]+/g) || [item.lyrics];
        const found = sentences.find(s => s.toLowerCase().includes(selectedText.toLowerCase()));
        if (found) example = found.trim();
      }

      // Fetch dictionary data
      const dictionaryResponse = await fetch(`/api/auth/dictionary/${encodeURIComponent(selectedText.toLowerCase())}`);
      const dictionaryData = await dictionaryResponse.json();

      // Save to vocabulary
      const newWord = {
        userId: user.id,
        word: selectedText,
        definition: dictionaryData?.definition || selectedText,
        example,
        difficulty: 'BEGINNER',
        pronunciation: dictionaryData?.pronunciation || '',
        partOfSpeech: dictionaryData?.partOfSpeech || '',
        synonyms: dictionaryData?.synonyms || ''
      };
      
      await fetch('/api/auth/vocabulary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWord)
      });
    }
  };
};
```

**Features:**
- **Video/Audio Content**: YouTube embed integration
- **Interactive Lyrics**: Click-to-highlight words
- **Context-Aware Saving**: Finds example sentences automatically
- **Dictionary Integration**: Automatic definition fetching
- **Content Categorization**: Filter by type (music, movies)

#### **Quiz.tsx - Assessment System**
```typescript
const Quiz = () => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [questionResults, setQuestionResults] = useState<any[]>([]);

  const generateQuestions = (vocabWords: VocabWord[]) => {
    const shuffled = [...vocabWords].sort(() => Math.random() - 0.5);
    const selectedWords = shuffled.slice(0, Math.min(10, shuffled.length));
    
    const quizQuestions: QuizQuestion[] = selectedWords.map((word, index) => {
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
      return { word, ...questionType };
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

  const submitQuizResults = async () => {
    const totalTimeSpent = Math.round((Date.now() - startTime) / 1000);
    const token = localStorage.getItem('token');
    
    const response = await fetch('/api/quiz/submit-result', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        quizId: 1,
        questions: questionResults,
        totalTimeSpent,
        score,
        totalQuestions: questions.length,
        quizType: 'vocabulary'
      })
    });
  };
};
```

**Features:**
- **Dynamic Question Generation**: Creates questions from user's vocabulary
- **Multiple Question Types**: Definition and sentence completion
- **Adaptive Options**: Generates distractors from other words
- **Progress Tracking**: Time tracking and detailed analytics
- **Result Storage**: Saves comprehensive quiz results

---

## 🔧 **Backend Architecture (Node.js + Express)**

### **1. Server Configuration**

#### **server.ts - Main Server Setup**
```typescript
import express from 'express';
import cors from 'cors';
import path from 'path';

const app = express();

// Middleware configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file serving
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Route configuration
app.use('/api/auth', authRoutes);
app.use('/api/vocab', vocabRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/quiz', quizRoutes);
```

**Features:**
- **CORS Configuration**: Cross-origin resource sharing
- **Static File Serving**: Multimedia content delivery
- **Route Organization**: Modular API structure
- **Environment Variables**: Configurable settings

### **2. Authentication System**

#### **auth.ts - Authentication Routes**
```typescript
// JWT authentication middleware
export const requireAuth = (req: AuthReq, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// User registration
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create user
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name }
    });
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );
    
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

// User login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );
    
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});
```

**Features:**
- **JWT Authentication**: Stateless token-based auth
- **Password Hashing**: bcrypt with salt rounds
- **User Validation**: Email uniqueness and credential verification
- **Token Expiration**: 7-day token lifetime
- **Error Handling**: Comprehensive error responses

### **3. Vocabulary Management**

#### **vocab.ts - Vocabulary Routes**
```typescript
// Get user's vocabulary
router.get('/', requireAuth, async (req: AuthReq, res) => {
  try {
    const userId = req.query.userId as string;
    const vocabulary = await prisma.vocabulary.findMany({
      where: { userId: parseInt(userId) },
      orderBy: { createdAt: 'desc' }
    });
    res.json(vocabulary);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch vocabulary' });
  }
});

// Add new vocabulary word
router.post('/', requireAuth, async (req: AuthReq, res) => {
  try {
    const { word, definition, example, difficulty, pronunciation, partOfSpeech, synonyms } = req.body;
    
    const vocabulary = await prisma.vocabulary.create({
      data: {
        word,
        definition,
        example,
        difficulty: difficulty || 'BEGINNER',
        pronunciation,
        partOfSpeech,
        synonyms: synonyms || [],
        userId: req.userId!
      }
    });
    
    res.json(vocabulary);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add vocabulary' });
  }
});

// Update vocabulary word
router.put('/:id', requireAuth, async (req: AuthReq, res) => {
  try {
    const { id } = req.params;
    const { word, definition, example, difficulty, pronunciation, partOfSpeech, synonyms } = req.body;
    
    const vocabulary = await prisma.vocabulary.update({
      where: { id: parseInt(id) },
      data: {
        word,
        definition,
        example,
        difficulty,
        pronunciation,
        partOfSpeech,
        synonyms
      }
    });
    
    res.json(vocabulary);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update vocabulary' });
  }
});

// Delete vocabulary word
router.delete('/:id', requireAuth, async (req: AuthReq, res) => {
  try {
    const { id } = req.params;
    
    await prisma.vocabulary.delete({
      where: { id: parseInt(id) }
    });
    
    res.json({ message: 'Vocabulary deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete vocabulary' });
  }
});
```

**Features:**
- **CRUD Operations**: Complete vocabulary management
- **User Isolation**: Each user sees only their vocabulary
- **Data Validation**: Input validation and error handling
- **Flexible Fields**: Support for pronunciation, synonyms, etc.

### **4. Quiz System**

#### **quiz.ts - Quiz Routes**
```typescript
// Submit quiz results
router.post('/submit-result', requireAuth, async (req: AuthReq, res) => {
  try {
    const { quizId, questions, totalTimeSpent, score, totalQuestions, quizType } = req.body;

    // Create quiz result record
    const quizResult = await prisma.quizResult.create({
      data: {
        userId: req.userId!,
        quizId,
        score,
        totalQuestions,
        timeSpent: totalTimeSpent
      }
    });

    // Store individual question results
    const questionResults = await Promise.all(
      questions.map(question => 
        prisma.questionResult.create({
          data: {
            quizResultId: quizResult.id,
            questionId: question.questionId,
            question: question.question,
            selectedOption: question.selectedOption,
            correctAnswer: question.correctAnswer,
            isCorrect: question.isCorrect,
            timeSpent: question.timeSpent || 0
          }
        })
      )
    );

    // Update user progress
    const percentage = Math.round((score / totalQuestions) * 100);
    const experienceGained = Math.round(score * 10 + (percentage >= 80 ? 50 : 0));

    await prisma.progress.upsert({
      where: {
        userId_category: {
          userId: req.userId!,
          category: quizType
        }
      },
      update: {
        experience: { increment: experienceGained },
        streak: percentage >= 60 ? { increment: 1 } : 0,
        lastStudied: new Date()
      },
      create: {
        userId: req.userId!,
        category: quizType,
        experience: experienceGained,
        streak: percentage >= 60 ? 1 : 0,
        level: 1
      }
    });

    res.json({
      message: 'Quiz result saved successfully',
      quizResult: {
        id: quizResult.id,
        score,
        totalQuestions,
        percentage,
        experienceGained
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save quiz result' });
  }
});

// Get quiz statistics
router.get('/stats', requireAuth, async (req: AuthReq, res) => {
  try {
    const userId = req.userId!;

    const [
      totalQuizzes,
      totalQuestions,
      correctAnswers,
      averageScore,
      recentQuizzes
    ] = await Promise.all([
      prisma.quizResult.count({ where: { userId } }),
      prisma.questionResult.count({ where: { quizResult: { userId } } }),
      prisma.questionResult.count({ where: { quizResult: { userId }, isCorrect: true } }),
      prisma.quizResult.aggregate({ where: { userId }, _avg: { score: true } }),
      prisma.quizResult.findMany({
        where: { userId },
        take: 5,
        orderBy: { completedAt: 'desc' },
        select: { id: true, score: true, totalQuestions: true, completedAt: true }
      })
    ]);

    const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
    const avgScore = averageScore._avg.score || 0;

    res.json({
      totalQuizzes,
      totalQuestions,
      correctAnswers,
      accuracy,
      averageScore: Math.round(avgScore),
      recentQuizzes: recentQuizzes.map(q => ({
        ...q,
        percentage: Math.round((q.score / q.totalQuestions) * 100)
      }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch quiz statistics' });
  }
});
```

**Features:**
- **Comprehensive Result Storage**: Detailed question-level tracking
- **Progress System**: Experience points and streaks
- **Analytics**: Performance statistics and trends
- **Gamification**: Bonus XP for high scores

### **5. Database Schema**

#### **Prisma Schema**
```prisma
model User {
  id                Int      @id @default(autoincrement())
  email             String   @unique
  password          String
  name              String?
  role              String   @default("user")
  resetToken        String?
  resetTokenExpiry  DateTime?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  vocabulary  Vocabulary[]
  flashcards  Flashcard[]
  quizResults QuizResult[]
  progress    Progress[]
  uploadedMedia MediaContent[]
}

model Vocabulary {
  id            Int        @id @default(autoincrement())
  word          String
  definition    String
  example       String?
  pronunciation String?
  partOfSpeech  String?
  synonyms      String[]   @default([])
  difficulty    Difficulty @default(BEGINNER)
  userId        Int
  user          User      @relation(fields: [userId], references: [id])
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  repetitions   Int       @default(0)
  nextReview    DateTime  @default(now())
  easeFactor    Float     @default(2.5)
  interval      Int       @default(1)
}

model QuizResult {
  id             Int      @id @default(autoincrement())
  userId         Int
  user           User     @relation(fields: [userId], references: [id])
  quizId         Int
  quiz           Quiz     @relation(fields: [quizId], references: [id])
  score          Int
  totalQuestions Int
  timeSpent      Int
  completedAt    DateTime @default(now())
  questionResults QuestionResult[]
}

model QuestionResult {
  id             Int      @id @default(autoincrement())
  quizResultId   Int
  quizResult     QuizResult @relation(fields: [quizResultId], references: [id], onDelete: Cascade)
  questionId     String
  question       String
  selectedOption String
  correctAnswer  String
  isCorrect      Boolean
  timeSpent      Int      @default(0)
  createdAt      DateTime @default(now())
}

model Progress {
  id          Int      @id @default(autoincrement())
  userId      Int
  user        User     @relation(fields: [userId], references: [id])
  category    String
  level       Int      @default(1)
  experience  Int      @default(0)
  streak      Int      @default(0)
  lastStudied DateTime @default(now())
}
```

**Features:**
- **User Management**: Authentication and profile data
- **Vocabulary Storage**: Comprehensive word data with spaced repetition
- **Quiz System**: Detailed result tracking and analytics
- **Progress Tracking**: Experience points and learning streaks
- **Media Content**: Multimedia file management

---

## 🔄 **Data Flow Architecture**

### **1. Authentication Flow**
```
User Login → Frontend Validation → API Call → Backend Verification → 
JWT Generation → Token Storage → Protected Route Access
```

### **2. Vocabulary Management Flow**
```
Add Word → Frontend Form → API Validation → Database Storage → 
Dictionary Integration → Progress Update → UI Refresh
```

### **3. Quiz Generation Flow**
```
Access Quiz → Check Prerequisites (10 words) → Fetch Vocabulary → 
Generate Questions → Create Options → Present Quiz → 
Track Answers → Calculate Score → Store Results → Update Progress
```

### **4. Multimedia Learning Flow**
```
Select Content → Load Video/Audio → Display Lyrics → 
User Highlights Word → Extract Context → Fetch Definition → 
Save to Vocabulary → Update Progress → Show Feedback
```

---

## 🛠️ **Key Technologies & Libraries**

### **Frontend Stack**
- **React 18.3.1**: Component-based UI framework
- **TypeScript 5.5.4**: Type-safe JavaScript
- **Emotion**: CSS-in-JS styling
- **React Router**: Client-side routing
- **Axios**: HTTP client for API calls

### **Backend Stack**
- **Node.js**: JavaScript runtime
- **Express.js**: Web framework
- **Prisma**: Database ORM
- **PostgreSQL**: Relational database
- **JWT**: Authentication tokens
- **bcryptjs**: Password hashing

### **External APIs**
- **Free Dictionary API**: Word definitions
- **Web Speech API**: Text-to-speech
- **YouTube Embed**: Video content

---

## 📊 **Performance Optimizations**

### **Frontend Optimizations**
- **Component Memoization**: React.memo for expensive components
- **Lazy Loading**: Dynamic imports for routes
- **State Management**: Efficient state updates
- **Caching**: Local storage for user data

### **Backend Optimizations**
- **Database Indexing**: Optimized queries
- **Connection Pooling**: Efficient database connections
- **Caching**: Redis for session data
- **Compression**: Gzip compression for responses

---

## 🔒 **Security Implementation**

### **Authentication Security**
- **JWT Tokens**: Stateless authentication
- **Password Hashing**: bcrypt with salt rounds
- **Token Expiration**: 7-day token lifetime
- **CORS Configuration**: Controlled cross-origin access

### **Data Security**
- **Input Validation**: Zod schema validation
- **SQL Injection Prevention**: Prisma ORM protection
- **File Upload Security**: Type validation and secure storage
- **Environment Variables**: Sensitive data protection

---

This comprehensive code explanation covers the entire architecture from frontend React components to backend Express routes, demonstrating how the English Learning Platform integrates multimedia content with traditional vocabulary learning through a modern, scalable web application.
