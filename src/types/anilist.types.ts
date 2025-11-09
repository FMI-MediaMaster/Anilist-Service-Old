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
    month?: number;
    day?: number;
};

export interface SearchResult{
    id: number;
    title?: Title;
    description?: string;
    startDate?: StartDate;
    genres?: string[];
    coverImage?: CoverImage;
    meanScore?: number;
    averageScore?: number;
    status?: string;
    externalLinks?: ExternalLink[];
};

interface Page {
    media?: SearchResult[];
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

export interface AnimeResult extends SearchResult {
    episodes?: number;
    duration?: number;
};

export interface MangaResult extends SearchResult {
    chapters?: number;
    volumes?: number;
};

export interface InfoSearchResponse {
    Media: MediaResult;
};

interface CoverImage {
    large?: string;
}

interface ExternalLink {
    site?: string;
    url?: string;
}

interface Link {
    name?: string;
    href?: string;
}

interface BaseMediaInfo {
    name?: string;
    description?: string;
    release_date?: string;
    genres?: string[];
    cover?: string;
    community_score?: number;
    critics_score?: number;
    status?: string;
    links?: Link[];
};

export interface AnimeInfo extends BaseMediaInfo {
    nr_episodes?: number;
    episode_duration?: number;
};

export interface MangaInfo extends BaseMediaInfo {
    nr_chapters?: number;
    nr_volumes?: number;
};

export type MediaResult = AnimeResult | MangaResult;
export type MediaInfo = AnimeInfo | MangaInfo;