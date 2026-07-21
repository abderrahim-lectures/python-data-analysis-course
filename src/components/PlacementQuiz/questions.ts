import type {DisplayQuizQuestion} from '@site/src/types/quiz';

/** 8-question self-check on Python 101 fundamentals, gating Data Analysis's Hard track. */
export const PLACEMENT_QUIZ_QUESTIONS: DisplayQuizQuestion[] = [
  {
    id: 'variables',
    prompt: 'What does `x = 5` do in Python?',
    options: [
      'Compares x to 5',
      'Creates a variable x holding the value 5',
      'Defines a function named x',
      'Imports a module called 5',
    ],
    correctOptionIndex: 1,
  },
  {
    id: 'types',
    prompt: 'What is the type of `3.0` in Python?',
    options: ['int', 'float', 'str', 'bool'],
    correctOptionIndex: 1,
  },
  {
    id: 'loops',
    prompt: 'What does `for i in range(3):` iterate over?',
    options: ['0, 1, 2', '1, 2, 3', '0, 1, 2, 3', 'An infinite loop'],
    correctOptionIndex: 0,
  },
  {
    id: 'conditionals',
    prompt: 'Which operator checks equality (not assignment) in Python?',
    options: ['=', '==', '<>', ':='],
    correctOptionIndex: 1,
  },
  {
    id: 'lists',
    prompt: 'What does `my_list[0]` return?',
    options: [
      'The last item in the list',
      'The length of the list',
      'The first item in the list',
      'An error, lists start at 1',
    ],
    correctOptionIndex: 2,
  },
  {
    id: 'dicts',
    prompt: 'How do you get the value for key "name" in a dict `d`?',
    options: ['d.name', 'd["name"]', 'd(name)', 'd->name'],
    correctOptionIndex: 1,
  },
  {
    id: 'functions',
    prompt: 'Which keyword defines a function in Python?',
    options: ['function', 'def', 'func', 'lambda'],
    correctOptionIndex: 1,
  },
  {
    id: 'csv',
    prompt: 'Which built-in module helps you read a CSV file in Python 101 Week 5?',
    options: ['json', 'csv', 'os', 're'],
    correctOptionIndex: 1,
  },
];
