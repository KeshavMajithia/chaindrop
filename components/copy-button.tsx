'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { Button } from './ui/button'

interface CopyButtonProps {
  text: string
  className?: string
  size?: 'sm' | 'default' | 'lg'
  variant?: 'ghost' | 'outline' | 'default'
  showLabel?: boolean
}

/**
 * Universal Copy Button Component
 * 
 * A reusable button that copies text to clipboard with visual feedback.
 * Shows "Copied!" with a check icon for 2 seconds after copying.
 * 
 * @example
 * ```tsx
 * <CopyButton text="0x1234...5678" />
 * <CopyButton text={txHash} size="default" variant="outline" showLabel />
 * ```
 */
export function CopyButton({ 
  text, 
  className = '', 
  size = 'sm',
  variant = 'ghost',
  showLabel = false
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false)
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      
      // Reset after 2 seconds
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }
  
  return (
    <Button
      onClick={handleCopy}
      variant={variant}
      size={size}
      className={`transition-all ${className}`}
      title={copied ? 'Copied!' : 'Copy to clipboard'}
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 text-green-400" />
          {(showLabel || size !== 'sm') && <span className="ml-1 text-green-400">Copied!</span>}
        </>
      ) : (
        <>
          <Copy className="w-4 h-4" />
          {(showLabel || size !== 'sm') && <span className="ml-1">Copy</span>}
        </>
      )}
    </Button>
  )
}

/**
 * Inline Copy Button Component
 * 
 * A minimal inline button for copying addresses, hashes, or short text.
 * Perfect for use next to addresses or transaction hashes.
 * 
 * @example
 * ```tsx
 * <span>0x1234...5678</span>
 * <InlineCopyButton text="0x1234567890abcdef" />
 * ```
 */
export function InlineCopyButton({ text, className = '' }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false)
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }
  
  return (
    <button
      onClick={handleCopy}
      className={`ml-2 p-1 hover:bg-white/10 rounded transition-colors inline-flex items-center ${className}`}
      title={copied ? 'Copied!' : 'Copy to clipboard'}
    >
      {copied ? (
        <Check className="w-3 h-3 text-green-400" />
      ) : (
        <Copy className="w-3 h-3 text-muted-foreground hover:text-foreground" />
      )}
    </button>
  )
}

/**
 * Icon-only Copy Button Component
 * 
 * A simple icon button without the Button component wrapper.
 * Useful for custom layouts or when you need more control.
 * 
 * @example
 * ```tsx
 * <IconCopyButton text={address} />
 * ```
 */
export function IconCopyButton({ 
  text, 
  className = '',
  iconSize = 'w-4 h-4'
}: { 
  text: string
  className?: string
  iconSize?: string
}) {
  const [copied, setCopied] = useState(false)
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }
  
  return (
    <button
      onClick={handleCopy}
      className={`p-2 hover:bg-white/10 rounded-lg transition-colors inline-flex items-center ${className}`}
      title={copied ? 'Copied!' : 'Copy to clipboard'}
    >
      {copied ? (
        <Check className={`${iconSize} text-green-400`} />
      ) : (
        <Copy className={`${iconSize} text-muted-foreground hover:text-foreground`} />
      )}
    </button>
  )
}

/**
 * Copy Button with Custom Content
 * 
 * Allows you to provide custom content while maintaining copy functionality.
 * 
 * @example
 * ```tsx
 * <CopyButtonWithContent text={txHash}>
 *   <span className="font-mono">{truncate(txHash)}</span>
 *   <Copy className="w-3 h-3 ml-2" />
 * </CopyButtonWithContent>
 * ```
 */
export function CopyButtonWithContent({ 
  text, 
  children,
  className = ''
}: { 
  text: string
  children: React.ReactNode
  className?: string
}) {
  const [copied, setCopied] = useState(false)
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }
  
  return (
    <button
      onClick={handleCopy}
      className={`hover:bg-white/10 rounded-lg transition-colors inline-flex items-center ${className}`}
      title={copied ? 'Copied!' : 'Copy to clipboard'}
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 text-green-400 mr-2" />
          <span className="text-green-400">Copied!</span>
        </>
      ) : (
        children
      )}
    </button>
  )
}
