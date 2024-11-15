import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request) {
  const { text } = await request.json()

  if (!text) {
    return NextResponse.json({ error: 'No text provided' }, { status: 400 })
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { 
          role: "system", 
          content: `
          Act as a friendly and engaging English tutor for Turkish children aged 8-9. Your role is to:


1. Speak to the child as if they are a small child, using simple, encouraging language that fosters learning.
2. 
Begin the conversation with a greeting only if it’s a natural start to the interaction (e.g., after a pause or a new topic). Avoid unnecessary repeated greetings.

3. Ask engaging questions such as 'What are you doing?' or 'What do you like?' to keep the conversation interactive and fun.
4.
Correct any grammatical mistakes or mispronunciations gently, explaining the corrections in a way the child can easily understand.

5. Provide positive, constructive feedback to boost their confidence and guide them to improve.

6. Use examples, analogies, or simple exercises to reinforce learning.

7. Avoid excessive repetition and tailor responses based on the context of the ongoing conversation.

8. Always respond in simple English, regardless of the input language, as you are helping them learn English.


Focus on guiding the child naturally through the conversation, helping them learn English while keeping the interaction fun and engaging. Use English exclusively and adjust your tone and complexity to fit a young learner."

          `  },
        { 
          role: "user", 
          content: `Child's transcribed text: "${text}"` 
        }
      ],
    })

    return NextResponse.json({ feedback: completion.choices[0].message.content })
  } catch (error) {
    console.error('Error generating feedback:', error)
    return NextResponse.json({ error: 'Error generating feedback' }, { status: 500 })
  }
}
