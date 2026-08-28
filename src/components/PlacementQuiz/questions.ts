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
    explanation: 'The = operator assigns the value on the right to the variable on the left. In Python, you don\'t need to declare variables — just use them!',
  },
  {
    id: 'types',
    prompt: 'What is the type of `3.0` in Python?',
    options: ['int', 'float', 'str', 'bool'],
    correctOptionIndex: 1,
    explanation: 'Numbers with a decimal point are floats (floating-point numbers). Even though 3.0 is a whole number, the .0 makes it a float.',
  },
  {
    id: 'loops',
    prompt: 'What does `for i in range(3):` iterate over?',
    options: ['0, 1, 2', '1, 2, 3', '0, 1, 2, 3', 'An infinite loop'],
    correctOptionIndex: 0,
    explanation: 'range(3) generates numbers starting from 0 up to (but not including) 3. This is called "zero-based indexing" — a key Python concept.',
  },
  {
    id: 'conditionals',
    prompt: 'Which operator checks equality (not assignment) in Python?',
    options: ['=', '==', '<>', ':='],
    correctOptionIndex: 1,
    explanation: 'Single = assigns a value (x = 5), while double == compares values (x == 5 checks if x equals 5). This is one of the most common beginner mistakes!',
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
    explanation: 'Python lists use zero-based indexing. The first item is at index 0, the second at index 1, and so on.',
  },
  {
    id: 'dicts',
    prompt: 'How do you get the value for key "name" in a dict `d`?',
    options: ['d.name', 'd["name"]', 'd(name)', 'd->name'],
    correctOptionIndex: 1,
    explanation: 'Dictionaries use square brackets with the key name: d["name"]. You can also use d.get("name", default) for a safer approach that doesn\'t crash if the key doesn\'t exist.',
  },
  {
    id: 'functions',
    prompt: 'Which keyword defines a function in Python?',
    options: ['function', 'def', 'func', 'lambda'],
    correctOptionIndex: 1,
    explanation: 'Python uses "def" to define functions (short for "definition"). Other languages like JavaScript use "function", but Python uses "def".',
  },
  {
    id: 'csv',
    prompt: 'Which built-in module helps you read a CSV file in Python 101 Week 5?',
    options: ['json', 'csv', 'os', 're'],
    correctOptionIndex: 1,
    explanation: 'The csv module is built into Python and provides tools for reading and writing CSV files. We\'ll use it in Week 5 to load data from files.',
  },
];
