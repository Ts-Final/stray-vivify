<script lang="ts" setup>
import { computed, ref } from 'vue'
import SimpleModal from '@renderer/components/modals/simple-modal.vue'
import { Storage } from '@renderer/core/storage'
import { StartUpTips } from '@renderer/core/misc/startup-tips'

const props = defineProps<{ id?: number }>()

const H2P_ARTICLES: { id: number; title: string }[] = [
  { id: 1, title: '导读' },
  { id: 2, title: 'skin格式' },
  { id: 3, title: '节拍器' },
  { id: 4, title: '谱面列表' },
  { id: 5, title: '导入' },
  { id: 6, title: '编辑器' },
  { id: 7, title: '排列' },
  { id: 8, title: '时轴' },
  { id: 9, title: '快捷键' }
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

const title = computed(() => H2P_ARTICLES.find((x) => x.id === id.value)?.title ?? '还没写哦……')
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
        <h2>{{ title }}</h2>
        <div v-if="id === 1">
          <p>这是一个操作说明。我不知道写什么在这里。所以就这样吧。</p>
          <p>
            注意，在反馈问题的时候，最好使用每个条目下方给出的代码名称，样式如下所示。
            如果未给出或你没找到（或者你没找），请尽可能描述好是哪里以便定位。
          </p>
          <p class="h2p-code">code-name</p>
          <p>反馈邮箱： <code>1011346306@qq.com</code></p>
        </div>
        <div v-if="id === 2">
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
    skin.css
          </pre>
          <p>其中，各个文件的用途：</p>
          <p><code>数字</code>标识其贴图用于多宽的note。</p>
          <p><code>l,h,m</code>标识其贴图用于左侧（右侧）的note。</p>
          <p><code>s</code>字面意义，对应s</p>
          <p><code>b</code>字面意义，对应b。不分左右。</p>
          <p>
            <code>h</code>对应ln面身。面头使用与（该处）等宽的note的同样的贴图。
            <strong>分左右！</strong>
          </p>
          <p><code>skin.css</code>可选，能覆盖sv的默认外观。</p>
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
          <p class="h2p-code">fn-section-tap</p>
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
            <br />
          </p>
          <p class="h2p-note">
            需要注意的是，如果在（连续的）tap中出现了 Avg Delay 从一个
            <strong>正数</strong>变为<strong>负数</strong>，
            则需要考虑是不是bpm低了。反之，则需要调高bpm。
          </p>
          <p><code>â</code> - 稳定系数，具体是由线性回归拟合的。在0.001以下认定为比较稳定。</p>
        </div>

        <div v-if="id == 4">
          <p class="h2p-code">chart-list</p>
          <p>
            这是你打开sv每天要面对的页面。
            你可以对着@RainFoamp画的图标发呆，也可以阅读一下我写的各种tips。
            当然本页面主要是用来进入谱面编辑页面的。
          </p>
          <p class="h2p-sa" @click="show(5)">导入文件</p>
          <h3>左侧</h3>
          <p>我们由上到下介绍吧。</p>
          <p v-if="Storage.settings.stray_logo">这是RainFoamp画的Logo哦。非常感谢！</p>
          <p v-else>
            这是stray/vivify (sans-serif).
            （如果你用这个截图可能会出现字体版权纠纷，不过我不是学法的我也不会揪你们这个的）
          </p>
          <p>接下来是tips。当然是随机抽的啦，现在总共有{{ StartUpTips.length }}条可用。</p>
          <p class="h2p-note">可以点击上方图标刷新tips，in case刷到了一些很长很长的tips</p>
          <p>接下来是欢迎 {{ Storage.username }}！</p>
          <p>广告位招租。（有没有人需要一些友情链接，<span class="blackout">@vivid/otto</span>?</p>
          <p>谱面信息：曲名，bpm，id，diff的列表。</p>
          <h3>右侧</h3>
          <p>搜索框，导入曲目。这两个不用多说了吧？</p>
          <p>
            每个曲目的条目。左键以进入<span class="h2p-link" @click="show(6)">编辑页面</span
            >，右键删除曲目（有二次确认，不必担心误触）。 鼠标滑过的时候会在左边显示谱面信息。
          </p>
        </div>

        <div v-if="id == 5">
          <p>一切的起点，导入。</p>
          <h3>chart-list</h3>
          <p>
            在chart-list，你可以点击右侧的导入曲目，选择一个曲目导入，也可以从顶部的*导入*栏选择其他的格式。
          </p>
          <p>
            当然，你也可以直接把文件（包）拖进来。支持的文件包括zip、svc、vsp、osz、mcz和音频文件。
          </p>
          <h3>chart-editor</h3>
          <p>在这个页面你可以拖入文件。支持vsc, vsb, osz, mcz, 和图片文件。</p>
          <p>
            vsb/vsc会直接新建一个diff（就像
            <span class="h2p-link">iexporter</span>
            手动导入的一样）。
          </p>
          <p>osz, mcz则会打开对应的 <span class="h2p-link">modal</span>。</p>
          <p>图片文件则会导入为曲绘。</p>
        </div>

        <div v-if="id == 6">
          <p class="h2p-code">chart-v2</p>
          <p>你们话费大部分时间写谱的地方。</p>
          <p class="h2p-sa" @click="show(7)">排列</p>
          <p class="h2p-sa" @click="show(8)">时轴</p>
          <p class="h2p-sa">曲目（信息）</p>
          <p>这个页面没有写，因为没有需要写的东西。</p>
          <p>按Tab以切换这些页面哦。</p>
          <p class="h2p-sa" @click="show(5)">导入</p>
          <p>在此页面也可以导入文件。</p>
        </div>

        <div v-if="id == 7">
          <p class="h2p-code">chart-main</p>
          <p>你写谱的地方。中间是轨道，由pixi.js负责渲染。左右两侧是几个功能面版，或者说fn。</p>
          <h3>写谱</h3>
          <p>直接写就好了。左键+note，右键删除，可以参考隔壁osu的editor，行为基本是一致的。</p>
          <h3>选择</h3>
          <p>
            和windows的选择功能比较相似。按住ctrl点一个note以选中，可以选中多个。
            选中之后fn-edit-tools（想做些什么呢？）会出现，可以进行镜像等操作。
          </p>
          <p>
            在选择模式下，拖动功能会同时移动所有被选中的note，右键会删除所有被选中的note。
            使用ctrl+C也可以快速复制（剪切。右键空地方可以清空剪贴板。
          </p>
        </div>
        <div v-if="id == 8">
          <p class="h2p-code">chart-timing</p>
          <p>调节时轴的地方。</p>
          <p>在左侧列表按住ctrl可以跳转到对应时间哦。</p>
          <p>Tap Bpm.上手试试吧！</p>
        </div>
        <div v-if="id == 9">
          <p>有一些默认的快捷键。这些是快捷键设置里面没有涉及的。</p>
          <p>在编排页面，按住ctrl滚轮上下可以调节流速，按住alt滚轮上下可以调节分音。</p>
          <p>Tab可以切换曲目、编排、时轴。</p>
          <p>按住alt以禁用note吸附到小节线（分音线）上。</p>
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

.copy-able {
  cursor: text;
  user-select: text;
}

.h2p-code {
  padding: 1rem;
  width: 100%;
  box-sizing: border-box;
  background: #b8dcee44;
  font-weight: bold;
  font-size: 1.2rem;
  font-family: monospace;
}

.h2p-code::before {
  content: '▶';
  font-weight: normal;
  font-family: sans-serif;
  font-size: 0.8rem;
}

.h2p-sa {
  padding: 0.5rem 1rem;
  width: fit-content;
  box-sizing: border-box;
  background: #b8dcee44;
  cursor: pointer;
}

.h2p-sa::before {
  content: '参见：';
  font-style: italic;
}

.blackout {
  color: black;
  background: black;
  transition: color 0.2s linear;
}

.blackout:hover {
  color: #b8dcee;
}

.h2p-link {
  text-decoration: 1px solid #b8dcee underline;
  cursor: pointer;
  filter: glow(1px);
}
</style>
