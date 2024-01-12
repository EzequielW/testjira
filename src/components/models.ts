export interface Note {
  id?: string;
  posX?: number;
  startPosY?: number;
  endPosY?: number;
  height?: number;
  moving?: boolean;
  duration?: number;
  timeStart?: number;
  midi: number;
  position: number;
  octave: number;
  name: string;
  isWhite: boolean;
  released?: boolean;
}

export interface NoteDict{
  [id: string]: Note;
}