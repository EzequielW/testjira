<template>
    <div class="piano-container" :style="containerStyle">
        <div
            class="piano-key"
            :class="{ 'piano-key__active': note.active }"
            v-for="(note, index) in whiteKeys"
            :key="'white_key_' + index"
            :style="getKeyStyle(note, index)"
            @mousedown="
                (e) => {
                    e.preventDefault();
                    playNote(note);
                }
            "
            @mouseover="(e) => e.buttons === 1 && playNote(note)"
            @mouseup="releaseNote(note)"
            @mouseleave="releaseNote(note)"
            draggable="false"
        >
            <span class="text-weight-medium" v-if="showNotes">
                {{ note.name }}
            </span>
        </div>
        <div
            class="piano-key"
            :class="{ 'piano-key__active': note.active }"
            v-for="(note, index) in blackKeys"
            :key="'black_key_' + index"
            :style="getKeyStyle(note, index)"
            @mousedown="
                (e) => {
                    e.preventDefault();
                    playNote(note);
                }
            "
            @mouseover="(e) => e.buttons === 1 && playNote(note)"
            @mouseup="releaseNote(note)"
            @mouseleave="releaseNote(note)"
            draggable="false"
        >
            <span class="text-weight-medium text-primary" v-if="showNotes">
                {{ note.name }}
            </span>
        </div>
    </div>
</template>
  
<script lang="ts">
import { computed } from 'vue';
import { ref } from 'vue';
import * as Tone from 'tone';
import { Note } from './models';

export default {
    props: {
        width: {
            type: Number,
            default: 800,
        },
        showNotes: {
            type: Boolean,
            default: false,
        },
        totalNotes: {
            type: Number,
            default: 88,
        },
        startOctave: {
            type: Number,
            default: 0,
        },
        startNote: {
            type: Number,
            default: 9,
        },
    },
    name: 'PianoUI',
    setup(props) {
        const baseNotes = [
            {
                name: 'C',
                isWhite: true,
            },
            {
                name: 'C#',
                isWhite: false,
            },
            {
                name: 'D',
                isWhite: true,
            },
            {
                name: 'D#',
                isWhite: false,
            },
            {
                name: 'E',
                isWhite: true,
            },
            {
                name: 'F',
                isWhite: true,
            },
            {
                name: 'F#',
                isWhite: false,
            },
            {
                name: 'G',
                isWhite: true,
            },
            {
                name: 'G#',
                isWhite: false,
            },
            {
                name: 'A',
                isWhite: true,
            },
            {
                name: 'A#',
                isWhite: false,
            },
            {
                name: 'B',
                isWhite: true,
            },
        ];

        const synth = new Tone.Sampler({
            urls: {
                A0: 'A0.mp3',
                C1: 'C1.mp3',
                'D#1': 'Ds1.mp3',
                'F#1': 'Fs1.mp3',
                A1: 'A1.mp3',
                C2: 'C2.mp3',
                'D#2': 'Ds2.mp3',
                'F#2': 'Fs2.mp3',
                A2: 'A2.mp3',
                C3: 'C3.mp3',
                'D#3': 'Ds3.mp3',
                'F#3': 'Fs3.mp3',
                A3: 'A3.mp3',
                C4: 'C4.mp3',
                'D#4': 'Ds4.mp3',
                'F#4': 'Fs4.mp3',
                A4: 'A4.mp3',
                C5: 'C5.mp3',
                'D#5': 'Ds5.mp3',
                'F#5': 'Fs5.mp3',
                A5: 'A5.mp3',
                C6: 'C6.mp3',
                'D#6': 'Ds6.mp3',
                'F#6': 'Fs6.mp3',
                A6: 'A6.mp3',
                C7: 'C7.mp3',
                'D#7': 'Ds7.mp3',
                'F#7': 'Fs7.mp3',
                A7: 'A7.mp3',
                C8: 'C8.mp3',
            },
            release: 10,
            baseUrl: 'https://tonejs.github.io/audio/salamander/',
        }).toDestination();

        const activeNotes = ref<Note[]>([]);

        const keyList = computed(() => {
            const keys: Note[] = [];

            let currentOctave = props.startOctave;
            let currentIndex = props.startNote;

            for (let i = 0; i < props.totalNotes; i++) {
                const noteName = baseNotes[currentIndex].name + currentOctave;
                const isActive =
                    activeNotes.value.find((note) => note.name === noteName) !==
                    undefined;

                const newNote = {
                    position: currentIndex,
                    octave: currentOctave,
                    name: noteName,
                    isWhite: baseNotes[currentIndex].isWhite,
                    active: isActive,
                };
                keys.push(newNote);

                if (currentIndex === baseNotes.length - 1) {
                    currentIndex = 0;
                    currentOctave++;
                } else {
                    currentIndex++;
                }
            }

            return keys;
        });

        const whiteKeys = computed(() => {
            return keyList.value.filter((key) => key.isWhite);
        });

        const blackKeys = computed(() => {
            return keyList.value.filter((key) => !key.isWhite);
        });

        const whiteKeyWidth = computed(() => {
            return props.width / whiteKeys.value.length;
        });

        const blackKeyWidth = computed(() => {
            return whiteKeyWidth.value / 1.5;
        });

        const containerStyle = computed(() => {
            const style = {
                width: `${props.width}px`,
            };

            return style;
        });

        const getKeyStyle = (note: Note, index: number) => {
            const whitePosition = index * whiteKeyWidth.value;
            const blackPosition =
                index * whiteKeyWidth.value +
                blackKeyWidth.value +
                whiteKeyWidth.value * (note.octave - props.startOctave) +
                (note.position >= 5
                    ? whiteKeyWidth.value * (note.octave - props.startOctave)
                    : whiteKeyWidth.value *
                      (note.octave - props.startOctave - 1)) +
                (props.startNote > 5 ? 0 : whiteKeyWidth.value);

            const keyStyle = {
                'background-color': note.isWhite ? '#fff' : '#000',
                width: note.isWhite
                    ? `${whiteKeyWidth.value}px`
                    : `${blackKeyWidth.value}px`,
                height: note.isWhite ? '100%' : '70%',
                left: note.isWhite
                    ? `${whitePosition}px`
                    : `${blackPosition}px`,
            };

            return keyStyle;
        };

        const playNote = (note: Note) => {
            activeNotes.value.push(note);
            const now = synth.now();
            synth.triggerAttack(note.name, now);
        };

        const releaseNote = (note: Note) => {
            const removeIndex = activeNotes.value.indexOf(note);
            activeNotes.value.splice(removeIndex, 1);
            const now = synth.now();
            synth.triggerRelease([note.name], now);
        };

        return {
            whiteKeys,
            blackKeys,
            containerStyle,
            getKeyStyle,
            playNote,
            releaseNote,
        };
    },
};
</script>
  
<style scoped lang='scss'>
.piano-container {
    height: 200px;
    position: relative;
}

.piano-key {
    cursor: pointer;
    position: absolute;
    background-color: #fff;
    border: 1px solid #777;
    display: flex;
    justify-content: center;
    align-items: flex-end;
}

.piano-key__active {
    background-color: $accent !important;
}
</style>