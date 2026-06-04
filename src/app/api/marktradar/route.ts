import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const {
      address,
      city,
      propertyType,
      livingArea,
      bedrooms,
      epc,
      description,
    } = body

    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY ontbreekt' },
        { status: 500 },
      )
    }

    function cleanPublicAnalysis(text: string) {
      return text
        .replace(/\[[^\]]+\]\([^\)]+\)/g, '')
        .replace(/https?:\/\/\S+/g, '')
        .replace(/\b(?:Immoweb|Zimmo|Funda|Realo|Immovlan|Immoscoop|Immolytics|Propertyweb|Wikipedia|Google|NBB|Statbel|Fednot|Notarisbarometer|Notaris\.be|Vlaanderen\.be|OVAM)\b/gi, 'SlimWoning MarktRadar')
        .replace(/\(\s*\)/g, '')
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
    }

    const prompt = `
Analyseer deze woning voor verkoop.

Adres: ${address || '-'}
Gemeente: ${city || '-'}
Type: ${propertyType || '-'}
Oppervlakte: ${livingArea || '-'} m²
Slaapkamers: ${bedrooms || '-'}
EPC: ${epc || '-'}
Beschrijving: ${description || '-'}

Schrijf het antwoord alsof het rechtstreeks van SlimWoning komt.
Gebruik geen namen van externe websites, platformen of databronnen in de zichtbare tekst.
Noem dus geen Immoweb, Zimmo, Funda, Realo, Immovlan, Immoscoop, Google of andere externe bronnamen.
Gebruik formuleringen zoals:
- "SlimWoning ziet in de actuele marktdata..."
- "Onze MarktRadar vergelijkt dit pand met vergelijkbare woningen in de regio..."
- "Op basis van lokale marktinformatie..."

Gebruik geen markdown-links, geen URL's, geen bronvermeldingen en geen haakjes met broninformatie in de zichtbare tekst.
Verwerk gevonden marktinformatie alsof het onderdeel is van de SlimWoning MarktRadar.
Schrijf dus niet "volgens bron X" en noem geen externe websites.
Maak de analyse professioneel, duidelijk en bruikbaar voor een verkoper.

Geef terug in deze structuur:
1. Marktpositie
2. Verkoopkansen
3. Aandachtspunten
4. Aanbevolen vraagprijsrange
5. Aanbevolen verkooptips
6. Welke extra gegevens de eigenaar kan toevoegen voor een nauwkeuriger resultaat

Belangrijk:
De gebruiker mag alleen een SlimWoning-antwoord zien.
Externe bronnen mogen intern gebruikt worden voor redenering, maar mogen niet zichtbaar vermeld worden.
`

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-5-mini',
        tools: [{ type: 'web_search' }],
        input: prompt,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()

      return NextResponse.json(
        {
          success: false,
          error: `OpenAI error: ${response.status} ${errorText}`,
        },
        { status: 500 },
      )
    }

    const data = await response.json()

    const rawAnalysis =
      data?.output_text ||
      data?.output
        ?.flatMap((item: any) => item?.content || [])
        ?.map((content: any) => content?.text || '')
        ?.filter(Boolean)
        ?.join('\n\n') ||
      null

    const analysis = rawAnalysis ? cleanPublicAnalysis(rawAnalysis) : null

    return NextResponse.json({
      success: true,
      analysis,
      result: data,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Onbekende fout',
      },
      { status: 500 },
    )
  }
}