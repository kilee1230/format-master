import React, { useState } from "react";
import { ChevronRight, ChevronDown, Copy, Check } from "lucide-react";

interface JsonTreeProps {
  data: any;
  level?: number;
  name?: string;
  isLast?: boolean;
}

const getDataType = (value: any): string => {
  if (Array.isArray(value)) return "array";
  if (value === null) return "null";
  return typeof value;
};

const JsonTreeNode: React.FC<JsonTreeProps> = ({
  data,
  level = 0,
  name,
  isLast = true,
}) => {
  const [expanded, setExpanded] = useState(true);
  const [copied, setCopied] = useState(false);
  const type = getDataType(data);
  const isObject = type === "object";
  const isArray = type === "array";
  const isExpandable = isObject || isArray;

  // Handling empty objects/arrays
  const isEmpty = isExpandable && Object.keys(data).length === 0;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const renderValue = (val: any) => {
    const valType = getDataType(val);
    switch (valType) {
      case "string":
        return <span className="text-green-400">"{val}"</span>;
      case "number":
        return <span className="text-orange-400">{val}</span>;
      case "boolean":
        return (
          <span className="text-red-400 font-bold">
            {val ? "true" : "false"}
          </span>
        );
      case "null":
        return <span className="text-gray-500 font-bold">null</span>;
      default:
        return <span className="text-gray-300">{String(val)}</span>;
    }
  };

  const renderHeader = () => {
    return (
      <div
        className={`flex items-start group font-mono text-sm leading-6 ${
          isExpandable && !isEmpty
            ? "cursor-pointer hover:bg-gray-800/50 -ml-5 pl-5 rounded"
            : ""
        }`}
        onClick={(e) => {
          if (isExpandable && !isEmpty) {
            e.stopPropagation();
            setExpanded(!expanded);
          }
        }}
      >
        {/* Caret */}
        <div className="w-5 h-6 flex items-center justify-center -ml-5 shrink-0 text-gray-500">
          {isExpandable &&
            !isEmpty &&
            (expanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            ))}
        </div>

        {/* Key */}
        {name && (
          <span className="mr-2 text-purple-400">
            "{name}"<span className="text-gray-400">:</span>
          </span>
        )}

        {/* Value Preview (for primitives or collapsed/empty objects) */}
        {!isExpandable ? (
          <>
            {renderValue(data)}
            {!isLast && <span className="text-gray-500">,</span>}
          </>
        ) : (
          <span className="text-gray-400 flex items-center gap-2">
            <span>{isArray ? "[" : "{"}</span>

            {isEmpty && (
              <span>
                {isArray ? "]" : "}"}
                {!isLast && <span className="text-gray-500">,</span>}
              </span>
            )}

            {!isEmpty && !expanded && (
              <span className="text-gray-500 text-xs italic tracking-wider flex items-center">
                ... {Object.keys(data).length} {isArray ? "items" : "keys"} ...
                <span className="text-gray-400 text-sm ml-2 font-mono not-italic">
                  {isArray ? "]" : "}"}
                  {!isLast && <span className="text-gray-500">,</span>}
                </span>
              </span>
            )}

            {/* Copy Button for Objects/Arrays */}
            {!isEmpty && (
              <button
                onClick={handleCopy}
                className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 p-0.5 rounded hover:bg-gray-700 text-gray-500 hover:text-gray-300"
                title="Copy subtree"
              >
                {copied ? (
                  <Check className="w-3 h-3 text-green-500" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            )}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="select-text">
      {renderHeader()}

      {isExpandable && !isEmpty && expanded && (
        <div>
          <div className="pl-4 border-l border-gray-800 ml-0.5">
            {Object.keys(data).map((key, index, arr) => (
              <JsonTreeNode
                key={key}
                name={isArray ? undefined : key}
                data={data[key]}
                level={level + 1}
                isLast={index === arr.length - 1}
              />
            ))}
          </div>
          <div className="pl-0.5 font-mono text-sm text-gray-400 leading-6">
            {isArray ? "]" : "}"}
            {!isLast && <span className="text-gray-500">,</span>}
          </div>
        </div>
      )}
    </div>
  );
};

const JsonTree: React.FC<{ data: any }> = ({ data }) => {
  return (
    <div className="p-4 overflow-auto h-full w-full">
      <JsonTreeNode data={data} />
    </div>
  );
};

export default JsonTree;
