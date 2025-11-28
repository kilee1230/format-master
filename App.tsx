import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  Play,
  Minimize2,
  CheckCircle,
  Trash2,
  Copy,
  Upload,
  Download,
  Zap,
  Code2,
  FileJson,
  FileCode,
  FileText,
} from "lucide-react";
import CodeEditor from "./components/CodeEditor";
import Button from "./components/Button";
import { formatJson, minifyJson, isValidJson } from "./utils/jsonUtils";
import { formatXml, minifyXml, isValidXml } from "./utils/xmlUtils";
import {
  formatYaml,
  minifyYaml,
  isValidYaml,
  yamlToJson,
} from "./utils/yamlUtils";
import { fixCodeWithAI } from "./services/geminiService";
import { ActionType, LanguageMode } from "./types";

function App() {
  const [mode, setMode] = useState<LanguageMode>("json");
  const [input, setInput] = useState<string>("");
  const [output, setOutput] = useState<string>("");
  const [status, setStatus] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clear inputs when switching modes
  const switchMode = (newMode: LanguageMode) => {
    setMode(newMode);
    setInput("");
    setOutput("");
    setStatus(null);
  };

  const handleAction = useCallback(
    async (action: ActionType) => {
      setStatus(null);
      setIsLoading(true);

      try {
        // Small delay to allow UI to update loading state
        await new Promise((resolve) => setTimeout(resolve, 100));

        if (!input.trim()) {
          throw new Error("Input is empty");
        }

        switch (action) {
          case ActionType.BEAUTIFY: {
            let formatted = "";
            if (mode === "json") formatted = formatJson(input);
            else if (mode === "xml") formatted = formatXml(input);
            else if (mode === "yaml") formatted = formatYaml(input);

            setOutput(formatted);
            setStatus({
              type: "success",
              message: `${mode.toUpperCase()} Beautified Successfully`,
            });
            break;
          }
          case ActionType.MINIFY: {
            let minified = "";
            if (mode === "json") minified = minifyJson(input);
            else if (mode === "xml") minified = minifyXml(input);
            else if (mode === "yaml") minified = minifyYaml(input);

            setOutput(minified);
            setStatus({
              type: "success",
              message: `${mode.toUpperCase()} Minified Successfully`,
            });
            break;
          }
          case ActionType.VALIDATE: {
            let isValid = false;
            if (mode === "json") isValid = isValidJson(input);
            else if (mode === "xml") isValid = isValidXml(input);
            else if (mode === "yaml") isValid = isValidYaml(input);

            if (isValid) {
              setStatus({
                type: "success",
                message: `Valid ${mode.toUpperCase()}`,
              });
            } else {
              throw new Error(`Invalid ${mode.toUpperCase()} format`);
            }
            break;
          }
          case ActionType.AI_FIX: {
            setStatus({
              type: "info",
              message: `Asking Gemini to fix ${mode.toUpperCase()}...`,
            });
            const fixed = await fixCodeWithAI(input, mode);

            // Beautify the fixed code
            let pretty = fixed;
            try {
              if (mode === "json") pretty = formatJson(fixed);
              else if (mode === "xml") pretty = formatXml(fixed);
              else if (mode === "yaml") pretty = formatYaml(fixed);
            } catch (e) {
              // If formatting fails, just show raw fixed
            }

            setOutput(pretty);
            setStatus({
              type: "success",
              message: `${mode.toUpperCase()} Fixed with AI`,
            });
            break;
          }
        }
      } catch (error) {
        setStatus({ type: "error", message: (error as Error).message });
      } finally {
        setIsLoading(false);
      }
    },
    [input, mode]
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setInput(event.target.result as string);
          setStatus({ type: "info", message: `Loaded ${file.name}` });
        }
      };
      reader.readAsText(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDownload = () => {
    if (!output) return;
    const typeMap = {
      json: "application/json",
      xml: "application/xml",
      yaml: "text/yaml",
    };
    const blob = new Blob([output], { type: typeMap[mode] });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `formatted.${mode}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setStatus({ type: "success", message: "Copied to clipboard" });
      setTimeout(() => setStatus(null), 2000);
    } catch (err) {
      setStatus({ type: "error", message: "Failed to copy" });
    }
  };

  const EditorTools = ({ type }: { type: "input" | "output" }) => (
    <div className="flex gap-2">
      {type === "input" && (
        <>
          <button
            onClick={() => fileInputRef.current?.click()}
            title={`Upload ${mode.toUpperCase()} file`}
            className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition"
          >
            <Upload className="w-4 h-4" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept={
              mode === "json"
                ? ".json,.txt"
                : mode === "xml"
                ? ".xml,.txt"
                : ".yaml,.yml,.txt"
            }
          />
          <button
            onClick={() => {
              setInput("");
              setStatus(null);
            }}
            title="Clear"
            className="p-1 hover:bg-red-900/50 rounded text-gray-400 hover:text-red-400 transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </>
      )}
      {type === "output" && (
        <>
          <button
            onClick={() => copyToClipboard(output)}
            title="Copy to Clipboard"
            disabled={!output}
            className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white disabled:opacity-30 transition"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={handleDownload}
            title="Download"
            disabled={!output}
            className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white disabled:opacity-30 transition"
          >
            <Download className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-gray-200">
      {/* Header */}
      <header className="h-16 border-b border-gray-800 bg-gray-900 flex items-center px-4 lg:px-6 shadow-lg z-10 shrink-0 gap-6">
        <div className="flex items-center">
          <Code2 className="w-8 h-8 text-blue-500 mr-3" />
          <div className="hidden md:block">
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
              Format Master
            </h1>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex bg-gray-950 p-1 rounded-lg border border-gray-800">
          <button
            onClick={() => switchMode("json")}
            className={`flex items-center px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              mode === "json"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            }`}
          >
            <FileJson className="w-4 h-4 mr-2" />
            JSON
          </button>
          <button
            onClick={() => switchMode("xml")}
            className={`flex items-center px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              mode === "xml"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            }`}
          >
            <FileCode className="w-4 h-4 mr-2" />
            XML
          </button>
          <button
            onClick={() => switchMode("yaml")}
            className={`flex items-center px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              mode === "yaml"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            }`}
          >
            <FileText className="w-4 h-4 mr-2" />
            YAML
          </button>
        </nav>

        <div className="ml-auto flex items-center gap-4">
          {status && (
            <div
              className={`text-sm px-3 py-1 rounded-full font-medium animate-fade-in hidden md:block ${
                status.type === "error"
                  ? "bg-red-900/50 text-red-200 border border-red-800"
                  : status.type === "success"
                  ? "bg-green-900/50 text-green-200 border border-green-800"
                  : "bg-blue-900/50 text-blue-200 border border-blue-800"
              }`}
            >
              {status.message}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative">
        <div className="h-full flex flex-col lg:flex-row">
          {/* LEFT: Input */}
          <div className="flex-1 h-[45%] lg:h-full p-4 lg:pr-2 min-w-0">
            <CodeEditor
              title={`Raw ${mode.toUpperCase()} Input`}
              value={input}
              onChange={setInput}
              language={mode}
              actions={<EditorTools type="input" />}
            />
          </div>

          {/* MIDDLE: Controls */}
          <div className="shrink-0 flex lg:flex-col items-center justify-center p-2 gap-3 bg-gray-950 border-y lg:border-y-0 lg:border-x border-gray-800 z-10 overflow-x-auto lg:overflow-visible">
            <div className="hidden lg:block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 rotate-0">
              Actions
            </div>

            <Button
              onClick={() => handleAction(ActionType.BEAUTIFY)}
              icon={<Play className="w-4 h-4" />}
              title="Format"
              disabled={isLoading || !input}
              className="w-full lg:w-36"
            >
              Beautify
            </Button>

            <Button
              variant="secondary"
              onClick={() => handleAction(ActionType.MINIFY)}
              icon={<Minimize2 className="w-4 h-4" />}
              title="Minify"
              disabled={isLoading || !input}
              className="w-full lg:w-36"
            >
              Minify
            </Button>

            <Button
              variant="secondary"
              onClick={() => handleAction(ActionType.VALIDATE)}
              icon={<CheckCircle className="w-4 h-4" />}
              title="Validate Syntax"
              disabled={isLoading || !input}
              className="w-full lg:w-36"
            >
              Validate
            </Button>

            {/* <div className="w-full h-px bg-gray-800 my-1 hidden lg:block" />

            <Button 
              variant="ai"
              onClick={() => handleAction(ActionType.AI_FIX)}
              icon={<Zap className="w-4 h-4 fill-current" />}
              title={`Fix invalid ${mode} with Gemini`}
              isLoading={isLoading && status?.type === 'info'}
              disabled={isLoading || !input}
              className="w-full lg:w-36"
            >
              AI Fix
            </Button>*/}
          </div>

          {/* RIGHT: Output */}
          <div className="flex-1 h-[45%] lg:h-full p-4 lg:pl-2 min-w-0">
            <CodeEditor
              title="Formatted Output"
              value={output}
              readOnly={true}
              placeholder="Result will appear here..."
              actions={<EditorTools type="output" />}
              language={mode}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
