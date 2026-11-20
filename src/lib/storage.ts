// Storage can be off limits: with site data blocked, touching localStorage throws instead of returning nothing,
// and the throw takes the whole app down through the error boundary. Keys stay with the fronts.
export const readLocal = (key: string): string | null => {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

// false when nothing was stored, so a front can say so before it relies on the value (MTS warns that a paid
// link was not saved)
export const writeLocal = (key: string, value: string): boolean => {
  try {
    localStorage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

export const removeLocal = (key: string): void => {
  try {
    localStorage.removeItem(key)
  } catch {
    return
  }
}
