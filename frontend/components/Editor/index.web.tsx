import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect, useRef } from 'react'

interface EditorProps {
  initialContent?: any
  onChange: (json: any) => void
}

export default function Editor({ initialContent, onChange }: EditorProps) {
  const initialized = useRef(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Start writing your adventure...' }),
    ],
    content: initialContent ?? { type: 'doc', content: [{ type: 'paragraph' }] },
    onUpdate({ editor }) {
      onChange(editor.getJSON())
    },
  })

  // Sync server content on first load only
  useEffect(() => {
    if (!editor || !initialContent || initialized.current) return
    editor.commands.setContent(initialContent, false)
    initialized.current = true
  }, [editor, initialContent])

  return (
    <div className="flappit-editor">
      <EditorContent editor={editor} />
    </div>
  )
}
