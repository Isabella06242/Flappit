import { StyleSheet, TextInput, View } from 'react-native'

interface EditorProps {
  initialContent?: any
  onChange: (json: any) => void
}

function contentToText(content: any): string {
  if (!content) return ''
  const nodes: any[] = content?.content ?? []
  return nodes
    .map((n: any) => {
      if (n.type === 'text') return n.text ?? ''
      const inner = contentToText(n)
      return n.type === 'paragraph' ? inner + '\n' : inner
    })
    .join('')
}

function textToContent(text: string): any {
  const paragraphs = text.split('\n').map((line) => ({
    type: 'paragraph',
    content: line ? [{ type: 'text', text: line }] : [],
  }))
  return { type: 'doc', content: paragraphs }
}

export default function Editor({ initialContent, onChange }: EditorProps) {
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        multiline
        defaultValue={contentToText(initialContent)}
        onChangeText={(text) => onChange(textToContent(text))}
        placeholder="Start writing your adventure..."
        placeholderTextColor="#bbb"
        textAlignVertical="top"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  input: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: '#1a1a1a',
    padding: 16,
  },
})
