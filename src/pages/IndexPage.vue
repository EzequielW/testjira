<template>
    <q-page class="row items-end justify-evenly">
        <PianoUI :width="$q.screen.width" :height="$q.screen.height"/>
    </q-page>
</template>

<script lang="ts">
import { Todo, Meta } from 'components/models';
import PianoUI from 'src/components/PianoUI.vue';
import { defineComponent, ref } from 'vue';

export default defineComponent({
    name: 'IndexPage',
    components: { PianoUI },
    setup() {
        const todos = ref<Todo[]>([
            {
                id: 1,
                content: 'ct1',
            },
            {
                id: 2,
                content: 'ct2',
            },
            {
                id: 3,
                content: 'ct3',
            },
            {
                id: 4,
                content: 'ct4',
            },
            {
                id: 5,
                content: 'ct5',
            },
        ]);
        const meta = ref<Meta>({
            totalCount: 1200,
        });
        return { todos, meta };
    },
});
</script>
