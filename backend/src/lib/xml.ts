/**
 * Lightweight XML parser for WeChat Pay async notifications.
 * WeChat sends XML with simple key-value structure:
 * <xml><field>value</field>...</xml>
 */

export function parseWeChatXml(xml: string): Record<string, string> {
  const result: Record<string, string> = {}
  const regex = /<(\w+)><!\[CDATA\[(.*?)\]\]><\/\1>|<(\w+)>(.*?)<\/\3>/g
  let match: RegExpExecArray | null

  while ((match = regex.exec(xml)) !== null) {
    const key = match[1] || match[3]
    const value = match[2] !== undefined ? match[2] : match[4]
    result[key] = value
  }

  return result
}

/**
 * Build XML response for WeChat Pay
 */
export function buildWeChatXml(data: Record<string, string>): string {
  const entries = Object.entries(data)
    .map(([key, value]) => `<${key}><![CDATA[${value}]]></${key}>`)
    .join('')
  return `<xml>${entries}</xml>`
}
