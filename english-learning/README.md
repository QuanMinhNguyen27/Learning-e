# English Learning Platform

A full-stack English vocabulary learning application built with React, TypeScript, Node.js, Express, and Prisma.

## Project Structure

```
english-learning/
├─ FE/                    # React + TypeScript Frontend
│  ├─ package.json
│  ├─ tsconfig.json
│  ├─ .env               # Frontend environment variables
│  └─ src/
│     ├─ index.tsx
│     ├─ index.css
│     ├─ App.tsx
│     ├─ App.css
│     ├─ components/
│     │  ├─ Navbar.tsx
│     │  ├─ Landing.tsx
│     │  ├─ Login.tsx
│     │  ├─ Register.tsx
│     │  ├─ Dashboard.tsx
│     │  ├─ VocabBank.tsx
│     │  ├─ Watching.tsx
│     │  ├─ Flashcard.tsx
│     │  └─ Quiz.tsx
│     └─ services/
│        └─ api.ts
└─ BE/                    # Node.js + Express + Prisma Backend
   ├─ package.json
   ├─ tsconfig.json
   ├─ .env                # Backend environment variables
   ├─ prisma/
   │  └─ schema.prisma
   └─ src/
      ├─ server.ts
      ├─ prisma.ts
      ├─ middleware/
      │  └─ auth.ts
      └─ routes/
         ├─ auth.ts
         └─ vocab.ts
```

## Features

- **User Authentication**: Login/Register with JWT tokens
- **Vocabulary Management**: Add, edit, delete vocabulary words
- **Interactive Quizzes**: Test your knowledge with adaptive quizzes
- **Flashcard System**: Spaced repetition learning
- **Progress Tracking**: Monitor your learning journey
- **Free Dictionary Integration**: Get definitions and pronunciations

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- PostgreSQL (for production) or SQLite (for development)

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd BE
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables in `.env`:
   ```
   DATABASE_URL="file:./dev.db"
   JWT_SECRET="your-super-secret-jwt-key-here"
   CORS_ORIGIN="http://localhost:3000"
   # Free Dictionary API (no API key required)
   ```

4. Generate Prisma client:
   ```bash
   npm run prisma:generate
   ```

5. Run database migrations:
   ```bash
   npm run prisma:migrate
   ```

6. Start the development server:
   ```bash
   npm run dev
   ```

The backend will be available at `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd FE
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables in `.env`:
   ```
   PORT=3000
   BROWSER=none
   REACT_APP_API_URL=http://localhost:5000/api
   ```

4. Start the development server:
   ```bash
   npm start
   ```

The frontend will be available at `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user info

### Vocabulary
- `GET /api/vocab` - Get user's vocabulary
- `POST /api/vocab` - Add new vocabulary word
- `PUT /api/vocab/:id` - Update vocabulary word
- `DELETE /api/vocab/:id` - Delete vocabulary word

### Free Dictionary
- `GET /api/auth/dictionary/:word` - Get word definition, pronunciation, and synonyms
- `GET /api/auth/dictionary/test` - Test dictionary API endpoint

## Technologies Used

### Frontend
- React 19
- TypeScript
- Emotion (CSS-in-JS)
- React Router
- Formik + Yup
- Axios

### Backend
- Node.js
- Express
- TypeScript
- Prisma ORM
- PostgreSQL/SQLite
- JWT Authentication
- bcryptjs
- CORS

## Development

### Running Tests
```bash
# Frontend tests
cd FE
npm test

# Backend tests (if implemented)
cd BE
npm test
```

### Building for Production
```bash
# Frontend
cd FE
npm run build

# Backend
cd BE
npm run build
```

## Deployment

The project is configured for deployment on:
- **Frontend**: Netlify (with `netlify.toml`)
- **Backend**: Render (with `render.yaml`)

See the respective configuration files for deployment settings.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the ISC License.
