export interface Todo {
  id: number;
  content: string;
}

export interface Meta {
  totalCount: number;
}

export interface Note {
  position: number,
  octave: number,
  name: string,
  isWhite: boolean,
  active: boolean
}