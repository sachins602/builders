export interface ResponseWithImage {
  id: number;
  proompt: string;
  url: string;
  createdAt: Date;
  previousResponseId: number | null;
  sourceImageId: number | null;
}

export interface Image {
  id: number;
  name: string;
  url: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  createdAt: Date;
}

export interface ChatState {
  prompt: string;
  selectedResponseId: number | null;
  isGenerating: boolean;
  responseChain: ResponseWithImage[];
}

export interface ChatData {
  lastImage: Image | null;
  responseHistory: ResponseWithImage[];
}
