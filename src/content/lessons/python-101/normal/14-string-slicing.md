---
title: "String Slicing"
description: "Extract substrings with Python's powerful slice notation."
module: "strings"
order: 14
difficulty: "beginner"
estimatedMinutes: 12
learningObjectives:
  - "Use slice notation [start:stop:step] to extract substrings"
  - "Reverse strings and skip characters with step"
  - "Use negative indices to count from the end"
  - "Apply slicing to lists (same syntax)"
prerequisites: ["13-string-methods"]
tags: ["slicing", "substring", "indices", "step"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## Basic slicing

The syntax is `string[start:stop:step]` — `start` is inclusive, `stop` is exclusive:

```python
text = "Python"
text[0:3]    # 'Pyt'
text[2:5]    # 'tho'
text[:4]     # 'Pyth'  (start defaults to 0)
text[3:]     # 'hon'   (stop defaults to end)
text[:]      # 'Python' (full copy)
```

## Negative indices

Count from the end with negative numbers:

```python
text = "Python"
text[-1]     # 'n'  (last character)
text[-3:]    # 'hon' (last 3 characters)
text[:-2]    # 'Pyth' (all except last 2)
text[-4:-1]  # 'tho'
```

## Step

The third parameter controls the stride:

```python
text = "abcdefghij"
text[::2]    # 'acegi'   (every 2nd character)
text[1::2]   # 'bdfhj'   (every 2nd, starting at index 1)
text[::-1]   # 'jihgfedcba'  (reversed!)
text[::-2]   # 'jhfdb'   (every 2nd, reversed)
```

## Slicing never errors

Unlike indexing, slicing never raises `IndexError` — it just returns what it can:

```python
text = "hi"
text[0:100]   # 'hi'  (no error, just stops at end)
text[100:200] # ''    (empty string)
```

## Slicing works on lists too

The same syntax works for any sequence:

```python
nums = [0, 1, 2, 3, 4, 5]
nums[1:4]     # [1, 2, 3]
nums[::-1]    # [5, 4, 3, 2, 1, 0]
```

## Common pitfalls

- **Confusing `text[3]` (indexing, one char) with `text[3:4]` (slicing, still one char but a new string)**
- **Assuming `stop` is inclusive** — `text[0:3]` gives characters at 0, 1, 2
- **Using slice assignment on strings** — strings don't support it (lists do: `nums[1:3] = [9, 9]`)

<section class="lesson-section lesson-section--challenges">
<h2 id="-challenges">🧩 Challenges</h2>

<details class="challenge">
<summary>Challenge — think first, then reveal</summary>
<div class="challenge__body">

Reverse the string `"racecar"` using slicing.

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>"racecar"[::-1]</code> → <code>"racecar"</code> (it's a palindrome!)</p>

</div>
</details>

<details class="challenge">
<summary>Challenge — think first, then reveal</summary>
<div class="challenge__body">

Given `"abcdefghij"`, extract every 3rd character: `a`, `d`, `g`, `j`.

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>"abcdefghij"[::3]</code> → <code>"adgj"</code></p>

</div>
</details>

</section>

<section class="lesson-section lesson-section--socratic">
<h2 id="-socratic-questions">🤔 Socratic Questions</h2>

- Why does slicing never raise an error but indexing does? What design philosophy does this reflect?
- How would you swap two elements in a list using only slice assignment?
- If `text[::-1]` reverses a string, how would you check if a string is a palindrome in one line?

</section>

<section class="lesson-section lesson-section--projects">
<h2 id="-projects-you-can-build">Projects You Can Build</h2>

<p>Here are a few real-world projects that reinforce these concepts:</p>

<ul>
  <li>🎮 <strong>Wordle Clone</strong> - Use slicing to extract letters and compare slices for color-coded feedback</li>
  <li>🎨 <strong>AI Story Writer</strong> - Apply slicing for text manipulation and paragraph extraction</li>
  <li>✅ <strong>Note-Taking App</strong> - Use slicing for preview generation and text truncation</li>
</ul>

</section>

<section class="lesson-section lesson-section--quiz">
<h2 id="-quick-check">✅ Quick check</h2>

<div class="quiz" data-quiz="python-101-string-slicing">
  <div class="quiz-q" data-answer="0">
    <p class="quiz-q__prompt">1. What does <code>"Python"[1:4]</code> return?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">'yth'</button>
      <button class="quiz-q__opt" data-idx="1">'Pyt'</button>
      <button class="quiz-q__opt" data-idx="2">'ytho'</button>
      <button class="quiz-q__opt" data-idx="3">'Pyth'</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>

  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">2. How do you reverse a string <code>s</code>?</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">s.reverse()</button>
      <button class="quiz-q__opt" data-idx="1">s[::-0]</button>
      <button class="quiz-q__opt" data-idx="2">s[::-1]</button>
      <button class="quiz-q__opt" data-idx="3">s[::1]</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
</div>
</section>
