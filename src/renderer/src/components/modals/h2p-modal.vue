<script lang="ts" setup>
import { ref } from 'vue'
import SimpleModal from '@renderer/components/modals/simple-modal.vue'

const props = defineProps<{ id?: number }>()

const H2P_ARTICLES: { id: number; title: string }[] = [
  { id: 1, title: '导读' },
  { id: 2, title: 'skin' },
  { id: 3, title: '节拍器' }
]

/** 当前显示的文章 id */
const id = ref(props.id ?? 1)
/** 正文滚动容器：换文章之后回到顶部 */
const body = ref<HTMLElement | null>(null)

function show(next: number) {
  if (id.value === next) return
  id.value = next
  body.value?.scrollTo({ top: 0 })
}
</script>

<template>
  <SimpleModal size="4" title="How to Play">
    <div class="h2p">
      <nav class="h2p-nav">
        <div class="h2p-nav-title">但这不是搜索框（憋笑</div>
        <div
          v-for="a in H2P_ARTICLES"
          :key="a.id"
          :class="id === a.id ? 'h2p-nav-item chosen' : 'h2p-nav-item'"
          @click="show(a.id)"
        >
          <span class="h2p-nav-id">{{ a.id }}</span>
          <span class="h2p-nav-text">{{ a.title }}</span>
        </div>
      </nav>

      <!-- 右：正文，一篇一个 div -->
      <div ref="body" class="h2p-body h2p-article">
        <div v-if="id === 1">
          <h2 class="h2p-title">导读</h2>
          <p>这是一个操作说明。我不知道写什么在这里。所以就这样吧。</p>
        </div>
        <div v-if="id === 2">
          <h2 class="h2p-title">skin</h2>
          <p>
            skin文件夹应当和程序文件在同一目录下。
            启动时，应用会尝试读取所有需要的皮肤文件，并弹窗提示缺失文件。
          </p>
          <h4>文件列表：</h4>
          <pre>
