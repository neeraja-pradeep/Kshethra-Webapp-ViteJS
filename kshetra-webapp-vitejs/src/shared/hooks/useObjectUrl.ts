import { useEffect, useState } from 'react'

/**
 * A preview URL for a picked file, revoked when it is replaced or the component
 * goes away.
 *
 * An object URL is a live handle, not a string: left unrevoked it pins the file
 * in memory for the life of the document.
 */
export function useObjectUrl(file: File | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!file) {
      setUrl(null)
      return
    }
    const objectUrl = URL.createObjectURL(file)
    setUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [file])

  return url
}
