<template>
    <q-page class="row items-end justify-evenly">
        <PianoUI :width="$q.screen.width" :height="$q.screen.height"/>
    </q-page>
</template>

<script lang="ts">
import PianoUI from 'src/components/PianoUI.vue';
import { defineComponent, ref } from 'vue';

export default defineComponent({
    name: 'IndexPage',
    components: { PianoUI },
    setup() {
        console.log('todo')
    },
});
</script>
