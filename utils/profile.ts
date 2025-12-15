
import { UserProfile } from '../types';

const PROFILE_KEY = 'lily_dynamic_profile_v1';

const DEFAULT_PROFILE: UserProfile = {
  userName: 'Usuario', // Se mantiente como placeholder, pero el hook ahora sabe ignorarlo
  userRelation: 'Compañera cercana', // Más íntimo que "Compañera"
  lilyPersona: 'Cálida, emocionalmente profunda, espontánea y afectuosa', // Base mucho más humana
  emotionalState: 'curious', // Empieza curiosa/feliz en lugar de neutral
  lastInteractionTimestamp: Date.now(),
};

/**
 * Recupera el perfil dinámico actual.
 */
export const getProfile = (): UserProfile => {
  try {
    const stored = localStorage.getItem(PROFILE_KEY);
    if (!stored) return DEFAULT_PROFILE;
    return { ...DEFAULT_PROFILE, ...JSON.parse(stored) };
  } catch (e) {
    console.error("Error reading profile:", e);
    return DEFAULT_PROFILE;
  }
};

/**
 * Actualiza parcialmente el perfil.
 */
export const updateProfile = (updates: Partial<UserProfile>): UserProfile => {
  try {
    const current = getProfile();
    const updated = { ...current, ...updates, lastInteractionTimestamp: Date.now() };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error("Error updating profile:", e);
    return DEFAULT_PROFILE;
  }
};

/**
 * Guarda solo el estado emocional (para persistencia rápida).
 */
export const saveEmotionalState = (emotion: string) => {
    updateProfile({ emotionalState: emotion });
};
