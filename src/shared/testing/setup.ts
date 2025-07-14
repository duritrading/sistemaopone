// src/shared/testing/setup.ts
import '@testing-library/jest-dom'

// Configuração básica de testes sem dependências globais
console.log('Setting up test environment...')

// Mock de APIs globais básicas
if (typeof window !== 'undefined') {
  // Mock do matchMedia para testes DOM
  window.matchMedia = window.matchMedia || function(query) {
    return {
      matches: false,
      media: query,
      onchange: null,
      addListener: function() {},
      removeListener: function() {},
      addEventListener: function() {},
      removeEventListener: function() {},
      dispatchEvent: function() {}
    }
  }

  // Mock do localStorage se necessário
  const localStorageMock = {
    getItem: function(key: string) { return null },
    setItem: function(key: string, value: string) {},
    removeItem: function(key: string) {},
    clear: function() {}
  }
  
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
  })
}