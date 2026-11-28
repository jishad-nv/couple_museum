import { useEffect, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { COLORS } from '../../utils/constants';
import type { QuizOptionKey } from '../../utils/secretMystery';

type QuizPhase = 'intro' | 'question' | 'complete';

export default function LoveQuizModal() {
  const showLoveQuizModal = useGameStore((s) => s.showLoveQuizModal);
  const loveQuizSkipIntro = useGameStore((s) => s.loveQuizSkipIntro);
  const setShowLoveQuizModal = useGameStore((s) => s.setShowLoveQuizModal);
  const completeLoveQuiz = useGameStore((s) => s.completeLoveQuiz);
  const secretQuiz = useGameStore((s) => s.secretQuiz);

  const [phase, setPhase] = useState<QuizPhase>('intro');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<QuizOptionKey | null>(null);
  const [answers, setAnswers] = useState<Record<string, QuizOptionKey>>({});

  const questions = secretQuiz;
  const total = questions.length;
  const currentQ = questions[questionIndex] ?? null;

  useEffect(() => {
    if (showLoveQuizModal) {
      setPhase(loveQuizSkipIntro ? 'question' : 'intro');
      setQuestionIndex(0);
      setSelectedOption(null);
      setAnswers({});
    }
  }, [showLoveQuizModal, loveQuizSkipIntro]);

  if (!showLoveQuizModal || total === 0) return null;

  const handleNext = () => {
    if (!currentQ || !selectedOption) return;
    const nextAnswers = { ...answers, [currentQ.id]: selectedOption };
    setAnswers(nextAnswers);

    if (questionIndex + 1 < total) {
      setQuestionIndex(questionIndex + 1);
      setSelectedOption(null);
    } else {
      setPhase('complete');
    }
  };

  const matchedCount = questions.reduce(
    (acc, q) => (answers[q.id] === q.correctOption ? acc + 1 : acc),
    0
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="love-quiz-title"
      data-testid="love-quiz-modal"
      className="ui-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(10, 6, 16, 0.86)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        zIndex: 1210,
        pointerEvents: 'auto',
      }}
    >
      <div
        style={{
          width: 'min(95vw, 560px)',
          background: 'linear-gradient(155deg, #271324 0%, #160c1a 100%)',
          border: `1.5px solid ${COLORS.gold}`,
          borderRadius: 20,
          padding: '26px 26px 24px',
          boxShadow: '0 28px 80px rgba(0, 0, 0, 0.82)',
          color: '#fcf4e8',
          fontFamily: 'Georgia, serif',
          position: 'relative',
        }}
      >
        <button
          type="button"
          data-testid="btn-close-love-quiz"
          aria-label="Close love test"
          onClick={() => setShowLoveQuizModal(false)}
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            width: 30,
            height: 30,
            borderRadius: '50%',
            border: '1px solid rgba(200, 165, 90, 0.35)',
            background: 'rgba(255, 255, 255, 0.06)',
            color: '#f5e6cc',
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          ✕
        </button>

        {phase === 'intro' && (
          <div style={{ textAlign: 'center', padding: '8px 6px' }}>
            <div
              style={{
                fontSize: 11,
                letterSpacing: 2.2,
                textTransform: 'uppercase',
                color: COLORS.goldLight,
                marginBottom: 8,
              }}
            >
              ✦ The Quiz Master Speaks ✦
            </div>
            <h2
              id="love-quiz-title"
              style={{
                margin: '0 0 12px',
                fontSize: 25,
                fontWeight: 500,
                color: '#fff7ea',
                lineHeight: 1.3,
              }}
            >
              ARE YOU READY FOR A LITTLE LOVE TEST?
            </h2>
            <p
              style={{
                margin: '0 auto 22px',
                maxWidth: 420,
                fontSize: 14,
                lineHeight: 1.65,
                color: 'rgba(248, 236, 224, 0.82)',
              }}
            >
              Answer {total} heartfelt questions about your shared story to unlock the golden key
              waiting inside the secret keepsake chest.
            </p>
            <button
              type="button"
              data-testid="btn-begin-love-quiz"
              onClick={() => setPhase('question')}
              style={{
                padding: '12px 28px',
                borderRadius: 12,
                border: `1.5px solid ${COLORS.goldLight}`,
                background: 'linear-gradient(135deg, #b87e32, #834f1a)',
                color: '#fffaf0',
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: 1,
                fontFamily: 'Georgia, serif',
                cursor: 'pointer',
                boxShadow: '0 12px 28px rgba(0, 0, 0, 0.45)',
              }}
            >
              START QUIZ ❤️
            </button>
          </div>
        )}

        {phase === 'question' && currentQ && (
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 10,
                paddingRight: 28,
              }}
            >
              <span
                data-testid="quiz-progress-label"
                style={{
                  fontSize: 11.5,
                  letterSpacing: 1.8,
                  textTransform: 'uppercase',
                  color: COLORS.goldLight,
                }}
              >
                Question {questionIndex + 1} of {total}
              </span>
              <span style={{ fontSize: 11.5, color: 'rgba(248, 236, 224, 0.65)' }}>
                Love Sanctuary Test
              </span>
            </div>

            {/* Progress Bar */}
            <div
              style={{
                height: 5,
                borderRadius: 99,
                background: 'rgba(255, 255, 255, 0.1)',
                overflow: 'hidden',
                marginBottom: 18,
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${((questionIndex + 1) / total) * 100}%`,
                  background: `linear-gradient(90deg, ${COLORS.gold}, #e87296)`,
                  transition: 'width 0.3s ease',
                }}
              />
            </div>

            <h2
              id="love-quiz-title"
              data-testid="quiz-question-text"
              style={{
                margin: '0 0 6px',
                fontSize: 20,
                fontWeight: 500,
                color: '#fff8ec',
                lineHeight: 1.35,
              }}
            >
              {currentQ.question}
            </h2>
            {currentQ.description && (
              <p
                style={{
                  margin: '0 0 16px',
                  fontSize: 13,
                  color: 'rgba(248, 236, 224, 0.72)',
                  fontStyle: 'italic',
                }}
              >
                {currentQ.description}
              </p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 20 }}>
              {(['A', 'B', 'C', 'D'] as const).map((letter) => {
                const selected = selectedOption === letter;
                return (
                  <button
                    key={letter}
                    type="button"
                    data-testid={`quiz-option-${letter}`}
                    onClick={() => setSelectedOption(letter)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: 11,
                      border: selected
                        ? `1.5px solid ${COLORS.goldLight}`
                        : '1px solid rgba(200, 165, 90, 0.28)',
                      background: selected
                        ? 'linear-gradient(135deg, rgba(168, 54, 92, 0.65), rgba(112, 34, 62, 0.68))'
                        : 'rgba(255, 250, 240, 0.04)',
                      color: '#fff7eb',
                      fontSize: 13.5,
                      fontFamily: 'Georgia, serif',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.16s ease',
                    }}
                  >
                    <span
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: '50%',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 700,
                        flexShrink: 0,
                        background: selected ? COLORS.gold : 'rgba(200, 165, 90, 0.18)',
                        color: selected ? '#1d101c' : COLORS.goldLight,
                      }}
                    >
                      {letter}
                    </span>
                    <span style={{ flex: 1 }}>{currentQ.options[letter]}</span>
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                data-testid="btn-quiz-next"
                disabled={!selectedOption}
                onClick={handleNext}
                style={{
                  padding: '10px 22px',
                  borderRadius: 10,
                  border: `1px solid ${COLORS.goldLight}`,
                  background: selectedOption
                    ? 'linear-gradient(135deg, #c89442, #905d20)'
                    : 'rgba(255, 255, 255, 0.08)',
                  color: selectedOption ? '#fffaf0' : 'rgba(255, 255, 255, 0.42)',
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: 'Georgia, serif',
                  cursor: selectedOption ? 'pointer' : 'not-allowed',
                }}
              >
                {questionIndex + 1 < total ? 'NEXT →' : 'FINISH TEST ❤️'}
              </button>
            </div>
          </div>
        )}

        {phase === 'complete' && (
          <div data-testid="quiz-completion-card" style={{ textAlign: 'center', padding: '10px 6px' }}>
            <div style={{ fontSize: 38, marginBottom: 8 }}>❤️ ✨ 🔑</div>
            <div
              style={{
                fontSize: 11,
                letterSpacing: 2,
                textTransform: 'uppercase',
                color: COLORS.goldLight,
                marginBottom: 6,
              }}
            >
              Love Test Complete · {matchedCount} of {total} Matched
            </div>
            <h2
              id="love-quiz-title"
              style={{ margin: '0 0 10px', fontSize: 24, fontWeight: 500, color: '#fff8ec' }}
            >
              YOU UNLOCKED A SPECIAL MEMORY ❤️
            </h2>
            <p
              style={{
                margin: '0 auto 20px',
                maxWidth: 420,
                fontSize: 13.5,
                lineHeight: 1.6,
                color: 'rgba(248, 236, 224, 0.85)',
              }}
            >
              The keepsake Reward Box in this Pre-Secret Room is now open—collect your Golden Key
              and read the Secret Letter waiting inside!
            </p>
            <button
              type="button"
              data-testid="btn-quiz-finish-close"
              onClick={completeLoveQuiz}
              style={{
                padding: '11px 24px',
                borderRadius: 11,
                border: `1.5px solid ${COLORS.goldLight}`,
                background: 'linear-gradient(135deg, #c89442, #905d20)',
                color: '#fffaf0',
                fontSize: 13.5,
                fontWeight: 700,
                fontFamily: 'Georgia, serif',
                cursor: 'pointer',
              }}
            >
              OPEN REWARD BOX &amp; LETTER ✨
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
