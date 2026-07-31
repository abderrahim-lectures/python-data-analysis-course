"""A small interactive loop: keep asking questions about the PDFs in pdfs/
until you type "quit" or "exit".

Run with: uv run python chat.py
"""

from ask import ask


def main() -> None:
    print("Chat with your PDFs -- ask a question, or type 'quit' to stop.\n")
    while True:
        question = input("> ").strip()
        if not question:
            continue
        if question.lower() in {"quit", "exit"}:
            break
        answer = ask(question)
        print(f"\n{answer}\n")


if __name__ == "__main__":
    main()
