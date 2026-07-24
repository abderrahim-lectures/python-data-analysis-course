## RAG recap

Retrieval-augmented generation (RAG) answers a question in two stages
instead of one. First, retrieval: embed the question into a vector, and
compare it against the vectors of every chunk of your documentation using
cosine similarity, keeping only the closest few. Second, generation: hand
those retrieved chunks to a language model as context and ask it to answer
using only what it was given, rather than relying on what it already
happens to know.

This project reuses exactly that two-stage pipeline from the course's
"Build a RAG App Over Your Own Notes" project -- the same local embedding
model, the same NumPy cosine-similarity search, the same "answer using only
this context" prompt -- and swaps the CLI script that calls it for a
Discord bot's message handler instead.
