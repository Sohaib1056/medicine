import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { smartTransliterate, containsRomanUrdu } from '../utils/romanUrduToUrdu'

interface UrduSuggestFieldProps {
  value: string
  onChange: (v: string) => void
  suggestions: string[]
  placeholder?: string
  rows?: number
  className?: string
  as?: 'textarea' | 'input'
  onBlurValue?: (v: string) => void
  /** Enable automatic Urdu transliteration. Default: true */
  enableUrdu?: boolean
  /** Delay in ms before transliteration triggers after typing stops. Default: 300 */
  transliterationDelay?: number
}

export default function UrduSuggestField({
  value,
  onChange,
  suggestions,
  placeholder,
  rows = 2,
  className = 'w-full rounded-md border border-slate-300 px-3 py-2 text-sm',
  as = 'textarea',
  onBlurValue,
  enableUrdu = true,
  transliterationDelay = 300,
}: UrduSuggestFieldProps) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastTransliteratedRef = useRef<string>('')
  const isProcessingRef = useRef(false)

  // Build Urdu suggestions by transliterating the existing suggestions
  const urduSuggestions = useMemo(() => {
    if (!enableUrdu) return suggestions

    const result: string[] = []
    for (const sug of suggestions) {
      // Add original
      if (!result.includes(sug)) result.push(sug)

      // Add Urdu transliteration if different and contains Roman Urdu
      if (containsRomanUrdu(sug)) {
        const urdu = smartTransliterate(sug)
        if (urdu !== sug && !result.includes(urdu)) {
          result.push(urdu)
        }
      }
    }
    return result
  }, [suggestions, enableUrdu])

  const query = useMemo(() => {
    return value.trim()
  }, [value])

  const list = useMemo(() => {
    const uniq = Array.from(new Set((urduSuggestions || []).map(s => (s || '').trim()).filter(Boolean)))
    if (!query) return uniq.slice(0, 8)

    // Search in both English and Urdu
    const q = query.toLowerCase()
    const matches = uniq.filter(s => s.toLowerCase().includes(q))
    return matches.slice(0, 8)
  }, [urduSuggestions, query])

  // Close dropdown when clicking outside
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current) return
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  // Handle input change with debounced transliteration - word by word
  const handleChange = useCallback((newValue: string) => {
    // Clear any pending transliteration
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Update immediately for responsiveness
    onChange(newValue)
    setOpen(true)

    // Don't transliterate if already processing or if value hasn't changed meaningfully
    if (!enableUrdu || isProcessingRef.current || !newValue.trim()) return

    // Skip if the value is already the last transliterated value
    if (newValue === lastTransliteratedRef.current) return

    // Debounced transliteration - word by word
    timeoutRef.current = setTimeout(() => {
      // Split into words
      const words = newValue.split(/(\s+)/)
      if (words.length === 0) return

      // Find the last non-whitespace word
      let lastWordIndex = -1
      for (let i = words.length - 1; i >= 0; i--) {
        if (words[i].trim()) {
          lastWordIndex = i
          break
        }
      }

      if (lastWordIndex === -1) return

      const lastWord = words[lastWordIndex]

      // Don't transliterate if already contains Urdu characters
      if (/[\u0600-\u06FF]/.test(lastWord)) return

      // Only transliterate if it looks like Roman Urdu
      if (!containsRomanUrdu(lastWord)) return

      // Transliterate only the last word
      const transliteratedLastWord = smartTransliterate(lastWord)

      // Only update if transliteration produced different result
      if (transliteratedLastWord !== lastWord) {
        isProcessingRef.current = true
        words[lastWordIndex] = transliteratedLastWord
        const finalValue = words.join('')
        lastTransliteratedRef.current = finalValue
        onChange(finalValue)

        // Reset processing flag after a short delay
        setTimeout(() => {
          isProcessingRef.current = false
        }, 100)
      }
    }, transliterationDelay)
  }, [onChange, transliterationDelay, enableUrdu])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const choose = (s: string) => {
    onChange(s)
    lastTransliteratedRef.current = s
    setOpen(false)
    setActive(0)
    setTimeout(() => (inputRef.current as any)?.focus?.(), 0)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setActive(a => Math.min((list.length || 1) - 1, a + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive(a => Math.max(0, a - 1))
    } else if ((e.key === 'Enter' || e.key === 'Tab') && open && list[active]) {
      e.preventDefault()
      choose(list[active])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div className="relative" ref={wrapRef}>
      {as === 'textarea' ? (
        <textarea
          ref={inputRef as any}
          dir="auto"
          rows={rows}
          value={value}
          onChange={e => handleChange(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={(e)=> onBlurValue?.(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className={className}
        />
      ) : (
        <input
          ref={inputRef as any}
          dir="auto"
          type="text"
          value={value}
          onChange={e => handleChange(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={(e)=> onBlurValue?.(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className={className}
        />
      )}
      {open && list.length > 0 && (
        <div className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-md border border-slate-200 bg-white shadow-lg">
          {list.map((s, i) => (
            <div
              key={`${s}-${i}`}
              onMouseDown={e => e.preventDefault()}
              onClick={() => choose(s)}
              className={`cursor-pointer px-3 py-2 text-sm ${i === active ? 'bg-slate-100' : ''}`}
              dir="auto"
            >
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
