"use client"

import {
  GoogleMap,
  Marker,
  StreetViewPanorama,
  useJsApiLoader,
} from '@react-google-maps/api'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getWoningkenmerken } from '@/lib/woningkenmerken'

const googleMapsLibraries: ('places')[] = ['places']

export default function PropertyDetailsPage() {
  const params = useParams()
  const router = useRouter()

  const [property, setProperty] = useState<any>(null)
  const [similarProperties, setSimilarProperties] = useState<any[]>([])
  const [userId, setUserId] = useState('')
  const [showMap, setShowMap] = useState(false)
  const [activePhotoIndex, setActivePhotoIndex] = useState(0)
  const [photoViewMode, setPhotoViewMode] = useState<'slider' | 'mosaic' | 'grid'>('slider')
  const [showPhotoFullscreen, setShowPhotoFullscreen] = useState(false)
  const [showPhotoMenu, setShowPhotoMenu] = useState(false)
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false)
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState('')
  const [showBrochurePreview, setShowBrochurePreview] = useState(false)
  const [showStreetViewInGallery, setShowStreetViewInGallery] = useState(false)

  const [mapCenter, setMapCenter] = useState({
    lat: 51.2194,
    lng: 4.4025,
  })

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: googleMapsLibraries,
    language: 'en',
    region: 'US',
  })

  useEffect(() => {
    getProperty()
    getUser()
  }, [])

  useEffect(() => {
    setActivePhotoIndex(0)
  }, [property?.id])

  useEffect(() => {
    if (
      (!showMap && !showStreetViewInGallery) ||
      !isLoaded ||
      !property?.address ||
      !window.google
    )
      return

    const geocoder = new window.google.maps.Geocoder()

    geocoder.geocode(
      {
        address: `${property.address}, ${property.city || ''}, Belgium`,
      },
      (results, status) => {
        if (status === 'OK' && results?.[0]) {
          const location = results[0].geometry.location

          setMapCenter({
            lat: location.lat(),
            lng: location.lng(),
          })
        } else {
          console.log('Geocode fout:', status)
        }
      }
    )
  }, [showMap, showStreetViewInGallery, isLoaded, property])

  async function getUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) setUserId(user.id)
  }

  async function getProperty() {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      console.log(error)
    } else {
      setProperty(data)
      getSimilarProperties(data)
    }
  }

  async function getSimilarProperties(currentProperty: any) {
    if (!currentProperty) return

    let query = supabase
      .from('properties')
      .select('*')
      .neq('id', currentProperty.id)
      .limit(3)

    if (currentProperty.city) {
      query = query.ilike('city', `%${currentProperty.city}%`)
    }

    if (currentProperty.woning_type) {
      query = query.eq('woning_type', currentProperty.woning_type)
    }

    const { data, error } = await query

    if (error) {
      console.log(error)
      return
    }

    setSimilarProperties((data || []).slice(0, 3))
  }

  async function handleDelete() {
    const confirmDelete = confirm(
      'Weet je zeker dat je deze woning wilt verwijderen?'
    )

    if (!confirmDelete) return

    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', params.id)

    if (error) {
      alert('Fout bij verwijderen van woning')
      console.log(error)
    } else {
      router.push('/properties')
    }
  }

  function yesNo(value: boolean | null) {
    if (value === true) return 'Ja'
    if (value === false) return 'Nee'
    return 'Niet opgegeven'
  }

  function formatPrice(value: any) {
    const number = Number(String(value || '').replace(/[^\d.]/g, '')) || 0

    if (!number) return '-'

    return new Intl.NumberFormat('nl-BE', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(number)
  }

  function estimatedMonthlyPayment(price: any) {
    const propertyPrice = Number(String(price || '').replace(/[^\d.]/g, '')) || 0

    if (!propertyPrice) return '-'

    const ownCapital = propertyPrice * 0.2
    const loanAmount = propertyPrice - ownCapital
    const yearlyInterest = 0.03
    const monthlyInterest = yearlyInterest / 12
    const months = 25 * 12

    const payment =
      loanAmount *
      (monthlyInterest / (1 - Math.pow(1 + monthlyInterest, -months)))

    return new Intl.NumberFormat('nl-BE', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(payment)
  }

  // --- Slim zoeken / match analysis helpers ---
  function getWoonMatchScore() {
    let score = 76

    if (property?.city) score += 5
    if (property?.price) score += 5
    if (property?.bewoonbare_oppervlakte) score += 4
    if (property?.slaapkamers) score += 4
    if (property?.parking) score += 2
    if (property?.tuin) score += 2
    if (property?.terras) score += 2

    return Math.min(score, 96)
  }

  function getWoonMatchPoints() {
    const city = property?.city || 'deze regio'

    return [
      {
        title: 'Ligging',
        text: `Interessante ligging in ${city} met relevante vastgoedvraag.`,
      },
      {
        title: 'Prijsindicatie',
        text: property?.price
          ? `Vraagprijs van ${formatPrice(property.price)} past binnen een duidelijke zoekcategorie.`
          : 'Prijsinformatie kan verder helpen om de match nauwkeuriger te maken.',
      },
      {
        title: 'Woonprofiel',
        text: `${cleanWoningType(property?.woning_type)} met kenmerken die geschikt kunnen zijn voor gerichte zoekers.`,
      },
    ]
  }

  function getStringArray(value: any) {
    if (!Array.isArray(value)) return []

    return value
      .map((item) => String(item || '').trim())
      .filter(Boolean)
  }

  function getPropertyPhotos(propertyValue: any) {
    if (!propertyValue) return []

    const propertyPhotos =
      getStringArray(propertyValue.photos).length
        ? getStringArray(propertyValue.photos)
        : getStringArray(propertyValue.images).length
          ? getStringArray(propertyValue.images)
          : propertyValue.photo
            ? [propertyValue.photo]
            : propertyValue.image
              ? [propertyValue.image]
              : propertyValue.mainImage
                ? [propertyValue.mainImage]
                : propertyValue.photo_url
                  ? [propertyValue.photo_url]
                  : []

    return Array.from(new Set(propertyPhotos.map((photo) => String(photo).trim()).filter(Boolean)))
  }

  function cleanWoningType(value: any) {
    const text = String(value || '').trim()

    if (!text) return 'Niet opgegeven'
    if (!Number.isNaN(Number(text))) return 'Appartement'

    return text
  }

  function capitalizeFirstLetter(value: any) {
    const text = String(value || '').trim()

    if (!text) return ''

    return text.charAt(0).toUpperCase() + text.slice(1)
  }


  const propertyPhotos = getPropertyPhotos(property)
  const activePhoto = propertyPhotos[activePhotoIndex] || propertyPhotos[0] || ''
  const previewPhotos = propertyPhotos
  const displayTitle = capitalizeFirstLetter(property?.title)
  const brochureLocation = property?.address
    ? `${property.address}${property.city ? `, ${property.city}` : ''}`
    : property?.city || 'Locatie op aanvraag'
  const brochureFeatures = [
    ['Slaapkamers', property?.slaapkamers ? `${property.slaapkamers}` : 'Op aanvraag'],
    ['Badkamers', property?.badkamers ? `${property.badkamers}` : 'Op aanvraag'],
    [
      'Oppervlakte',
      property?.bewoonbare_oppervlakte ? `${property.bewoonbare_oppervlakte} m²` : 'Op aanvraag',
    ],
    ['EPC', property?.epc || 'Op aanvraag'],
    ['Bouwjaar', property?.bouwjaar || 'Op aanvraag'],
    [
      'Buitenruimte',
      [property?.parking ? 'Parking' : '', property?.tuin ? 'Tuin' : '', property?.terras ? 'Terras' : '']
        .filter(Boolean)
        .join(' / ') || 'Op aanvraag',
    ],
  ]
  const uniqueFeatures = [
    property?.pluspunten,
    property?.verwarmingstype ? `Comfortabele verwarming via ${property.verwarmingstype}.` : '',
    property?.tuin ? 'Aangename tuinruimte voor rust en buitenleven.' : '',
    property?.terras ? 'Terras voor ontspannen momenten buiten.' : '',
    property?.parking ? 'Parkeermogelijkheid inbegrepen bij de woning.' : '',
  ]
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .slice(0, 4)
  const brochureContact =
    property?.makelaar_kantoornaam || property?.contact_name || 'SlimWoning'
  const isMakelaarBrochure = Boolean(property?.makelaar_kantoornaam || property?.makelaar_logo || property?.agency_logo)
  const makelaarLogo = property?.makelaar_logo || property?.agency_logo || property?.logo_url || ''
  const makelaarNaam = property?.makelaar_kantoornaam || property?.agency_name || property?.contact_name || 'Makelaar'
  const makelaarAdres = property?.makelaar_adres || property?.agency_address || property?.contact_address || ''

  const contactNaam = isMakelaarBrochure
    ? makelaarNaam
    : property?.contact_name || property?.verkoper_naam || property?.seller_name || 'Particuliere verkoper'
  const contactAdres = isMakelaarBrochure
    ? makelaarAdres || property?.address || property?.city || ''
    : property?.contact_address || property?.verkoper_adres || property?.seller_address || property?.address || property?.city || ''
  const contactTelefoon = isMakelaarBrochure
    ? property?.makelaar_telefoon || property?.agency_phone || property?.contact_phone || property?.phone || ''
    : property?.contact_phone || property?.verkoper_telefoon || property?.seller_phone || property?.phone || ''
  const contactEmail = isMakelaarBrochure
    ? property?.makelaar_email || property?.agency_email || property?.contact_email || property?.email || ''
    : property?.contact_email || property?.verkoper_email || property?.seller_email || property?.email || ''

  function showPreviousPhoto() {
    setActivePhotoIndex((current) =>
      propertyPhotos.length > 0
        ? (current - 1 + propertyPhotos.length) % propertyPhotos.length
        : 0
    )
  }

  function showNextPhoto() {
    setActivePhotoIndex((current) =>
      propertyPhotos.length > 0 ? (current + 1) % propertyPhotos.length : 0
    )
  }

  function openPhotoView(mode: 'slider' | 'mosaic' | 'grid') {
    setShowStreetViewInGallery(false)
    setPhotoViewMode(mode)
    setShowPhotoMenu(false)
    setShowPhotoFullscreen(false)
  }

  function scrollToSection(sectionId: string) {
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  function renderPhotoView(mode: 'slider' | 'mosaic' | 'grid', isFullscreen = false) {
    if (!activePhoto) {
      return (
        <div className={`flex ${isFullscreen ? 'h-[calc(100vh-170px)]' : 'h-[330px] md:h-[430px] lg:h-[460px]'} w-full items-center justify-center bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400`}>
          <span className="text-lg font-black text-white/90">Geen foto beschikbaar</span>
        </div>
      )
    }

    if (mode === 'mosaic' && previewPhotos.length >= 3) {
      const collagePhotos = previewPhotos.slice(0, 5)
      const remainingPhotos = Math.max(propertyPhotos.length - collagePhotos.length, 0)

      return (
        <div className={`${isFullscreen ? 'h-full w-full' : 'h-[330px] md:h-[430px] lg:h-[460px]'} grid grid-cols-4 grid-rows-2 gap-3 bg-white p-3`}>
          <button
            type="button"
            onClick={() => {
              setActivePhotoIndex(0)
              setPhotoViewMode('slider')
              setShowPhotoMenu(false)
            }}
            className="relative col-span-2 row-span-2 overflow-hidden rounded-[1.5rem]"
          >
            <img
              src={collagePhotos[0]}
              alt={`${displayTitle || 'Woning'} hoofdfoto`}
              className="h-full w-full object-cover transition duration-300 hover:scale-105"
            />
          </button>

          {collagePhotos.slice(1, 5).map((photo, index) => {
            const photoIndex = index + 1
            const isLastVisiblePhoto = photoIndex === collagePhotos.length - 1 && remainingPhotos > 0

            return (
              <button
                key={`${photo}-mosaic-${photoIndex}`}
                type="button"
                onClick={() => {
                  setShowPhotoMenu(false)

                  if (isLastVisiblePhoto) {
                    setActivePhotoIndex(0)
                    setPhotoViewMode('grid')
                    setShowPhotoFullscreen(true)
                    return
                  }

                  setActivePhotoIndex(photoIndex)
                  setPhotoViewMode('slider')
                }}
                className="relative overflow-hidden rounded-[1.25rem]"
              >
                <img
                  src={photo}
                  alt={`${displayTitle || 'Woning'} foto ${photoIndex + 1}`}
                  className="h-full w-full object-cover transition duration-300 hover:scale-105"
                />

                {isLastVisiblePhoto && (
                  <span className="absolute inset-0 grid place-items-center bg-[#071B4D]/70 text-2xl font-black text-white backdrop-blur-[1px]">
                    +{remainingPhotos} foto&apos;s
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )
    }

    if (mode === 'grid' && previewPhotos.length >= 2) {
      return (
        <div className={`${isFullscreen ? 'h-full w-full' : 'h-[330px] md:h-[430px] lg:h-[460px]'} overflow-auto bg-white p-3`}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {previewPhotos.map((photo, index) => (
              <button
                key={`${photo}-grid-${index}`}
                type="button"
                onClick={() => {
                  setActivePhotoIndex(index)
                  setPhotoViewMode('slider')
                  setShowPhotoMenu(false)
                  setShowPhotoFullscreen(true)
                }}
                className="relative h-52 overflow-hidden rounded-[1.25rem] md:h-56"
              >
                <img
                  src={photo}
                  alt={`${displayTitle || 'Woning'} foto ${index + 1}`}
                  className="h-full w-full object-cover transition duration-300 hover:scale-105"
                />
              </button>
            ))}
          </div>
        </div>
      )
    }

    return (
      <img
        src={activePhoto}
        alt={displayTitle || 'Woning'}
        className={`${isFullscreen ? 'h-[calc(100vh-170px)]' : 'h-[330px] md:h-[430px] lg:h-[460px]'} w-full object-cover`}
      />
    )
  }

  function getVideoFeatureLine() {
    const parts = [
      cleanWoningType(property?.woning_type),
      property?.bewoonbare_oppervlakte ? `${property.bewoonbare_oppervlakte} m²` : '',
      property?.slaapkamers ? `${property.slaapkamers} slaapkamers` : '',
      property?.epc ? `EPC ${property.epc}` : '',
    ].filter(Boolean)

    return parts.join(' • ')
  }

  function getVideoSlides() {
    return [
      {
        title: property?.title || 'Woning in de kijker',
        subtitle: `${property?.city || 'België'} • ${formatPrice(property?.price)}`,
      },
      {
        title: 'Ruimte en potentieel',
        subtitle: getVideoFeatureLine(),
      },
      {
        title: 'Belangrijkste kenmerken',
        subtitle: `${property?.badkamers || '-'} badkamers • ${yesNo(property?.tuin) === 'Ja' ? 'Tuin' : yesNo(property?.terras) === 'Ja' ? 'Terras' : 'Praktische indeling'}`,
      },
      {
        title: 'Interesse in deze woning?',
        subtitle: 'Plan een bezoek of vraag meer informatie aan via SlimWoning.',
      },
    ]
  }

  function drawRoundedRect(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ) {
    context.beginPath()
    context.moveTo(x + radius, y)
    context.lineTo(x + width - radius, y)
    context.quadraticCurveTo(x + width, y, x + width, y + radius)
    context.lineTo(x + width, y + height - radius)
    context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    context.lineTo(x + radius, y + height)
    context.quadraticCurveTo(x, y + height, x, y + height - radius)
    context.lineTo(x, y + radius)
    context.quadraticCurveTo(x, y, x + radius, y)
    context.closePath()
  }

  async function loadVideoImage(src: string) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image()
      image.crossOrigin = 'anonymous'
      image.onload = () => resolve(image)
      image.onerror = reject
      image.src = src
    })
  }

  function drawVideoFrame(
    context: CanvasRenderingContext2D,
    image: HTMLImageElement | null,
    progress: number,
    title: string,
    subtitle: string,
    isFinalSlide = false
  ) {
    const width = context.canvas.width
    const height = context.canvas.height

    context.fillStyle = '#071B4D'
    context.fillRect(0, 0, width, height)

    if (image) {
      const scale = Math.max(width / image.width, height / image.height) * (1.04 + progress * 0.06)
      const imageWidth = image.width * scale
      const imageHeight = image.height * scale
      const x = (width - imageWidth) / 2 + (progress - 0.5) * 34
      const y = (height - imageHeight) / 2 + (progress - 0.5) * 18

      context.drawImage(image, x, y, imageWidth, imageHeight)
    }

    const gradient = context.createLinearGradient(0, height * 0.35, 0, height)
    gradient.addColorStop(0, 'rgba(7, 27, 77, 0)')
    gradient.addColorStop(1, 'rgba(7, 27, 77, 0.88)')
    context.fillStyle = gradient
    context.fillRect(0, 0, width, height)

    if (isFinalSlide) {
      context.fillStyle = 'rgba(7, 27, 77, 0.88)'
      context.fillRect(0, 0, width, height)
      context.fillStyle = '#ffffff'
      context.font = '700 58px Arial'
      context.textAlign = 'center'
      context.fillText(title, width / 2, 250)
      context.fillStyle = '#dbeafe'
      context.font = '500 30px Arial'
      context.fillText(subtitle, width / 2, 315)
      context.fillStyle = '#2454F4'
      drawRoundedRect(context, width / 2 - 220, 385, 440, 78, 24)
      context.fill()
      context.fillStyle = '#ffffff'
      context.font = '700 28px Arial'
      context.fillText('Contacteer SlimWoning', width / 2, 434)
      return
    }

    context.fillStyle = 'rgba(7, 27, 77, 0.86)'
    drawRoundedRect(context, 56, height - 158, 720, 112, 26)
    context.fill()

    context.fillStyle = '#ffffff'
    context.font = '700 42px Arial'
    context.textAlign = 'left'
    context.fillText(title, 90, height - 104)

    context.fillStyle = '#dbeafe'
    context.font = '500 24px Arial'
    context.fillText(subtitle, 90, height - 66)

    context.fillStyle = '#ffffff'
    context.font = '700 24px Arial'
    context.fillText('SlimWoning', width - 215, 58)
  }

  // PDF download for brochure - direct PDF generation, no html2canvas/html2pdf
  async function loadJsPdf() {
    const windowWithPdf = window as any

    if (windowWithPdf.jspdf?.jsPDF) return windowWithPdf.jspdf.jsPDF

    await new Promise<void>((resolve, reject) => {
      const existingScript = document.querySelector<HTMLScriptElement>('script[data-jspdf="true"]')

      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(), { once: true })
        existingScript.addEventListener('error', () => reject(new Error('PDF bibliotheek kon niet worden geladen.')), { once: true })
        return
      }

      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
      script.async = true
      script.dataset.jspdf = 'true'
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('PDF bibliotheek kon niet worden geladen.'))
      document.body.appendChild(script)
    })

    if (!windowWithPdf.jspdf?.jsPDF) {
      throw new Error('PDF bibliotheek is niet beschikbaar.')
    }

    return windowWithPdf.jspdf.jsPDF
  }

  function pdfText(value: any) {
    return String(value || '').replace(/<[^>]*>/g, '').trim()
  }

  async function imageToDataUrl(src: string) {
    if (!src) return ''

    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = src
      })

      const canvas = document.createElement('canvas')
      canvas.width = image.naturalWidth || image.width
      canvas.height = image.naturalHeight || image.height

      const context = canvas.getContext('2d')
      if (!context) return ''

      context.drawImage(image, 0, 0, canvas.width, canvas.height)
      return canvas.toDataURL('image/jpeg', 0.86)
    } catch {
      return ''
    }
  }

  function addPdfImageContain(pdf: any, imageData: string, x: number, y: number, width: number, height: number) {
    if (!imageData) return

    try {
      const props = pdf.getImageProperties(imageData)
      const imageRatio = props.width / props.height
      const boxRatio = width / height

      let drawWidth = width
      let drawHeight = height
      let drawX = x
      let drawY = y

      if (imageRatio > boxRatio) {
        drawHeight = width / imageRatio
        drawY = y + (height - drawHeight) / 2
      } else {
        drawWidth = height * imageRatio
        drawX = x + (width - drawWidth) / 2
      }

      pdf.addImage(imageData, 'JPEG', drawX, drawY, drawWidth, drawHeight)
    } catch {
      // ignore broken image in PDF generation
    }
  }

  function addPdfImageCover(pdf: any, imageData: string, x: number, y: number, width: number, height: number) {
    if (!imageData) return

    try {
      const props = pdf.getImageProperties(imageData)
      const imageRatio = props.width / props.height
      const boxRatio = width / height

      let drawWidth = width
      let drawHeight = height
      let drawX = x
      let drawY = y

      if (imageRatio > boxRatio) {
        drawHeight = height
        drawWidth = height * imageRatio
        drawX = x - (drawWidth - width) / 2
      } else {
        drawWidth = width
        drawHeight = width / imageRatio
        drawY = y - (drawHeight - height) / 2
      }

      pdf.addImage(imageData, 'JPEG', drawX, drawY, drawWidth, drawHeight)
    } catch {
      // ignore broken image in PDF generation
    }
  }

  function addPdfHeader(pdf: any, title = 'SlimWoning') {
    pdf.setFillColor(244, 248, 255)
    pdf.rect(0, 0, 210, 297, 'F')

    pdf.setFillColor(7, 27, 77)
    pdf.roundedRect(14, 14, 52, 22, 5, 5, 'F')
    pdf.setTextColor(255, 255, 255)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(15)
    pdf.text(title, 20, 25)
    pdf.setFontSize(6)
    pdf.setTextColor(170, 245, 255)
    pdf.text('VASTGOEDBROCHURE', 20, 31)

    pdf.setDrawColor(8, 145, 178)
    pdf.setLineWidth(1.1)
    pdf.line(14, 45, 196, 45)
  }

  async function handleDownloadBrochurePdf() {
    try {
      const JsPdf = await loadJsPdf()
      const pdf = new JsPdf({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true })
      const filename = `slimwoning-brochure-${property?.id || 'woning'}.pdf`

      const photoData = await Promise.all(propertyPhotos.slice(0, 6).map((photo) => imageToDataUrl(photo)))
      const mainPhoto = photoData[0] || ''
      const title = pdfText(property?.title || `${cleanWoningType(property?.woning_type)} te koop`)
      const typeLabel = pdfText(cleanWoningType(property?.woning_type))
      const location = pdfText(brochureLocation)
      const description = pdfText(property?.description || 'Geen beschrijving opgegeven door de verkoper.')

      // Page 1: cover
      pdf.setFillColor(7, 27, 77)
      pdf.rect(0, 0, 210, 297, 'F')
      if (mainPhoto) addPdfImageCover(pdf, mainPhoto, 0, 0, 210, 297)

      // Overlay with improved opacity
      pdf.setFillColor(7, 27, 77)
      pdf.setGState(new pdf.GState({ opacity: 0.42 }))
      pdf.rect(0, 0, 210, 297, 'F')
      pdf.setGState(new pdf.GState({ opacity: 1 }))

      // Logo/header block (smaller, more professional)
      pdf.setFillColor(255, 255, 255)
      pdf.roundedRect(14, 16, 50, 22, 5, 5, 'F')
      pdf.setTextColor(7, 27, 77)
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(13)
      pdf.text('SlimWoning', 19, 27)
      pdf.setFontSize(5)
      pdf.setTextColor(8, 145, 178)
      pdf.text('VASTGOEDBROCHURE', 19, 33)

      // Header right: title panel, city, etc (smaller, more professional)
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(7)
      pdf.text('PREMIUM VASTGOEDPRESENTATIE', 138, 26, { align: 'center' })
      pdf.setFontSize(6)
      pdf.text(pdfText(property?.city || 'België'), 190, 38, { align: 'right' })

      // --- Cover title directly on the photo ---
      pdf.setFontSize(7)
      pdf.setTextColor(170, 245, 255)
      pdf.text(`${typeLabel.toUpperCase()} TE KOOP`, 105, 118, { align: 'center' })
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(25)
      pdf.text(title, 105, 137, { align: 'center', maxWidth: 145 })
      pdf.setFontSize(9)
      pdf.text(location, 105, 152, { align: 'center', maxWidth: 135 })
      pdf.setDrawColor(8, 145, 178)
      pdf.setLineWidth(1)
      pdf.line(80, 166, 130, 166)
      pdf.setFontSize(18)
      pdf.text(formatPrice(property?.price), 105, 184, { align: 'center' })

      // Page 2: marketing overview
      pdf.addPage()
      addPdfHeader(pdf)
      if (mainPhoto) addPdfImageContain(pdf, mainPhoto, 14, 58, 182, 88)

      pdf.setTextColor(8, 145, 178)
      pdf.setFontSize(8)
      pdf.text('WONING TE KOOP', 14, 164)
      pdf.setTextColor(7, 27, 77)
      pdf.setFontSize(24)
      pdf.text(title, 14, 180, { maxWidth: 105 })
      pdf.setTextColor(71, 85, 105)
      pdf.setFontSize(10)
      pdf.text(location, 14, 192, { maxWidth: 105 })
      pdf.setDrawColor(219, 227, 239)
      pdf.line(14, 205, 116, 205)
      pdf.setTextColor(100, 116, 139)
      pdf.setFontSize(7)
      pdf.text('VRAAGPRIJS', 14, 218)
      pdf.setTextColor(7, 27, 77)
      pdf.setFontSize(22)
      pdf.text(formatPrice(property?.price), 14, 233)

      pdf.setDrawColor(8, 145, 178)
      pdf.setLineWidth(1)
      pdf.line(130, 164, 130, 250)
      pdf.setTextColor(7, 27, 77)
      pdf.setFontSize(16)
      pdf.text('Unieke kenmerken', 138, 170)
      pdf.setFontSize(9)
      pdf.setTextColor(71, 85, 105)
      ;(uniqueFeatures.length ? uniqueFeatures : getWoonMatchPoints().map((point) => point.text)).slice(0, 4).forEach((feature, index) => {
        const y = 187 + index * 16
        pdf.setFillColor(8, 145, 178)
        pdf.circle(140, y - 1.5, 1.3, 'F')
        pdf.setTextColor(71, 85, 105)
        pdf.text(pdf.splitTextToSize(pdfText(feature), 48), 146, y)
      })

      // Page 3: technical fiche
      pdf.addPage()
      addPdfHeader(pdf)
      pdf.setTextColor(8, 145, 178)
      pdf.setFontSize(8)
      pdf.text('VASTGOEDFICHE', 14, 62)
      pdf.setTextColor(7, 27, 77)
      pdf.setFontSize(22)
      pdf.text('Kenmerken van de woning', 14, 76)
      pdf.setDrawColor(219, 227, 239)
      pdf.line(14, 88, 196, 88)

      pdf.setFontSize(16)
      pdf.text(title, 14, 110, { maxWidth: 85 })
      pdf.setFontSize(9)
      pdf.setTextColor(100, 116, 139)
      pdf.text(location, 14, 121, { maxWidth: 85 })

      let featureY = 145
      brochureFeatures.forEach(([label, value]) => {
        pdf.setFillColor(207, 250, 254)
        pdf.circle(18, featureY - 2, 3, 'F')
        pdf.setTextColor(7, 27, 77)
        pdf.setFontSize(9)
        pdf.text('✓', 16.5, featureY - 0.5)
        pdf.setTextColor(71, 85, 105)
        pdf.setFontSize(10)
        pdf.text(label, 27, featureY)
        pdf.setTextColor(7, 27, 77)
        pdf.setFont('helvetica', 'bold')
        pdf.text(pdfText(value), 92, featureY, { align: 'right' })
        pdf.setDrawColor(219, 227, 239)
        pdf.line(14, featureY + 8, 98, featureY + 8)
        featureY += 18
      })

      pdf.setDrawColor(8, 145, 178)
      pdf.setLineWidth(1)
      pdf.line(112, 105, 112, 230)
      pdf.setTextColor(7, 27, 77)
      pdf.setFontSize(16)
      pdf.text('Technische gegevens', 122, 110)
      const technicalRows = [
        ['Adres', property?.address || 'Niet opgegeven'],
        ['Type', cleanWoningType(property?.woning_type)],
        ['Bouwjaar', property?.bouwjaar || 'Niet opgegeven'],
        ['Verwarming', property?.verwarmingstype || 'Niet opgegeven'],
        ['Parking', yesNo(property?.parking)],
        ['Tuin', yesNo(property?.tuin)],
        ['Terras', yesNo(property?.terras)],
        ['Lift', yesNo(property?.lift)],
      ]
      let rowY = 130
      technicalRows.forEach(([label, value]) => {
        pdf.setTextColor(100, 116, 139)
        pdf.setFontSize(9)
        pdf.text(label, 122, rowY)
        pdf.setTextColor(7, 27, 77)
        pdf.setFont('helvetica', 'bold')
        pdf.text(pdfText(value), 196, rowY, { align: 'right', maxWidth: 45 })
        pdf.setDrawColor(219, 227, 239)
        pdf.line(122, rowY + 5, 196, rowY + 5)
        rowY += 15
      })

      // Page 4: photos, description and contact
      pdf.addPage()
      addPdfHeader(pdf)
      pdf.setTextColor(8, 145, 178)
      pdf.setFontSize(8)
      pdf.text('FOTOREPORTAGE', 14, 62)
      pdf.setTextColor(7, 27, 77)
      pdf.setFontSize(22)
      pdf.text('Beelden van de woning', 14, 76)
      pdf.setFontSize(8)
      pdf.setTextColor(100, 116, 139)
      pdf.text(`${propertyPhotos.length} foto&apos;s beschikbaar`.replace('&apos;', "'"), 196, 76, { align: 'right' })
      pdf.setDrawColor(219, 227, 239)
      pdf.line(14, 88, 196, 88)

      if (photoData[0]) addPdfImageContain(pdf, photoData[0], 14, 102, 88, 58)
      if (photoData[1]) addPdfImageContain(pdf, photoData[1], 108, 102, 88, 58)
      if (photoData[2]) addPdfImageContain(pdf, photoData[2], 14, 166, 88, 58)
      if (photoData[3]) addPdfImageContain(pdf, photoData[3], 108, 166, 88, 58)

      pdf.setTextColor(8, 145, 178)
      pdf.setFontSize(7)
      pdf.text('BESCHRIJVING VAN DE WONING', 14, 242)
      pdf.setTextColor(71, 85, 105)
      pdf.setFontSize(9)
      pdf.text(pdf.splitTextToSize(description, 116).slice(0, 8), 14, 252)

      pdf.setDrawColor(219, 227, 239)
      pdf.line(140, 238, 140, 282)
      pdf.setTextColor(8, 145, 178)
      pdf.setFontSize(7)
      pdf.text('CONTACT', 148, 242)
      pdf.setTextColor(7, 27, 77)
      pdf.setFontSize(14)
      pdf.text(pdfText(contactNaam), 148, 253, { maxWidth: 48 })
      pdf.setFontSize(8)
      pdf.setTextColor(71, 85, 105)
      let contactY = 264
      if (contactAdres) {
        pdf.text(pdf.splitTextToSize(`Adres: ${pdfText(contactAdres)}`, 48), 148, contactY)
        contactY += 10
      }
      if (contactTelefoon) {
        pdf.text(`Tel: ${pdfText(contactTelefoon)}`, 148, contactY)
        contactY += 7
      }
      if (contactEmail) {
        pdf.text(pdf.splitTextToSize(`E-mail: ${pdfText(contactEmail)}`, 48), 148, contactY)
      }

      pdf.setDisplayMode('fullpage', 'single', 'UseNone')
      pdf.save(filename)
    } catch (error) {
      console.error('BROCHURE PDF ERROR', error)
      alert(error instanceof Error ? error.message : 'Brochure PDF kon niet worden gemaakt.')
    }
  }

  async function handleGenerateVideo() {
    if (isGeneratingVideo) return

    const photos = propertyPhotos.slice(0, 8)

    if (!photos.length) {
      alert('Voeg eerst foto’s toe om een verkoopvideo te maken.')
      return
    }

    if (!('MediaRecorder' in window)) {
      alert('Je browser ondersteunt video generatie niet. Probeer Chrome of Edge.')
      return
    }

    setIsGeneratingVideo(true)

    try {
      const canvas = document.createElement('canvas')
      canvas.width = 1280
      canvas.height = 720

      const context = canvas.getContext('2d')
      if (!context) throw new Error('Canvas context kon niet worden geladen')

      const stream = canvas.captureStream(24)
      const supportedMimeType = [
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm',
        'video/mp4;codecs=h264',
        'video/mp4',
      ].find((type) => MediaRecorder.isTypeSupported(type))

      const recorder = supportedMimeType
        ? new MediaRecorder(stream, { mimeType: supportedMimeType })
        : new MediaRecorder(stream)

      const chunks: BlobPart[] = []
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data)
      }

      const finished = new Promise<Blob>((resolve) => {
        recorder.onstop = () => resolve(new Blob(chunks, { type: recorder.mimeType || 'video/webm' }))
      })

      recorder.start()

      const loadedImages = await Promise.all(
        photos.map(async (photo) => {
          try {
            return await loadVideoImage(photo)
          } catch {
            return null
          }
        })
      )

      const slides = getVideoSlides()
      const frameDelay = 1000 / 24
      const framesPerScene = 72

      for (let index = 0; index < loadedImages.length; index += 1) {
        const slide = slides[index % (slides.length - 1)]

        for (let frame = 0; frame < framesPerScene; frame += 1) {
          drawVideoFrame(
            context,
            loadedImages[index],
            frame / framesPerScene,
            slide.title,
            slide.subtitle
          )

          await new Promise((resolve) => setTimeout(resolve, frameDelay))
        }
      }

      const finalSlide = slides[slides.length - 1]
      for (let frame = 0; frame < 84; frame += 1) {
        drawVideoFrame(context, null, 0, finalSlide.title, finalSlide.subtitle, true)
        await new Promise((resolve) => setTimeout(resolve, frameDelay))
      }

      recorder.stop()
      const blob = await finished
      const videoExtension = blob.type.includes('mp4') ? 'mp4' : 'webm'
      const videoUrl = URL.createObjectURL(blob)

      if (generatedVideoUrl) URL.revokeObjectURL(generatedVideoUrl)

      setGeneratedVideoUrl(videoUrl)

      const link = document.createElement('a')
      link.href = videoUrl
      link.download = `slimwoning-verkoopvideo-${property?.id || 'woning'}.${videoExtension}`
      link.click()
    } catch (error) {
      console.error('VIDEO ERROR', error)

      alert(
        error instanceof Error
          ? error.message
          : JSON.stringify(error)
      )
    } finally {
      setIsGeneratingVideo(false)
    }
  }

  if (!property) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f8fb] text-2xl font-bold text-[#111827]">
        Laden...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f6f8fb] px-4 py-5 text-[#111827] md:px-8">
      <div className="property-page-content mx-auto max-w-[1280px]">
        <div className="mb-5 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="rounded-2xl bg-white px-5 py-3 font-bold text-[#111827] shadow-sm"
          >
            ← Terug naar dashboard
          </Link>
        </div>

        <div className="space-y-6">
          <div>
            <div className="mx-auto max-w-[1100px] overflow-hidden rounded-[1.5rem] bg-white shadow-lg ring-1 ring-slate-200/70">
              <div className="relative overflow-hidden">
                {showStreetViewInGallery ? (
                  <div className="relative h-[330px] w-full bg-slate-900 md:h-[430px] lg:h-[460px]">
                      <StreetViewFrame position={mapCenter} />

                    <button
                      type="button"
                      onClick={() => setShowStreetViewInGallery(false)}
                      className="absolute right-5 top-5 z-30 rounded-full bg-white px-5 py-3 text-sm font-black text-[#071B4D] shadow-xl"
                    >
                      Sluiten
                    </button>
                  </div>
                ) : (
                  renderPhotoView(photoViewMode)
                )}

              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />


              {!showStreetViewInGallery && photoViewMode === 'slider' && propertyPhotos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={showPreviousPhoto}
                    className="absolute left-6 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-2xl font-black text-[#071B4D] shadow-xl transition hover:bg-white"
                    aria-label="Vorige foto"
                  >
                    ‹
                  </button>

                  <button
                    type="button"
                    onClick={showNextPhoto}
                    className="absolute right-6 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-2xl font-black text-[#071B4D] shadow-xl transition hover:bg-white"
                    aria-label="Volgende foto"
                  >
                    ›
                  </button>

                  <div className="absolute bottom-5 left-1/2 z-20 -translate-x-1/2 rounded-full bg-black/55 px-4 py-2 text-sm font-black text-white backdrop-blur">
                    {activePhotoIndex + 1} / {propertyPhotos.length}
                  </div>
                </>
              )}


              {property.created_at &&
                Date.now() - new Date(property.created_at).getTime() <
                  15 * 24 * 60 * 60 * 1000 && (
                  <div className="absolute left-8 top-8 flex items-center drop-shadow-xl md:top-8">
                    <div className="relative flex h-10 items-center rounded-r-md bg-red-600 pl-10 pr-6 text-xl font-black italic leading-none text-white">
                      <span className="absolute left-[-24px] top-0 h-0 w-0 border-y-[20px] border-r-[24px] border-y-transparent border-r-red-600" />
                      <span className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-[3px] border-white/90 bg-white/20" />
                      Nieuw
                    </div>
                  </div>
                )}
              </div>

              {!showStreetViewInGallery && photoViewMode === 'slider' && propertyPhotos.length > 1 && (
                <div className="flex gap-2 overflow-x-auto border-t border-slate-200 bg-white p-2">
                  {propertyPhotos.map((photo, index) => (
                    <button
                      key={`${photo}-${index}`}
                      type="button"
                      onClick={() => setActivePhotoIndex(index)}
                      className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-xl ring-4 transition ${
                        activePhotoIndex === index
                          ? 'ring-blue-700'
                          : 'ring-transparent hover:ring-blue-200'
                      }`}
                      aria-label={`Toon foto ${index + 1}`}
                      aria-pressed={activePhotoIndex === index}
                    >
                      <img
                        src={photo}
                        alt={`${displayTitle || 'Woning'} foto ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>


            

            <div className="relative mx-auto mt-2 max-w-[1100px]">
              {showPhotoMenu && (
                <div className="absolute left-0 top-[calc(100%+0.5rem)] z-30 w-[280px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                  <div className="divide-y divide-slate-200">
                    <button
                      type="button"
                      onClick={() => openPhotoView('slider')}
                      className={`flex w-full items-center justify-between px-5 py-4 text-left text-sm font-black transition hover:bg-slate-50 ${
                        photoViewMode === 'slider' ? 'bg-blue-50 text-blue-700' : 'text-[#071B4D]'
                      }`}
                    >
                      <span>Grote foto</span>
                      <span className="text-xs text-slate-400">1 groot beeld</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openPhotoView('grid')}
                      className={`flex w-full items-center justify-between px-5 py-4 text-left text-sm font-black transition hover:bg-slate-50 ${
                        photoViewMode === 'grid' ? 'bg-blue-50 text-blue-700' : 'text-[#071B4D]'
                      }`}
                    >
                      <span>Foto overzicht</span>
                      <span className="text-xs text-slate-400">alle foto's</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="grid grid-cols-2 divide-x divide-y divide-slate-200 lg:grid-cols-4 lg:divide-y-0">
                  <button
                    type="button"
                    onClick={() => {
                      setShowStreetViewInGallery(false)
                      setShowPhotoMenu((current) => !current)
                    }}
                    className={`flex items-center justify-center gap-2 px-4 py-3 text-sm font-black transition ${
                      showStreetViewInGallery
                        ? 'text-[#071B4D] hover:bg-slate-50'
                        : 'bg-[#071B4D] text-white hover:bg-[#0B2A6F]'
                    }`}
                  >
                    <span className="text-base">▦</span>
                    <span>Foto&apos;s</span>
                    <span className="text-xs opacity-80">▾</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowPhotoMenu(false)
                      handleGenerateVideo()
                    }}
                    disabled={isGeneratingVideo}
                    className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-black text-[#071B4D] transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className="text-base">▶</span>
                    <span>{isGeneratingVideo ? 'Video maken...' : 'Video'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowPhotoMenu(false)
                      setShowBrochurePreview(true)
                    }}
                    className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-black text-[#071B4D] transition hover:bg-slate-50"
                  >
                    <span className="text-base">□</span>
                    <span>Brochure</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowPhotoMenu(false)
                      setShowStreetViewInGallery(true)
                    }}
                    className={`flex items-center justify-center gap-2 px-4 py-3 text-sm font-black transition ${
                      showStreetViewInGallery
                        ? 'bg-[#071B4D] text-white hover:bg-[#0B2A6F]'
                        : 'text-[#071B4D] hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-base">⌖</span>
                    <span>Street View</span>
                  </button>
                </div>
              </div>
            </div>

            <section className="mx-auto mt-8 max-w-[1180px]">
              <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
                {/* Left Column: Content */}
                <div className="min-w-0">
                  {/* Header */}
                  <div className="mb-6">
                    <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-700">
                      {property.city || 'Locatie niet opgegeven'}
                    </p>

                    <div className="mt-2 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                      <h1 className="text-4xl font-black leading-tight tracking-[-0.03em] text-[#111827]">
                        {displayTitle}
                      </h1>

                      <div className="shrink-0 text-left md:text-right">
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">
                          Vraagprijs
                        </p>
                        <p className="mt-1 text-3xl font-black text-blue-700">
                          {formatPrice(property.price)}
                        </p>
                      </div>
                    </div>

                    {/* Quick Stats Row */}
                  </div>

                  {/* Quick Stats Row */}
                  <div id="energie-section" className="scroll-mt-8 mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="grid grid-cols-2 md:grid-cols-4">
                      {property.bewoonbare_oppervlakte && (
                        <div className="flex min-h-[116px] flex-col items-center justify-center border-b border-r border-slate-200 p-5 text-center md:border-b-0">
                          <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
                            Oppervlakte
                          </p>
                          <p className="mt-2 text-2xl font-black text-[#071B4D]">
                            {property.bewoonbare_oppervlakte} m²
                          </p>
                        </div>
                      )}

                      {property.slaapkamers && (
                        <div className="flex min-h-[116px] flex-col items-center justify-center border-b border-slate-200 p-5 text-center md:border-b-0 md:border-r">
                          <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
                            Slaapkamers
                          </p>
                          <p className="mt-2 text-2xl font-black text-[#071B4D]">
                            {property.slaapkamers}
                          </p>
                        </div>
                      )}

                      {property.badkamers && (
                        <div className="flex min-h-[116px] flex-col items-center justify-center border-r border-slate-200 p-5 text-center">
                          <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
                            Badkamers
                          </p>
                          <p className="mt-2 text-2xl font-black text-[#071B4D]">
                            {property.badkamers}
                          </p>
                        </div>
                      )}

                      {property.epc && (
                        <div className="flex min-h-[116px] flex-col items-center justify-center p-5 text-center">
                          <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
                            EPC
                          </p>
                          <p className="mt-2 text-2xl font-black text-[#071B4D]">
                            {property.epc}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>


                  {/* Features Grid + Beschrijving */}
                  <div className="rounded-[1.5rem] bg-white p-6 shadow-sm">
                    <h2 className="mb-4 text-2xl font-black text-[#071B4D]">Woningkenmerken</h2>
                    <div className="grid grid-cols-1 gap-x-8 gap-y-3 md:grid-cols-2">
                      <InfoRow label="Type" value={cleanWoningType(property.woning_type)} />
                      <InfoRow label="Bouwjaar" value={property.bouwjaar} />
                      <InfoRow label="Verwarming" value={property.verwarmingstype} />
                      <InfoRow label="Grondoppervlakte" value={property.grondoppervlakte ? `${property.grondoppervlakte} m²` : ''} />
                      <InfoRow label="Parking" value={yesNo(property.parking)} />
                      <InfoRow label="Tuin" value={yesNo(property.tuin)} />
                      <InfoRow label="Terras" value={yesNo(property.terras)} />
                      <InfoRow label="Lift" value={yesNo(property.lift)} />
                      <InfoRow label="Gemeubeld" value={yesNo(property.gemeubeld)} />
                      <InfoRow label="Dubbel glas" value={yesNo(property.dubbel_glas)} />
                    </div>
                    <div className="mt-8 border-t border-slate-200 pt-8">
                      <h2 className="text-2xl font-black text-[#071B4D]">Beschrijving</h2>
                      <p className="mt-4 leading-7 text-gray-600">
                        {property.description || 'Geen beschrijving beschikbaar.'}
                      </p>
                    </div>
                    {userId === property.user_id && (
                      <div className="mt-8 border-t border-slate-200 pt-6">
                        <div className="flex flex-wrap justify-center gap-3">
                          <Link
                            href={`/edit-property/${property.id}`}
                            className="flex min-w-[180px] items-center justify-center rounded-xl bg-blue-700 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-800"
                          >
                            Bewerken
                          </Link>

                          <button
                            type="button"
                            onClick={handleDelete}
                            className="min-w-[180px] rounded-xl border-2 border-slate-900 bg-white px-6 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-50"
                          >
                            Verwijderen
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                </div>

                {/* Right Column: Sticky Sidebar */}
                <div className="space-y-4 lg:sticky lg:top-8 lg:h-fit">
                  {/* Location Card */}
                  {property.address && (
                    <div className="rounded-[1.5rem] bg-white p-6 shadow-sm">
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">
                        Locatie
                      </p>
                      <p className="mt-3 font-black text-[#071B4D]">
                        {property.address}
                      </p>
                      <p className="mt-1 text-sm text-gray-600">
                        {property.city}
                      </p>
                      <button
                        onClick={() => setShowMap(true)}
                        className="mt-4 w-full rounded-xl border-2 border-blue-700 px-4 py-3 font-black text-blue-700 transition hover:bg-blue-50"
                      >
                        Open kaart
                      </button>
                    </div>
                  )}



                  {/* Makelaar matching - seller only */}
                  <div className="rounded-[1.5rem] bg-white p-6 shadow-sm">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">
                      Makelaar matching
                    </p>

                    <h3 className="mt-3 text-xl font-black text-[#071B4D]">
                      Vind een geschikte makelaar
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-gray-600">
                      We zoeken makelaars die actief zijn in deze regio en passen bij dit type woning.
                    </p>

                    <div className="mt-4 rounded-2xl bg-blue-50 p-4">
                      <p className="text-3xl font-black text-blue-700">15</p>
                      <p className="mt-1 text-sm font-bold text-slate-600">makelaars actief in deze regio</p>
                    </div>

                    <div className="mt-4 grid gap-2">
                      <Link
                        href={`/dashboard/properties/${property.id}/makelaar-aanvraag`}
                        className="rounded-xl bg-blue-700 px-4 py-3 text-center font-black text-white transition hover:bg-blue-800"
                      >
                        Bekijk makelaars
                      </Link>

                      <Link
                        href={`/dashboard/properties/${property.id}/makelaar-aanvraag`}
                        className="rounded-xl border-2 border-blue-700 px-4 py-3 text-center font-black text-blue-700 transition hover:bg-blue-50"
                      >
                        Verstuur aanvraag
                      </Link>
                    </div>
                  </div>

                </div>
              </div>
            </section>
            {generatedVideoUrl && (
              <div className="mt-3 overflow-hidden rounded-[1.5rem] bg-[#071B4D] p-3 shadow-xl">
                <video
                  src={generatedVideoUrl}
                  controls
                  className="aspect-video w-full rounded-[1.25rem] bg-black"
                />
                <div className="mt-3 flex justify-center">
                  <a
                    href={generatedVideoUrl}
                    download={`slimwoning-verkoopvideo-${property?.id || 'woning'}.webm`}
                    className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-bold text-[#071B4D] transition hover:bg-slate-100"
                  >
                    Download video
                  </a>
                </div>
              </div>
            )}



            {getWoningkenmerken(property).length > 0 && (
              <SectionCard title="Woningkenmerken">
                <div className="flex flex-wrap gap-2">
                  {getWoningkenmerken(property).map((kenmerk) => (
                    <span
                      key={kenmerk}
                      className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700"
                    >
                      {kenmerk}
                    </span>
                  ))}
                </div>
              </SectionCard>
            )}


          </div>

        </div>
      </div>

      {showBrochurePreview && (
        <div className="brochure-print-modal fixed inset-0 z-50 overflow-y-auto bg-[#eef2f7] p-4 md:p-6">
          <style jsx global>{`
            @media print {
              @page {
                size: A4;
                margin: 0;
              }
              html,
              body {
                width: 210mm !important;
                height: auto !important;
                margin: 0 !important;
                padding: 0 !important;
                overflow: visible !important;
                background: white !important;
              }
              .property-page-content {
                display: none !important;
              }
              .brochure-print-modal {
                position: static !important;
                width: auto !important;
                height: auto !important;
                min-height: auto !important;
                overflow: visible !important;
                background: white !important;
                padding: 0 !important;
                margin: 0 !important;
              }

              .brochure-print-area {
                width: 100% !important;
                height: auto !important;
                overflow: visible !important;
                margin: 0 !important;
                padding: 0 !important;
              }

              .brochure-print-page {
                width: 210mm !important;
                min-height: 297mm !important;
                height: 297mm !important;
                overflow: hidden !important;
                margin: 0 !important;
                box-shadow: none !important;
                break-after: page !important;
                page-break-after: always !important;
              }

              .brochure-print-page:last-child {
                break-after: auto !important;
                page-break-after: auto !important;
              }
              .brochure-print-actions {
                display: none !important;
              }
            }
          `}</style>
          <div className="mx-auto w-full max-w-[794px]">
            <div className="brochure-print-area space-y-6 print:space-y-0">
              <section className="brochure-print-page relative h-[1123px] overflow-hidden bg-[#071B4D] shadow-2xl">
                {previewPhotos[0] ? (
                  <img
                    src={previewPhotos[0]}
                    alt={displayTitle || 'Hoofdfoto woning'}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-300 to-slate-500" />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-[#071B4D]/95 via-[#071B4D]/45 to-[#071B4D]/15" />
                <div className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-black/35 to-transparent" />

                <div className="relative flex h-full flex-col justify-between p-12 text-white print:h-[297mm]">
                  <div className="flex items-start justify-between gap-8">
                    <div className="rounded-[1.25rem] bg-white/95 px-5 py-4 text-[#071B4D] shadow-xl">
                      <p className="text-2xl font-black leading-none">SlimWoning</p>
                      <p className="mt-2 text-[10px] font-black uppercase tracking-[0.24em] text-cyan-600">
                        Vastgoedbrochure
                      </p>
                    </div>

                    <div className="pt-4 text-right">
                      <p className="text-sm font-black uppercase tracking-[0.34em] text-white">
                        Premium vastgoedpresentatie
                      </p>
                      <p className="mt-3 text-sm font-bold text-white/80">
                        {property.city || 'België'}
                      </p>
                    </div>
                  </div>

                  <div className="mx-auto mb-20 max-w-5xl text-center">
                    <p className="text-sm font-black uppercase tracking-[0.34em] text-cyan-200">
                      {cleanWoningType(property.woning_type)} te koop
                    </p>

                    <h1 className="mt-6 text-5xl font-black leading-tight tracking-[-0.03em] md:text-6xl">
                      {displayTitle || `${cleanWoningType(property.woning_type)} te koop`}
                    </h1>

                    <p className="mx-auto mt-5 max-w-3xl text-xl font-bold leading-8 text-white/90">
                      {brochureLocation}
                    </p>

                    <div className="mx-auto mt-10 h-1.5 w-56 bg-cyan-400" />

                    <p className="mt-10 text-4xl font-black tracking-tight">
                      {formatPrice(property.price)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-white/25 pt-7 text-sm font-bold text-white/80">
                    <span>SlimWoning vastgoedpresentatie</span>
                    <span>{property.city || 'België'}</span>
                  </div>
                </div>
              </section>

              <section className="brochure-print-page h-[1123px] bg-[#F4F8FF] p-10 shadow-2xl">
                <div className="flex items-start justify-between gap-8">
                  <div className="rounded-[1.25rem] bg-[#071B4D] px-5 py-4 text-white">
                    <p className="text-2xl font-black leading-none">SlimWoning</p>
                    <p className="mt-2 text-[10px] font-black uppercase tracking-[0.24em] text-cyan-200">
                      Vastgoedbrochure
                    </p>
                  </div>

                  <div className="pt-2 text-right">
                    {isMakelaarBrochure ? (
                      <div className="flex flex-col items-end">
                        {makelaarLogo ? (
                          <img
                            src={makelaarLogo}
                            alt={makelaarNaam}
                            className="max-h-14 max-w-[220px] object-contain"
                          />
                        ) : (
                          <p className="text-2xl font-black text-[#071B4D]">
                            {makelaarNaam}
                          </p>
                        )}
                        <p className="mt-3 text-sm font-black uppercase tracking-[0.22em] text-[#071B4D]">
                          {makelaarNaam}
                        </p>
                        <p className="mt-1 max-w-[300px] text-sm font-bold leading-6 text-slate-500">
                          {makelaarAdres || property.city || 'België'}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-black uppercase tracking-[0.34em] text-[#071B4D]">
                          Premium vastgoedpresentatie
                        </p>
                        <p className="mt-3 text-sm font-bold text-slate-500">
                          {property.city || 'België'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-7 h-1.5 w-full bg-cyan-400" />

                <div className="mt-9 h-[390px] overflow-hidden bg-slate-100">
                  {previewPhotos[0] ? (
                    <img
                      src={previewPhotos[0]}
                      alt={displayTitle || 'Woning'}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-slate-200 text-xl font-black text-slate-500">
                      Geen hoofdfoto beschikbaar
                    </div>
                  )}
                </div>

                <div className="mt-9 grid gap-12 md:grid-cols-[1.25fr_0.75fr]">
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.28em] text-cyan-600">
                      Woning te koop
                    </p>
                    <h1 className="mt-4 text-4xl font-black leading-tight text-[#071B4D]">
                      {displayTitle || cleanWoningType(property.woning_type)}
                    </h1>
                    <p className="mt-3 text-base font-bold leading-7 text-slate-600">
                      {brochureLocation}
                    </p>

                    <div className="mt-6 border-y border-slate-200 py-5">
                      <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">
                        Vraagprijs
                      </p>
                      <p className="mt-2 text-4xl font-black tracking-tight text-[#071B4D]">
                        {formatPrice(property.price)}
                      </p>
                    </div>
                  </div>

                  <div className="border-l-4 border-cyan-400 pl-7">
                    <h2 className="text-2xl font-black text-[#071B4D]">
                      Unieke kenmerken
                    </h2>
                    <div className="mt-6 space-y-5 text-base leading-7 text-slate-600">
                      {(uniqueFeatures.length ? uniqueFeatures : getWoonMatchPoints().map((point) => point.text)).slice(0, 4).map((feature, index) => (
                        <p key={`${feature}-${index}`} className="flex gap-4">
                          <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-cyan-500" />
                          <span>{feature}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              <section className="brochure-print-page h-[1123px] bg-[#F4F8FF] p-12 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-200 pb-8">
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.3em] text-cyan-600">
                      Vastgoedfiche
                    </p>
                    <h2 className="mt-2 text-3xl font-black text-[#071B4D]">
                      Kenmerken van de woning
                    </h2>
                  </div>
                  <p className="text-2xl font-black text-[#071B4D]">SlimWoning</p>
                </div>

                <div className="mt-10 grid gap-12 md:grid-cols-[1.1fr_0.9fr]">
                  <div>
                    <h3 className="text-2xl font-black text-[#071B4D]">
                      {displayTitle || cleanWoningType(property.woning_type)}
                    </h3>
                    <p className="mt-3 text-base font-bold text-slate-500">
                      {brochureLocation}
                    </p>

                    <div className="mt-10 divide-y divide-slate-200 border-y border-slate-200">
                      {brochureFeatures.map(([label, value]) => (
                        <div key={label} className="grid grid-cols-[40px_1fr_auto] items-center gap-4 py-5">
                          <span className="grid h-8 w-8 place-items-center rounded-full bg-cyan-100 text-sm font-black text-[#071B4D]">
                            ✓
                          </span>
                          <span className="text-base font-bold text-slate-600">{label}</span>
                          <span className="text-base font-black text-[#071B4D]">{value}</span>
                        </div>
                      ))}
                    </div>

                  </div>

                  <div>
                    <div className="border-l-4 border-cyan-400 pl-7">
                      <h3 className="text-2xl font-black text-[#071B4D]">Technische gegevens</h3>
                      <div className="mt-6 space-y-4 text-base">
                        <InfoRow label="Adres" value={property.address} />
                        <InfoRow label="Type" value={cleanWoningType(property.woning_type)} />
                        <InfoRow label="Bouwjaar" value={property.bouwjaar} />
                        <InfoRow label="Verwarming" value={property.verwarmingstype} />
                        <InfoRow label="Parking" value={yesNo(property.parking)} />
                        <InfoRow label="Tuin" value={yesNo(property.tuin)} />
                        <InfoRow label="Terras" value={yesNo(property.terras)} />
                        <InfoRow label="Lift" value={yesNo(property.lift)} />
                      </div>
                    </div>

                  </div>
                </div>
              </section>

              <section className="brochure-print-page h-[1123px] bg-[#F4F8FF] p-12 shadow-2xl">
                <div className="flex items-end justify-between border-b border-slate-200 pb-8">
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.3em] text-cyan-600">
                      Fotoreportage
                    </p>
                    <h2 className="mt-2 text-3xl font-black text-[#071B4D]">
                      Beelden van de woning
                    </h2>
                  </div>
                  <p className="text-sm font-bold text-slate-500">
                    {propertyPhotos.length} foto&apos;s beschikbaar
                  </p>
                </div>

                <div className="mt-10 grid grid-cols-2 gap-5">
                  {propertyPhotos.slice(0, 6).map((photo, index) => (
                    <div key={`${photo}-brochure-page-${index}`} className={`${index === 0 ? 'col-span-2 h-[390px]' : 'h-[245px]'} overflow-hidden bg-slate-100`}>
                      <img
                        src={photo}
                        alt={`${displayTitle || 'Woning'} brochure foto ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-10 grid gap-10 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <p className="text-sm font-black uppercase tracking-[0.28em] text-cyan-600">
                      Beschrijving van de woning
                    </p>

                    <div className="mt-3">
                      <p className="text-lg leading-9 text-slate-700 whitespace-pre-line">
                        {property.description || 'Geen beschrijving opgegeven door de verkoper.'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-14 border-t border-slate-200 pt-8">
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-600">
                    Contact
                  </p>
                  <p className="mt-3 text-2xl font-black text-[#071B4D]">
                    {contactNaam}
                  </p>

                  <div className="mt-5 grid gap-x-10 gap-y-3 text-base leading-7 text-slate-600 md:grid-cols-2">
                    {contactAdres && (
                      <p>
                        <span className="font-black text-[#071B4D]">Adres: </span>
                        {contactAdres}
                      </p>
                    )}

                    {contactTelefoon && (
                      <p>
                        <span className="font-black text-[#071B4D]">Telefoon: </span>
                        {contactTelefoon}
                      </p>
                    )}

                    {contactEmail && (
                      <p>
                        <span className="font-black text-[#071B4D]">E-mail: </span>
                        {contactEmail}
                      </p>
                    )}

                    {!contactAdres && !contactTelefoon && !contactEmail && (
                      <p>
                        Vraag een bezoek of bijkomende informatie aan via SlimWoning.
                      </p>
                    )}
                  </div>
                </div>
              </section>
              <div className="brochure-print-actions mt-6 flex justify-center gap-3 print:hidden">
                <button
                  type="button"
                  onClick={handleDownloadBrochurePdf}
                  className="rounded-2xl bg-emerald-600 px-8 py-4 text-sm font-black text-white shadow-lg transition hover:bg-emerald-700"
                >
                  Download brochure als PDF
                </button>

                <button
                  type="button"
                  onClick={() => setShowBrochurePreview(false)}
                  className="rounded-2xl bg-[#071B4D] px-8 py-4 text-sm font-black text-white shadow-lg transition hover:bg-[#0B2A6F]"
                >
                  Sluiten
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPhotoFullscreen && (
        <div className="fixed inset-0 z-50 bg-[#f6f8fb] p-4 md:p-6">
          <div className="mx-auto flex h-full max-w-[1600px] flex-col">
            <div className="min-h-0 flex-1 overflow-hidden rounded-[2rem] bg-white shadow-2xl ring-1 ring-slate-200/70">
              <div className="relative h-full overflow-auto bg-[#f8fafc] p-4">
                <button
                  type="button"
                  onClick={() => setShowPhotoFullscreen(false)}
                  className="absolute right-8 top-8 z-40 grid h-12 w-12 place-items-center rounded-full bg-[#071B4D] text-2xl font-black text-white shadow-xl transition hover:bg-[#0B2A6F]"
                  aria-label="Sluiten"
                >
                  ×
                </button>
                {renderPhotoView(photoViewMode, true)}

                {photoViewMode === 'slider' && propertyPhotos.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={showPreviousPhoto}
                      className="absolute left-6 top-1/2 grid h-14 w-14 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-3xl font-black text-[#071B4D] shadow-xl transition hover:bg-white"
                    >
                      ‹
                    </button>

                    <button
                      type="button"
                      onClick={showNextPhoto}
                      className="absolute right-6 top-1/2 grid h-14 w-14 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-3xl font-black text-[#071B4D] shadow-xl transition hover:bg-white"
                    >
                      ›
                    </button>

                    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-5 py-2 text-sm font-black text-white backdrop-blur">
                      {activePhotoIndex + 1} / {propertyPhotos.length}
                    </div>
                  </>
                )}
              </div>

              {photoViewMode === 'slider' && propertyPhotos.length > 1 && (
                <div className="flex gap-2 overflow-x-auto border-t border-slate-200 bg-white p-2">
                  {propertyPhotos.map((photo, index) => (
                    <button
                      key={`${photo}-fullscreen-${index}`}
                      type="button"
                      onClick={() => setActivePhotoIndex(index)}
                      className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-xl ring-4 transition ${
                        activePhotoIndex === index
                          ? 'ring-blue-700'
                          : 'ring-transparent hover:ring-blue-200'
                      }`}
                    >
                      <img
                        src={photo}
                        alt={`${displayTitle || 'Woning'} foto ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {showMap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-5">
          <div className="relative w-full max-w-7xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
            <button
              onClick={() => setShowMap(false)}
              className="absolute right-5 top-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-black text-2xl font-bold text-white"
            >
              ✕
            </button>

            <div className="h-[85vh] w-full">
              {!isLoaded && (
                <div className="flex h-full items-center justify-center text-2xl font-bold">
                  Map laden...
                </div>
              )}

              {isLoaded && (
                <GoogleMap
                  mapContainerStyle={{
                    width: '100%',
                    height: '100%',
                  }}
                  center={mapCenter}
                  zoom={15}
                >
                  <Marker position={mapCenter} />
                </GoogleMap>
              )}
            </div>

            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between bg-gradient-to-t from-black/90 via-black/70 to-transparent p-8">
              <div>
                <h2 className="text-3xl font-bold text-white">
                  {displayTitle}
                </h2>
                <p className="mt-2 text-lg text-gray-300">
                  {property.address || property.city}
                </p>
              </div>

              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  `${property.address || ''} ${property.city || ''}`
                )}`}
                target="_blank"
                className="rounded-2xl bg-blue-700 px-7 py-5 font-bold text-white transition hover:bg-blue-800"
              >
                Open Google Maps
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function InfoRow({
  label,
  value,
}: {
  label: string
  value: any
}) {
  const displayValue = String(value || '').trim()

  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-3">
      <span className="text-gray-500">{label}</span>
      <span className="font-black text-[#071B4D]">
        {displayValue || 'Niet opgegeven'}
      </span>
    </div>
  )
}

function StreetViewFrame({
  position,
}: {
  position: { lat: number; lng: number }
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const panoramaRef = useRef<any>(null)

  useEffect(() => {
    if (!containerRef.current || !window.google?.maps) return

    const requestedPosition = new window.google.maps.LatLng(
      position.lat,
      position.lng
    )

    if (!panoramaRef.current) {
      panoramaRef.current = new window.google.maps.StreetViewPanorama(
        containerRef.current,
        {
          position: requestedPosition,
          pov: {
            heading: 0,
            pitch: 0,
          },
          zoom: 1,
          addressControl: false,
          fullscreenControl: true,
          motionTracking: false,
          panControl: true,
          zoomControl: true,
          showRoadLabels: true,
          visible: true,
        }
      )
    }

    const panorama = panoramaRef.current
    const service = new window.google.maps.StreetViewService()

    service.getPanorama(
      {
        location: requestedPosition,
        radius: 100,
        source: window.google.maps.StreetViewSource.OUTDOOR,
      },
      (data: any, status: any) => {
        if (
          status === window.google.maps.StreetViewStatus.OK &&
          data?.location?.latLng
        ) {
          panorama.setPosition(data.location.latLng)
          panorama.setPov({
            heading: 0,
            pitch: 0,
          })
          panorama.setVisible(true)
          return
        }

        panorama.setPosition(requestedPosition)
        panorama.setVisible(true)
      }
    )
  }, [position.lat, position.lng])

  return <div ref={containerRef} className="h-full w-full" />
}

function SectionCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="mx-auto mt-5 max-w-[1180px] rounded-[1.75rem] bg-white p-5 shadow-sm md:p-6">
      <h2 className="mb-4 text-2xl font-bold">{title}</h2>
      {children}
    </div>
  )
}

type ComparableProperty = {
  id: string | number
  title?: string | null
  address?: string | null
  city?: string | null
  postcode?: string | number | null
  price?: string | number | null
  slaapkamers?: string | number | null
  bedrooms?: string | number | null
  badkamers?: string | number | null
  bathrooms?: string | number | null
  bewoonbare_oppervlakte?: string | number | null
  oppervlakte?: string | number | null
  living_area?: string | number | null
  grondoppervlakte?: string | number | null
  epc?: string | null
  epc_code?: string | null
  ai_rank_score?: string | number | null
}
