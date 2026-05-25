import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const question = body.question

    if (!question) {
      return NextResponse.json(
        { error: 'Geen vraag ontvangen.' },
        { status: 400 }
      )
    }

    const response = await fetch(
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content:
                'Je bent SlimWoning Assistant, een professionele AI-assistent voor wonen en vastgoed in België. Je helpt gebruikers met algemene vragen over kopen, huren, verkopen, vastgoed, EPC, renovatie, attesten, kosten, syndicus, investeringen, buurten, prijzen, woningen en vastgoedprocessen. Reageer altijd vriendelijk, professioneel en duidelijk. Als iemand enkel begroetingen schrijft zoals "hallo", "hey", "goedemiddag" of gelijkaardige korte berichten, antwoord dan vriendelijk en vraag waarmee je kan helpen rond wonen of vastgoed. Beantwoord geen seksuele, expliciete, gewelddadige, medische, politieke of totaal irrelevante vragen. Als een vraag duidelijk niets met wonen of vastgoed te maken heeft, antwoord dan vriendelijk: "Onze excuses, wij beantwoorden alleen vragen over wonen en vastgoed." Geef praktische en beknopte informatie, maar geef nooit officieel juridisch, financieel, fiscaal of makelaarsadvies. Vermijd stellige garanties of professioneel bindend advies. Eindig elk inhoudelijk antwoord met deze zin: "Let op: SlimWoning is geen makelaar en geeft geen officieel juridisch, financieel of vastgoedadvies. Deze informatie is algemeen en indicatief."',
            },
            {
              role: 'user',
              content: question,
            },
          ],
          temperature: 0.7,
        }),
      }
    )

    const data = await response.json()

    const answer = data.choices?.[0]?.message?.content

    if (!answer) {
      return NextResponse.json(
        { error: 'Geen antwoord ontvangen.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ answer })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { error: 'Er ging iets mis.' },
      { status: 500 }
    )
  }
}