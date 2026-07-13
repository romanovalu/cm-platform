import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY no configurada. Agregala en Vercel → Settings → Environment Variables.' },
      { status: 500 }
    )
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  try {
    const { plataforma, periodo, datos } = await req.json()

    const prompt = `Sos un analista de marketing digital experto. Analizá los siguientes datos de ${plataforma} del período ${periodo} y generá un reporte claro y profesional para el cliente (no para el CM).

DATOS:
${JSON.stringify(datos, null, 2)}

El reporte debe:
1. Empezar con un resumen ejecutivo de 2-3 oraciones
2. Destacar los 3-5 métricas más importantes con su valor
3. Explicar qué significa cada métrica en lenguaje simple (sin tecnicismos)
4. Dar una conclusión sobre el rendimiento general (positivo, neutro o a mejorar)
5. Incluir 2-3 recomendaciones accionables

Formato: texto plano con secciones claras usando ===, no uses markdown con asteriscos. Escribí en español argentino, tono profesional pero cercano.`

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const reporte = (message.content[0] as { type: string; text: string }).text
    return NextResponse.json({ reporte })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: `Error al llamar a la IA: ${msg}` }, { status: 500 })
  }
}
