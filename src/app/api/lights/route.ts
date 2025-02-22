export { GET } from './handlers/get'
export { POST } from './handlers/post'

// Import autoSyncService to ensure it starts when the server starts
// import './services/autoSyncService'

import { handleCorsPreflightRequest } from '../shared/cors'

export async function OPTIONS() {
  return handleCorsPreflightRequest();
}
