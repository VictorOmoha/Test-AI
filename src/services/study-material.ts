export interface ParsedStudyMaterial {
  title: string
  text: string
  fileType: string
  stats: {
    characters: number
    estimatedSections: number
    extractionQuality: 'high' | 'medium' | 'low'
    warnings: string[]
  }
}

export interface StudyChunk {
  index: number
  content: string
}

export class StudyMaterialService {
  async parseBase64File(fileName: string, mimeType: string, base64Content: string): Promise<ParsedStudyMaterial> {
    const buffer = Buffer.from(base64Content, 'base64')
    const extension = this.getExtension(fileName, mimeType)
    const rawText = await this.extractText(buffer, extension)
    const cleanedText = this.normalizeText(rawText)
    const warnings = this.assessExtractionWarnings(cleanedText, extension)

    if (!cleanedText || cleanedText.length < 40) {
      throw new Error('Uploaded file does not contain enough readable text yet. Try a cleaner TXT, Markdown, PDF, or DOCX file.')
    }

    return {
      title: fileName.replace(/\.[^.]+$/, ''),
      text: cleanedText,
      fileType: extension,
      stats: {
        characters: cleanedText.length,
        estimatedSections: this.chunkText(cleanedText).length,
        extractionQuality: this.getExtractionQuality(cleanedText, warnings),
        warnings
      }
    }
  }

  chunkText(text: string, chunkSize = 1800): StudyChunk[] {
    const normalized = this.normalizeText(text)
    if (!normalized) return []

    const paragraphs = normalized.split(/\n{2,}/).map(part => part.trim()).filter(Boolean)
    const chunks: StudyChunk[] = []
    let current = ''

    for (const paragraph of paragraphs) {
      const candidate = current ? `${current}\n\n${paragraph}` : paragraph
      if (candidate.length <= chunkSize) {
        current = candidate
        continue
      }

      if (current) {
        chunks.push({ index: chunks.length + 1, content: current })
      }

      if (paragraph.length <= chunkSize) {
        current = paragraph
        continue
      }

      const sentences = paragraph.split(/(?<=[.!?])\s+/)
      let sentenceBucket = ''
      for (const sentence of sentences) {
        const combined = sentenceBucket ? `${sentenceBucket} ${sentence}` : sentence
        if (combined.length <= chunkSize) {
          sentenceBucket = combined
        } else {
          if (sentenceBucket) {
            chunks.push({ index: chunks.length + 1, content: sentenceBucket.trim() })
          }
          sentenceBucket = sentence
        }
      }
      current = sentenceBucket.trim()
    }

    if (current) {
      chunks.push({ index: chunks.length + 1, content: current })
    }

    return chunks
  }

  buildContextSnippet(text: string, maxChars = 7000): string {
    return this.chunkText(text)
      .slice(0, 4)
      .map(chunk => `[Section ${chunk.index}]\n${chunk.content}`)
      .join('\n\n')
      .slice(0, maxChars)
  }

  private getExtension(fileName: string, mimeType: string): string {
    const fromName = fileName.split('.').pop()?.toLowerCase() || ''
    if (fromName) return fromName
    if (mimeType.includes('wordprocessingml')) return 'docx'
    if (mimeType.includes('pdf')) return 'pdf'
    if (mimeType.includes('markdown')) return 'md'
    if (mimeType.includes('plain')) return 'txt'
    return 'txt'
  }

