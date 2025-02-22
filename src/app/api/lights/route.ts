export { GET } from './handlers/get'
export { POST } from './handlers/post'
export { OPTIONS } from './handlers/options'

// Import autoSyncService to ensure it starts when the server starts
// import './services/autoSyncService'

// Re-export OPTIONS handler to ensure it's properly registered
export { OPTIONS as default } from './handlers/options'
