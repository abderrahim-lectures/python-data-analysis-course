// Shared between /playground and the 404-based /playground/<code> fallback
// so the two entry points can't drift.
export const PLAYGROUND_STARTER = `# Playground — write and run any Python here.
# Nothing is graded here; it's just a bigger scratch space.

def greet(name):
    return f"Hello, {name}!"

print(greet("world"))
`;
