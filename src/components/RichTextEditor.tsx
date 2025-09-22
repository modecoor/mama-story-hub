import React, { useMemo } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  height?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Начните писать...',
  readOnly = false,
  height = '300px'
}) => {
  const modules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'direction': 'rtl' }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['blockquote', 'code-block'],
      ['link', 'image'],
      ['clean']
    ],
    clipboard: {
      matchVisual: false,
    }
  }), []);

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'script',
    'indent',
    'direction',
    'color', 'background',
    'align',
    'blockquote', 'code-block',
    'link', 'image'
  ];

  return (
    <div className="rich-text-editor">
      <style dangerouslySetInnerHTML={{
        __html: `
          .rich-text-editor .ql-editor {
            min-height: ${height};
            font-family: inherit;
            font-size: 14px;
            line-height: 1.6;
          }
          
          .rich-text-editor .ql-toolbar {
            border-color: hsl(var(--border));
            border-radius: 0.5rem 0.5rem 0 0;
          }
          
          .rich-text-editor .ql-container {
            border-color: hsl(var(--border));
            border-radius: 0 0 0.5rem 0.5rem;
          }
          
          .rich-text-editor .ql-editor.ql-blank::before {
            color: hsl(var(--muted-foreground));
            font-style: normal;
          }
          
          .dark .rich-text-editor .ql-toolbar {
            background-color: hsl(var(--muted));
          }
          
          .dark .rich-text-editor .ql-container {
            background-color: hsl(var(--background));
          }
          
          .dark .rich-text-editor .ql-editor {
            color: hsl(var(--foreground));
          }
          
          .dark .rich-text-editor .ql-stroke {
            stroke: hsl(var(--foreground));
          }
          
          .dark .rich-text-editor .ql-fill {
            fill: hsl(var(--foreground));
          }
        `
      }} />
      
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        readOnly={readOnly}
        modules={modules}
        formats={formats}
      />
    </div>
  );
};