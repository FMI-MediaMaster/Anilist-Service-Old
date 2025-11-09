import runMetadataTests, { Fields } from '@media-master/metadata-service-tests';
import { Express } from 'express';
import { describe } from 'vitest';
import app from '../src/app';

const server = app as Express;

describe('Controller', () => {
    describe('Endpoint /api/anime', () => {
        const endpoint: string = '/api/anime';
        const validMap: object = {
            'Inazuma Eleven': '5231',
            'Bakugan Battle Brawlers': '2156',
            'My Hero Academia': '21459',
        };
        const invalidMap: object = {
            'dsadfajd': '-1',
            '' : 'Inazuma Eleven',
            'nonExistentAnime': 'nonExistentId',
        };
        const fieldsMap: Record<string, Fields> = {
            options: {
                id: { type: 'number' },
                name: { type: 'string' },
            },
            info: {
                name: { type: 'string' },
                description: { type: 'string' },
                release_date: { type: 'string' },
                genres: { type: 'stringArray' },
                cover: { type: 'string' },
                community_score: { type: 'number' },
                critics_score: { type: 'number' },
                status: { type: 'string' },
                links: { type: 'objectArray' },
                nr_episodes: { type: 'number' },
                episode_duration: { type: 'number' },
            },
            recommendations: {
                id: { type: 'number' },
                name: { type: 'string' },
            },
        };

        runMetadataTests(
            server,
            endpoint,
            { validMap, invalidMap, fieldsMap, type: 'anime' }
        );
    });

    describe('Endpoint /api/manga', () => {
        const endpoint: string = '/api/manga';
        const validMap: object = {
            'Blue Box': '132182',
            'Frieren: Beyond Journey’s End': '118586',
            'Mayonaka Heart Tune': '169272',
        };
        const invalidMap: object = {
            'dsadfajd': '-1',
            '' : 'Blue Box',
            'nonExistentManga1': 'nonExistentId',
        };
        const fieldsMap: Record<string, Fields> = {
            options: {
                id: { type: 'number' },
                name: { type: 'string' },
            },
            info: {
                name: { type: 'string' },
                description: { type: 'string' },
                release_date: { type: 'string' },
                genres: { type: 'stringArray' },
                cover: { type: 'string' },
                community_score: { type: 'number' },
                critics_score: { type: 'number' },
                status: { type: 'string' },
                links: { type: 'objectArray' },
                nr_chapters: { type: 'number' },
                nr_volumes: { type: 'number' },
            },
            recommendations: {
                id: { type: 'number' },
                name: { type: 'string' },
            },
        };

        runMetadataTests(
            server,
            endpoint,
            { validMap, invalidMap, fieldsMap, type: 'manga' }
        );
    });
});
