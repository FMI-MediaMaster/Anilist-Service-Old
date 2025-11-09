import fetch from 'node-fetch';
import errors from '@media-master/http-errors';
import {
    Query,
    AnimeInfo,
    MangaInfo,
    MediaInfo,
    AnimeResult,
    MangaResult,
    MediaResult,
    MediaOption,
    ResponseBody,
    SearchResult,
    MediaRecommendation,
    InfoSearchResponse,
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

    private mapSearchResult = (media: SearchResult | MediaRecommendation): MediaOption => {
        // Prefer the English title, fallback to the Japanese one
        const title = this.removeBadItems(media.title?.english ?? media.title?.romaji ?? '');
        const name = 'startDate' in media && media.startDate?.year
            ? `${title} (${media.startDate.year})`.trim()
            : title.trim();

        return {
            id: media.id,
            name,
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

        return data?.Page?.media?.map(this.mapSearchResult) ?? [];
    };

    private getMediaById = async (id: string, customFields: string[]) => {
        const query = `
            query {
                Media(id: ${id}) {
                    id
                    title {
                        romaji
                        english
                    }
                    description
                    startDate {
                        year
                        month
                        day
                    }
                    genres
                    coverImage {
                        large
                    }
                    meanScore
                    averageScore
                    status
                    externalLinks {
                        site
                        url
                    }
                    ${customFields.join('\n')}
                }
            }
        `;
        const data = await this.request<InfoSearchResponse>(query);
        return data?.Media;
    };

    private sharedInfo = (media: MediaResult): MediaInfo => {
        const formatTwoDigits = (value: number): string => value.toString().padStart(2, '0');

        return {
            name           : this.removeBadItems(media.title?.english ?? media.title?.romaji ?? ''),
            description    : this.removeBadItems(media.description ?? ''),
            release_date   : `${media.startDate?.year ?? new Date().getFullYear()}-` +
                             `${formatTwoDigits(media.startDate?.month ?? 12)}-` + 
                             `${formatTwoDigits(media.startDate?.day ?? 31)}`,
            genres         : media.genres,
            cover          : media.coverImage?.large ?? '',
            community_score: media.meanScore,
            critics_score  : media.averageScore,
            status         : media.status,
            links          : media.externalLinks?.map((link) => ({
                name: link.site,
                href: link.url,
            })),
        };
    };

    private getAnimeInfo = async (id: string): Promise<AnimeInfo> => {
        const customFields = [
            'episodes',
            'duration',
        ];
        const anime = await this.getMediaById(id, customFields) as AnimeResult;

        if (!anime?.id) throw errors.notFound('Anime not found');

        return {
            ...this.sharedInfo(anime),
            nr_episodes     : anime.episodes ?? -1, // TODO: Find a better way to handle this
            episode_duration: anime.duration ?? -1,
        };
    };

    private getMangaInfo = async (id: string): Promise<MangaInfo> => {
        const customFields = [
            'chapters',
            'volumes',
        ];
        const manga = await this.getMediaById(id, customFields) as MangaResult;

        if (!manga?.id) throw errors.notFound('Manga not found');

        return {
            ...this.sharedInfo(manga),
            nr_chapters: manga.chapters ?? -1,
            nr_volumes : manga.volumes ?? -1,
        };
    };

    private getInfo = async (id: string): Promise<MediaInfo> => {
        return this.mediaType === 'ANIME' ? this.getAnimeInfo(id) : this.getMangaInfo(id);
    };

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
        return data?.Media?.recommendations?.edges.map((edge) => this.mapSearchResult(edge.node?.mediaRecommendation)) ?? [];
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
};