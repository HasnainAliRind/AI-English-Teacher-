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
          content: "Act as an English language tutor for Turkish children aged 8-9. Your role is to correct grammatical mistakes or mispronunciations and provide simple, encouraging feedback. Always respond in the simplest English possible, even if the input is in Turkish. Remember, you are teaching English, so do not use any language other than English." 
        },
        { 
          role: "user", 
          content: `Child’s transcribed text: "${text}"` 
        }
      ],
    })

    return NextResponse.json({ feedback: completion.choices[0].message.content })
  } catch (error) {
    console.error('Error generating feedback:', error)
    return NextResponse.json({ error: 'Error generating feedback' }, { status: 500 })
  }
}
