export interface MediaOption {
    id: number;
    name: string;
};

export interface Query {
    name?: string;
    id?: string;
};

interface Title {
    romaji: string;
    english: string;
};

interface StartDate {
    year: number;
};

export interface OptionsSearchResult{
    id: number;
    title?: Title;
    startDate?: StartDate;
};

interface Page {
    media?: OptionsSearchResult[];
};

export interface ResponseBody {
    data?: object;
};

export interface OptionsSearchResponse {
    Page?: Page;
};

interface Type {
    type: 'ANIME' | 'MANGA';
};

export interface MediaRecommendation {
    id: number;
    title?: Title;
    type?: Type;
}

interface Node {
    mediaRecommendation: MediaRecommendation;
};

export interface Edge {
    node: Node;
}

interface Edges {
    edges: Edge[];
};

interface Media {
    recommendations?: Edges;
};

export interface RecommendationsSearchResponse {
    Media?: Media;
};