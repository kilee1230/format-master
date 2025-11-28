import React, { useRef, useEffect, useState } from "react";
import { Braces, Code } from "lucide-react";
import { EditorProps, LanguageMode } from "../types";
import JsonTree from "./JsonTree";
import { yamlToJson } from "../utils/yamlUtils";
import { xmlToJson } from "../utils/xmlUtils";
import { tomlToJson } from "../utils/tomlUtils";

interface ExtendedEditorProps extends EditorProps {
  language?: LanguageMode | "text";
}

const CodeEditor: React.FC<ExtendedEditorProps> = ({
  value,
  onChange,
  readOnly = false,
  placeholder = "Paste code here...",
  title,
  actions,
  language = "text",
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const [lineCount, setLineCount] = useState(1);
  const [viewMode, setViewMode] = useState<"code" | "tree">("code");
  const [parsedData, setParsedData] = useState<any>(null);
  const [parseError, setParseError] = useState(false);

  // Sync scroll between textarea and line numbers
  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Update line numbers count based on value
  useEffect(() => {
    const lines = value.split("\n").length;
    setLineCount(lines > 0 ? lines : 1);
  }, [value]);

  // Handle Parsing for Tree View (JSON, YAML, XML, TOML)
  useEffect(() => {
    if (value) {
      if (language === "json") {
        try {
          const parsed = JSON.parse(value);
          setParsedData(parsed);
          setParseError(false);
        } catch (e) {
          setParseError(true);
        }
      } else if (language === "yaml") {
        const parsed = yamlToJson(value);
        if (parsed) {
          setParsedData(parsed);
          setParseError(false);
        } else {
          setParseError(true);
        }
      } else if (language === "xml") {
        const parsed = xmlToJson(value);
        if (parsed) {
          setParsedData(parsed);
          setParseError(false);
        } else {
          setParseError(true);
        }
      } else if (language === "toml") {
        const parsed = tomlToJson(value);
        if (parsed) {
          setParsedData(parsed);
          setParseError(false);
        } else {
          setParseError(true);
        }
      }
    }
  }, [value, language]);

  // Reset view mode when language changes
  useEffect(() => {
    // Default to tree view only for JSON.
    // For XML/YAML/TOML, usually users want to see the syntax first after conversion.
    if (language === "json" && readOnly && !parseError && value) {
      setViewMode("tree");
    } else {
      setViewMode("code");
    }
  }, [language, readOnly]); // Only run when these props change, not value

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab" && !readOnly) {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;

      const newValue = value.substring(0, start) + "  " + value.substring(end);
      if (onChange) onChange(newValue);

      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      }, 0);
    }
  };

  const canShowTree =
    language === "json" ||
    language === "yaml" ||
    language === "xml" ||
    language === "toml";

  return (
    <div className="flex flex-col h-full bg-gray-900 border border-gray-700 rounded-lg overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700 min-h-[42px]">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
            {title}
          </h3>

          {/* View Toggle */}
          {canShowTree && (
            <div className="flex bg-gray-900 rounded-md p-0.5 border border-gray-700">
              <button
                onClick={() => setViewMode("code")}
                className={`p-1 rounded ${
                  viewMode === "code"
                    ? "bg-gray-700 text-white"
                    : "text-gray-400 hover:text-gray-200"
                }`}
                title="Code View"
              >
                <Code className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode("tree")}
                className={`p-1 rounded ${
                  viewMode === "tree"
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:text-gray-200"
                }`}
                title="Tree View"
                disabled={parseError && !parsedData}
              >
                <Braces className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {actions}
          {readOnly && viewMode === "code" && (
            <div className="hidden sm:block text-xs text-gray-500 font-mono border-l border-gray-700 pl-3 ml-1">
              {new TextEncoder().encode(value).length} bytes
            </div>
          )}
        </div>
      </div>

      <div className="relative flex-1 flex overflow-hidden bg-gray-900">
        {canShowTree && viewMode === "tree" && !parseError ? (
          <JsonTree data={parsedData} />
        ) : (
          <>
            {/* Line Numbers */}
            <div
              ref={lineNumbersRef}
              className="hidden sm:block w-12 pt-4 px-2 text-right bg-gray-950 text-gray-600 font-mono text-sm select-none overflow-hidden"
              style={{ lineHeight: "1.5rem" }}
            >
              {Array.from({ length: lineCount }).map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>

            {/* Editor Area */}
            <textarea
              ref={textareaRef}
              value={value}
              onChange={handleChange}
              onScroll={handleScroll}
              onKeyDown={handleKeyDown}
              readOnly={readOnly}
              spellCheck={false}
              placeholder={placeholder}
              className={`flex-1 w-full h-full p-4 bg-gray-900 text-gray-200 font-mono text-sm border-none resize-none focus:ring-0 focus:outline-none leading-6 custom-scrollbar ${
                readOnly ? "cursor-text" : "cursor-text"
              }`}
              style={{
                lineHeight: "1.5rem",
                whiteSpace: "pre",
                overflowWrap: "normal",
                overflowX: "auto",
              }}
            />
          </>
        )}

        {/* Error Overlay for Tree View */}
        {canShowTree && viewMode === "tree" && parseError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90 z-10 text-center p-4">
            <div className="text-red-400">
              <Braces className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="font-medium">Invalid {language.toUpperCase()}</p>
              <p className="text-sm text-gray-500 mt-1">
                Switch to Code view to fix syntax errors.
              </p>
              <button
                onClick={() => setViewMode("code")}
                className="mt-4 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm text-white transition-colors"
              >
                Switch to Code View
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeEditor;
