export type SceneId =
  | 'INTRO'
  | 'PARK_MAIN'
  | 'CAROUSEL_APPROACH'
  | 'CAROUSEL_RIDING'
  | 'CAROUSEL_SHUTDOWN'
  | 'COASTER_APPROACH'
  | 'COASTER_CLIMB'
  | 'COASTER_PEAK'
  | 'COASTER_LOOK_UP'
  | 'COASTER_LOOK_DOWN'
  | 'COASTER_DROP'
  | 'COASTER_SHUTDOWN'
  | 'FERRIS_APPROACH'
  | 'FERRIS_ASCENDING'
  | 'FERRIS_PEAK'
  | 'FERRIS_DESCENDING'
  | 'FERRIS_SHUTDOWN'
  | 'FINAL_DARKNESS'
  | 'FINAL_PEACE';

export type RideId = 'carousel' | 'coaster' | 'ferris';

export interface RideState {
  ridden: boolean;
  shutdown: boolean;
}

export interface ParkState {
  carousel: RideState;
  coaster: RideState;
  ferris: RideState;
  currentScene: SceneId;
  previousScene: SceneId | null;
  audioStarted: boolean;
}
