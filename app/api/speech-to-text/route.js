import { NextResponse } from 'next/server'

export async function POST(request) {
  const formData = await request.formData()
  const file = formData.get('file')
  const model = formData.get('model')
  const language = formData.get('language')

  console.log(process.env.OPENAI_API_KEY);
  

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const formDataForOpenAI = new FormData()
  formDataForOpenAI.append('file', file)
  formDataForOpenAI.append('model', model)
  formDataForOpenAI.append('language', language)

  try {
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: formDataForOpenAI,
    })



    // if (!response.ok) {
    //   throw new Error('Failed to transcribe audio')
    // }

    console.log(response);
    

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error processing audio:', error)
    return NextResponse.json({ error: 'Error processing audio' }, { status: 500 })
  }
}