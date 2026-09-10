// Hydrates `.quiz[data-quiz]` blocks (rendered from recovered WeeklyQuiz
// data — see plan/astro-rebuild.md) with click-to-answer feedback, wired
// into gameState.recordQuiz() so the "quiz accuracy" stat on /progress becomes
// real instead of permanently 0%. Loaded once from Base.astro.
import {m} from '../paraglide/messages.js';

function initQuiz(quiz: Element) {
  if (quiz.hasAttribute('data-hydrated')) return;
  quiz.setAttribute('data-hydrated', '1');
  const questions = Array.from(quiz.querySelectorAll('.quiz-q'));
  let answered = 0;
  let correct = 0;

  questions.forEach((q) => {
    const answerIdx = Number((q as HTMLElement).dataset.answer);
    const options = Array.from(q.querySelectorAll('.quiz-q__opt')) as HTMLButtonElement[];
    const feedback = q.querySelector('.quiz-q__feedback') as HTMLElement | null;

    options.forEach((opt, idx) => {
      opt.addEventListener('click', async () => {
        if (q.classList.contains('quiz-q--answered')) return;
        q.classList.add('quiz-q--answered');
        const isCorrect = idx === answerIdx;
        opt.classList.add(isCorrect ? 'quiz-q__opt--correct' : 'quiz-q__opt--wrong');
        if (!isCorrect) options[answerIdx]?.classList.add('quiz-q__opt--correct');
        if (feedback) {
          feedback.hidden = false;
          feedback.textContent = isCorrect ? m.quiz_feedback_correct() : m.quiz_feedback_wrong();
          feedback.classList.toggle('quiz-q__feedback--correct', isCorrect);
        }
        answered++;
        if (isCorrect) correct++;
        try {
          const gs = await import('./gameState.ts');
          gs.recordQuiz(isCorrect);
        } catch {
          // offline: skip
        }

        if (answered === questions.length) {
          const summary = quiz.querySelector('[data-quiz-summary]') as HTMLElement | null;
          if (summary) {
            summary.hidden = false;
            summary.textContent = m.quiz_summary({correct, total: questions.length});
          }
        }
      });
    });
  });
}

export function initQuizzes(root: ParentNode = document) {
  root.querySelectorAll('[data-quiz]').forEach(initQuiz);
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => initQuizzes());
}