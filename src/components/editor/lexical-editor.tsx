"use client";

import { useCallback, useEffect, useState } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ListItemNode, ListNode } from "@lexical/list";
import { LinkNode, AutoLinkNode } from "@lexical/link";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import {
  $getRoot,
  $createParagraphNode,
  $createTextNode,
  EditorState,
  LexicalEditor as LexicalEditorType,
} from "lexical";
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";
import ToolbarPlugin from "./toolbar-plugin";

interface LexicalEditorProps {
  initialContent?: string;
  onChange?: (html: string, text: string) => void;
  placeholder?: string;
  editable?: boolean;
  className?: string;
  minHeight?: string;
}

const theme = {
  root: "lexical-root",
  link: "text-blue-600 underline cursor-pointer hover:text-blue-800",
  text: {
    bold: "font-bold",
    italic: "italic",
    underline: "underline",
    strikethrough: "line-through",
  },
  list: {
    nested: {
      listitem: "ml-4",
    },
    ol: "list-decimal ml-4",
    ul: "list-disc ml-4",
    listitem: "ml-2",
  },
  heading: {
    h1: "text-2xl font-bold",
    h2: "text-xl font-bold",
    h3: "text-lg font-semibold",
  },
  quote: "border-l-4 border-zinc-300 pl-4 italic text-zinc-600",
};

function onError(error: Error) {
  console.error("Lexical error:", error);
}

// Plugin to set initial content
function InitialContentPlugin({ content }: { content?: string }) {
  const [editor] = useLexicalComposerContext();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (content && !initialized) {
      editor.update(() => {
        const root = $getRoot();
        root.clear();

        // Check if content is HTML
        if (content.startsWith("<") && content.includes(">")) {
          const parser = new DOMParser();
          const dom = parser.parseFromString(content, "text/html");
          const nodes = $generateNodesFromDOM(editor, dom);
          root.append(...nodes);
        } else {
          // Plain text - split by newlines
          const paragraphs = content.split("\n");
          for (const text of paragraphs) {
            const paragraph = $createParagraphNode();
            if (text.trim()) {
              paragraph.append($createTextNode(text));
            }
            root.append(paragraph);
          }
        }
      });
      setInitialized(true);
    }
  }, [editor, content, initialized]);

  return null;
}

// Plugin to extract content
function ContentExtractionPlugin({
  onChange,
}: {
  onChange?: (html: string, text: string) => void;
}) {
  const [editor] = useLexicalComposerContext();

  const handleChange = useCallback(
    (editorState: EditorState, _editor: LexicalEditorType) => {
      editorState.read(() => {
        const root = $getRoot();
        const text = root.getTextContent();
        const html = $generateHtmlFromNodes(_editor);
        onChange?.(html, text);
      });
    },
    [onChange]
  );

  return <OnChangePlugin onChange={handleChange} />;
}

export default function LexicalEditor({
  initialContent,
  onChange,
  placeholder = "Start typing...",
  editable = true,
  className = "",
  minHeight = "200px",
}: LexicalEditorProps) {
  const initialConfig = {
    namespace: "ResumeEditor",
    theme,
    onError,
    editable,
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, LinkNode, AutoLinkNode],
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div
        className={`lexical-container rounded-md border border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900 ${className}`}
      >
        {editable && <ToolbarPlugin />}
        <div className="relative">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className="lexical-content focus:outline-none px-4 py-3"
                style={{ minHeight }}
              />
            }
            placeholder={
              <div className="lexical-placeholder pointer-events-none absolute left-4 top-3 text-zinc-400">
                {placeholder}
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
        </div>
        <HistoryPlugin />
        <ListPlugin />
        <LinkPlugin />
        <InitialContentPlugin content={initialContent} />
        <ContentExtractionPlugin onChange={onChange} />
      </div>
    </LexicalComposer>
  );
}
