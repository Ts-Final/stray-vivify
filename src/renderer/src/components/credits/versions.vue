<script lang="ts" setup>
import Build from '@renderer/components/credits/build.vue'
import WordHelper from '@renderer/components/miscellaneous/word-helper.vue'
import AHref from '@renderer/components/a-elements/a-href.vue'
</script>

<template>
  <div class="version-wrapper">
    <Build build="1" d="31" m="1" y="2025">
      <div>第一个测试版本。</div>
    </Build>
    <Build build="2" d="1" m="2" y="2025">
      <template #bugs>
        <div>修复了note图片缺失的问题。（来自Fyato）</div>
        <span>
          此问题来源于vue的动态引用资源的路径问题。
          由于在写谱的时候传给负责渲染note模块的数据是动态的，所以引用图片的时候使用了基于/public的动态路径。
          正常来说，对于css中的url，img的src等对文件的url引用会在编译的时候自动替换为相对根目录的相对路径。
          但是对于动态的引用资源，则不会有这一步编译，则原来的文件路径就会被保留。
          （如果正常做前端项目并不会有什么问题，因为根目录是相同的，即"/"）
          但是在这里（本项目中），基于electron-vite的项目根目录是在/，但是渲染端的目录在/src/renderer/
          在调试（开发dev）的时候，electron会以后者作为渲染端的根目录，所以可以找到/public文件夹，
          但是打包（build:win）的时候，所有东西都会砸到根目录下，也即没有了/src/renderer/public文件夹，
          但是在动态引用中，会自动解析（这不是神金吗。）为这个虚空目录，自然找不到了。
          如果你打开控制台可以看到，引用这个图片的时候采用的路径是C:/note.png。（盘符可能不一样，无关紧要啦）
          因此修改了动态引用的路径。
          <br />
          原本是
          <code>img src="/note.png"</code>， 更新后则使用了
          <code>img src="./note.png"</code>。这样就没问题了。（倒，这玩意是最逆天的一个了）
        </span>
      </template>
    </Build>
    <Build build="3" d="5" m="2" y="2025">
      <template>
        <div>添加了本界面。</div>
        <div>现在界面轨道位置可以调整了。请在设置中查看选项。</div>
        <span
          >是按照界面大小（1600px）来自动转换的。不建议使用中间停靠的策略，这样子在窗口很窄的时候会视觉上出问题。</span
        >
      </template>
      <template #bugs>
        <div>修复了note摆放容易错位的问题。（来自1sk3se）</div>
        <span
          >这个bug其实很简单。在每次更新谱面时，会重新计算一次各bpm分段的长度，位置等等。
          但是notes是按照摆放时间顺序存储的，所以会出现bpm分段出现问题的情况（指先写后面再往前面放bpm）。
          解决办法：自动按时间排序。（笑，这是什么简单但难蚌bug
        </span>
      </template>
    </Build>
    <Build build="4" d="8" m="3" y="2025">
      <template #bugs>
        <div>修复了撞尾bug。</div>
      </template>
      <template #header> stray/vivify </template>
      <div>新增了纯享模式。该模式下，你可以撇掉别的乱七八糟的东西。</div>
      <div>
        增加了撤销、重做功能。快捷键为Ctrl+Z和Ctrl+Y，这方面（指快捷键）的自定义还在路上（悲
      </div>
      <div>重写了部分底层逻辑，修改了小节线的显示方式，添加了小节数显示。</div>
      <div>优化了轨道在左侧时的功能选项的显示方式。</div>
      <div>新增了Credits。请在设置中打开！</div>
      <div>
        移除了note重叠的检测，现在只不允许放在同一个位置（这意味着你大概可以把单键放在hold里面……
      </div>
      <div>为制谱器起了个名字。</div>
    </Build>
    <Build build="5" d="3" m="4" y="2025">
      <template #bugs>
        <div>修复了（？）关于谱面offset的一系列问题。现在应该好了吧……</div>
      </template>
      <template #qol>
        <div>
          现在将谱面渲染逻辑改为分组渲染。drawCanvas（画小节的）效率现在应该提高了2900%（人话：消耗时间从大概58ms->2ms）
        </div>
        <div>修改了offset的逻辑。现在应该和音频时间分开独立计算。</div>
        <span>然而我不知道为什么之前会把这俩玩意混在一起</span>
        <div>将bpm列表改为懒加载。这可能提升一部分性能。</div>
      </template>
      <div>新增了waiting-load界面，现在如果读取的时候卡住了可以帮你分析（？）原因。</div>
      <div>新增了株洲岛有栖。</div>
      <template #header> 我愚人节呢？？？ </template>
    </Build>
    <Build build="7.3" d="17" m="8" y="2025">
      <template #header> stray-vivify Reborn </template>
      <div>移除了waiting-load</div>
      <div>移除了株洲岛有栖，新增了株洲岛有栖（汉堡ver）画师：River</div>
      <div>修改了lane的渲染方式。从canvas切换到了svg。</div>
      <div>移除了纯享模式，改为了预览模式，从工具栏进入。按空格以开始。</div>
      <div>修改了快捷键、设置界面</div>
      <div>新增了F1界面。点击试试吧！</div>
      <div>增加了skin。</div>
      <div>调整了很多界面。</div>
    </Build>
    <Build build="8" d="24" m="8" y="2025">
      <template #header> stray-vivify 101.00% </template>
      <div>Major 新增游玩模式</div>
      <div>解除了不能下宽面（？）的限制。</div>
      <div>修改F1界面为Inspector.快捷键可以在设置中修改。</div>
    </Build>
    <Build build="8.2" d="29" m="8" y="2025">
      <template #header> 开学快乐……？ </template>
      <template #bugs>
        <div>修复了预览模式暴毙的bug，原因是我把退出的逻辑写到空格上了</div>
      </template>
      <div>修改了宽面的皮肤读取逻辑</div>
    </Build>
    <Build build="8.3" d="30" m="8" y="2025">
      <template #bugs>
        <div>回滚了宽面和渲染逻辑。由于img的鼠标操作比较猎奇，所以后面再说吧</div>
        <div>修复了validator的bug，这会导致所有面变成米。</div>
      </template>
      <div>新增了一个导出选项。后面计划把所有导入导出都塞到这个里面，虽然不太方便（？</div>
    </Build>
    <Build build="8.4" d="31" m="8" y="2025">
      <template #bugs>
        <div>#5 3.0流速下大概会相较鼠标偏后1个16分音</div>
        <div>#10 修改了2宽bumper的lane摆放逻辑，现在是|-1.5-|-1-|-1.5-|的权重。</div>
        <div>再次修复了validator的bug，这会导致所有1宽的东西全变成普通chip</div>
        <div>修复了本界面日期多一个月的bug。</div>
      </template>
      <template #qol>
        <div>#8 0面改米</div>
        <div>#9 为note添加了z-index来处理遮挡关系，现在是chip在ln上面，其次宽在下。</div>
        <div>长条上面的贴图可以改了。</div>
        <div>将所有导入导出都放到了一个modal中。</div>
      </template>
      <div>添加了word-helper机制，用来做一些小提示。</div>
      <div>现在在切换版本的时候会弹出来本页面。</div>
      <div>密度（梯度）折线图</div>
      <div>移除了ab30，广告位招租（？</div>
    </Build>
    <Build build="8.5" d="1" m="9" title="V8 Stable(?" y="2025">
      <template #bugs>
        <div>修复了本页面在没有bug修复的时候不会显示qol的bug。（？？？</div>
      </template>
      <template #qol>
        <div>新增了一个检查skin缺失哪些贴图的modal。</div>
        <div>给本页面增加了高亮。</div>
      </template>
      <div>添加了word-helper</div>
    </Build>
    <Build build="8.9" d="20" m="9" title="Pre 9" y="2025">
      <template #qol>
        <div>
          仿osu的小节线渲染。但是不知道为什么这个颜色总是不对，但是我的<WordHelper
            dec="物竞委你们最好晚上睁着眼睡觉"
            msg="脑子有点过载"
          />无法处理这个问题。后面再说
        </div>
        <div>比osu略微高级一点的移动所有物件的选项。下面的移动全部会覆盖上面的移动此timing。</div>
        <div>给谱面列表添加了曲绘显示。</div>
        <div>给header添加了所处页面的高亮提示。</div>
      </template>
      <template #bugs>
        <div>修复了vsc导出中1宽全部都会导出为chip的bug。</div>
      </template>
      <div>
        新增了导入osz的东西，调整了<word-helper
          dec="谱 面 列 表"
          msg="chart-list"
        />页面中的导入按钮
      </div>
      <div>调整了Inspector页面中对缺失图片的分类逻辑。现在是单独一面的了。</div>
      <div style="font-size: 1.5rem; font-weight: bold">
        <word-helper dec="我草我们pre5真王朝了" msg="Pre5还在追我！" />
      </div>
      <div>塞了一些sv的史在里面</div>
      <div>
        osz导入中由于osu存储timing的方式比较伪人（指存储时长），所以导入的timing的bpm会比较奇怪。
      </div>
    </Build>
    <Build build="9" d="24" m="9" title="Build ⑨" y="2025">
      <template #qol>
        <div>添加了select功能，以及配套的快捷键。</div>
        <div>添加了打击音。由于html特色延迟，打击音大概率是不准的，请谨慎使用</div>
        <div>在Inspector中新增了（运行）内存占用管理。</div>
        <div>给输入id的界面添加了enter确认。</div>
      </template>
      <template #bugs>
        <div>修复timing无法滚动的问题</div>
        <div>略修改了validator的逻辑。</div>
      </template>
      <div>添加了svg导出。要求谱面至少有1个物件。会很卡的。</div>
      <div>调整了导入osz的界面。</div>
      <div>调整了CORS policy</div>
      <div>给变速打了个底。</div>
      <div>移除了部分不需要的东西（指node库）</div>
      <div>调整了小节线的上色逻辑。现在应该比较人类了。</div>
      <div><s>神秘东方小妖精正在入侵sv。</s></div>
    </Build>
    <Build build="9.1" d="6" m="9" title="Build 9s" y="2025">
      <template #qol>
        <div>添加了diff复制的功能。（指复制一整个diff）</div>
        <div>为导出谱面预览png添加了显示部分内容的选项。</div>
        <div>修改了打击音的导入逻辑，现在不要求打击音的后缀了。</div>
        <div>在谱面统计中调整了总数的计算方式，添加了bpm的统计</div>
      </template>
      <div>为Inspector添加了一个占用磁盘空间的统计。</div>
      <div>添加了用户名设置（然并卵）</div>
      <div>添加了vsc导入，调整了导入导出界面的排版。</div>
      <div>@-Re-Again- 添加了拍号的选项。可以在设置中修改，注意和小节数只能选一个。</div>
      <div>大概修复了打击音延迟比较大的问题，切换到了HTML的AudioContext。</div>
      <div>@-Re-Again- 添加了导入vsc的功能。</div>
      <div>限制了<word-helper dec="是我哦。" msg="Word Helper" />的大小。</div>
      <template #bugs>
        <div>修复了osz导入会出现负数bpm的bug。</div>
        <div>调整了曲目信息页面的信息不同步的bug。</div>
        <div style="font-size: 2rem">
          <word-helper
            dec="我说怎么sv包体积这么鬼大原来是"
            msg="修复了打包应用时错误的把我写的谱塞到应用包里面的bug。"
          ></word-helper>
        </div>
      </template>
    </Build>
    <Build build="9.2" d="6" m="10" y="2025">
      <template #bugs>
        <div>修改了导入曲目的bug</div>
      </template>
      <div>添加了打击音音量</div>
      <div>custom song导出</div>
      <div>回退了diff的编辑逻辑</div>
    </Build>
    <Build build="9.3" d="18" m="10" title="9s2" y="2025">
      <template #bugs>
        <div>非全屏状态下，note定位错误的问题</div>
        <div>窗口大小不及时同步的问题，现在采用的是每秒更新一次</div>
        <div>修复拉面会被select卡掉的问题</div>
        <div>修复select在摆放note时仍然会触发的问题</div>
      </template>
      <div>Inspector添加了Frame Rate - Update Rate</div>
      <div>调整了部分程序结构</div>
    </Build>
    <Build build="9.4" d="23" m="11" title="Pre 10" y="2025">
      <div>更改了bpm修改时同步计算的逻辑。</div>
      <div>添加了Custom Song导出</div>
      <div>将note插入 删除逻辑改为二分法</div>
      <div>添加了节奏谱选项，在预览模式中可用</div>
      <div>添加了未完成的SV页面。</div>
    </Build>
    <Build build="9.5" d="5" m="12" title="0.9.5" y="2025">
      <template #bugs>
        <div>修复了在使用任务栏关闭应用时不会触发自动保存的问题</div>
        <s>安全性调整</s>
        <span style="text-decoration: #b8dcee line-through 1px">
          由于使用了vue-json-pretty，其正常工作需要使用到 unsafe-eval script，
          而这在某些情况下可能导致本应用的网络交互（其实压根没有）被攻击。 <br />
          未来版本中会引入新的解决方案，也考虑到会添加在线功能api所需的安全需求。<br />
          总之不以管理员权限打开 stray/vivify应当可以解决现在存在的所有风险。
        </span>
      </template>
      <div>修改了密度计算的逻辑，<s>从~200ms压缩到了~3ms</s></div>
      <div>为线密度添加了时间跳转功能 和 当前时间的显示</div>
      <div>修改了stray:/读取文件的逻辑</div>
      <div>
        压缩了hold的高度，现在应该不会出现面尾和下一个note过分重叠的情况（如果还有重叠证明你写的是无理）
      </div>
      <div>
        添加了stats展示 from @Creeper_001
        <a-href href="https://github.com/Ts-Final/stray-vivify/pull/3">查看PR</a-href>
      </div>
      <div>添加了使用时间统计，将从这个版本开始计算。</div>
      <div>更新本版本时会重新打开自动保存</div>
      <div>调整了版本号逻辑。之前的就不改了……</div>
      <div>调整了谱面列表search的逻辑。现在更加宽松了。</div>
    </Build>
    <Build build="9.6" d="25" m="1" title="0.9.6" y="2026">
      <template #bugs>
        <div>修复了可能存在删除note失败的bug。</div>
        <span>因为vue会给note套上一个Proxy导致===的匹配失败（这俩的内存指针不一样）</span>
      </template>
      <div>修改了custom json的编辑控件，回调了安全设置。</div>
      <div>为时间字符串添加了小时支持。</div>
      <div>
        调整了使用时间统计的逻辑。 现在会显示 AppData/stray-vivify的创建时间
        存放exe的文件夹创建时间和 第一次使用v0.9.5以后的时间 中的最早者来计算。
      </div>
      <div>修改了谱面列表的事件逻辑，现在在加载曲目的时候不会触发其他事件。</div>
      <div>重构了Inspector和custom的modal（代码意义上）。</div>
      <div>将右下角的Version提示改为一直显示，可以在设置中关闭。</div>
    </Build>
    <Build build="9.7" d="14" m="2" title="0.9.7" y="2026">
      <template #bugs>
        <div>修复了删除note失败的问题（x2），将二分查找note改为线性查找。</div>
        <div>修复了modal会导致爆滚动条的问题。</div>
        <div>修复了beat最大值好像不太对的问题。</div>
        <div>修复了word-helper在部分情况下无法准确定位（报错）的问题。</div>
        <div>修复了无法从-5秒开始播放的问题。</div>
        <div>修复了note pooling的间隔设置未正确生效的问题。</div>
      </template>
      <div>为数字输入框添加了更加严格的数值校验。</div>
      <div>调整了顶栏的z高度，使其在modal显示的时候依然在顶层。</div>
      <div>调整了window的属性暴露方式。现在请使用window.sv来查看暴露的属性。</div>
      <div>添加了Error的全局捕获与通知。可在设置中关闭。</div>
      <div>添加了手动触发Error的快捷键，默认值为F3。</div>
      <div>为编排和vsm界面添加了diff选择框。</div>
      <div>添加了VSM编辑界面和对应的导入导出。</div>
      <div>彻底移除了原来的sv功能。</div>
      <div>移除了note和diff上的ani字段。</div>
      <div>移除了罗马音的输入限制。现在罗马音字段可以独立编辑了。</div>
      <div>将框架升级到了vue 3.5.28 最新最热了属于是</div>
      <div>调整了stats计算的逻辑，移除了对不同难度（名称）的修正。</div>
      <div>添加了启动页面的tips。</div>
      <div>调整了Credits页面内容，以使本项目更符合Felleta的运作方式。</div>
      <div>
        添加了External功能，现在可以加载外部json。现在允许加载vsm-objects和startup-tips。具体要求请查看源代码（preload/external.d.ts）。
      </div>
      <div>调整了select的样式，现在溢出的文字会显示为省略号。</div>
      <div>添加了“不吸附”的功能，按住alt以触发。（这个改不了）</div>
      <div>添加了48 64分小节线的颜色设置。</div>
      <div>移除了对skin文件夹的强行校验，改为了modal提示。当然要是不放skin是啥都不会显示的。</div>
      <div>添加了一个1分钟画出来的sv图标。这对吗……？</div>
      <div>添加了“从此处开始游玩”的功能。</div>
      <div>调整了试玩的判定逻辑，我感觉现在比较像人了。</div>
      <div>修复了note可能会卡src导致贴图乱变的问题。</div>
      <div>略微提升了ticks（右边的分音）的计算精度。</div>
      <div>移除了每次保存时在node端的控制台输出。不会有人用控制台启动sv吧……</div>
      <div>移除了note摆放的限制。</div>
      <span>需要注意的是这是直接把无理检测删掉了，除了不能在同一时刻放相同的note</span>
    </Build>
    <Build build="9.8" d="12" m="4" title="0.9.8" y="2026">
      <template #bugs>
        <div>修复了导出Custom-JSON的问题。 (@Creeper_001)</div>
        <div>修复了大写（shift或者大写锁定下）快捷键不生效的问题。</div>
        <div>修复了第一个note吞打击音的问题（索引为 0 时的if炸了）</div>
      </template>
      <template #qol>
        <div>
          重构了osz导入行为，现在所有内容都在一个modal中处理。并且可以导入（除了mania的）其他模式了
        </div>
        <div>添加了工具栏功能，支持刷新谱面数据。</div>
        <div>添加了修改最大缩放和分音的设置。(@Creeper_001)</div>
        <div>优化了 diff 密度计算逻辑，现在在切换diff时自动触发而非由 Vue 触发。</div>
        <div>刷新组件的刷新更加明确一些，作用域更加像人了。</div>
        <div>优化了皮肤模态框样式，并将设置整合到模态框中。</div>
        <div>改进了圆形显示和存储逻辑。</div>
        <div>优化了不同diff间轨道数存在差异时，svg尺寸自适应的逻辑。</div>
        <div>为 BPM 文本添加了固定显示。</div>
      </template>
      <div style="font-size: 1.2rem; padding: 10px 0">更新了图标！感谢 @雫星沫RainFoamp</div>
      <div>添加了timing复制为文字功能</div>
      <div>更新了builder选项，现在大概是可以安装到自定义路径了（当然和用zip的人没什么关系</div>
      <div>试了下vue3.6-beta又回滚回来了，憋笑</div>
      <div>引入了 EventHub 和 StopClass 以节省资源（灵感来自Antimatter Dimensions）</div>
      <div>实现了基础的 diff参考功能。</div>
      <div>添加了一点对窗口宽度的自适应</div>
      <div>使用时长统计：添加了为旧版本 vs-charter-ev 的检查。</div>
      <div>禁用了首页一句话中的动画效果。</div>
    </Build>
    <Build build="9.9" d="17" m="6" title="0.9.9" y="2026">
      <template #header> stray/vivify alpha </template>
      <template #bugs>
        <div>修复了某些触发器完全不会触发的问题。</div>
        <div>修复了部分曲名过长会导致chart-list显示炸掉的问题。</div>
        <div>修复了无法读取部分vsb的问题。</div>
        <div>修复了多选情况下会乱删note的问题。</div>
        <div>修复了密度折线在切换diff时乱跳的问题。</div>
      </template>
      <template #qol>
        <div>修改了定时器的逻辑，避免在播放音频的时候执行函数导致的卡顿。</div>
        <div>禁用了多开。</div>
        <div>调整了设置页面的样式，添加了一些解释。</div>
      </template>
      <div>添加了备份功能。（这真是ai写的，有问题也别太急因为我也很难修）</div>
      <div>现在使用pixi.js进行渲染。应该快多了。</div>
      <div>添加了vue-devtools，可以尝试添加--dt的启动参数。</div>
      <div>添加了一个关闭所有inspect的设置，可以在极限情况下提高性能。</div>
      <div>修改了skin检查，现在强制要求1.png存在。不建议缺失皮肤。</div>
      <div>移除了所有mod内容。</div>
      <div>添加了vsb导出。（感谢@RGBProductions的支持）</div>
      <div>移除了fn-debug，FPS显示可能日后再加。</div>
      <div>添加了aiMod。</div>
      <div>移除了很多地方的reactivity，感觉会快一点点。</div>
      <div>添加了一个复制timing list的按钮。</div>
    </Build>
    <Build build="0.9.10" d="25" m="6" y="2026">
      <div>移除了vsb导出。</div>
      <div>将所有vs-chart重命名为chart。</div>
      <div>现在会自动检测无效的谱面并移除之。</div>
      <div>添加了load-song页面。</div>
      <div>调整了加载曲目长度的逻辑。</div>
      <div>调整了曲目列表右键删除的操作，移除了删除确认的设置。</div>
      <div>添加了beat宽容时间。参见设置。</div>
      <div>
        添加了底部bpm显示，调整了左侧bpm显示的有效数字，移除了底部bpm显示的设置（即关不掉底部bpm显示）。
      </div>
    </Build>
    <Build build="0.9.11" d="5" m="7" y="2026">
      <template #bugs>
        <div>修复了导入osz时无法读取文件的问题。</div>
        <div>修复了ln宽度不随设置改变的问题。</div>
        <div>修复了右上角流速分音设置不会触发小节线重绘的问题。</div>
        <div>
          修复了内存释放并没有真的释放的问题。（但事实上还是没法严格地释放掉，除非我学会java）
        </div>
        <div>修复了设置里关闭打击音不能关闭打击音的问题。</div>
      </template>
      <div>调整了使用的electron版本。</div>
      <div>添加了防沉迷提示，默认半小时，请去设置调一下。</div>
      <div>添加了一个无意义tip。</div>
    </Build>
    <Build build="1.0.0" d="26" m="9" title="Originium" y="2026">
      <template #bugs>
        <div>降低了音频播放延迟。（@Creeper_001 PR#7）</div>
        <div>调整了拖拽note和添加note两个功能的逻辑，之前似乎会在某些时候很混乱。</div>
        <div>修复了防沉迷组件无法关闭、没有内容的问题。</div>
        <div>修复了右侧工具不会响应选中的问题。</div>
        <div>调整了打开skin文件夹的行为，现在没有1.png也可以正常打开了。</div>
      </template>
    </Build>
  </div>
</template>

<style scoped>
.version-wrapper {
  display: flex;
  flex-direction: column-reverse;
  overflow-x: hidden;
}
</style>
