<template>
    <div
        class="piano-background bg-dark col items-end"
        :style="backgroundStyle"
    >
        <div class="play-button row justify-center q-gutter-sm">
            <q-btn color="primary" :disable="!synthLoaded" icon="play_arrow" @click="resumePlaying" />
            <q-btn color="primary" :disable="!synthLoaded" icon="pause" @click="pausePlaying" />
            <q-btn color="primary" :disable="!synthLoaded" icon="stop" @click="stopPlaying" />
        </div>

        <div 
            :ref="unwrapDivs.drawnDivs" 
            class="piano-key drawn-note"
            :class="{ 'drawn-note__black': !note.isWhite }" 
            v-for="(note, index) in drawnNotes" 
            :key="'draw_note_' + index" 
            :style="drawnNoteStyle(note)"
            :id="note.id">
        </div>

        <div v-for="(note, index) in whiteKeys" :key="'octave_separator_' + index">
            <q-separator
                v-if="note.name.charAt(0) === 'C'"
                vertical
                color="grey"
                :style="{ position: 'absolute', left: `${note.posX}px`, top: '0px', height: '100%' }"
            />
        </div>

        <div class="piano-container" :style="containerStyle">
            <div
                class="piano-key"
                :class="{ 'piano-key__active': isNoteActive(note) }"
                v-for="(note, index) in whiteKeys"
                :key="'white_key_' + index"
                :style="getKeyStyle(note)"
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
                :class="{ 'piano-key__active': isNoteActive(note) }"
                v-for="(note, index) in blackKeys"
                :key="'black_key_' + index"
                :style="getKeyStyle(note)"
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
                <span class="text-weight-medium text-primary text-caption" v-if="showNotes">
                    {{ note.name }}
                </span>
            </div>
            <q-inner-loading
                :showing="!synthLoaded"
                color="accent"
                label="Loading keyboard..."
                label-class="text-white"
                label-style="font-size: 1.1em"
                dark
            />
        </div>
    </div>
</template>
  
<script lang="ts">
import { computed, watch } from 'vue';
import { ref } from 'vue';
import * as Tone from 'tone';
import { Note, NoteDict } from './models';
import { Midi } from '@tonejs/midi';
import anime from 'animejs';

