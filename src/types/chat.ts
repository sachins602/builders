export interface ResponseWithImage {
  id: number;
  prompt: string;
  url: string;
  createdAt: Date;
  previousResponseId: number | null;
  sourceImageId: number | null;
  sourceImage?: Image | null;
}

export interface Image {
  id: number;
  name: string | null;
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
