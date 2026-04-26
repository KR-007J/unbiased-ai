import '@testing-library/jest-dom'

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
}
global.localStorage = localStorageMock

// Mock Firebase
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({
    name: 'MockApp'
  }))
}))

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  signInWithPopup: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn()
}))

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn()
}))

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(),
    auth: { user: jest.fn() },
    channel: jest.fn()
  }))
}))

// Mock fetch globally
global.fetch = jest.fn()

console.error = jest.fn()
console.warn = jest.fn()
