export interface BulbState {
    colorTemp?: number;
    rgb?: [number, number, number];
    scene?: string;
    isOn: boolean;
    brightness?: number;
    warmWhite?: number;
    coldWhite?: number;
}

export interface BulbFeatures {
    brightness: boolean;
    color: boolean;
    color_tmp: boolean;
    effect: boolean;
}

export interface KelvinRange {
    max: number;
    min: number;
}

export interface BulbInfo {
    ip: string;
    state: BulbState;
    features: BulbFeatures;
    kelvin_range: KelvinRange;
    name: string;
    error?: string;
}

export interface LightResponse {
    message: string;
    overall_success?: boolean;
    success?: boolean;
    results?: Record<string, { success: boolean; message: string }>;
    count?: number;
    bulbs?: BulbInfo[];
}