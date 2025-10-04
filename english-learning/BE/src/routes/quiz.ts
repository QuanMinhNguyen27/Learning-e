import { Router } from 'express';
import { prisma } from '../prisma';
import { z } from 'zod';
import type { AuthReq } from '../middleware/auth';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Schema for quiz result submission
const quizResultSchema = z.object({
  quizId: z.number().optional().default(1), // Default vocabulary quiz
  questions: z.array(z.object({
    questionId: z.string(),
    question: z.string(),
    selectedOption: z.string(),
    correctAnswer: z.string(),
    isCorrect: z.boolean(),
    timeSpent: z.number().optional().default(0) // Time spent on this question in seconds
  })),
  totalTimeSpent: z.number(), // Total quiz time in seconds
  score: z.number(),
  totalQuestions: z.number(),
  quizType: z.string().default('vocabulary')
});

// Schema for individual question result
const questionResultSchema = z.object({
  questionId: z.string(),
  question: z.string(),
  selectedOption: z.string(),
  correctAnswer: z.string(),
  isCorrect: z.boolean(),
  timeSpent: z.number().optional().default(0)
});

// Store detailed quiz results
router.post('/submit-result', requireAuth, async (req: AuthReq, res) => {
  try {
    const parsed = quizResultSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ 
        error: 'Invalid quiz result data', 
        details: parsed.error.errors 
      });
    }

    const { quizId, questions, totalTimeSpent, score, totalQuestions, quizType } = parsed.data;

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
        experience: {
          increment: experienceGained
        },
        streak: percentage >= 60 ? {
          increment: 1
        } : 0,
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
      },
      questionResults: questionResults.length
    });

  } catch (error) {
    console.error('Save quiz result error:', error);
    res.status(500).json({ error: 'Failed to save quiz result' });
  }
});

