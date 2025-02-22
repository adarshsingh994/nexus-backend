import { corsResponse } from '../../shared/cors';

export async function POST() {
  return corsResponse(
    { message: 'This is a post request' },
    { status: 200 }
  );
}