/skin
    1.png
    1b.png
    1h.png
    1lh.png
    1rh.png
    2b.png
    2l.png
    2lh.png
    2m.png
    2mh.png
    2r.png
    2rh.png
    2sl.png
    2sm.png
    2sr.png
    3b.png
    3l.png
    3lh.png
    3r.png
    3rh.png
    3sl.png
    3sr.png
    4.png
    4b.png
    4h.png
    4s.png
    hit.{mp3,ogg,wav,m4a}
          </pre>
          <p>其中，各个文件的用途：</p>
          <p><code>数字</code>标识其贴图用于多宽的note。</p>
          <p><code>l,h,m</code>标识其贴图用于左侧（右侧）的note。</p>
          <p><code>s</code>字面意义，对应s</p>
          <p><code>b</code>字面意义，对应b。不分左右。</p>
          <p><code>h</code>对应ln面身。面头使用与（该处）等宽的note的同样的贴图。不分左右。</p>
          <h3>hit</h3>
          <p>打击音效。在默认皮肤包中不被提供。</p>
          <p>可使用的后缀已经列出。根据Creeper的pr，使用wav应当是延迟最低的一个。</p>
          <h2>其他说明</h2>
          <p>
            除了hit的后缀可变，其它图片文件的命名是定死的。
            虽然windows好像会自动进行大小写转换（认定同一），但是sv不会这样子识别。
          </p>
        </div>
        <div v-if="id == 3">
          <h2 class="h2p-title">sectionTap</h2>
          <p>命名是代码命名的，在反馈时请不要使用其它你自定义的名字，谢谢。</p>
          <p>
            准确来说是测谱面延迟的。通过下方的 <code>Tap</code> 和
            <code>从头开始Tap</code>可以启用校准。
          </p>
          <h4>初校准</h4>
          <p>
            最开始通过tap得到的时间大概不太准，原因包括人类自然会有的误差、输入延迟、音频延迟和<b>谱面延迟</b>。
            这四者共同作用会导致最开始的延迟飞上天（表现为+80左右）。
          </p>
          <p>
            请找一张osu导入的谱子，或者你非常确定其 <b>谱面延迟</b> 几乎为0。
            之后对其进行一段时间的tap，直到下方â变为彩色之后，将得到的 Avg Delay 填入
            <code>设置-音频设置-Tap延迟</code>进行校准。（注意不需要取负，是多少填多少就可以了。
          </p>
          <h4>使用</h4>
          <p>有两种操作方式：</p>
          <p><code>Tap</code> - 自动对齐到最近的 <b>拍号</b>（也即分音为4下的线）并开始播放。</p>
          <p><code>从开头Tap</code> - 跳转到该Timing开头并开始播放。</p>
          <br />
          <p>在Tap过程中，所有快捷键会被屏蔽，并被认定为一次Tap行为。</p>
          <p>你会得到两个值： <code>Avg Delay</code> 和 <code>â</code>。</p>
          <p>
            <code>Avg Delay</code> -
            可以将你的第一个timing推迟(#)ms，使用*移动此timing之后的所有物件*。也可以选择直接应用调整。
          </p>
          <p><code>â</code> - 稳定系数，具体是由线性回归拟合的。在0.001以下认定为比较稳定。</p>
        </div>
      </div>
    </div>
  </SimpleModal>
</template>

<style scoped>
h1,
h2,
h3 {
  margin: 0;
  border-bottom: 1px solid gray;
}
/* 分栏：左右各自滚动，正文那一侧允许选中文字（全局是 user-select: none） */
.h2p {
  display: flex;
  width: 100%;
  min-width: 0;
  height: 60vh;
}

.h2p-nav {
  flex: 0 0 12rem;
  min-width: 0;
  overflow-y: auto;
  border-right: 2px solid rgba(184, 220, 238, 0.35);
  padding-right: 0.75rem;
}

.h2p-nav-title {
  opacity: 0.6;
  font-size: 0.8rem;
  padding-left: 0.5rem;
  margin-bottom: 0.5rem;
}

.h2p-nav-item {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  padding: 0.35rem 0.5rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.h2p-nav-item:hover {
  background: rgba(184, 220, 238, 0.15);
}

.h2p-nav-item.chosen {
  background: rgba(184, 220, 238, 0.22);
  box-shadow: inset 3px 0 0 #b8dcee;
}

.h2p-nav-id {
  flex: 0 0 1.2em;
  text-align: right;
  font-size: 0.8rem;
  opacity: 0.6;
}

.h2p-nav-text {
  text-align: left;
  min-width: 0;
  word-break: break-word;
}

.h2p-body {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  padding-left: 1rem;
  user-select: text;
}

.h2p-body > div {
  text-align: left;
  line-height: 1.6;
  padding-right: 0.5rem;
}

.h2p-title {
  font-size: 1.25rem;
  font-weight: 500;
  margin: 0 0 0.75rem;
  padding-bottom: 0.35rem;
  border-bottom: 1px solid rgba(184, 220, 238, 0.35);
}

.h2p-article h3 {
  font-size: 1rem;
  font-weight: 500;
  margin: 1.1rem 0 0.35rem;
}

.h2p-article p {
  margin: 0.15rem 0;
}

.h2p-article ul {
  margin: 0.35rem 0;
  padding-left: 1.3rem;
}

.h2p-article li {
  margin: 0.15rem 0;
}

.h2p-article code {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 0.2rem;
  padding: 0 0.5rem;
  font-size: 1rem;
  line-height: 1rem;
  font-family: monospace;
}

.h2p-article kbd {
  display: inline-block;
  padding: 0 0.35em;
  border: 1px solid rgba(184, 220, 238, 0.5);
  border-radius: 0.25rem;
  background: rgba(0, 0, 0, 0.3);
  font-family: monospace;
  font-size: 0.85em;
  line-height: 1.4;
}

/* 需要单独强调的一段话 */
.h2p-note {
  background: rgba(255, 215, 0, 0.08);
  border-left: 3px solid #ffd700;
  border-radius: 0 0.25rem 0.25rem 0;
  padding: 0.35rem 0.6rem;
  opacity: 0.95;
}
</style>
