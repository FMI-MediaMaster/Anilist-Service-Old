import fetch from 'node-fetch';
import config from '@media-master/load-dotenv';
import errors from '@media-master/http-errors';
import {
    Edge,
    Query,
    MediaOption,
    OptionsSearchResult,
    ResponseBody,
    MediaRecommendation,
    OptionsSearchResponse,
    RecommendationsSearchResponse,
} from '@types';

export default class AnilistService {
    private readonly headers: Record<string, string>;
    private readonly mediaType: 'ANIME' | 'MANGA';

    private readonly replaceItems = {
        '<br><br>': ' ',
        '<br>'    : ' ',
    };
    private readonly removeItems = [
        '<i>',
        '</i>',
        '\n',
        '\r',
    ];

    constructor(mediaType: string) {
        if (!['anime', 'manga'].includes(mediaType)) {
            throw errors.notFound(
                'Invalid endpoint! Use /api/[anime|manga]/[options|info|recommendations]'
            );
        }

        this.mediaType = mediaType === 'anime' ? 'ANIME' : 'MANGA';
        this.headers = {
            'Content-Type': 'application/json',
        };
    };

    private request = async <T>(query: string): Promise<T | undefined> => {
        const url = new URL('https://graphql.anilist.co/');
        const response = await fetch(url, {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify({ 'query': query }),
        });
        if (!response.ok) return undefined;

        return ((await response.json() as ResponseBody)['data']) as T;
    };

    private removeBadItems(input: string) {
        for (const item of this.removeItems) {
            input = input.replaceAll(item, '');
        }

        for (const [key, value] of Object.entries(this.replaceItems)) {
            input = input.replaceAll(key, value);
        }

        return input;
    }

    private mapSearchResultOptions = (media: OptionsSearchResult): MediaOption => {
        // Prefer the English title, fallback to the Japanese one
        const title = this.removeBadItems(media.title?.english ?? media.title?.romaji ?? '');
        const year = media.startDate?.year;

        return {
            id: media.id,
            name: `${title} (${year})`.trim(),
        };
    };

    private mapSearchResultRecommendations = (edge: Edge): MediaOption => {
        const media: MediaRecommendation = edge.node?.mediaRecommendation;
        // Prefer the English title, fallback to the Japanese one
        const title = this.removeBadItems(media.title?.english ?? media.title?.romaji ?? '');

        return {
            id: media.id,
            name: `${title}`.trim(),
        };
    };

    private getOptions = async (name: string): Promise<MediaOption[]> => {
        const query = `
            query {
                Page {
                    media(search: "${name}", type: ${this.mediaType}) {
                        id
                        title {
                            romaji
                            english
                        }
                        startDate {
                            year
                        }
                    }
                }
            }
        `;
        const data = await this.request<OptionsSearchResponse>(query);

        return data?.Page?.media?.map(this.mapSearchResultOptions) ?? [];
    };

    private getInfo = async (id: string): Promise<[]> => {
        return [];
    }

    private getRecommendations = async (id: string): Promise<MediaOption[]> => {
        const query = `
            query {
                Media(id: ${id}) {
                    recommendations {
                        edges {
                            node {
                                mediaRecommendation {
                                    id
                                    title {
                                        romaji
                                        english
                                    }
                                    type
                                }
                            }
                        }
                    }
                }
            }
        `;

        const data = await this.request<RecommendationsSearchResponse>(query);
        return data?.Media?.recommendations?.edges.map(this.mapSearchResultRecommendations) ?? [];
    }

    public handle = async (method: string, query: Query): Promise<unknown> => {
        const methodMap: Record<string, (param: string) => Promise<unknown>> = {
            options: this.getOptions,
            info: this.getInfo,
            recommendations: this.getRecommendations,
        };

        if (!(method in methodMap)) {
            throw errors.notFound(
                'Invalid endpoint! Use /api/[anime|manga]/[options|info|recommendations]'
            );
        }

        const param = query[method === 'options' ? 'name' : 'id'];
        if (param === undefined) throw errors.badRequest(`Missing parameter for the ${method} endpoint`);

        return await methodMap[method](param);
    };
}