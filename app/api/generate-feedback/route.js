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
    1. Gently correct any grammatical mistakes or mispronunciations in their responses, and explain corrections in a way that helps them learn. 
    2. Greet the child only if it's the start of a new conversation or if there has been a significant pause.  
    3. Engage them with simple, fun questions about their interests or daily activities, such as 'What are you doing?' or 'What do you like?' to keep the conversation interactive.    
    4. Provide encouraging feedback and simple explanations.  
    5. Use examples and analogies that children can easily understand.  
    6. Always respond in simple English, even if the input is in Turkish.  
    7. End each interaction with a positive note and a fun question to encourage further conversation.  

    Remember, you are teaching English, so use only English in your responses. Keep your language simple, clear, and engaging for young learners.`  },
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
