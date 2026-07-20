import { MAX_WEBP_IMAGE_SIZE_BYTES, WEBP_CONTENT_TYPE } from '@/constants/image'

const MAX_DIMENSION = 1920
const MIN_DIMENSION = 320
const DIMENSION_SCALE = 0.8
const QUALITY_LEVELS = [0.82, 0.72, 0.62, 0.52, 0.42, 0.32, 0.24, 0.16]

const loadImage = (file: File): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const image = new Image()

    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error(`Unable to read ${file.name}.`))
    }
    image.src = objectUrl
  })

const encodeWebp = (canvas: HTMLCanvasElement, quality: number): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('This browser could not compress the selected image.'))
          return
        }
        if (blob.type !== WEBP_CONTENT_TYPE) {
          reject(new Error('This browser does not support WebP image compression.'))
          return
        }
        resolve(blob)
      },
      WEBP_CONTENT_TYPE,
      quality,
    )
  })

const createWebpFileName = (fileName: string): string => {
  const extensionIndex = fileName.lastIndexOf('.')
  const baseName = extensionIndex > 0 ? fileName.slice(0, extensionIndex) : fileName
  return `${baseName || 'image'}.webp`
}

export async function compressImageToWebp(file: File): Promise<File> {
  const image = await loadImage(file)
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('This browser could not prepare the selected image.')
  }

  const initialScale = Math.min(
    1,
    MAX_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight),
  )
  let width = Math.max(1, Math.round(image.naturalWidth * initialScale))
  let height = Math.max(1, Math.round(image.naturalHeight * initialScale))

  while (true) {
    canvas.width = width
    canvas.height = height
    context.clearRect(0, 0, width, height)
    context.drawImage(image, 0, 0, width, height)

    for (const quality of QUALITY_LEVELS) {
      const blob = await encodeWebp(canvas, quality)
      if (blob.size <= MAX_WEBP_IMAGE_SIZE_BYTES) {
        return new File([blob], createWebpFileName(file.name), {
          type: WEBP_CONTENT_TYPE,
          lastModified: Date.now(),
        })
      }
    }

    if (Math.max(width, height) <= MIN_DIMENSION) {
      break
    }

    width = Math.max(1, Math.round(width * DIMENSION_SCALE))
    height = Math.max(1, Math.round(height * DIMENSION_SCALE))
  }

  throw new Error(`Unable to compress ${file.name} below 100 KB.`)
}
