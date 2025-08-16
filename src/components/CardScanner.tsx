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
    }, [])

    // Capture and process frame
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

            // Get the guide box dimensions to match exactly what the user sees
            // Calculate the guide box area (this should match the yellow overlay)
            // The guide box is centered and takes up a portion of the video
            const guideBoxWidth = canvas.width * 0.6  // 60% of video width
            const guideBoxHeight = canvas.height * 0.3 // 30% of video height
            const guideBoxX = (canvas.width - guideBoxWidth) / 2  // Centered horizontally
            const guideBoxY = (canvas.height - guideBoxHeight) / 2 // Centered vertically

            // Create a canvas for just the guide box area
            const titleCanvas = document.createElement('canvas')
            const titleCtx = titleCanvas.getContext('2d')!
            titleCanvas.width = guideBoxWidth
            titleCanvas.height = guideBoxHeight

            // Extract exactly the area shown in the yellow guide box
            titleCtx.drawImage(
                canvas,
                guideBoxX, guideBoxY, guideBoxWidth, guideBoxHeight,  // Source area (guide box)
                0, 0, guideBoxWidth, guideBoxHeight                   // Destination (full title canvas)
            )

            // Convert to data URL for Tesseract
            const imageData = titleCanvas.toDataURL('image/png')

            // Run OCR on the title area
            const { data } = await Tesseract.recognize(imageData, 'eng')

            let cardTitle = data.text.trim()

            // Clean up the OCR result
            cardTitle = cardTitle
                .replace(/[^\w\s]/g, ' ') // Remove special characters
                .replace(/\s+/g, ' ') // Replace multiple spaces with single space
                .trim()

            if (cardTitle && cardTitle.length > 2) {
                console.log(`🃏 Scan #${scanCount} - Card Title Detected:`, cardTitle)
                console.log(`📊 OCR Confidence: ${data.confidence.toFixed(1)}%`)
                setLastScannedTitle(cardTitle)
            } else {
                console.log(`🃏 Scan #${scanCount} - No clear title detected`)
            }

        } catch (error) {
            console.error('OCR Error:', error)
        } finally {
            setIsProcessing(false)
        }
    }, [isProcessing, scanCount])

    // Auto-scan every 2 seconds when camera is active
    useEffect(() => {
        if (!isScanning) return

        const interval = setInterval(() => {
            scanCard()
        }, 2000)

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
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Card Scanner</h2>
                    <p className="text-gray-600">
                        Point your camera at a Magic: The Gathering card to read its title.
                        The scanner will automatically detect and log card titles to the console.
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

                                {/* Overlay guide */}
                                <div className="absolute inset-0 pointer-events-none">
                                    <div className="h-full w-full flex items-center justify-center">
                                        <div
                                            className="border-2 border-yellow-400 border-dashed bg-black bg-opacity-30"
                                            style={{
                                                width: '60%',      // Matches guideBoxWidth calculation
                                                height: '30%',     // Matches guideBoxHeight calculation
                                            }}
                                        >
                                            <div className="h-full flex items-center justify-center">
                                                <p className="text-white text-center text-sm font-semibold">
                                                    Position card title here
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Status indicators */}
                                <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white px-3 py-2 rounded">
                                    {isProcessing ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                                            Scanning...
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                                            Ready (Scan #{scanCount})
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="h-96 flex items-center justify-center text-gray-400">
                                <div className="text-center">
                                    <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <p>Camera not active</p>
                                    <p className="text-sm">Click "Start Camera" to begin scanning</p>
                                </div>
                            </div>
                        )}
                    </div>

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
                        <h3 className="font-semibold text-blue-800 mb-2">Instructions:</h3>
                        <ul className="text-blue-700 text-sm space-y-1">
                            <li>• Hold the card steady with the title clearly visible</li>
                            <li>• Ensure good lighting on the card</li>
                            <li>• Position the card title within the yellow guide box</li>
                            <li>• The scanner will automatically attempt to read titles every 2 seconds</li>
                            <li>• All detected titles are logged to the browser console (press F12)</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    )
}
