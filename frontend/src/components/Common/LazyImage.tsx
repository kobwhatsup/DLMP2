import React, { useState, useRef, useEffect } from 'react'
import { Skeleton } from 'antd'
import { useVisibility } from '@/utils/lazyLoad'

interface LazyImageProps {
  src: string
  alt: string
  width?: number | string
  height?: number | string
  className?: string
  style?: React.CSSProperties
  placeholder?: React.ReactNode
  errorPlaceholder?: React.ReactNode
  onLoad?: () => void
  onError?: () => void
  threshold?: number
  rootMargin?: string
}

/**
 * 懒加载图片组件
 */
export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  width,
  height,
  className,
  style,
  placeholder,
  errorPlaceholder,
  onLoad,
  onError,
  threshold = 0.1,
  rootMargin = '50px'
}) => {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  const [imageSrc, setImageSrc] = useState<string>('')
  const imgRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const isVisible = useVisibility(containerRef)

  useEffect(() => {
    if (isVisible && !loaded && !error && src) {
      // 创建新的Image对象预加载
      const img = new Image()
      
      img.onload = () => {
        setImageSrc(src)
        setLoaded(true)
        onLoad?.()
      }
      
      img.onerror = () => {
        setError(true)
        onError?.()
      }
      
      img.src = src
    }
  }, [isVisible, src, loaded, error, onLoad, onError])

  const defaultPlaceholder = (
    <Skeleton.Image
      style={{ 
        width: width || '100%', 
        height: height || 200 
      }}
      active
    />
  )

  const defaultErrorPlaceholder = (
    <div
      style={{
        width: width || '100%',
        height: height || 200,
        background: '#f5f5f5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#999',
        fontSize: '14px',
        border: '1px solid #d9d9d9',
        borderRadius: '4px'
      }}
    >
      图片加载失败
    </div>
  )

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width,
        height,
        ...style
      }}
    >
      {error ? (
        errorPlaceholder || defaultErrorPlaceholder
      ) : loaded ? (
        <img
          ref={imgRef}
          src={imageSrc}
          alt={alt}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
      ) : (
        placeholder || defaultPlaceholder
      )}
    </div>
  )
}

/**
 * 背景图片懒加载组件
 */
interface LazyBackgroundProps {
  src: string
  children?: React.ReactNode
  className?: string
  style?: React.CSSProperties
  placeholder?: React.ReactNode
}

export const LazyBackground: React.FC<LazyBackgroundProps> = ({
  src,
  children,
  className,
  style,
  placeholder
}) => {
  const [loaded, setLoaded] = useState(false)
  const [backgroundImage, setBackgroundImage] = useState<string>('')
  const containerRef = useRef<HTMLDivElement>(null)
  
  const isVisible = useVisibility(containerRef)

  useEffect(() => {
    if (isVisible && !loaded && src) {
      const img = new Image()
      
      img.onload = () => {
        setBackgroundImage(`url(${src})`)
        setLoaded(true)
      }
      
      img.src = src
    }
  }, [isVisible, src, loaded])

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        backgroundImage: loaded ? backgroundImage : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        ...style
      }}
    >
      {!loaded && placeholder}
      {children}
    </div>
  )
}

/**
 * 自适应图片组件
 */
interface ResponsiveImageProps {
  src: string
  srcSet?: string
  sizes?: string
  alt: string
  className?: string
  style?: React.CSSProperties
  width?: number | string
  height?: number | string
}

export const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  src,
  srcSet,
  sizes,
  alt,
  className,
  style,
  width,
  height
}) => {
  const [loaded, setLoaded] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const isVisible = useVisibility(containerRef)

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width, height, ...style }}
    >
      {isVisible ? (
        <img
          src={src}
          srcSet={srcSet}
          sizes={sizes}
          alt={alt}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: loaded ? 1 : 0,
            transition: 'opacity 0.3s ease'
          }}
          onLoad={() => setLoaded(true)}
        />
      ) : (
        <Skeleton.Image
          style={{ width: '100%', height: '100%' }}
          active
        />
      )}
    </div>
  )
}

/**
 * 图片画廊懒加载组件
 */
interface ImageGalleryProps {
  images: Array<{
    src: string
    thumbnail?: string
    alt: string
    title?: string
  }>
  columns?: number
  gap?: number
  onImageClick?: (index: number) => void
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  columns = 3,
  gap = 16,
  onImageClick
}) => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap,
        width: '100%'
      }}
    >
      {images.map((image, index) => (
        <div
          key={index}
          style={{
            cursor: onImageClick ? 'pointer' : 'default',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            transition: 'transform 0.2s ease',
            ':hover': {
              transform: 'scale(1.05)'
            }
          }}
          onClick={() => onImageClick?.(index)}
        >
          <LazyImage
            src={image.thumbnail || image.src}
            alt={image.alt}
            height={200}
            style={{ borderRadius: '8px' }}
          />
          {image.title && (
            <div
              style={{
                padding: '8px 12px',
                background: 'white',
                fontSize: '14px',
                color: '#333'
              }}
            >
              {image.title}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default LazyImage