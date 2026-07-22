const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I — easier to read aloud

/** Short, easy-to-read-aloud student ID (see plan/persistence.md). */
export function generateStudentId(length = 8): string {
  let id = '';
  for (let i = 0; i < length; i++) {
    id += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return id;
}