// Get user's quiz history with detailed results
router.get('/history', requireAuth, async (req: AuthReq, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [quizResults, total] = await Promise.all([
      prisma.quizResult.findMany({
        where: { userId: req.userId! },
        skip,
        take: limit,
        orderBy: { completedAt: 'desc' },
        include: {
          questionResults: {
            select: {
              questionId: true,
              question: true,
              selectedOption: true,
              correctAnswer: true,
              isCorrect: true,
              timeSpent: true
            }
          },
          quiz: {
            select: { title: true, category: true }
          }
        }
      }),
      prisma.quizResult.count({ where: { userId: req.userId! } })
    ]);

    res.json({
      quizResults,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get quiz history error:', error);
    res.status(500).json({ error: 'Failed to fetch quiz history' });
  }
});

// Get aggregated quiz statistics for dashboard
router.get('/stats', requireAuth, async (req: AuthReq, res) => {
  try {
    const userId = req.userId!;

    // Get overall quiz statistics
    const [
      totalQuizzes,
      totalQuestions,
      correctAnswers,
      averageScore,
      bestScore,
      recentQuizzes,
      streakData
    ] = await Promise.all([
      // Total quizzes taken
      prisma.quizResult.count({
        where: { userId }
      }),
      
      // Total questions attempted
      prisma.questionResult.count({
        where: {
          quizResult: { userId }
        }
      }),
      
      // Total correct answers
      prisma.questionResult.count({
        where: {
          quizResult: { userId },
          isCorrect: true
        }
      }),
      
      // Average score
      prisma.quizResult.aggregate({
        where: { userId },
        _avg: {
          score: true
        }
      }),
      
      // Best score
      prisma.quizResult.aggregate({
        where: { userId },
        _max: {
          score: true
        }
      }),
      
      // Recent 5 quizzes
      prisma.quizResult.findMany({
        where: { userId },
        take: 5,
        orderBy: { completedAt: 'desc' },
        select: {
          id: true,
          score: true,
          totalQuestions: true,
          completedAt: true
        }
      }),
      
      // Current streak
      prisma.progress.findMany({
        where: { userId },
        select: {
          category: true,
          streak: true,
          lastStudied: true
        }
      })
    ]);

    // Calculate accuracy
    const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
    const avgScore = averageScore._avg.score || 0;
    const bestScoreValue = bestScore._max.score || 0;

    // Calculate improvement trend (compare last 3 vs previous 3)
    const recentScores = recentQuizzes.slice(0, 3).map(q => q.score);
    const olderScores = recentQuizzes.slice(3, 6).map(q => q.score);
    
    const recentAvg = recentScores.length > 0 ? recentScores.reduce((a, b) => a + b, 0) / recentScores.length : 0;
    const olderAvg = olderScores.length > 0 ? olderScores.reduce((a, b) => a + b, 0) / olderScores.length : 0;
    
    const improvement = olderAvg > 0 ? Math.round(((recentAvg - olderAvg) / olderAvg) * 100) : 0;

    res.json({
      totalQuizzes,
      totalQuestions,
      correctAnswers,
      accuracy,
      averageScore: Math.round(avgScore),
      bestScore: bestScoreValue,
      improvement,
      recentQuizzes: recentQuizzes.map(q => ({
        ...q,
        percentage: Math.round((q.score / q.totalQuestions) * 100)
      })),
      streaks: streakData,
      lastQuizDate: recentQuizzes[0]?.completedAt || null
    });

  } catch (error) {
    console.error('Get quiz stats error:', error);
    res.status(500).json({ error: 'Failed to fetch quiz statistics' });
  }
});

// Get detailed quiz result by ID
router.get('/result/:id', requireAuth, async (req: AuthReq, res) => {
  try {
    const quizResultId = parseInt(req.params.id);
    
    const quizResult = await prisma.quizResult.findFirst({
      where: {
        id: quizResultId,
        userId: req.userId!
      },
      include: {
        questionResults: true,
        quiz: {
          select: { title: true, category: true }
        }
      }
    });

    if (!quizResult) {
      return res.status(404).json({ error: 'Quiz result not found' });
    }

    res.json(quizResult);

  } catch (error) {
    console.error('Get quiz result error:', error);
    res.status(500).json({ error: 'Failed to fetch quiz result' });
  }
});

// Get performance analytics by category/topic
router.get('/analytics', requireAuth, async (req: AuthReq, res) => {
  try {
    const userId = req.userId!;
    const category = req.query.category as string;

    // Get quiz results with question details
    const quizResults = await prisma.quizResult.findMany({
      where: {
        userId,
        ...(category && {
          quiz: {
            category: category
          }
        })
      },
      include: {
        questionResults: true,
        quiz: {
          select: { title: true, category: true }
        }
      },
      orderBy: { completedAt: 'desc' }
    });

    // Calculate detailed analytics
    const analytics = {
      totalAttempts: quizResults.length,
      averageScore: 0,
      accuracyByQuestion: {},
      timeAnalysis: {
        averageTimePerQuestion: 0,
        averageTimePerQuiz: 0
      },
      improvementTrend: [],
      weakAreas: []
    };

    if (quizResults.length > 0) {
      // Calculate average score
      const totalScore = quizResults.reduce((sum, result) => sum + result.score, 0);
      analytics.averageScore = Math.round(totalScore / quizResults.length);

      // Calculate accuracy by question type
      const questionStats = {};
      let totalTimePerQuestion = 0;
      let totalQuestions = 0;

      quizResults.forEach(result => {
        result.questionResults.forEach(qResult => {
          const questionKey = qResult.questionId;
          if (!questionStats[questionKey]) {
            questionStats[questionKey] = {
              total: 0,
              correct: 0,
              avgTime: 0,
              times: []
            };
          }
          
          questionStats[questionKey].total++;
          if (qResult.isCorrect) {
            questionStats[questionKey].correct++;
          }
          questionStats[questionKey].times.push(qResult.timeSpent);
          totalTimePerQuestion += qResult.timeSpent;
          totalQuestions++;
        });
      });

      // Calculate accuracy percentages
      Object.keys(questionStats).forEach(questionKey => {
        const stats = questionStats[questionKey];
        analytics.accuracyByQuestion[questionKey] = {
          accuracy: Math.round((stats.correct / stats.total) * 100),
          attempts: stats.total,
          averageTime: Math.round(stats.times.reduce((a, b) => a + b, 0) / stats.times.length)
        };
      });

      // Calculate time analysis
      analytics.timeAnalysis.averageTimePerQuestion = totalQuestions > 0 ? 
        Math.round(totalTimePerQuestion / totalQuestions) : 0;
      
      const totalQuizTime = quizResults.reduce((sum, result) => sum + result.timeSpent, 0);
      analytics.timeAnalysis.averageTimePerQuiz = Math.round(totalQuizTime / quizResults.length);

      // Calculate improvement trend (weekly)
      const weeklyData = {};
      quizResults.forEach(result => {
        const week = new Date(result.completedAt).toISOString().split('T')[0].substring(0, 7); // YYYY-MM
        if (!weeklyData[week]) {
          weeklyData[week] = { scores: [], count: 0 };
        }
        weeklyData[week].scores.push(result.score);
        weeklyData[week].count++;
      });

      analytics.improvementTrend = Object.keys(weeklyData).map(week => ({
        week,
        averageScore: Math.round(weeklyData[week].scores.reduce((a, b) => a + b, 0) / weeklyData[week].scores.length),
        attempts: weeklyData[week].count
      }));

      // Identify weak areas (questions with < 70% accuracy)
      analytics.weakAreas = Object.keys(questionStats)
        .filter(questionKey => analytics.accuracyByQuestion[questionKey].accuracy < 70)
        .map(questionKey => ({
          questionId: questionKey,
          accuracy: analytics.accuracyByQuestion[questionKey].accuracy,
          attempts: analytics.accuracyByQuestion[questionKey].attempts
        }));
    }

    res.json(analytics);

  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

export default router;
