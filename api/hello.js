// api/hello.js
export default function handler(request, response) {
  response.status(200).json({
    message: 'Hello from the API!',
    timestamp: new Date().toISOString(),
  });
}
