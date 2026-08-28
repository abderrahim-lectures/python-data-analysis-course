import React, {useState} from 'react';
import Translate from '@docusaurus/Translate';
import {STORAGE_KEYS} from '@site/src/utils/storageKeys';
import styles from './styles.module.css';

interface SurveyQuestion {
  id: string;
  question: React.ReactNode;
  options: {label: React.ReactNode; value: string}[];
}

interface MicroSurveyProps {
  onComplete: (profile: StudentProfile) => void;
}

export interface StudentProfile {
  experience: 'none' | 'some' | 'experienced';
  learningStyle: 'step-by-step' | 'project-based' | 'reading';
}

const QUESTIONS: SurveyQuestion[] = [
  {
    id: 'experience',
    question: (
      <Translate id="microSurvey.question1">
        Have you ever written code before?
      </Translate>
    ),
    options: [
      {label: <Translate id="microSurvey.option1a">No, this is my first time</Translate>, value: 'none'},
      {label: <Translate id="microSurvey.option1b">A little (HTML/CSS or similar)</Translate>, value: 'some'},
      {label: <Translate id="microSurvey.option1c">Yes, I know some Python</Translate>, value: 'experienced'},
    ],
  },
  {
    id: 'learningStyle',
    question: (
      <Translate id="microSurvey.question2">
        How do you learn best?
      </Translate>
    ),
    options: [
      {label: <Translate id="microSurvey.option2a">Step by step, with examples</Translate>, value: 'step-by-step'},
      {label: <Translate id="microSurvey.option2b">By building something real</Translate>, value: 'project-based'},
      {label: <Translate id="microSurvey.option2c">By reading and thinking</Translate>, value: 'reading'},
    ],
  },
];

export default function MicroSurvey({onComplete}: MicroSurveyProps): React.JSX.Element {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Partial<StudentProfile>>({});

  const handleAnswer = (value: string) => {
    const questionId = QUESTIONS[currentQuestion].id;
    const newAnswers = {...answers, [questionId]: value};
    setAnswers(newAnswers);

    if (currentQuestion < QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Survey complete
      const profile: StudentProfile = {
        experience: (newAnswers.experience as StudentProfile['experience']) || 'none',
        learningStyle: (newAnswers.learningStyle as StudentProfile['learningStyle']) || 'step-by-step',
      };
      localStorage.setItem(STORAGE_KEYS.studentProfile, JSON.stringify(profile));
      onComplete(profile);
    }
  };

  const question = QUESTIONS[currentQuestion];

  return (
    <div className={styles.survey} role="group" aria-labelledby="survey-question">
      <div className={styles.header}>
        <span className={styles.progress}>
          <Translate id="microSurvey.progress" values={{current: currentQuestion + 1, total: QUESTIONS.length}}>
            {'Question {current} of {total}'}
          </Translate>
        </span>
      </div>

      <div className={styles.progressBar}>
        <div 
          className={styles.progressFill}
          style={{width: `${((currentQuestion + 1) / QUESTIONS.length) * 100}%`}}
        />
      </div>

      <h3 id="survey-question" className={styles.question}>{question.question}</h3>

      <div className={styles.options} role="radiogroup" aria-labelledby="survey-question">
        {question.options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={styles.option}
            role="radio"
            aria-checked={answers[question.id as keyof StudentProfile] === option.value}
            onClick={() => handleAnswer(option.value)}>
            {option.label}
          </button>
        ))}
      </div>

      {currentQuestion > 0 && (
        <button
          type="button"
          className={styles.backButton}
          onClick={() => setCurrentQuestion(currentQuestion - 1)}>
          ← Back
        </button>
      )}
    </div>
  );
}
