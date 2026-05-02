import type { MapConfig } from '../objects/MapLoader';
import { map1Config } from './map1.ts';
// import { map2Config } from './map2'; // Будущие карты

export const maps: { [key: string]: MapConfig } = {
    'map1': map1Config,
    // 'map2': map2Config,
};

export function getMapConfig(mapName: string): MapConfig | null {
    return maps[mapName] || null;
}

export function getMapNames(): string[] {
    return Object.keys(maps);
}