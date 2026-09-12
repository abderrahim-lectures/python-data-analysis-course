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

## The language of windows

A string is a sequence, and its characters stand at positions $0, 1, 2, \ldots, n-1$. Slicing asks for the window between two boundaries. The notation is `string[start:stop:step]`, and the one asymmetry to memorize is that **`start` is included and `stop` is excluded**, the same half-open rule `range` taught you:

$$
s[a:b] = s_a s_{a+1} \cdots s_{b-1}, \qquad |s[a:b]| = \max(0, b - a).
$$

```python
text = "Python"
text[0:3]    # 'Pyt'
text[2:5]    # 'tho'
text[:4]     # 'Pyth'  (start defaults to 0)
text[3:]     # 'hon'   (stop defaults to end)
text[:]      # 'Python' (full copy)
```

Omitting a boundary sends it to its default: `start` to the beginning, `stop` to the end. `text[:]` takes everything, which doubles as the classic one-key copy.

## Negative indices: counting from the end

Mathematics indexes from zero at the front. Python adds a second ruler, counting backward from the last character with negative numbers:

```python
text = "Python"
text[-1]     # 'n'  (last character)
text[-3:]    # 'hon' (last 3 characters)
text[:-2]    # 'Pyth' (all except last 2)
text[-4:-1]  # 'tho'
```

Position $-k$ is the character $n - k$ from the front. Asking for the last three characters is `text[-3:]`, a small mental gesture that reads naturally: *the final three*.

## Step: the stride

A third parameter controls how many positions you leap between selections:

```python
text = "abcdefghij"
text[::2]    # 'acegi'   (every 2nd character)
text[1::2]   # 'bdfhj'   (every 2nd, starting at index 1)
text[::-1]   # 'jihgfedcba'  (reversed!)
text[::-2]   # 'jhfdb'   (every 2nd, reversed)
```

A negative step reverses the direction of travel, this is the arithmetic of $a, a+d, a+2d, \ldots$ with negative $d$. The canonical reversal `[::-1]` is worth one hard recollection, because from it everything finer is a variation.

## Slicing never errors

Indexing a position that doesn't exist raises `IndexError`. Slicing is gentler, it clips to the available range and returns what exists, asking nothing on the way:

```python
text = "hi"
text[0:100]   # 'hi'  (no error, just stops at end)
text[100:200] # ''    (empty string)
```

This is a deliberate generosity: a window that extends past the end simply shrinks. Where indexing is a claim, slicing is a request.

## The same instrument plays lists

Slicing is not a string specialty; it is the notation of sequences. Lists answer the same calls:

```python
nums = [0, 1, 2, 3, 4, 5]
nums[1:4]     # [1, 2, 3]
nums[::-1]    # [5, 4, 3, 2, 1, 0]
```

Whatever you learned on characters transfers to any ordered collection, and beyond reading, lists accept slice assignment where strings do not: `nums[1:3] = [9, 9]` swaps a window in place.

## A worked example: dissecting a filename

Programs live among file names like `"report_2026_summary.txt"`, and slicing is how you read them apart. The extension is the last three characters:

```python
filename = "report_2026_summary.txt"
extension = filename[-3:]     # 'txt'
stem      = filename[:-4]     # 'report_2026_summary'
print(stem, extension)        # report_2026_summary txt
```

`[-3:]` reads *from three positions before the end, to the end*, the final three characters. `[:-4]` reads *from the start, up to four positions before the end*, which is everything before the dot. The half-open rule reappears: `[:-4]` excludes position $n - 4$, the dot itself, so the tail `.txt` never leaks into the stem. One rule, both ends.

And the reverse of taking apart is reading whole: the palindrome check is a one-liner with the same instrument:

```python
word = "radar"
print(word == word[::-1])     # True
```

## Common pitfalls

- **Confusing indexing with slicing.** `text[3]` is one character, a claim; `text[3:4]` is one character, a request, and a new string.
- **Assuming `stop` is included.** `text[0:3]` yields characters at $0, 1, 2$; position $3$ is where the window shuts.
- **Slice assignment on strings.** Strings refuse it, that mutability is a list privilege.
- **A step's sign must match its direction.** `"abcdef"[0:5:-1]` is empty, a window that walks right and a step that points left meet nowhere. Keep start, stop, and step pointing the same way.

## 🧩 Challenges

<details class="challenge">
<summary>🧩 Challenge, think first, then reveal</summary>
<div class="challenge__body">

Reverse the string `"racecar"` with slicing.

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>"racecar"[::-1]</code> → <code>"racecar"</code>, it reads the same both ways, which is precisely why a palindrome survives its own reversal.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge, think first, then reveal</summary>
<div class="challenge__body">

From `"abcdefghij"`, extract every third character: `a`, `d`, `g`, `j`.

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>"abcdefghij"[::3]</code> → <code>"adgj"</code>, the default start pins you to index 0 and the stride 3 marches you through the arithmetic sequence.</p>

</div>
</details>

## 🤔 Socratic Questions

- Why does slicing never raise an error where indexing does? What attitude separates the two?
- Using only slice assignment, how would you swap two elements of a list?
- If `text[::-1]` reverses, what one-liner tells you whether a string is a palindrome?

## ✅ Quick check

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