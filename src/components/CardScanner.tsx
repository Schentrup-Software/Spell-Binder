import { useRef, useEffect, useState, useCallback } from 'react'
import Tesseract from 'tesseract.js'

export default function CardScanner() {
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const [isScanning, setIsScanning] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [lastScannedTitle, setLastScannedTitle] = useState<string>('')
    const [scanCount, setScanCount] = useState(0)
    const [detectedCard, setDetectedCard] = useState<string | null>(null)
    const [cardCorners, setCardCorners] = useState<Array<{ x: number, y: number }>>([])
    const [showDebug, setShowDebug] = useState(false)
    const [debugContours, setDebugContours] = useState<Array<Array<{ x: number, y: number }>>>([])
    const [debugEdges, setDebugEdges] = useState<string | null>(null)
    const [debugOcrImage, setDebugOcrImage] = useState<string | null>(null)

    // Start camera
    const startCamera = useCallback(async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment', // Use back camera on mobile
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            })

            streamRef.current = mediaStream
            setIsScanning(true)

            // Wait for video element to be mounted and retry if needed
            const setupVideo = async (retryCount = 0) => {
                const maxRetries = 10

                if (!videoRef.current) {
                    if (retryCount < maxRetries) {
                        console.log(`Video ref is null, retrying in 100ms... (attempt ${retryCount + 1}/${maxRetries})`)
                        setTimeout(() => setupVideo(retryCount + 1), 100)
                        return
                    } else {
                        console.error('Video element failed to mount after maximum retries')
                        return
                    }
                }

                videoRef.current.srcObject = mediaStream

                // Add error handler
                videoRef.current.onerror = (error) => {
                    console.error('Video element error:', error)
                }

                // Wait for video metadata to load before proceeding
                videoRef.current.onloadedmetadata = async () => {
                    try {
                        await videoRef.current?.play()
                    } catch (playError) {
                        console.error('Failed to start video playback:', playError)
                    }
                }

                // Also try to play immediately in case metadata is already loaded
                try {
                    await videoRef.current.play()
                } catch (immediatePlayError) {
                    console.log('Immediate play failed, waiting for metadata:', (immediatePlayError as Error).message)
                }
            }

            await setupVideo()

        } catch (error) {
            console.error('Failed to start camera:', error)
            alert('Failed to access camera. Please ensure camera permissions are granted.')
        }
    }, [])

    // Stop camera
    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop())
            streamRef.current = null
        }
        setIsScanning(false)
        setLastScannedTitle('')
        setScanCount(0)
        setDetectedCard(null)
        setCardCorners([])
        setDebugContours([])
        setDebugEdges(null)
        setDebugOcrImage(null)
    }, [])

    // Capture and process frame with card detection and perspective correction
    const scanCard = useCallback(async () => {
        if (!videoRef.current || !canvasRef.current || isProcessing) return

        setIsProcessing(true)
        setScanCount(prev => prev + 1)

        try {
            const video = videoRef.current
            const canvas = canvasRef.current
            const ctx = canvas.getContext('2d')

            // More thorough check for video readiness
            if (!ctx || video.videoWidth === 0 || video.videoHeight === 0 || video.readyState < 3) {
                setIsProcessing(false)
                return
            }

            // Set canvas size to match video
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight

            // Draw current frame
            ctx.drawImage(video, 0, 0)

            console.log(`🔍 Scan #${scanCount} - Detecting card in frame (${canvas.width}×${canvas.height})...`)

            // Detect card boundaries in the image
            const cardCorners = detectCardCorners(canvas, ctx)

            if (cardCorners.length === 4) {
                console.log('📄 Card detected with corners:', cardCorners)
                setCardCorners(cardCorners)

                // Extract and perspective-correct the card
                const cardImage = extractCard(canvas, cardCorners)

                if (cardImage) {
                    console.log(`✂️ Card extracted: ${cardImage.width}×${cardImage.height}`)
                    setDetectedCard(cardImage.toDataURL('image/png'))

                    // Create a cropped version for OCR (top 12% where the title is)
                    const titleHeight = Math.round(cardImage.height * 0.12)
                    const ocrCanvas = document.createElement('canvas')
                    ocrCanvas.width = cardImage.width
                    ocrCanvas.height = titleHeight

                    const ocrCtx = ocrCanvas.getContext('2d')!
                    // Draw only the top 12% of the card
                    ocrCtx.drawImage(cardImage, 0, 0, cardImage.width, titleHeight, 0, 0, cardImage.width, titleHeight)

                    // Run OCR on the cropped title area
                    const ocrImageData = ocrCanvas.toDataURL('image/png')
                    console.log(`🔤 OCR area cropped: ${ocrCanvas.width}×${ocrCanvas.height} (top 12% of card)`)

                    // Store debug OCR image if debug mode is enabled
                    if (showDebug) {
                        setDebugOcrImage(ocrImageData)
                    }

                    const { data } = await Tesseract.recognize(ocrImageData, 'eng', {
                        logger: m => {
                            if (m.status === 'recognizing text') {
                                console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`)
                            }
                        }
                    })

                    // Find card title from the OCR results
                    const cardTitle = findCardTitle(data.text, data.confidence)

                    if (cardTitle) {
                        console.log(`🃏 Scan #${scanCount} - Card Title Detected:`, cardTitle)
                        console.log(`📊 OCR Confidence: ${data.confidence.toFixed(1)}%`)
                        console.log(`📝 Raw text found: "${data.text.trim()}"`)
                        setLastScannedTitle(cardTitle)
                    } else {
                        console.log(`🃏 Scan #${scanCount} - No clear title detected in card`)
                        console.log(`📝 Raw text found: "${data.text.trim()}"`)
                    }
                } else {
                    console.log('❌ Failed to extract card image')
                }
            } else {
                console.log(`🃏 Scan #${scanCount} - No card detected`)
                setCardCorners([])
                setDetectedCard(null)
                if (showDebug) {
                    setDebugOcrImage(null)
                }
            }

        } catch (error) {
            console.error('Card Detection Error:', error)
        } finally {
            setIsProcessing(false)
        }
    }, [isProcessing, scanCount])

    // Detect rectangular card boundaries using edge detection and contour analysis
    const detectCardCorners = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): Array<{ x: number, y: number }> => {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data

        // Convert to grayscale
        const grayData = new Uint8ClampedArray(canvas.width * canvas.height)
        for (let i = 0; i < data.length; i += 4) {
            const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2])
            grayData[i / 4] = gray
        }

        // Apply Gaussian blur to reduce noise
        const blurred = gaussianBlur(grayData, canvas.width, canvas.height, 1.0)

        // Apply Canny edge detection
        const edges = cannyEdgeDetection(blurred, canvas.width, canvas.height)

        // Create debug edge visualization
        if (showDebug) {
            const edgeCanvas = document.createElement('canvas')
            edgeCanvas.width = canvas.width
            edgeCanvas.height = canvas.height
            const edgeCtx = edgeCanvas.getContext('2d')!
            const edgeImageData = edgeCtx.createImageData(canvas.width, canvas.height)

            for (let i = 0; i < edges.length; i++) {
                const edgeValue = edges[i]
                edgeImageData.data[i * 4] = edgeValue     // R
                edgeImageData.data[i * 4 + 1] = edgeValue // G
                edgeImageData.data[i * 4 + 2] = edgeValue // B
                edgeImageData.data[i * 4 + 3] = 255       // A
            }

            edgeCtx.putImageData(edgeImageData, 0, 0)
            setDebugEdges(edgeCanvas.toDataURL('image/png'))
        }

        // Find contours and identify the largest rectangular contour
        const contours = findContours(edges, canvas.width, canvas.height)

        // Store debug contours (limit to top 10 largest for performance)
        if (showDebug) {
            const sortedContours = contours
                .sort((a, b) => b.length - a.length)
                .slice(0, 10)
            setDebugContours(sortedContours)
        }

        const cardContour = findLargestRectangularContour(contours, canvas.width, canvas.height)
        console.log('Contours found:', contours.length, 'Card contour points:', cardContour?.length || 0)

        // Debug info for card detection
        if (showDebug && contours.length > 0) {
            console.log('Top 3 contours by size:', contours.slice(0, 3).map((c, i) => {
                const minX = Math.min(...c.map(p => p.x))
                const maxX = Math.max(...c.map(p => p.x))
                const minY = Math.min(...c.map(p => p.y))
                const maxY = Math.max(...c.map(p => p.y))
                const area = polygonArea(c)

                // Calculate score for this contour
                const epsilon = 0.02 * contourPerimeter(c)
                const approx = approximatePolygon(c, epsilon)
                const score = approx.length >= 4 ? calculatePerspectiveScore(approx, area, canvas.width, canvas.height) : 0

                return {
                    index: i,
                    points: c.length,
                    approxPoints: approx.length,
                    width: maxX - minX,
                    height: maxY - minY,
                    aspectRatio: (maxX - minX) / (maxY - minY),
                    area: Math.round(area),
                    score: score.toFixed(3)
                }
            }))
        }

        return cardContour || []
    }

    // Extract card image with perspective correction
    const extractCard = (sourceCanvas: HTMLCanvasElement, corners: Array<{ x: number, y: number }>): HTMLCanvasElement | null => {
        if (corners.length !== 4) return null

        // Standard card dimensions (63mm × 88mm, aspect ratio ~0.716)
        // Increased resolution for better OCR accuracy
        const cardWidth = 800  // Doubled from 400
        const cardHeight = Math.round(cardWidth / 0.716) // ~1118

        // Create canvas for the extracted card
        const cardCanvas = document.createElement('canvas')
        cardCanvas.width = cardWidth
        cardCanvas.height = cardHeight

        // Order corners: top-left, top-right, bottom-right, bottom-left
        const orderedCorners = orderCorners(corners)

        // Apply perspective transformation
        const success = perspectiveTransform(
            sourceCanvas,
            cardCanvas,
            orderedCorners,
            [
                { x: 0, y: 0 },
                { x: cardWidth, y: 0 },
                { x: cardWidth, y: cardHeight },
                { x: 0, y: cardHeight }
            ]
        )

        return success ? cardCanvas : null
    }

    // Extract likely card title from OCR text
    const findCardTitle = (text: string, confidence: number): string | null => {
        if (confidence < 30) return null

        const lines = text.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)

        // Look for title-like text (usually in the first few lines)
        for (const line of lines.slice(0, 5)) {
            // Clean the line but preserve apostrophes
            const cleaned = line
                .replace(/[^\w\s']/g, ' ')  // Keep apostrophes in addition to word characters and spaces
                .replace(/\s+/g, ' ')
                .trim()

            // Card titles are typically 3-50 characters
            if (cleaned.length >= 3 && cleaned.length <= 50) {
                // Skip common non-title text
                return cleaned.toLowerCase()
            }
        }

        return null
    }

    // Helper functions for image processing
    const gaussianBlur = (data: Uint8ClampedArray, width: number, height: number, sigma: number): Uint8ClampedArray => {
        const result = new Uint8ClampedArray(data.length)
        const radius = Math.ceil(sigma * 3)
        const kernel = createGaussianKernel(radius, sigma)

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let sum = 0
                let weightSum = 0

                for (let ky = -radius; ky <= radius; ky++) {
                    for (let kx = -radius; kx <= radius; kx++) {
                        const ny = y + ky
                        const nx = x + kx

                        if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
                            const weight = kernel[ky + radius][kx + radius]
                            sum += data[ny * width + nx] * weight
                            weightSum += weight
                        }
                    }
                }

                result[y * width + x] = Math.round(sum / weightSum)
            }
        }

        return result
    }

    const createGaussianKernel = (radius: number, sigma: number): number[][] => {
        const size = radius * 2 + 1
        const kernel: number[][] = []
        const twoSigmaSquared = 2 * sigma * sigma

        for (let y = 0; y < size; y++) {
            kernel[y] = []
            for (let x = 0; x < size; x++) {
                const dx = x - radius
                const dy = y - radius
                kernel[y][x] = Math.exp(-(dx * dx + dy * dy) / twoSigmaSquared)
            }
        }

        return kernel
    }

    const cannyEdgeDetection = (data: Uint8ClampedArray, width: number, height: number): Uint8ClampedArray => {
        // Improved edge detection for card borders
        const result = new Uint8ClampedArray(data.length)
        const lowThreshold = 30   // Lower threshold for card detection
        const highThreshold = 80  // Higher threshold to avoid noise

        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = y * width + x

                // Sobel operators for gradient calculation
                const gx = data[idx - width - 1] + 2 * data[idx - 1] + data[idx + width - 1] -
                    data[idx - width + 1] - 2 * data[idx + 1] - data[idx + width + 1]

                const gy = data[idx - width - 1] + 2 * data[idx - width] + data[idx - width + 1] -
                    data[idx + width - 1] - 2 * data[idx + width] - data[idx + width + 1]

                const magnitude = Math.sqrt(gx * gx + gy * gy)

                // Double thresholding for better edge detection
                if (magnitude > highThreshold) {
                    result[idx] = 255  // Strong edge
                } else if (magnitude > lowThreshold) {
                    // Check if connected to strong edge (simplified hysteresis)
                    let hasStrongNeighbor = false
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            const nx = x + dx
                            const ny = y + dy
                            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                                const neighborIdx = ny * width + nx
                                const neighborGx = data[neighborIdx - width - 1] + 2 * data[neighborIdx - 1] + data[neighborIdx + width - 1] -
                                    data[neighborIdx - width + 1] - 2 * data[neighborIdx + 1] - data[neighborIdx + width + 1]
                                const neighborGy = data[neighborIdx - width - 1] + 2 * data[neighborIdx - width] + data[neighborIdx - width + 1] -
                                    data[neighborIdx + width - 1] - 2 * data[neighborIdx + width] - data[neighborIdx + width + 1]
                                const neighborMagnitude = Math.sqrt(neighborGx * neighborGx + neighborGy * neighborGy)
                                if (neighborMagnitude > highThreshold) {
                                    hasStrongNeighbor = true
                                    break
                                }
                            }
                        }
                        if (hasStrongNeighbor) break
                    }
                    result[idx] = hasStrongNeighbor ? 255 : 0
                } else {
                    result[idx] = 0  // No edge
                }
            }
        }

        return result
    }

    const findContours = (edges: Uint8ClampedArray, width: number, height: number): Array<Array<{ x: number, y: number }>> => {
        // Improved contour detection for card shapes
        const visited = new Array(width * height).fill(false)
        const contours: Array<Array<{ x: number, y: number }>> = []

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = y * width + x
                if (edges[idx] === 255 && !visited[idx]) {
                    const contour = traceContour(edges, visited, width, height, x, y)

                    // Filter contours by size - cards should be substantial
                    const minContourSize = Math.max(100, (width * height) * 0.001) // At least 0.1% of image

                    if (contour.length > minContourSize) {
                        // Calculate bounding box to filter by aspect ratio
                        const minX = Math.min(...contour.map(p => p.x))
                        const maxX = Math.max(...contour.map(p => p.x))
                        const minY = Math.min(...contour.map(p => p.y))
                        const maxY = Math.max(...contour.map(p => p.y))

                        const contourWidth = maxX - minX
                        const contourHeight = maxY - minY

                        // Filter by size and rough aspect ratio
                        if (contourWidth > width * 0.1 && contourHeight > height * 0.1) {
                            const aspectRatio = contourWidth / contourHeight
                            // Magic cards can be oriented portrait or landscape
                            if ((aspectRatio > 0.5 && aspectRatio < 2.0)) {
                                contours.push(contour)
                            }
                        }
                    }
                }
            }
        }

        // Sort by contour size (larger first)
        return contours.sort((a, b) => b.length - a.length)
    }

    const traceContour = (edges: Uint8ClampedArray, visited: boolean[], width: number, height: number, startX: number, startY: number): Array<{ x: number, y: number }> => {
        const contour: Array<{ x: number, y: number }> = []
        const stack = [{ x: startX, y: startY }]

        while (stack.length > 0) {
            const { x, y } = stack.pop()!
            const idx = y * width + x

            if (x < 0 || x >= width || y < 0 || y >= height || visited[idx] || edges[idx] !== 255) {
                continue
            }

            visited[idx] = true
            contour.push({ x, y })

            // Add 8-connected neighbors
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (dx !== 0 || dy !== 0) {
                        stack.push({ x: x + dx, y: y + dy })
                    }
                }
            }
        }

        return contour
    }

    const findLargestRectangularContour = (contours: Array<Array<{ x: number, y: number }>>, width: number, height: number): Array<{ x: number, y: number }> | null => {
        let bestContour: Array<{ x: number, y: number }> | null = null
        let bestScore = 0

        for (const contour of contours) {
            if (contour.length < 20) continue // Skip very small contours

            // Try different epsilon values for approximation since cards have rounded corners
            for (const epsilonFactor of [0.01, 0.015, 0.02, 0.025, 0.03, 0.04, 0.05, 0.06, 0.08]) {
                const epsilon = epsilonFactor * contourPerimeter(contour)
                const approx = approximatePolygon(contour, epsilon)

                // Accept 4-corner polygons (including perspective-distorted quadrilaterals)
                if (approx.length >= 4 && approx.length <= 12) {
                    const area = polygonArea(approx)

                    // Calculate perspective-aware rectangularity score
                    const score = calculatePerspectiveScore(approx, area, width, height)

                    if (score > bestScore && area > (width * height * 0.03)) { // Lowered threshold to 3%
                        bestContour = approximateToRectangle(approx)
                        bestScore = score

                        console.log(`Found potential card: ${approx.length} corners, score: ${score.toFixed(3)}, area: ${Math.round(area)}`)
                    }
                }
            }
        }

        return bestContour
    }

    // Calculate how card-like a polygon is, considering perspective distortion
    const calculatePerspectiveScore = (
        polygon: Array<{ x: number, y: number }>,
        area: number,
        imageWidth: number,
        imageHeight: number
    ): number => {
        if (polygon.length < 4) return 0

        // Get bounding box
        const minX = Math.min(...polygon.map(p => p.x))
        const maxX = Math.max(...polygon.map(p => p.x))
        const minY = Math.min(...polygon.map(p => p.y))
        const maxY = Math.max(...polygon.map(p => p.y))

        const boundingWidth = maxX - minX
        const boundingHeight = maxY - minY
        const boundingArea = boundingWidth * boundingHeight

        // Size should be reasonable for a card
        const sizeScore = Math.min(boundingArea / (imageWidth * imageHeight), 1)
        if (sizeScore < 0.02) return 0 // Too small to be a card

        // Check convexity - cards should form convex quadrilaterals
        const convexityScore = calculateConvexityScore(polygon)

        // Check if it's roughly quadrilateral after simplification
        const quadScore = polygon.length <= 6 ? 1.0 : Math.max(0, 1.0 - (polygon.length - 6) * 0.1)

        // Check aspect ratio flexibility - allow for perspective distortion
        const aspectRatio = boundingWidth / boundingHeight
        let aspectScore = 0

        // Magic cards can appear with various aspect ratios due to perspective
        if (aspectRatio >= 0.3 && aspectRatio <= 3.0) {
            // Closer to card ratio (0.714) gets higher score, but be flexible
            const targetAspectRatio = 63 / 88
            const deviation = Math.abs(aspectRatio - targetAspectRatio) / targetAspectRatio
            aspectScore = Math.max(0.3, 1.0 - deviation * 0.5) // Minimum 0.3 score for reasonable ratios
        }

        // Check how much of the bounding box is filled
        const fillRatio = area / boundingArea
        const fillScore = Math.min(fillRatio * 1.2, 1.0) // Allow slightly loose fill

        // Combine scores with perspective-friendly weights
        const score = (
            sizeScore * 0.25 +        // Size is important
            convexityScore * 0.3 +    // Convexity is key for cards
            quadScore * 0.2 +         // Prefer simpler shapes
            aspectScore * 0.15 +      // Aspect ratio (more flexible)
            fillScore * 0.1          // Fill ratio (less important due to perspective)
        )

        return score
    }

    // Calculate how convex a polygon is (cards should be convex quadrilaterals)
    const calculateConvexityScore = (polygon: Array<{ x: number, y: number }>): number => {
        if (polygon.length < 4) return 0

        // Calculate cross products to check if all turns are in the same direction
        let positiveCount = 0
        let negativeCount = 0

        for (let i = 0; i < polygon.length; i++) {
            const p1 = polygon[i]
            const p2 = polygon[(i + 1) % polygon.length]
            const p3 = polygon[(i + 2) % polygon.length]

            const crossProduct = (p2.x - p1.x) * (p3.y - p2.y) - (p2.y - p1.y) * (p3.x - p2.x)

            if (crossProduct > 0) positiveCount++
            else if (crossProduct < 0) negativeCount++
        }

        // For convex polygons, all cross products should have the same sign
        const convexityRatio = Math.max(positiveCount, negativeCount) / polygon.length

        // Also check that we have roughly 4 corners for a quadrilateral
        const cornerPenalty = polygon.length > 4 ? (polygon.length - 4) * 0.1 : 0

        return Math.max(0, convexityRatio - cornerPenalty)
    }

    // Convert a polygon (possibly with rounded corners) to a 4-point rectangle
    const approximateToRectangle = (polygon: Array<{ x: number, y: number }>): Array<{ x: number, y: number }> => {
        if (polygon.length <= 4) return polygon

        // Use convex hull approach to find the extreme points
        const hull = convexHull(polygon)

        if (hull.length <= 4) return hull

        // Find the 4 most extreme points that form the best quadrilateral
        const center = polygon.reduce((acc, p) => ({
            x: acc.x + p.x / polygon.length,
            y: acc.y + p.y / polygon.length
        }), { x: 0, y: 0 })

        // Divide into quadrants and find the most extreme point in each
        const quadrants = [[], [], [], []] as Array<Array<{ x: number, y: number }>>

        for (const point of hull) {
            const angle = Math.atan2(point.y - center.y, point.x - center.x)
            const normalizedAngle = (angle + 2 * Math.PI) % (2 * Math.PI)

            const quadrant = Math.floor(normalizedAngle / (Math.PI / 2))
            quadrants[quadrant].push(point)
        }

        const corners: Array<{ x: number, y: number }> = []

        // For each quadrant, find the point furthest from center
        for (let i = 0; i < 4; i++) {
            if (quadrants[i].length === 0) {
                // If no points in this quadrant, use interpolation
                const prevQuad = (i - 1 + 4) % 4
                const nextQuad = (i + 1) % 4

                if (quadrants[prevQuad].length > 0 && quadrants[nextQuad].length > 0) {
                    const prevPoint = quadrants[prevQuad][quadrants[prevQuad].length - 1]
                    const nextPoint = quadrants[nextQuad][0]
                    corners.push({
                        x: (prevPoint.x + nextPoint.x) / 2,
                        y: (prevPoint.y + nextPoint.y) / 2
                    })
                } else {
                    // Fallback to bounding box corner
                    const minX = Math.min(...polygon.map(p => p.x))
                    const maxX = Math.max(...polygon.map(p => p.x))
                    const minY = Math.min(...polygon.map(p => p.y))
                    const maxY = Math.max(...polygon.map(p => p.y))

                    const boundingCorners = [
                        { x: minX, y: minY },
                        { x: maxX, y: minY },
                        { x: maxX, y: maxY },
                        { x: minX, y: maxY }
                    ]
                    corners.push(boundingCorners[i])
                }
            } else {
                // Find the point furthest from center in this quadrant
                let furthestPoint = quadrants[i][0]
                let maxDistance = 0

                for (const point of quadrants[i]) {
                    const distance = Math.sqrt(
                        Math.pow(point.x - center.x, 2) + Math.pow(point.y - center.y, 2)
                    )
                    if (distance > maxDistance) {
                        maxDistance = distance
                        furthestPoint = point
                    }
                }
                corners.push(furthestPoint)
            }
        }

        return corners
    }

    // Simple convex hull using gift wrapping algorithm
    const convexHull = (points: Array<{ x: number, y: number }>): Array<{ x: number, y: number }> => {
        if (points.length < 3) return points

        // Find the leftmost point
        let leftmost = points[0]
        for (const point of points) {
            if (point.x < leftmost.x || (point.x === leftmost.x && point.y < leftmost.y)) {
                leftmost = point
            }
        }

        const hull: Array<{ x: number, y: number }> = []
        let current = leftmost

        do {
            hull.push(current)
            let next = points[0]

            for (const point of points) {
                if (point === current) continue

                const cross = (next.x - current.x) * (point.y - current.y) -
                    (next.y - current.y) * (point.x - current.x)

                if (next === current || cross > 0 ||
                    (cross === 0 && distanceSquared(current, point) > distanceSquared(current, next))) {
                    next = point
                }
            }

            current = next
        } while (current !== leftmost && hull.length < points.length)

        return hull
    }

    const distanceSquared = (p1: { x: number, y: number }, p2: { x: number, y: number }): number => {
        return Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)
    }

    const approximatePolygon = (contour: Array<{ x: number, y: number }>, epsilon: number): Array<{ x: number, y: number }> => {
        // Douglas-Peucker algorithm for polygon approximation
        if (contour.length < 3) return contour

        // Find the point with maximum distance from line between first and last points
        let maxDist = 0
        let maxIndex = 0

        const start = contour[0]
        const end = contour[contour.length - 1]

        for (let i = 1; i < contour.length - 1; i++) {
            const dist = pointToLineDistance(contour[i], start, end)
            if (dist > maxDist) {
                maxDist = dist
                maxIndex = i
            }
        }

        if (maxDist > epsilon) {
            // Recursively simplify
            const left = approximatePolygon(contour.slice(0, maxIndex + 1), epsilon)
            const right = approximatePolygon(contour.slice(maxIndex), epsilon)
            return [...left.slice(0, -1), ...right]
        } else {
            return [start, end]
        }
    }

    const contourPerimeter = (contour: Array<{ x: number, y: number }>): number => {
        let perimeter = 0
        for (let i = 0; i < contour.length; i++) {
            const current = contour[i]
            const next = contour[(i + 1) % contour.length]
            perimeter += Math.sqrt((next.x - current.x) ** 2 + (next.y - current.y) ** 2)
        }
        return perimeter
    }

    const polygonArea = (polygon: Array<{ x: number, y: number }>): number => {
        let area = 0
        for (let i = 0; i < polygon.length; i++) {
            const current = polygon[i]
            const next = polygon[(i + 1) % polygon.length]
            area += current.x * next.y - next.x * current.y
        }
        return Math.abs(area) / 2
    }

    const pointToLineDistance = (point: { x: number, y: number }, lineStart: { x: number, y: number }, lineEnd: { x: number, y: number }): number => {
        const A = point.x - lineStart.x
        const B = point.y - lineStart.y
        const C = lineEnd.x - lineStart.x
        const D = lineEnd.y - lineStart.y

        const dot = A * C + B * D
        const lenSq = C * C + D * D

        if (lenSq === 0) return Math.sqrt(A * A + B * B)

        const param = dot / lenSq
        let xx, yy

        if (param < 0) {
            xx = lineStart.x
            yy = lineStart.y
        } else if (param > 1) {
            xx = lineEnd.x
            yy = lineEnd.y
        } else {
            xx = lineStart.x + param * C
            yy = lineStart.y + param * D
        }

        const dx = point.x - xx
        const dy = point.y - yy
        return Math.sqrt(dx * dx + dy * dy)
    }

    const orderCorners = (corners: Array<{ x: number, y: number }>): Array<{ x: number, y: number }> => {
        // Order corners as: top-left, top-right, bottom-right, bottom-left
        const center = corners.reduce((acc, corner) => ({
            x: acc.x + corner.x / corners.length,
            y: acc.y + corner.y / corners.length
        }), { x: 0, y: 0 })

        return corners.sort((a, b) => {
            const angleA = Math.atan2(a.y - center.y, a.x - center.x)
            const angleB = Math.atan2(b.y - center.y, b.x - center.x)
            return angleA - angleB
        })
    }

    const perspectiveTransform = (
        sourceCanvas: HTMLCanvasElement,
        destCanvas: HTMLCanvasElement,
        sourceCorners: Array<{ x: number, y: number }>,
        _destCorners: Array<{ x: number, y: number }>
    ): boolean => {
        // Simplified perspective transformation using inverse mapping
        const sourceCtx = sourceCanvas.getContext('2d')!
        const destCtx = destCanvas.getContext('2d')!
        const sourceImageData = sourceCtx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height)

        const destImageData = destCtx.createImageData(destCanvas.width, destCanvas.height)

        // For each pixel in destination, find corresponding source pixel
        for (let destY = 0; destY < destCanvas.height; destY++) {
            for (let destX = 0; destX < destCanvas.width; destX++) {
                // Map destination coordinates to source coordinates using bilinear interpolation
                const u = destX / destCanvas.width
                const v = destY / destCanvas.height

                // Bilinear interpolation in source image
                const sourceX =
                    sourceCorners[0].x * (1 - u) * (1 - v) +
                    sourceCorners[1].x * u * (1 - v) +
                    sourceCorners[2].x * u * v +
                    sourceCorners[3].x * (1 - u) * v

                const sourceY =
                    sourceCorners[0].y * (1 - u) * (1 - v) +
                    sourceCorners[1].y * u * (1 - v) +
                    sourceCorners[2].y * u * v +
                    sourceCorners[3].y * (1 - u) * v

                // Sample source pixel (with bounds checking)
                const sx = Math.round(sourceX)
                const sy = Math.round(sourceY)

                if (sx >= 0 && sx < sourceCanvas.width && sy >= 0 && sy < sourceCanvas.height) {
                    const sourceIdx = (sy * sourceCanvas.width + sx) * 4
                    const destIdx = (destY * destCanvas.width + destX) * 4

                    destImageData.data[destIdx] = sourceImageData.data[sourceIdx]         // R
                    destImageData.data[destIdx + 1] = sourceImageData.data[sourceIdx + 1] // G
                    destImageData.data[destIdx + 2] = sourceImageData.data[sourceIdx + 2] // B
                    destImageData.data[destIdx + 3] = 255                                 // A
                }
            }
        }

        destCtx.putImageData(destImageData, 0, 0)
        return true
    }

    // Auto-scan every 3 seconds when camera is active (slower due to more processing)
    useEffect(() => {
        if (!isScanning) return

        const interval = setInterval(() => {
            scanCard()
        }, 3000)

        return () => clearInterval(interval)
    }, [isScanning, scanCard])

    // Cleanup on unmount
    useEffect(() => {
        return () => stopCamera()
    }, [stopCamera])

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="bg-white rounded-lg shadow-lg">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Magic Card Scanner with Perspective Correction</h2>
                    <p className="text-gray-600">
                        Point your camera at a Magic: The Gathering card. The scanner will automatically detect the card boundaries,
                        extract and straighten the card image, and read the title using OCR technology.
                    </p>
                </div>

                <div className="p-6">
                    {/* Camera Controls */}
                    <div className="mb-6 flex gap-4">
                        {!isScanning ? (
                            <button
                                onClick={startCamera}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Start Camera
                            </button>
                        ) : (
                            <div className="flex gap-4">
                                <button
                                    onClick={stopCamera}
                                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold"
                                >
                                    Stop Camera
                                </button>
                                <button
                                    onClick={scanCard}
                                    disabled={isProcessing}
                                    className={`px-6 py-3 rounded-lg font-semibold ${isProcessing
                                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                                        : 'bg-green-600 hover:bg-green-700 text-white'
                                        }`}
                                >
                                    {isProcessing ? 'Scanning...' : 'Manual Scan'}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Camera Feed */}
                    <div className="relative bg-gray-900 rounded-lg overflow-hidden">
                        {isScanning ? (
                            <div className="relative">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="w-full h-auto"
                                />
                                <canvas
                                    ref={canvasRef}
                                    className="hidden"
                                />

                                {/* Card corner overlay */}
                                {cardCorners.length === 4 && (
                                    <div className="absolute inset-0 pointer-events-none">
                                        <svg className="w-full h-full" style={{ position: 'absolute', top: 0, left: 0 }}>
                                            <polygon
                                                points={cardCorners.map(corner =>
                                                    `${(corner.x / (videoRef.current?.videoWidth || 1)) * (videoRef.current?.getBoundingClientRect().width || 1)},${(corner.y / (videoRef.current?.videoHeight || 1)) * (videoRef.current?.getBoundingClientRect().height || 1)}`
                                                ).join(' ')}
                                                fill="rgba(0, 255, 0, 0.2)"
                                                stroke="rgba(0, 255, 0, 0.8)"
                                                strokeWidth="2"
                                            />
                                            {cardCorners.map((corner, index) => (
                                                <circle
                                                    key={index}
                                                    cx={(corner.x / (videoRef.current?.videoWidth || 1)) * (videoRef.current?.getBoundingClientRect().width || 1)}
                                                    cy={(corner.y / (videoRef.current?.videoHeight || 1)) * (videoRef.current?.getBoundingClientRect().height || 1)}
                                                    r="4"
                                                    fill="red"
                                                />
                                            ))}
                                        </svg>
                                    </div>
                                )}

                                {/* Debug contour overlay */}
                                {showDebug && debugContours.length > 0 && (
                                    <div className="absolute inset-0 pointer-events-none">
                                        <svg className="w-full h-full" style={{ position: 'absolute', top: 0, left: 0 }}>
                                            {debugContours.map((contour, contourIndex) => (
                                                <g key={contourIndex}>
                                                    {contour.map((point, pointIndex) => (
                                                        <circle
                                                            key={pointIndex}
                                                            cx={(point.x / (videoRef.current?.videoWidth || 1)) * (videoRef.current?.getBoundingClientRect().width || 1)}
                                                            cy={(point.y / (videoRef.current?.videoHeight || 1)) * (videoRef.current?.getBoundingClientRect().height || 1)}
                                                            r="1"
                                                            fill={`hsl(${(contourIndex * 360 / debugContours.length)}, 70%, 50%)`}
                                                            opacity="0.7"
                                                        />
                                                    ))}
                                                </g>
                                            ))}
                                        </svg>
                                        {/* Debug info */}
                                        <div className="absolute bottom-4 left-4 bg-black bg-opacity-90 text-white p-3 rounded text-xs max-w-xs">
                                            <div className="font-bold mb-1">Debug Info:</div>
                                            <div>Contours: {debugContours.length}</div>
                                            <div>Largest: {debugContours[0]?.length || 0} points</div>
                                            <div>Card corners: {cardCorners.length}/4</div>
                                        </div>
                                    </div>
                                )}

                                {/* Status indicators */}
                                <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white px-3 py-2 rounded">
                                    {isProcessing ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                                            Detecting Card...
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded-full ${cardCorners.length === 4 ? 'bg-green-400' : 'bg-blue-400'}`}></div>
                                            {cardCorners.length === 4 ? 'Card Detected' : 'Scanning'} (#{scanCount})
                                        </div>
                                    )}
                                </div>

                                {/* Debug toggle */}
                                <div className="absolute top-4 right-4">
                                    <button
                                        onClick={() => setShowDebug(!showDebug)}
                                        className="bg-black bg-opacity-75 text-white px-3 py-2 rounded text-sm"
                                    >
                                        {showDebug ? 'Hide Debug' : 'Show Debug'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="h-96 flex items-center justify-center text-gray-400">
                                <div className="text-center">
                                    <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0118.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <p>Camera not active</p>
                                    <p className="text-sm">Click "Start Camera" to begin scanning</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Debug Panel */}
                    {showDebug && (
                        <div className="mt-6 p-4 bg-gray-800 rounded-lg">
                            <h3 className="font-semibold text-white mb-4">Debug Visualization</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Edge Detection */}
                                {debugEdges && (
                                    <div className="bg-gray-700 p-3 rounded">
                                        <h4 className="text-white font-medium mb-2">Edge Detection</h4>
                                        <img
                                            src={debugEdges}
                                            alt="Edge detection"
                                            className="w-full border border-gray-600 rounded"
                                        />
                                    </div>
                                )}

                                {/* OCR Input Image */}
                                {debugOcrImage && (
                                    <div className="bg-gray-700 p-3 rounded">
                                        <h4 className="text-white font-medium mb-2">OCR Input Image</h4>
                                        <img
                                            src={debugOcrImage}
                                            alt="Image sent to OCR"
                                            className="w-full border border-gray-600 rounded"
                                        />
                                        <p className="text-xs text-gray-400 mt-2">
                                            This is the exact image sent to Tesseract OCR after perspective correction
                                        </p>
                                    </div>
                                )}

                                {/* Contour Stats */}
                                <div className="bg-gray-700 p-3 rounded">
                                    <h4 className="text-white font-medium mb-2">Contour Analysis</h4>
                                    <div className="text-sm text-gray-300 space-y-1">
                                        <div>Total contours: {debugContours.length}</div>
                                        <div>Card corners found: {cardCorners.length}/4</div>
                                        {debugContours.slice(0, 5).map((contour, index) => (
                                            <div key={index} className="flex justify-between">
                                                <span>Contour {index + 1}:</span>
                                                <span>{contour.length} points</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Contour Details */}
                            {debugContours.length > 0 && (
                                <div className="mt-4 bg-gray-700 p-3 rounded">
                                    <h4 className="text-white font-medium mb-2">Contour Legend</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                                        {debugContours.slice(0, 10).map((contour, index) => (
                                            <div key={index} className="flex items-center gap-2">
                                                <div
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: `hsl(${(index * 360 / debugContours.length)}, 70%, 50%)` }}
                                                ></div>
                                                <span className="text-gray-300">{contour.length}pts</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Extracted Card Preview */}
                    {detectedCard && (
                        <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                            <h3 className="font-semibold text-gray-800 mb-3">Extracted Card:</h3>
                            <div className="flex justify-center">
                                <img
                                    src={detectedCard}
                                    alt="Extracted card"
                                    className="max-w-xs border-2 border-gray-300 rounded-lg shadow-lg"
                                />
                            </div>
                        </div>
                    )}

                    {/* Last Scanned Result */}
                    {lastScannedTitle && (
                        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                            <h3 className="font-semibold text-green-800 mb-2">Last Detected Title:</h3>
                            <p className="text-green-700 font-mono text-lg">{lastScannedTitle}</p>
                            <p className="text-sm text-green-600 mt-1">
                                Check the browser console for detailed scan history
                            </p>
                        </div>
                    )}

                    {/* Instructions */}
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h3 className="font-semibold text-blue-800 mb-2">How it works:</h3>
                        <ul className="text-blue-700 text-sm space-y-1">
                            <li>• <strong>Card Detection:</strong> The scanner automatically detects rectangular card shapes in the camera feed</li>
                            <li>• <strong>Perspective Correction:</strong> Handles skewed or angled cards by straightening them automatically</li>
                            <li>• <strong>Image Extraction:</strong> Crops and enhances the card image for better OCR accuracy</li>
                            <li>• <strong>Title Recognition:</strong> Uses OCR to read and identify card titles from the extracted image</li>
                            <li>• <strong>Visual Feedback:</strong> Green overlay shows detected card boundaries and corner points</li>
                        </ul>
                        <div className="mt-3 pt-3 border-t border-blue-200">
                            <p className="text-blue-600 text-xs">
                                <strong>Tips:</strong> Ensure good lighting, avoid shadows, and hold the card steady for best results.
                                The scanner works better with high contrast between the card and background.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
