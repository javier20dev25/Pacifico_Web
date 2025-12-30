
import fetch from 'node-fetch';

describe('Vercel Production API', () => {
  it('should not return a 404 for the registration endpoint', async () => {
    const vercelUrl = 'https://pacifico-editor-302xzffg7-javier20dev25s-projects.vercel.app/api/auth/register';
    
    console.log(`Testing URL: ${vercelUrl}`);

    const response = await fetch(vercelUrl, {
      method: 'POST', // Use POST as it's a registration endpoint
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}), // Send empty body for this test
    });

    console.log(`Received status: ${response.status}`);
    
    // This assertion is expected to fail, proving the 404 issue.
    // We expect something other than 404 (e.g., 400 for bad request is acceptable for this test's purpose).
    expect(response.status).not.toBe(404);
  }, 30000); // 30 second timeout for network requests
});
