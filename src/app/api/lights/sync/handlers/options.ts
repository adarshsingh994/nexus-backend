import { handleCorsPreflightRequest } from '../../../shared/cors';

export async function OPTIONS() {
  return handleCorsPreflightRequest();
}
