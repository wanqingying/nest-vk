const { OpenAI } = require('openai');

const client = new OpenAI({
  apiKey: 'sk-Jg800f045160f131efd4e26ddbcb0b7cd5d90b0028aT6CVy', // This is the default and can be omitted
  baseURL: 'https://api.gptsapi.net/v1',
});

async function main() {
  const stream = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: 'Say this is a test' }],
    stream: true,
  });
  for await (const chunk of stream) {
    console.log('val', chunk.choices[0]?.delta?.content || '');
    // process.stdout.write(chunk.choices[0]?.delta?.content || '');
  }
}

main();
