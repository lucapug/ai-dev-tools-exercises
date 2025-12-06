import React, { useRef } from 'react';
import Editor from '@monaco-editor/react';

function CodeEditor({ code, language, onChange }) {
  const editorRef = useRef(null);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    
    // Configure editor options
    editor.updateOptions({
      fontSize: 14,
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      automaticLayout: true,
    });
  };

  const getLanguageForMonaco = (lang) => {
    const languageMap = {
      'javascript': 'javascript',
      'typescript': 'typescript',
      'python': 'python',
      'java': 'java',
      'cpp': 'cpp',
    };
    return languageMap[lang] || 'javascript';
  };

  return (
    <div className="editor-container">
      <Editor
        height="100%"
        language={getLanguageForMonaco(language)}
        value={code}
        theme="vs-dark"
        onChange={onChange}
        onMount={handleEditorDidMount}
        options={{
          selectOnLineNumbers: true,
          roundedSelection: false,
          readOnly: false,
          cursorStyle: 'line',
          automaticLayout: true,
          wordWrap: 'on',
        }}
      />
    </div>
  );
}

export default CodeEditor;