  private async extractText(buffer: Buffer, extension: string): Promise<string> {
    if (['txt', 'md', 'markdown', 'csv', 'json'].includes(extension)) {
      return buffer.toString('utf-8')
    }

    if (extension === 'pdf') {
      const { default: PDFParser } = await import('pdf2json')
      const parser = new (PDFParser as any)()
      const text: string = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('PDF parsing timed out')), 30000);
        (parser as any).on('pdfParser_dataReady', (pdfData: any) => {
          clearTimeout(timeout)
          try {
            const pages = pdfData?.Pages || []
            if (pages.length === 0) {
              reject(new Error('PDF contains no readable pages. It may be a scanned image or protected document.'))
              return
            }
            const text = pages
              .map((page: any) =>
                (page.Texts || [])
                  .map((t: any) =>
                    (t.R || [])
                      .map((r: any) => decodeURIComponent(r.T || ''))
                      .join('')
                  )
                  .join(' ')
              )
              .join('\n\n')
            resolve(text)
          } catch (err) {
            reject(err)
          }
        })
        ;(parser as any).on('pdfParser_dataError', (err: any) => {
          clearTimeout(timeout)
          reject(err?.parserError || err)
        })
        ;(parser as any).parseBuffer(buffer)
      })
      const cleaned = this.normalizeText(text)
      if (!cleaned || cleaned.length < 40) {
        throw new Error('PDF produced almost no readable text. Try exporting as text or a cleaner PDF format.')
      }
      if (this.looksLikeExtractionGarbage(cleaned)) {
        throw new Error('PDF extraction returned corrupted content. This PDF may use unsupported encoding. Try re-saving or exporting as a text-based format.')
      }
      return text || ''
    }

    if (extension === 'docx') {
      const mammoth = await import('mammoth')
      const result = await mammoth.extractRawText({ buffer })
      return result.value || ''
    }

    return buffer.toString('utf-8')
  }

  private assessExtractionWarnings(text: string, extension: string): string[] {
    const warnings: string[] = []
    const suspiciousSymbolRatio = text.length
      ? ((text.match(/[^\w\s.,;:!?()'"%&\-]/g) || []).length / text.length)
      : 0

    if (text.length < 300) {
      warnings.push('Very little readable text was extracted from this file.')
    }

    if (suspiciousSymbolRatio > 0.12) {
      warnings.push('The extracted text looks noisy, which may reduce test quality.')
    }

    if ((extension === 'pdf' || extension === 'docx') && text.length < 800) {
      warnings.push('This document may not have extracted cleanly. If the results feel off, try exporting cleaner text or Markdown.')
    }

    return warnings
  }

  private getExtractionQuality(text: string, warnings: string[]): 'high' | 'medium' | 'low' {
    if (text.length < 300 || warnings.length >= 2) return 'low'
    if (text.length < 1200 || warnings.length === 1) return 'medium'
    return 'high'
  }

  private looksLikeExtractionGarbage(text: string): boolean {
    const sample = text.slice(0, 2000)
    // Stack trace patterns
    if (/Traceback \(most recent call last\)/.test(sample)) return true
    if (/File ".*\.py", line \d+/.test(sample)) return true
    // Terminal/console output patterns
    if (/Microsoft Windows \[Version/.test(sample)) return true
    if (/C:\\Users\\/.test(sample) && /\\AppData\\/.test(sample)) return true
    // Excessive file paths (extraction artifact)
    const pathMatches = sample.match(/[A-Z]:\\[^\s]+|[\/](?:usr|home|var|opt)\/[^\s]+/g) || []
    if (pathMatches.length > 5) return true
    // Binary/encoding garbage: high ratio of non-printable or symbol-heavy content
    const printableRatio = (sample.match(/[\w\s.,;:!?'"()\-]/g) || []).length / Math.max(sample.length, 1)
    if (printableRatio < 0.5) return true
    // Repetitive garbage: same short token repeated excessively
    const words = sample.toLowerCase().split(/\s+/).filter(w => w.length > 2)
    if (words.length > 20) {
      const unique = new Set(words)
      if (unique.size / words.length < 0.15) return true
    }
    return false
  }

  private normalizeText(text: string): string {
    return text
      .replace(/\r/g, '\n')
      .replace(/\u0000/g, ' ')
      .replace(/\t/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]{2,}/g, ' ')
      .trim()
  }
}
