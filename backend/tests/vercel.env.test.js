
import fetch from 'node-fetch';

describe('Vercel Production Environment Variables', () => {
  it('should have SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY set', async () => {
    const deploymentUrl = 'https://pacifico-editor.vercel.app/api/test-env';
    
    console.log(`Testing Environment URL: ${deploymentUrl}`);

    const response = await fetch(deploymentUrl);
    const data = await response.json();

    console.log(`Received Environment Data: ${JSON.stringify(data)}`);
    
    // This assertion is expected to fail if env vars are not set, proving the problem.
    expect(data.supabaseUrlFound).toBe(true);
    expect(data.supabaseServiceKeyFound).toBe(true);
  }, 30000); // 30 second timeout for network requests
});