export default {
    props: {
        width: {
            type: Number,
            default: 800,
        },
        height: {
            type: Number,
            default: 800,
        },
        pianoHeight: {
            type: Number,
            default: 200,
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

        const synthLoaded = ref(false);

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
            onload: () => {
                synthLoaded.value = true;
            },
        }).toDestination();

        const activeNotes = ref<Note[]>([]);

        const drawnNotes = ref<NoteDict>({});
        const drawnDivs = ref<any[]>([]);
        const unwrapDivs = { drawnDivs };
        const drawDelay = 4;

        const animationList = ref<anime.AnimeInstance[]>([]);
        const paused = ref(false);
        const stopped = ref(true);

        const whiteKeyWidth = computed(() => {
            const whiteStartKeys = baseNotes.slice(props.startNote, baseNotes.length);
            const extraWhiteStartKeys = whiteStartKeys.filter(bnote => bnote.isWhite).length;

            const whiteEndKeys = baseNotes.slice(0, (props.totalNotes - whiteStartKeys.length) % 12).filter(bnote => bnote.isWhite);
            const extraWhiteEndKeys = whiteEndKeys.length;

            const whiteKeyCount = Math.floor((props.totalNotes - extraWhiteEndKeys - extraWhiteStartKeys) / 12) * 7 + extraWhiteEndKeys + extraWhiteStartKeys;
            return props.width / whiteKeyCount;
        });

        const blackKeyWidth = computed(() => {
            return whiteKeyWidth.value / 1.5;
        })

        const keyList = computed(() => {
            const keys: Note[] = [];

            let currentOctave = props.startOctave;
            let currentIndex = props.startNote;

            for (let i = 0; i < props.totalNotes; i++) {
                const noteName = baseNotes[currentIndex].name + currentOctave;

                const newNote = {
                    position: currentIndex,
                    octave: currentOctave,
                    name: noteName,
                    isWhite: baseNotes[currentIndex].isWhite,
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
            const whiteNotes = keyList.value.filter((key) => key.isWhite);
            
            return whiteNotes.map((note, index) => {
                const whitePosition = index * whiteKeyWidth.value;

                return {
                    ...note,
                    posX: whitePosition
                }
            });
        });

        const blackKeys = computed(() => {
            const blackNotes = keyList.value.filter((key) => !key.isWhite);

            return blackNotes.map((note, index) => {
                const blackPosition =
                    blackKeyWidth.value +
                    whiteKeyWidth.value * 
                    (index + 2 * note.octave - 2 * props.startOctave 
                        + (note.position >= 5 ? 0 : -1)
                        + (props.startNote >= 5 ? 0 : 1));

                return {
                    ...note,
                    posX: blackPosition
                }
            });
        });

        const containerStyle = computed(() => {
            const style = {
                width: `${props.width}px`,
                height: `${props.pianoHeight}px`,
            };

            return style;
        });

        const backgroundStyle = computed(() => {
            const style = {
                height: `${props.height}px`,
                display: 'flex',
            };

            return style;
        });

        const getKeyStyle = (note: Note) => {
            const keyStyle = {
                'background-color': note.isWhite ? '#fff' : '#000',
                width: note.isWhite
                    ? `${whiteKeyWidth.value}px`
                    : `${blackKeyWidth.value}px`,
                height: note.isWhite ? '100%' : '70%',
                left: `${note.posX}px`,
            };

            return keyStyle;
        };

        const drawnNoteStyle = (note: Note) => {
            const style = {
                left: `${note.posX}px`,
                width: note.isWhite
                    ? `${whiteKeyWidth.value}px`
                    : `${blackKeyWidth.value}px`,
                height: `${note.height}px`,
                ...( note.startPosY && { top: `${note.startPosY}px` } )
            }

            return style;
        }

        const playNote = (note: Note) => {
            const now = synth.now();
            synth.triggerAttack(note.name, now);

            let newNote = note.name.includes('#')
                ? blackKeys.value.find(n => n.name === note.name) 
                : whiteKeys.value.find(n => n.name === note.name);

            const noteId = `time:${now}name:${note.name}`;

            let drawnNote: Note | undefined = undefined;
            if (newNote && stopped.value) {
                const heightPerSecond = (props.height - props.pianoHeight) / drawDelay;
                const height = heightPerSecond * 0.05;

                drawnNote = {
                    ...newNote,
                    id: noteId,
                    height: height,
                    startPosY: props.height - props.pianoHeight,
                    endPosY: -props.height + props.pianoHeight - height,
                    moving: false,
                    duration: 0.05,
                    timeStart: now,
                    released: false
                }

                drawnNotes.value[noteId] = drawnNote;
            }

            activeNotes.value.push(drawnNote ? drawnNote : note);
        };

        const releaseNote = (note: Note) => {
            const removeIndex = activeNotes.value.findIndex((n) => n.name === note.name);
            if(removeIndex >= 0 && stopped.value) {
                const id = activeNotes.value[removeIndex].id;
                if(id && drawnNotes.value[id]) {
                    drawnNotes.value[id].released = true;
                }
            }

            activeNotes.value.splice(removeIndex, 1);
            const now = synth.now();
            synth.triggerRelease([note.name], now);
        };

        const loadTestMidi = async () => {
            const midi = await Midi.fromUrl('./audio/Samples/nocturne_9_3.mid');
            synth.sync();
            await Tone.start();
            Tone.Transport.start();

            const now = synth.now() + drawDelay;
            midi.tracks.forEach((track) => {
                track.notes.forEach((note) => {
                    let newNote = note.name.includes('#')
                        ? blackKeys.value.find(n => n.name === note.name) 
                        : whiteKeys.value.find(n => n.name === note.name);

                    const noteId = `time:${note.time}name:${note.name}`;

                    let drawnNote: Note | undefined = undefined;

                    if (newNote) {
                        const heightPerSecond = (props.height - props.pianoHeight) / drawDelay;
                        const height = heightPerSecond * note.duration;

                        drawnNote = {
                            ...newNote,
                            id: noteId,
                            height: height,
                            startPosY: -height,
                            endPosY: props.height - props.pianoHeight + height,
                            moving: false,
                            duration: note.duration
                        }
                    }

                    Tone.Transport.schedule(function(time){
                        synth.triggerAttackRelease(
                            note.name,
                            note.duration,
                            note.time + now,
                            note.velocity
                        );

                        Tone.Draw.schedule(() => {
                            if(drawnNote) {
                                drawnNotes.value[noteId] = drawnNote;
                            }
                        }, time);
                    }, now + note.time - drawDelay);

                    Tone.Transport.schedule(function(time){
                        Tone.Draw.schedule(() => {
                            if(drawnNote && !stopped.value) {
                                activeNotes.value.push(drawnNote);
                            }
                        }, time);
                    }, now + note.time);

                    Tone.Transport.schedule(function(time){
                        Tone.Draw.schedule(() => {
                            if(drawnNote) {
                                const removeIndex = activeNotes.value.indexOf(drawnNote);
                                activeNotes.value.splice(removeIndex, 1);
                            }
                        }, time);
                    }, now + note.time + note.duration);
                });
            });
        };

        const isNoteActive = (note: Note) => {
            return activeNotes.value.find((n) => n.name === note.name);
        }

        const animateNotes = () => {
            drawnDivs.value.forEach(el => {
                const note = drawnNotes.value[el.id];
                const noteMovesUp = (note.startPosY && note.endPosY && note.startPosY > note.endPosY);
                if(note && !note.moving && (!stopped.value || noteMovesUp)) {
                    const addAnimation = (newEndPosition: number) => {
                        const newAnimation = anime({
                            targets: el,
                            translateY: newEndPosition,
                            duration: (drawDelay + (note.duration ? note.duration : 1)) * 1000,
                            easing: 'linear',
                            complete: function() {
                                if(note.id) {
                                    const newPosition = (note.endPosY ? note.endPosY : 0) - props.height + props.pianoHeight - (note.height ? note.height : 0);

                                    if(note.released === false || (noteMovesUp && newPosition < newEndPosition * 2)) {
                                        addAnimation(newPosition);
                                    }
                                    else {
                                        el.style={ display: 'none'}
                                        delete drawnNotes.value[note.id];
                                    }     
                                }

                            
                            },
                            update: function() {
                                if(note.released === false) {
                                    const timeStart = (note.timeStart ? note.timeStart : 0);
                                    const heightPerSecond = (props.height - props.pianoHeight) / drawDelay;

                                    note.duration = synth.now() - timeStart;
                                    note.height = heightPerSecond * note.duration;
                                }
                            }
                        });

                        note.endPosY = newEndPosition;

                        if(paused.value) {
                            newAnimation.pause();
                        }

                        animationList.value.push(newAnimation);
                    }
                    addAnimation(note.endPosY ? note.endPosY : 0);
                    
                    note.moving = true;
                }
            });
        }

        const pausePlaying = () => {
            paused.value = true;
            Tone.Transport.pause();
            animationList.value.forEach(animation => {
                animation.pause();
            });
        }

        const resumePlaying = async () => {
            if(stopped.value) {
                stopped.value = false;
                await loadTestMidi();
            }
            else {
                animationList.value.forEach(animation => {
                    animation.play();
                });
                Tone.Transport.start();
                paused.value = false;
            }
        }

        const stopPlaying = () => {
            stopped.value = true;
            Tone.Transport.cancel();
            animationList.value = [];
            drawnNotes.value = {};
            activeNotes.value = [];
        }

        watch(drawnDivs.value, () => {
            animateNotes();
        });

        return {
            whiteKeys,
            blackKeys,
            containerStyle,
            backgroundStyle,
            synth,
            synthLoaded,
            drawnNotes,
            unwrapDivs,
            getKeyStyle,
            drawnNoteStyle,
            playNote,
            releaseNote,
            isNoteActive,
            loadTestMidi,
            pausePlaying,
            resumePlaying,
            stopPlaying
        };
    },
};
</script>
  
<style scoped lang='scss'>
.piano-container {
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

.drawn-note {
    top: 1000px;
    background-color: $accent !important;
    border-radius: 5px;
}

.drawn-note__black {
    background-color: $accent-dark !important;
}

.piano-key__active {
    background-color: $accent !important;
}

.play-button {
    z-index: 1;
    position: absolute;
    top: 50%;
    left: 0; 
    right: 0; 
    margin-left: auto; 
    margin-right: auto;
    width: 500px;
}

.piano-background {
    position: relative;
    overflow: hidden;
}
</style>