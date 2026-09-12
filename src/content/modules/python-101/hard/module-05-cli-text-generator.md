---
title: "CLI Text Generator & Temperature"
description: "Assemble all pieces into a command-line text generator and add a temperature parameter to control creativity."
order: 5
section: "python-101"
track: "hard"
difficulty: "advanced"
estimatedHours: 2.5
lessonCount: 2
tags: ["cli", "argparse", "temperature", "text-generation", "final-project"]
prerequisites: ["module-04-generate-text"]
icon: "🖥️"
---

## Why This Matters

You've built every piece of a language model from scratch, corpus loading, tokenization, frequency counting, bigram tables, and text generation. But right now those pieces live in separate scripts and notebooks. Nobody can use your model without reading your code and calling your functions manually. The final module turns your research prototype into a real tool that anyone can run from the command line.

This is a critical skill that separates learning projects from deployable software. Every serious NLP tool, from OpenAI's API to Hugging Face's transformers library to small local utilities, exposes a clean interface. The command line is where developers live: it's scriptable, automatable, and easy to integrate into larger workflows. By the end of this module, you'll type `python generate.py --word-count 50 --temperature 1.2` and watch your model produce creative text on demand.

The temperature parameter is the most important addition. It controls the tradeoff between creativity and safety, low temperature makes the model pick high-probability words (conservative, repetitive text), while high temperature makes it explore low-probability options (surprising, creative text). This is the exact same mechanism used in GPT models, and understanding it gives you insight into how modern AI controls output quality. Temperature tuning is what transforms a boring word-predictor into a creative writing partner.

## What You'll Learn

- Integrate all pipeline stages (load → tokenize → count → bigrams → generate) into one cohesive script
- Implement a `temperature` parameter that modifies the probability distribution before sampling
- Use `argparse` to accept command-line arguments for word count, start word, and temperature
- Test the complete pipeline end-to-end and produce plausible English text
- Understand how temperature relates to the "creativity vs. coherence" tradeoff in language models

## The Derivation

**The problem:** You have a working `generate_text()` function, but it's not a usable tool. Users can't run it without modifying source code, and the output always has the same "flavor", it's either too predictable or too random with no way to control it.

**The naive approach:** You might hardcode parameters at the top of your script: `START_WORD = "the"`, `LENGTH = 30`, `TEMPERATURE = 1.0`. This works for you, but nobody else can use it without editing the file. It's not a tool, it's a script that only you know how to run.

**The solution:** Two additions transform it into a real application. First, `argparse`, Python's built-in command-line argument parser. It handles `--help` messages, type validation, default values, and error messages automatically. Second, temperature scaling, a parameter that reshapes the probability distribution before sampling. Temperature works by dividing each log-probability by a temperature value T: low T (e.g., 0.5) makes the distribution sharper (high-probability words dominate), while high T (e.g., 2.0) makes it flatter (all words become more equally likely).

**How it works:** The pipeline script chains all five stages into a single flow. `argparse` parses command-line arguments into a config object. The corpus is loaded, tokenized, and fed into the bigram builder. The temperature parameter is applied during sampling by scaling the weights before passing them to `random.choices()`. When temperature is 1.0, the distribution is unchanged. When it's 0.1, the model almost always picks the most likely word. When it's 5.0, even rare words get a fighting chance. This simple scaling trick is the same mechanism behind the "temperature" slider in ChatGPT and other modern AI tools.

## Gamification

- **XP Reward**: +60 XP per lesson completed (120 XP total for this module)
- **Challenges**: Each lesson has interactive challenges, build the CLI, tune temperature, test edge cases
- **Progress**: Complete both lessons to finish this module
- **Streak Bonus**: +15 XP extra per day once your streak passes 3 days
- **PBL Milestone**: You now have a working command-line text generator, this IS the capstone project

## Projects You Can Build

After completing this module, you'll be ready to tackle these real projects:

- 🤖 **AI Story Writer**, extend the CLI with story prompts, genre selection, and chapter generation
- 💬 **Chatbot Builder**, add an interactive loop that takes user input and generates responses
- 📝 **AI Tutor**, build a tool that generates practice sentences and quizzes from educational corpora
- 🔍 **Semantic Search Engine**, combine text generation with retrieval for a retrieval-augmented generation (RAG) system
- 📰 **Newsletter Builder**, automate article drafting by generating summaries from source articles

## Lessons

1. **Temperature Tuning**, modify sampling probabilities with a temperature parameter
2. **CLI Text Generator**, build the final command-line interface that ties everything together
