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
  ShieldCheck,
  Check,
  XCircle,
  FileType,
  ArrowRightLeft,
  ChevronDown,
} from "lucide-react";
import CodeEditor from "./components/CodeEditor";
import Button from "./components/Button";
import { formatJson, minifyJson, isValidJson } from "./utils/jsonUtils";
import {
  formatXml,
  minifyXml,
  isValidXml,
  xmlToJson,
  jsonToXml,
} from "./utils/xmlUtils";
import {
  formatYaml,
  minifyYaml,
  isValidYaml,
  yamlToJson,
} from "./utils/yamlUtils";
import { decodeJwt, isValidJwt, verifyHmacSignature } from "./utils/jwtUtils";
import {
  formatToml,
  minifyToml,
  isValidToml,
  tomlToJson,
} from "./utils/tomlUtils";
import { fixCodeWithAI } from "./services/geminiService";
import { ActionType, LanguageMode } from "./types";
import yaml from "js-yaml";
import { stringify as tomlStringify } from "smol-toml";

function App() {
  const [mode, setMode] = useState<LanguageMode>("json");
  // Output mode can differ from input mode (e.g. JSON -> YAML)
  const [outputMode, setOutputMode] = useState<LanguageMode>("json");

  const [input, setInput] = useState<string>("");
  const [output, setOutput] = useState<string>("");
  const [status, setStatus] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // JWT Specific State
  const [jwtSecret, setJwtSecret] = useState<string>("");
  const [isSignatureValid, setIsSignatureValid] = useState<boolean | null>(
    null
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clear inputs when switching modes
  const switchMode = (newMode: LanguageMode) => {
    setMode(newMode);
    setOutputMode(newMode); // Reset output mode to match input
    setInput("");
    setOutput("");
    setStatus(null);
    setJwtSecret("");
    setIsSignatureValid(null);
  };

  // JWT Verification Effect
  useEffect(() => {
    let active = true;
    const checkSig = async () => {
      if (mode === "jwt" && input && jwtSecret) {
        // Basic check if input looks like a JWT
        if (input.split(".").length === 3) {
          const isValid = await verifyHmacSignature(input, jwtSecret);
          if (active) setIsSignatureValid(isValid);
        } else {
          if (active) setIsSignatureValid(false);
        }
      } else {
        if (active) setIsSignatureValid(null);
      }
    };
    checkSig();
    return () => {
      active = false;
    };
  }, [mode, input, jwtSecret]);

  const parseInputToObj = (
    inputStr: string,
    currentMode: LanguageMode
  ): any => {
    if (!inputStr.trim()) throw new Error("Input is empty");

    switch (currentMode) {
      case "json":
        return JSON.parse(inputStr);
      case "yaml":
        const y = yamlToJson(inputStr);
        if (!y) throw new Error("Invalid YAML");
        return y;
      case "xml":
        const x = xmlToJson(inputStr);
        if (!x) throw new Error("Invalid XML");
        return x;
      case "toml":
        const t = tomlToJson(inputStr);
        if (!t) throw new Error("Invalid TOML");
        return t;
      default:
        throw new Error("Conversion not supported for this format");
    }
  };

  const handleConvert = (targetMode: LanguageMode) => {
    setStatus(null);
    setIsLoading(true);

    // Slight delay for UI
    setTimeout(() => {
      try {
        const obj = parseInputToObj(input, mode);
        let result = "";

        switch (targetMode) {
          case "json":
            result = JSON.stringify(obj, null, 2);
            break;
          case "yaml":
            result = yaml.dump(obj);
            break;
          case "toml":
            // smol-toml doesn't handle nulls well sometimes, usually toml is flat, but let's try
            result = tomlStringify(obj);
            break;
          case "xml":
            result = jsonToXml(obj);
            break;
          default:
            throw new Error(`Cannot convert to ${targetMode}`);
        }

        setOutput(result);
        setOutputMode(targetMode); // Switch output view to target language
        setStatus({
          type: "success",
          message: `Converted ${mode.toUpperCase()} to ${targetMode.toUpperCase()}`,
        });
      } catch (error) {
        setStatus({
          type: "error",
          message: `Conversion Failed: ${(error as Error).message}`,
        });
      } finally {
        setIsLoading(false);
      }
    }, 100);
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

        // If action is Beautify/Minify/Validate, we treat it as working on the CURRENT input mode
        // and the result is usually the SAME mode.

        // Reset output mode to input mode for standard actions
        setOutputMode(mode);

        switch (action) {
          case ActionType.BEAUTIFY: {
            let formatted = "";
            if (mode === "json") formatted = formatJson(input);
            else if (mode === "xml") formatted = formatXml(input);
            else if (mode === "yaml") formatted = formatYaml(input);
            else if (mode === "jwt") formatted = decodeJwt(input);
            else if (mode === "toml") formatted = formatToml(input);

            setOutput(formatted);
            setStatus({
              type: "success",
              message: `${mode.toUpperCase()} ${
                mode === "jwt" ? "Decoded" : "Beautified"
              } Successfully`,
            });
            break;
          }
          case ActionType.MINIFY: {
            if (mode === "jwt") throw new Error("Cannot minify a JWT token");

            let minified = "";
            if (mode === "json") minified = minifyJson(input);
            else if (mode === "xml") minified = minifyXml(input);
            else if (mode === "yaml") minified = minifyYaml(input);
            else if (mode === "toml") minified = minifyToml(input);

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
            else if (mode === "jwt") isValid = isValidJwt(input);
            else if (mode === "toml") isValid = isValidToml(input);

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
              else if (mode === "jwt") pretty = decodeJwt(fixed);
              else if (mode === "toml") pretty = formatToml(fixed);
            } catch (e) {
              // Fallback
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
          // Reset output when loading new file
          setOutput("");
          setOutputMode(mode);
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
      jwt: "application/json",
      toml: "application/toml",
    };
    const extMap = {
      json: "json",
      xml: "xml",
      yaml: "yaml",
      jwt: "json",
      toml: "toml",
    };
    // Use outputMode to determine download type
    const blob = new Blob([output], { type: typeMap[outputMode] });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `result.${extMap[outputMode]}`;
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
                : mode === "yaml"
                ? ".yaml,.yml,.txt"
                : mode === "toml"
                ? ".toml,.txt"
                : ".txt"
            }
          />
          <button
            onClick={() => {
              setInput("");
              setOutput("");
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
        <nav className="flex bg-gray-950 p-1 rounded-lg border border-gray-800 overflow-x-auto custom-scrollbar">
          <button
            onClick={() => switchMode("json")}
            className={`flex items-center px-4 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
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
            className={`flex items-center px-4 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
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
            className={`flex items-center px-4 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
              mode === "yaml"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            }`}
          >
            <FileText className="w-4 h-4 mr-2" />
            YAML
          </button>
          <button
            onClick={() => switchMode("toml")}
            className={`flex items-center px-4 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
              mode === "toml"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            }`}
          >
            <FileType className="w-4 h-4 mr-2" />
            TOML
          </button>
          <button
            onClick={() => switchMode("jwt")}
            className={`flex items-center px-4 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
              mode === "jwt"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            }`}
          >
            <ShieldCheck className="w-4 h-4 mr-2" />
            JWT
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
              language={mode === "jwt" ? "text" : mode}
              actions={<EditorTools type="input" />}
              placeholder={
                mode === "jwt"
                  ? "Paste your JWT token here (e.g. eyJhbGciOi...)"
                  : "Paste code here..."
              }
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
              title={mode === "jwt" ? "Decode JWT" : "Format"}
              disabled={isLoading || !input}
              className="w-full lg:w-36"
            >
              {mode === "jwt" ? "Decode" : "Beautify"}
            </Button>

            {mode !== "jwt" && mode !== "toml" && (
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
            )}

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

            <div className="w-full h-px bg-gray-800 my-1 hidden lg:block" />

            {/* Conversion Controls (Not for JWT) */}
            {mode !== "jwt" && (
              <div className="w-full lg:w-36 relative group">
                <button
                  disabled={!input || isLoading}
                  className="w-full flex items-center justify-between px-4 py-2 rounded-md font-medium text-sm bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700 transition-colors disabled:opacity-50"
                >
                  <span className="flex items-center">
                    <ArrowRightLeft className="w-4 h-4 mr-2" />
                    Convert
                  </span>
                  <ChevronDown className="w-3 h-3" />
                </button>

                {/* Dropdown Menu */}
                <div className="absolute left-0 bottom-full lg:bottom-auto lg:top-0 lg:left-full ml-1 mb-1 bg-gray-800 border border-gray-700 rounded-md shadow-xl py-1 w-32 hidden group-hover:block z-20">
                  {mode !== "json" && (
                    <button
                      onClick={() => handleConvert("json")}
                      className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                    >
                      To JSON
                    </button>
                  )}
                  {mode !== "xml" && (
                    <button
                      onClick={() => handleConvert("xml")}
                      className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                    >
                      To XML
                    </button>
                  )}
                  {mode !== "yaml" && (
                    <button
                      onClick={() => handleConvert("yaml")}
                      className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                    >
                      To YAML
                    </button>
                  )}
                  {mode !== "toml" && (
                    <button
                      onClick={() => handleConvert("toml")}
                      className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                    >
                      To TOML
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* <div className="w-full h-px bg-gray-800 my-1 hidden lg:block" />

            <Button
              variant="ai"
              onClick={() => handleAction(ActionType.AI_FIX)}
              icon={<Zap className="w-4 h-4 fill-current" />}
              title={`Fix invalid ${mode} with Gemini`}
              isLoading={isLoading && status?.type === "info"}
              disabled={isLoading || !input}
              className="w-full lg:w-36"
            >
              AI Fix
            </Button> */}
          </div>

          {/* RIGHT: Output */}
          <div className="flex-1 h-[45%] lg:h-full p-4 lg:pl-2 min-w-0 flex flex-col gap-4">
            <div
              className={`flex-1 min-h-0 ${
                mode === "jwt" ? "h-2/3" : "h-full"
              }`}
            >
              <CodeEditor
                title={
                  mode === "jwt"
                    ? "Decoded Header & Payload"
                    : `Output (${outputMode.toUpperCase()})`
                }
                value={output}
                readOnly={true}
                placeholder="Result will appear here..."
                actions={<EditorTools type="output" />}
                // For JWT, we render the result as a JSON tree, so pass 'json'
                // For others, use the outputMode to ensure correct highlighting and tree view
                language={mode === "jwt" ? "json" : outputMode}
              />
            </div>

            {/* JWT Signature Verification Panel */}
            {mode === "jwt" && (
              <div className="h-auto shrink-0 bg-gray-900 border border-gray-700 rounded-lg overflow-hidden flex flex-col shadow-sm">
                <div className="px-4 py-2 bg-gray-800 border-b border-gray-700 text-xs font-bold text-gray-400 uppercase tracking-widest flex justify-between items-center">
                  <span>Signature Verification (HS256)</span>
                  {isSignatureValid !== null && (
                    <span
                      className={`flex items-center gap-1.5 px-2 py-0.5 rounded ${
                        isSignatureValid
                          ? "bg-green-900/30 text-green-400"
                          : "bg-red-900/30 text-red-400"
                      }`}
                    >
                      {isSignatureValid ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          Signature Verified
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5" />
                          Invalid Signature
                        </>
                      )}
                    </span>
                  )}
                </div>
                <div className="p-4 flex flex-col gap-2 bg-gray-900">
                  <label className="text-xs text-gray-500 font-medium uppercase">
                    Verify Signature
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={jwtSecret}
                      onChange={(e) => setJwtSecret(e.target.value)}
                      placeholder="Enter your 256-bit secret..."
                      className="w-full bg-gray-950 border border-gray-700 text-gray-200 text-sm font-mono rounded p-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder-gray-600"
                    />
                    {isSignatureValid === true && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 pointer-events-none">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the secret key to verify the HMAC SHA-256 signature of
                    the token above.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
