export interface Note {
  id?: string;
  posX?: number;
  height?: number;
  moving?: boolean;
  duration?: number;
  position: number;
  octave: number;
  name: string;
  isWhite: boolean;
}

export interface NoteDict{
  [id: string]: Note;
}