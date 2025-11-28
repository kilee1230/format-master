import React from 'react';

export enum ActionType {
  BEAUTIFY = 'BEAUTIFY',
  MINIFY = 'MINIFY',
  VALIDATE = 'VALIDATE',
  AI_FIX = 'AI_FIX'
}

export type LanguageMode = 'json' | 'xml' | 'yaml';

export interface EditorProps {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  placeholder?: string;
  title: string;
  actions?: React.ReactNode;
}