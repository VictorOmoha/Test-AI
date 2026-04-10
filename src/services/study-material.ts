export interface ParsedStudyMaterial {
  title: string
  text: string
  fileType: string
  stats: {
    characters: number
    estimatedSections: number
  }
}

export interface StudyChunk {
  index: number
  content: string
}

export class StudyMaterialService {
  parseBase64File(fileName: string, mimeType: string, base64Content: string): ParsedStudyMaterial {
    const buffer = Buffer.from(base64Content, 'base64')
    const extension = this.getExtension(fileName, mimeType)
    const rawText = this.extractText(buffer, extension)
    const cleanedText = this.normalizeText(rawText)

    if (!cleanedText || cleanedText.length < 40) {
      throw new Error('Uploaded file does not contain enough readable text yet. Start with TXT or Markdown files.')
    }

    return {
      title: fileName,
      text: cleanedText,
      fileType: extension,
      stats: {
        characters: cleanedText.length,
        estimatedSections: this.chunkText(cleanedText).length
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
    if (mimeType.includes('markdown')) return 'md'
    if (mimeType.includes('plain')) return 'txt'
    return 'txt'
  }

  private extractText(buffer: Buffer, extension: string): string {
    if (['txt', 'md', 'markdown', 'csv', 'json'].includes(extension)) {
      return buffer.toString('utf-8')
    }

    if (extension === 'pdf') {
      const binary = buffer.toString('latin1')
      const matches = binary.match(/\(([^()]|\\.){2,}\)/g) || []
      const extracted = matches
        .map(match => match.slice(1, -1))
        .join(' ')
      return extracted
    }

    if (extension === 'docx') {
      const binary = buffer.toString('latin1')
      const matches = binary.match(/[A-Za-z0-9][A-Za-z0-9 ,.;:!?()'"\-\n]{20,}/g) || []
      return matches.join(' ')
    }

    return buffer.toString('utf-8')
  }

  private normalizeText(text: string): string {
    return text
      .replace(/\r/g, '\n')
      .replace(/\u0000/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]{2,}/g, ' ')
      .trim()
  }
}
