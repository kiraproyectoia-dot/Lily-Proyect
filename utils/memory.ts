const MEMORY_KEY = 'lily_memories_v1';

/**
 * Retrieves all stored memories from localStorage.
 * @returns An array of memory strings.
 */
export const getMemories = (): string[] => {
  try {
    const storedMemories = localStorage.getItem(MEMORY_KEY);
    return storedMemories ? JSON.parse(storedMemories) : [];
  } catch (error) {
    console.error("Failed to retrieve memories from localStorage", error);
    return [];
  }
};

/**
 * Adds a new memory to localStorage, avoiding duplicates.
 * @param memory - The memory string to add.
 */
export const addMemory = (memory: string): void => {
  try {
    const currentMemories = getMemories();
    // Avoid duplicates
    if (!currentMemories.includes(memory)) {
      const updatedMemories = [...currentMemories, memory];
      localStorage.setItem(MEMORY_KEY, JSON.stringify(updatedMemories));
    }
  } catch (error) {
    console.error("Failed to add memory to localStorage", error);
  }
};

/**
 * Clears all memories from localStorage.
 */
export const clearMemories = (): void => {
  try {
    localStorage.removeItem(MEMORY_KEY);
  } catch (error) {
    console.error("Failed to clear memories from localStorage", error);
  }
};
