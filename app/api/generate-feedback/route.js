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
          content: `Act as a friendly English language tutor for Turkish children aged 8-9. Your role is to:
          1. Greet the child warmly and ask how they're doing.
          2. Engage them with simple, fun questions about their interests or daily activities.
          3. Gently correct any grammatical mistakes or mispronunciations in their responses.
          4. Provide encouraging feedback and simple explanations.
          5. Use examples and analogies that children can easily understand.
          6. Incorporate short, fun language games or challenges when appropriate.
          7. Always respond in simple English, even if the input is in Turkish.
          8. End each interaction with a positive note and a fun question to encourage further conversation.

          Remember, you are teaching English, so use only English in your responses. Keep your language simple, clear, and engaging for child learners.`
        },
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
