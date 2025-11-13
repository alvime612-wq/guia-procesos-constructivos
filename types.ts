
export interface Norm {
  name: string;
  description: string;
}

export interface SearchResult {
  title: string;
  description: string;
  steps: string[];
  norms: Norm[];
  image_base64: string | null;
  sources: Source[];
}

export interface Source {
  uri: string;
  title: string;
}