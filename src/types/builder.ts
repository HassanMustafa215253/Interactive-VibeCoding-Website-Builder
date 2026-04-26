export type BuilderVersion = {
  id: string;
  timestamp: number;
  summary: string;
  html: string;
};

export type SelectedElement = {
  id: string;
  tagName: string;
  snippet: string;
  textPreview: string;
  componentPath?: string;
};

export type GenerateRequest = {
  prompt: string;
};

export type GenerateResponse = {
  html: string;
  summary: string;
};

export type EditRequest = {
  instruction: string;
  selected: SelectedElement;
  parentSnippet?: string;
  fullHtml: string;
};

export type EditResponse = {
  updatedSnippet: string;
  explanation: string;
};

export type ExplainResponse = {
  explanation: string;
};
