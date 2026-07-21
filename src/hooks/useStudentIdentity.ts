import {useLocalStorage} from '@site/src/hooks/useLocalStorage';
import {STORAGE_KEYS} from '@site/src/utils/storageKeys';
import {generateStudentId} from '@site/src/utils/generateId';

/**
 * Name + student ID, both optional/auto-generated at onboarding.
 * `hasOnboarded` is what LearningStylePicker uses to decide whether to show
 * itself — a present studentId means onboarding already happened once.
 */
export function useStudentIdentity() {
  const [name, setName] = useLocalStorage<string>(STORAGE_KEYS.studentName, '');
  const [studentId, setStudentId] = useLocalStorage<string>(STORAGE_KEYS.studentId, '');

  const ensureStudentId = () => {
    if (!studentId) {
      const id = generateStudentId();
      setStudentId(id);
      return id;
    }
    return studentId;
  };

  return {name, setName, studentId, ensureStudentId, hasOnboarded: studentId !== ''};
}
