module.exports = {
  preset: 'ts-jest',
  automock: false,
  resetMocks: false,
  setupFiles: [
    "./setupJest.js"
  ]
};