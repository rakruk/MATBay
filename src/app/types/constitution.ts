import { Song } from './song';

export const MIN_USER_LIMIT = 4;
export const MAX_USER_LIMIT = 10;
export const MAX_SONG_LIMIT = 100;

export enum ConstitutionType {
    SOC, FMTTM
}

export interface Constitution {
    season: number;
    round: number;
    name: string;
    isPublic: boolean;
    // type: ConstitutionType;

    // Users
    owner: string;
    users: string[];
    winnerUserIndex: number;
    // numberMaxOfUser: number;
    // isAnonymous: bool;

    // Songs
    songs: Song[];
    winnerSongIndex: number;
    youtubePlaylistID: string;
    numberOfSongsPerUser: number;
}
