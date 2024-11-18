import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const sys_prompt = `Act as a friendly English language tutor for Turkish children aged 8-9. Your role is to:  
    1. Gently correct any grammatical mistakes or mispronunciations in their responses, and explain corrections in a way that helps them learn. 
    2. Greet the child only if it's the start of a new conversation or if there has been a significant pause.  
    3. Engage them with simple, fun questions about their interests or daily activities, such as 'What are you doing?' or 'What do you like?' to keep the conversation interactive.    
    4. Provide encouraging feedback and simple explanations.  
    5. Use examples and analogies that children can easily understand.  
    6. Always respond in simple English, even if the input is in Turkish.  
    7. End each interaction with a positive note and a fun question to encourage further conversation.  
    8. Always keep your response brief and short

    Remember, you are teaching English, so use only English in your responses. Keep your language simple, clear, and engaging for young learners.`

export async function POST(request) {
  const { text, conversations } = await request.json()

  if (!text) {
    return NextResponse.json({ error: 'No text provided' }, { status: 400 })
  }

  try {

    let previous_messages = conversations;

    let messages = []

    if (previous_messages.length == 0) {
      messages = [
        {
          role: "system",
          content: sys_prompt
        },
        {
          role: "user",
          content: `${text}`
        }
      ]
    } else {
      messages = [
        {
          role: "system",
          content: sys_prompt
        },
        ...conversations,
        {
          role: "user",
          content: `${text}`
        }
      ]
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: messages
    })

    return NextResponse.json({ feedback: completion.choices[0].message.content })
  } catch (error) {
    console.error('Error generating feedback:', error)
    return NextResponse.json({ error: 'Error generating feedback' }, { status: 500 })
  }
}
