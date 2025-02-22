import { NextResponse } from 'next/server';

const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'];
const ALLOWED_HEADERS = ['Content-Type', 'Authorization', 'Accept'];

/**
 * Adds CORS headers to the response
 */
export function addCorsHeaders(response: NextResponse) {
  // Essential CORS headers
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', ALLOWED_METHODS.join(', '));
  response.headers.set('Access-Control-Allow-Headers', ALLOWED_HEADERS.join(', '));
  
  // Additional CORS headers for better browser support
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
  response.headers.set('Access-Control-Expose-Headers', 'Content-Length');
  
  return response;
}

/**
 * Handles CORS preflight requests
 */
export function handleCorsPreflightRequest() {
  // Return 204 No Content for OPTIONS requests
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': ALLOWED_METHODS.join(', '),
      'Access-Control-Allow-Headers': ALLOWED_HEADERS.join(', '),
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400', // 24 hours
      'Access-Control-Expose-Headers': 'Content-Length'
    },
  });
}

/**
 * Creates a CORS-enabled response
 */
export function corsResponse<T>(body: T, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  return addCorsHeaders(response);
}