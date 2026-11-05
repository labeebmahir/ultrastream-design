// Components from the creator studio screens. Markup matches app/ultra-studio.html, analytics.html, manage-contents.html,
// upload.html, go-live.html and create-channel.html, most of which app/js/studio.js renders.
// Studio screens use a 24px side margin, so most previews add it with frameCSS. Copy the markup into a screen's own wrapper.
(window.COMPONENTS = window.COMPONENTS || []).push(
  {
    id: "studio-header",
    name: "Studio header",
    group: "Creator studio",
    order: 10,
    app: "",
    css: ["app/css/studio.css"],
    screens: ["ultra-studio.html", "manage-contents.html", "channel-settings.html", "upload.html"],
    text: "The header on studio screens: a back button, a 16px bold title and an optional action. Channel screens use the 24px title, and the upload form puts a smaller header inside its scrolling area.",
    keywords: "title back studio-title up-header cs-header",
    html: `
      <header class="app-header studio-header">
        <a class="icon-btn" href="profile.html" aria-label="Back"><i class="icon" data-lucide="arrow-left"></i></a>
        <h1 class="app-header__title studio-title">Ultra studio</h1>
        <a class="icon-btn" href="create-channel.html?mode=edit" aria-label="Edit channel"><i class="icon" data-lucide="user-round-pen"></i></a>
      </header>

      <!-- Channel screens -->
      <header class="app-header cs-header">
        <a class="icon-btn" href="profile.html" aria-label="Back"><i class="icon" data-lucide="arrow-left"></i></a>
        <h1 class="app-header__title studio-title studio-title--lg">Channel Setting</h1>
      </header>

      <!-- Upload form, inside .studio-scroll--form -->
      <div class="up-header">
        <button class="icon-btn" type="button" aria-label="Back"><i class="icon" data-lucide="arrow-left"></i></button>
        <h1 class="studio-title">Upload content</h1>
      </div>
    `,
    rn: `
      import { View, Pressable, StyleSheet } from 'react-native';
      import { Lucide } from '@react-native-vector-icons/lucide';
      import { AppText } from '@/core/components';
      import { useTheme } from '@/core/hooks';

      const { colors, spacing } = useTheme();

      <View style={[styles.header, { paddingHorizontal: spacing.lg }]}>
        <Pressable onPress={() => {}} accessibilityLabel="Back" hitSlop={8}>
          <Lucide name="arrow-left" size={24} color={colors.white} />
        </Pressable>
        {/* Channel screens use variant="headlineSmall" for the 24px title */}
        <AppText variant="titleMedium" style={styles.title}>Ultra studio</AppText>
        <Pressable onPress={() => {}} accessibilityLabel="Edit channel" hitSlop={8}>
          <Lucide name="user-round-pen" size={24} color={colors.white} />
        </Pressable>
      </View>

      const styles = StyleSheet.create({
        header: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 56 },
        title: { flex: 1, fontWeight: '700' },
      });
    `,
    rnKind: "pattern",
    rnWhere: "each studio screen, such as CreatorDashboardScreen",
    frameCSS: ".up-header{padding:0 24px}",
  },
  {
    id: "studio-profile",
    name: "Studio profile row",
    group: "Creator studio",
    order: 20,
    app: "",
    css: ["app/css/studio.css"],
    screens: ["ultra-studio.html", "create.html?as=creator", "ultra-studio.html?state=loading"],
    text: "The creator's channel at the top of Ultra Studio: photo, name, handle, follower count and a button to open the channel page.",
    keywords: "channel avatar followers view channel",
    html: `
      <div class="studio-profile">
        <div class="studio-profile__left">
          <span class="avatar avatar--56" aria-hidden="true"><i class="icon" data-lucide="user"></i></span>
          <div class="studio-profile__info">
            <span class="studio-profile__name">PixelForge</span>
            <span class="studio-profile__meta">@pixelforge</span>
            <span class="studio-profile__meta">128K followers</span>
          </div>
        </div>
        <a class="btn btn--primary" href="channel.html?c=PixelForge">View channel</a>
      </div>
    `,
    rn: `
      import { View } from 'react-native';
      import { AppAvatar, AppButton, AppText } from '@/core/components';
      import { useTheme } from '@/core/hooks';

      const { spacing } = useTheme();

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <AppAvatar uri={avatarUri} size={56} />
        <View style={{ flex: 1, gap: 2 }}>
          <AppText variant="titleMedium" numberOfLines={1}>PixelForge</AppText>
          <AppText variant="bodySmall" color="white50">@pixelforge</AppText>
          <AppText variant="bodySmall" color="white50">128K followers</AppText>
        </View>
        <AppButton label="View channel" size="sm" onPress={() => {}} />
      </View>
    `,
    rnKind: "usage",
    rnUses: ["AppAvatar", "AppText", "AppButton"],
    frameCSS: ".cd-phone{padding:0 24px}",
    note: "While loading, the three text lines are replaced by grey .s-skel blocks.",
  },
  {
    id: "stat-tiles",
    name: "Stat tiles",
    group: "Creator studio",
    order: 30,
    app: "",
    css: ["app/css/studio.css"],
    screens: ["ultra-studio.html", "ultra-studio.html?state=new", "ultra-studio.html?state=loading"],
    text: "A three-column grid of channel totals. The first tile, money earned, uses the brand gradient; the rest sit on a grey surface.",
    keywords: "stats earned views likes numbers totals grid",
    html: `
      <div class="stats">
        <div class="stat stat--earned">
          <span class="stat__head"><i class="icon" data-lucide="chart-line"></i><span>Earned</span></span>
          <span class="stat__value">$ 500.2</span>
        </div>
        <div class="stat">
          <span class="stat__head"><i class="icon" data-lucide="eye"></i><span>Views</span></span>
          <span class="stat__value">1.8M</span>
        </div>
        <div class="stat">
          <span class="stat__head"><i class="icon" data-lucide="thumbs-up"></i><span>Likes</span></span>
          <span class="stat__value">96.4K</span>
        </div>
        <div class="stat">
          <span class="stat__head"><i class="icon" data-lucide="video"></i><span>Videos</span></span>
          <span class="stat__value">120</span>
        </div>
        <div class="stat">
          <span class="stat__head"><i class="icon" data-lucide="clapperboard"></i><span>Shorts</span></span>
          <span class="stat__value">60</span>
        </div>
        <div class="stat">
          <span class="stat__head"><i class="icon" data-lucide="radio"></i><span>Live</span></span>
          <span class="stat__value">50</span>
        </div>
      </div>
    `,
    rn: `
      import { View, StyleSheet } from 'react-native';
      import LinearGradient from 'react-native-linear-gradient';
      import { Lucide } from '@react-native-vector-icons/lucide';
      import { AppSkeleton, AppText } from '@/core/components';
      import { useTheme } from '@/core/hooks';

      const { colors } = useTheme();
      const stats = [
        { icon: 'eye', label: 'Views', value: '1.8M' },
        { icon: 'thumbs-up', label: 'Likes', value: '96.4K' },
      ] as const;

      <View style={styles.grid}>
        <LinearGradient colors={[colors.red, colors.orange]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.tile}>
          <View style={styles.head}><Lucide name="chart-line" size={16} color={colors.white} /><AppText variant="labelSmall">Earned</AppText></View>
          <AppText variant="headlineSmall" style={styles.value}>$ 500.2</AppText>
        </LinearGradient>
        {stats.map(s => (
          <View key={s.label} style={[styles.tile, { backgroundColor: colors.surfaceVariant }]}>
            <View style={styles.head}><Lucide name={s.icon} size={16} color={colors.white} /><AppText variant="labelSmall">{s.label}</AppText></View>
            {loading ? <AppSkeleton width={48} height={24} /> : <AppText variant="headlineSmall" style={styles.value}>{s.value}</AppText>}
          </View>
        ))}
      </View>

      const styles = StyleSheet.create({
        grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
        tile: { width: '31%', minHeight: 72, padding: 12, borderRadius: 16 },
        head: { flexDirection: 'row', alignItems: 'center', gap: 4 },
        value: { fontWeight: '700' },
      });
    `,
    rnKind: "pattern",
    rnWhere: "CreatorDashboardScreen",
    frameCSS: ".cd-phone{padding:0 24px}",
    note: 'While loading, each value is replaced by a grey <code>&lt;span class="s-skel"&gt;&lt;/span&gt;</code> block, like AppSkeleton in the app.',
  },
  {
    id: "studio-menu",
    name: "Studio menu rows",
    group: "Creator studio",
    order: 40,
    app: "",
    css: ["app/css/studio.css"],
    screens: ["ultra-studio.html", "create.html?as=creator"],
    text: "A section title over a list of large tappable rows, each with an icon, a label and a chevron. Used for the quick actions and studio tools in Ultra Studio.",
    keywords: "quick actions studio tools links navigation",
    html: `
      <h2 class="studio-section">Quick actions</h2>
      <nav class="studio-menu" aria-label="Quick actions">
        <a href="upload.html"><i class="icon" data-lucide="video"></i><span>Upload a video/short</span><i class="icon" data-lucide="chevron-right"></i></a>
        <a href="go-live.html"><i class="icon" data-lucide="radio"></i><span>Go live</span><i class="icon" data-lucide="chevron-right"></i></a>
      </nav>
    `,
    rn: `
      import { View, Pressable, StyleSheet } from 'react-native';
      import { Lucide } from '@react-native-vector-icons/lucide';
      import { AppText } from '@/core/components';
      import { useTheme } from '@/core/hooks';

      const { colors } = useTheme();
      const actions = [
        { icon: 'video', label: 'Upload a video/short' },
        { icon: 'radio', label: 'Go live' },
      ] as const;

      <AppText variant="titleMedium" style={styles.section}>Quick actions</AppText>
      <View style={styles.menu}>
        {actions.map(a => (
          <Pressable key={a.label} onPress={() => {}} style={styles.row}>
            <Lucide name={a.icon} size={22} color={colors.white} />
            <AppText variant="bodyLarge" style={styles.label}>{a.label}</AppText>
            <Lucide name="chevron-right" size={22} color={colors.white50} />
          </Pressable>
        ))}
      </View>

      const styles = StyleSheet.create({
        section: { fontWeight: '700', marginBottom: 16 },
        menu: { gap: 12 },
        row: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 16, paddingHorizontal: 8, borderRadius: 16 },
        label: { flex: 1, fontWeight: '500' },
      });
    `,
    rnKind: "pattern",
    rnWhere: "CreatorDashboardScreen",
    frameCSS: ".cd-phone{padding:0 24px;gap:0}",
  },
  {
    id: "period-picker",
    name: "Period picker",
    group: "Creator studio",
    order: 50,
    app: "",
    css: ["app/css/studio.css"],
    screens: ["analytics.html", "analytics.html?state=period-menu", "analytics.html?state=30d"],
    text: "A small outlined button in the Analysis header that opens a menu of time periods. The chosen period is shaded and becomes the button's label.",
    keywords: "analytics date range menu last 7 days filter",
    html: `
      <header class="app-header studio-header an-header">
        <a class="icon-btn" href="ultra-studio.html" aria-label="Back"><i class="icon" data-lucide="arrow-left"></i></a>
        <h1 class="app-header__title studio-title">Analysis</h1>
        <div class="an-period">
          <button class="an-period__btn" type="button" id="period" aria-haspopup="menu" aria-expanded="true" aria-controls="period-menu"><span id="period-label">Last 7 days</span><span id="chev-down" hidden><i class="icon" data-lucide="chevron-down"></i></span><span id="chev-up"><i class="icon" data-lucide="chevron-up"></i></span></button>
          <div class="an-period__menu" id="period-menu" role="menu">
            <button type="button" role="menuitemradio" aria-checked="true" data-period="7d">Last 7 days</button>
            <button type="button" role="menuitemradio" aria-checked="false" data-period="30d">Last 30 days</button>
            <button type="button" role="menuitemradio" aria-checked="false" data-period="90d">Last 90 days</button>
          </div>
        </div>
      </header>
    `,
    js: `
      const btn = document.getElementById("period");
      const menu = document.getElementById("period-menu");
      const setOpen = (open) => {
        menu.hidden = !open;
        btn.setAttribute("aria-expanded", open);
        document.getElementById("chev-down").hidden = open;
        document.getElementById("chev-up").hidden = !open;
      };
      btn.addEventListener("click", () => setOpen(menu.hidden));
      menu.addEventListener("click", (e) => {
        const b = e.target.closest("[data-period]");
        if (!b) return;
        menu.querySelectorAll("[data-period]").forEach((x) => x.setAttribute("aria-checked", x === b));
        document.getElementById("period-label").textContent = b.textContent;
        setOpen(false);
      });
    `,
    rn: `
      import { useState } from 'react';
      import { View, Pressable, StyleSheet } from 'react-native';
      import { Lucide } from '@react-native-vector-icons/lucide';
      import { AppText } from '@/core/components';
      import { useTheme } from '@/core/hooks';

      const { colors } = useTheme();
      const periods = ['Last 7 days', 'Last 30 days', 'Last 90 days'];
      const [period, setPeriod] = useState(periods[0]);
      const [open, setOpen] = useState(false);

      <View>
        <Pressable onPress={() => setOpen(!open)} style={[styles.button, { borderColor: colors.outline }]}>
          <AppText variant="labelMedium">{period}</AppText>
          <Lucide name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.outline} />
        </Pressable>
        {open && (
          <View style={[styles.menu, { backgroundColor: colors.black, borderColor: colors.outline }]}>
            {periods.map(p => (
              <Pressable key={p} onPress={() => { setPeriod(p); setOpen(false); }} style={[styles.item, p === period && { backgroundColor: colors.surfaceVariant }]}>
                <AppText variant="labelMedium">{p}</AppText>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      const styles = StyleSheet.create({
        button: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderRadius: 10 },
        menu: { position: 'absolute', top: '100%', right: 0, zIndex: 10, minWidth: 140, marginTop: 4, borderWidth: 1, borderRadius: 10, overflow: 'hidden' },
        item: { paddingVertical: 12, paddingHorizontal: 16 },
      });
    `,
    rnKind: "pattern",
    rnWhere: "AnalysisScreen",
    height: 190,
    note: "Shown open. On the screen the menu starts hidden and only changes the label.",
  },
  {
    id: "chart-card",
    name: "Chart card",
    group: "Creator studio",
    order: 60,
    app: "ChartCard",
    css: ["app/css/studio.css"],
    screens: ["analytics.html"],
    text: "An outlined card with a metric's title and total, its growth against the last period in green, and a bar chart of the week.",
    keywords: "analytics growth views revenue chart card",
    html: `
      <section class="an-card">
        <h2 class="an-card__title">Average views (12.5k)</h2>
        <span class="an-card__growth">+12.3% vs last period</span>
        <div class="an-card__divider"></div>
        <div class="bar-chart" role="img" aria-label="Average views (12.5k): MON 1600, TUE 700, WED 1800, THU 1000, FRI 2400, SAT 600, SUN 1500">
          <div class="bar-chart__plot">
            <span class="bar-chart__grid" style="bottom:0%"></span>
            <span class="bar-chart__grid" style="bottom:33.33%"></span>
            <span class="bar-chart__grid" style="bottom:66.67%"></span>
            <span class="bar-chart__grid" style="bottom:100%"></span>
            <span class="bar-chart__bar" style="height:53.33%"></span>
            <span class="bar-chart__bar" style="height:23.33%"></span>
            <span class="bar-chart__bar" style="height:60%"></span>
            <span class="bar-chart__bar" style="height:33.33%"></span>
            <span class="bar-chart__bar bar-chart__bar--on" style="height:80%"></span>
            <span class="bar-chart__bar" style="height:20%"></span>
            <span class="bar-chart__bar" style="height:50%"></span>
          </div>
          <span class="bar-chart__y" style="bottom:22px">0</span>
          <span class="bar-chart__y" style="bottom:66px">1k</span>
          <span class="bar-chart__y" style="bottom:110px">2k</span>
          <span class="bar-chart__y" style="bottom:154px">3k</span>
          <div class="bar-chart__x"><span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span><span>SUN</span></div>
        </div>
      </section>
    `,
    rn: `
      import { View, StyleSheet, useWindowDimensions } from 'react-native';
      import { AppText, BarChart } from '@/core/components';
      import { useTheme } from '@/core/hooks';

      const { colors, spacing } = useTheme();
      const { width } = useWindowDimensions();
      const views = [
        { label: 'MON', value: 1600 }, { label: 'TUE', value: 700 }, { label: 'WED', value: 1800 }, { label: 'THU', value: 1000 },
        { label: 'FRI', value: 2400 }, { label: 'SAT', value: 600 }, { label: 'SUN', value: 1500 },
      ];

      <View style={[styles.card, { borderColor: colors.outline, backgroundColor: colors.black }]}>
        <AppText variant="titleMedium" style={styles.title}>Average views (12.5k)</AppText>
        <AppText variant="labelMedium" color="success">+12.3% vs last period</AppText>
        <View style={[styles.divider, { backgroundColor: colors.outline }]} />
        {/* Add the colour props from the Bar chart entry for grey bars */}
        <BarChart data={views} width={width - spacing.lg * 2 - 32} maxValue={3000} highlightIndex={4} />
      </View>

      const styles = StyleSheet.create({
        card: { gap: 8, padding: 16, borderWidth: 1, borderRadius: 16 },
        title: { fontWeight: '600' },
        divider: { height: StyleSheet.hairlineWidth, marginTop: 12 },
      });
    `,
    rnKind: "pattern",
    rnWhere: "AnalysisScreen, as a local ChartCard",
    frameCSS: ".cd-phone{padding:0 24px}",
  },
  {
    id: "bar-chart",
    name: "Bar chart",
    group: "Creator studio",
    order: 70,
    app: "BarChart",
    css: ["app/css/studio.css"],
    screens: ["analytics.html"],
    text: "Seven daily bars on a dashed grid, with the value axis on the left and day labels below. One bar can be highlighted in a darker grey.",
    keywords: "analytics graph bars week days",
    html: `
      <div class="bar-chart" role="img" aria-label="Revenue (125k): MON 1700, TUE 800, WED 1800, THU 1000, FRI 2500, SAT 500, SUN 1600">
        <div class="bar-chart__plot">
          <span class="bar-chart__grid" style="bottom:0%"></span>
          <span class="bar-chart__grid" style="bottom:33.33%"></span>
          <span class="bar-chart__grid" style="bottom:66.67%"></span>
          <span class="bar-chart__grid" style="bottom:100%"></span>
          <span class="bar-chart__bar" style="height:56.67%"></span>
          <span class="bar-chart__bar" style="height:26.67%"></span>
          <span class="bar-chart__bar" style="height:60%"></span>
          <span class="bar-chart__bar bar-chart__bar--on" style="height:33.33%"></span>
          <span class="bar-chart__bar" style="height:83.33%"></span>
          <span class="bar-chart__bar" style="height:16.67%"></span>
          <span class="bar-chart__bar" style="height:53.33%"></span>
        </div>
        <span class="bar-chart__y" style="bottom:22px">0</span>
        <span class="bar-chart__y" style="bottom:66px">1k</span>
        <span class="bar-chart__y" style="bottom:110px">2k</span>
        <span class="bar-chart__y" style="bottom:154px">3k</span>
        <div class="bar-chart__x"><span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span><span>SUN</span></div>
      </div>
    `,
    rn: `
      import { useWindowDimensions } from 'react-native';
      import { BarChart } from '@/core/components';
      import { useTheme } from '@/core/hooks';

      const { colors, spacing } = useTheme();
      const { width } = useWindowDimensions();
      const revenue = [
        { label: 'MON', value: 1700 }, { label: 'TUE', value: 800 }, { label: 'WED', value: 1800 }, { label: 'THU', value: 1000 },
        { label: 'FRI', value: 2500 }, { label: 'SAT', value: 500 }, { label: 'SUN', value: 1600 },
      ];

      <BarChart
        data={revenue}
        width={width - spacing.lg * 2}
        height={168}
        maxValue={3000}
        yAxisLabels={['0', '1k', '2k', '3k']}
        highlightIndex={3}
        barColor={colors.outline}
        highlightColor={colors.slateGray}
        gridColor={colors.outline}
        labelColor={colors.outline}
      />
    `,
    rnKind: "usage",
    frameCSS: ".cd-phone{padding:0 24px}",
    note: "Each bar's height is its value as a percentage of the top of the axis (3k here). Studio.barChart() in app/js/studio.js builds this markup from a list of values.",
  },
  {
    id: "metric-tiles",
    name: "Metric tiles",
    group: "Creator studio",
    order: 80,
    app: "",
    css: ["app/css/studio.css"],
    screens: ["analytics.html"],
    text: "Two outlined tiles side by side, each with a small icon, a bold value and a label. Used under the charts on Analysis.",
    keywords: "analytics followers like rate stat",
    html: `
      <div class="an-metrics">
        <div class="an-metric"><i class="icon" data-lucide="users"></i><span class="an-metric__value">12k</span>Followers</div>
        <div class="an-metric"><i class="icon" data-lucide="thumbs-up"></i><span class="an-metric__value">12%</span>Like rates</div>
      </div>
    `,
    rn: `
      import { View, StyleSheet } from 'react-native';
      import { Lucide } from '@react-native-vector-icons/lucide';
      import { AppText } from '@/core/components';
      import { useTheme } from '@/core/hooks';

      const { colors } = useTheme();
      const metrics = [
        { icon: 'users', value: '12k', label: 'Followers' },
        { icon: 'thumbs-up', value: '12%', label: 'Like rates' },
      ] as const;

      <View style={styles.row}>
        {metrics.map(m => (
          <View key={m.label} style={[styles.tile, { borderColor: colors.outline }]}>
            <Lucide name={m.icon} size={14} color={colors.white} />
            <AppText variant="titleMedium" style={styles.value}>{m.value}</AppText>
            <AppText variant="labelSmall">{m.label}</AppText>
          </View>
        ))}
      </View>

      const styles = StyleSheet.create({
        row: { flexDirection: 'row', gap: 16 },
        tile: { flex: 1, padding: 16, borderWidth: 1, borderRadius: 16 },
        value: { fontWeight: '700', lineHeight: 32 },
      });
    `,
    rnKind: "pattern",
    rnWhere: "AnalysisScreen",
    frameCSS: ".cd-phone{padding:0 24px}",
  },
  {
    id: "upload-video-picker",
    name: "Video file picker",
    group: "Creator studio",
    order: 90,
    app: "",
    css: ["app/css/studio.css"],
    screens: ["upload.html", "upload.html?state=filled"],
    text: "A dashed drop zone that opens the video picker. Once a file is picked it is replaced by a grey row with the file name and a button to remove it.",
    keywords: "upload drop zone file video dashed",
    html: `
      <button class="up-drop" type="button" id="pick-video"><i class="icon" data-lucide="upload"></i><span class="up-drop__title">Upload video</span><span class="up-drop__hint">mp4, mov, or avi (max up to 2GB)</span></button>

      <!-- After a file is picked -->
      <div class="up-file"><i class="icon" data-lucide="clapperboard"></i><span class="up-file__name">myvideo.mp4</span><button class="icon-btn" type="button" id="remove-file" aria-label="Remove video file"><i class="icon" data-lucide="x"></i></button></div>
    `,
    rn: `
      import { useState } from 'react';
      import { View, Pressable, StyleSheet } from 'react-native';
      import { Lucide } from '@react-native-vector-icons/lucide';
      import { AppText } from '@/core/components';
      import { useTheme } from '@/core/hooks';

      const { colors } = useTheme();
      const [fileName, setFileName] = useState<string | null>('myvideo.mp4');

      {fileName ? (
        <View style={[styles.file, { backgroundColor: colors.surfaceVariant }]}>
          <Lucide name="clapperboard" size={20} color={colors.white} />
          <AppText variant="bodyMedium" numberOfLines={1} style={styles.name}>{fileName}</AppText>
          <Pressable onPress={() => setFileName(null)} accessibilityLabel="Remove video file" hitSlop={8}>
            <Lucide name="x" size={16} color={colors.white} />
          </Pressable>
        </View>
      ) : (
        <Pressable onPress={() => {}} style={[styles.drop, { borderColor: colors.outline }]}>
          <Lucide name="upload" size={28} color={colors.white} />
          <AppText variant="labelLarge" style={styles.title}>Upload video</AppText>
          <AppText variant="bodySmall" color="white50">mp4, mov, or avi (max up to 2GB)</AppText>
        </Pressable>
      )}

      const styles = StyleSheet.create({
        drop: { alignItems: 'center', gap: 8, paddingVertical: 32, paddingHorizontal: 24, borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 16 },
        title: { marginTop: 8, fontWeight: '600' },
        file: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 16 },
        name: { flex: 1 },
      });
    `,
    rnKind: "pattern",
    rnWhere: "UploadVideoScreen",
    frameCSS: ".cd-phone{padding:0 24px}",
  },
  {
    id: "upload-thumbnail",
    name: "Thumbnail picker",
    group: "Creator studio",
    order: 100,
    app: "",
    css: ["app/css/studio.css"],
    screens: ["upload.html", "upload.html?state=short", "upload.html?state=filled"],
    text: "A 16:9 dashed drop zone for the thumbnail. Once an image is picked it shows as a preview with buttons to replace or remove it.",
    keywords: "upload thumbnail image preview remove drop zone",
    html: `
      <button class="up-drop up-drop--thumb" type="button" id="pick-thumb"><i class="icon" data-lucide="upload"></i><span class="up-drop__title">Upload thumbnail</span></button>

      <!-- After an image is picked -->
      <div class="up-thumb">
        <div class="up-thumb__img" style="background:linear-gradient(135deg,hsl(30 55% 32%),hsl(80 65% 18%))" role="img" aria-label="Thumbnail"></div>
        <div class="up-thumb__actions">
          <button class="btn" type="button"><i class="icon icon--sm" data-lucide="camera"></i>Upload thumbnail</button>
          <button class="btn btn-outline-red" type="button">Remove</button>
        </div>
      </div>
    `,
    rn: `
      import { useState } from 'react';
      import { View, Pressable, Image, StyleSheet } from 'react-native';
      import { Lucide } from '@react-native-vector-icons/lucide';
      import { AppButton, AppText } from '@/core/components';
      import { useTheme } from '@/core/hooks';

      const { colors } = useTheme();
      const [thumbUri, setThumbUri] = useState<string | null>(null);

      {thumbUri ? (
        <View style={styles.picked}>
          <Image source={{ uri: thumbUri }} style={[styles.frame, { borderColor: colors.outline }]} accessibilityLabel="Thumbnail" />
          <View style={styles.actions}>
            <AppButton label="Upload thumbnail" icon="camera" variant="outlined" textColor={colors.white} onPress={() => {}} />
            <AppButton label="Remove" variant="outlined" textColor={colors.primary} style={{ borderColor: colors.primary }} onPress={() => setThumbUri(null)} />
          </View>
        </View>
      ) : (
        <Pressable onPress={() => {}} style={[styles.frame, styles.drop, { borderColor: colors.outline }]}>
          <Lucide name="upload" size={28} color={colors.white} />
          <AppText variant="labelLarge">Upload thumbnail</AppText>
        </Pressable>
      )}

      const styles = StyleSheet.create({
        // For a short, use width: '52%' and aspectRatio: 9 / 16
        frame: { width: '100%', aspectRatio: 16 / 9, borderWidth: 1, borderRadius: 16 },
        drop: { alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderStyle: 'dashed' },
        picked: { gap: 16 },
        actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
      });
    `,
    rnKind: "pattern",
    rnWhere: "UploadVideoScreen",
    frameCSS: ".cd-phone{padding:0 24px}",
    note: "For a short, add up-drop--short or up-thumb__img--short for a 9:16 frame at half width. A picked image is set as the preview's background-image.",
  },
  {
    id: "upload-banner",
    name: "Upload progress banner",
    group: "Creator studio",
    order: 110,
    app: "UploadProgressBanner",
    css: ["app/css/studio.css"],
    screens: ["upload.html?state=uploading", "upload.html?state=paused", "upload.html?state=interrupted", "upload.html?state=failed", "upload.html?state=done"],
    text: "A card that floats over the top of the screen while a video uploads, with a thumbnail, status, progress bar and a button to cancel or dismiss. An interrupted upload adds Resume and Discard; a failed one shows a red alert icon.",
    keywords: "upload progress bar status error resume discard failed",
    html: `
      <!-- Uploading -->
      <div class="up-banner" role="status" aria-live="polite">
        <div class="up-banner__info">
          <span class="up-banner__thumb" style="background:linear-gradient(135deg,hsl(30 55% 32%),hsl(80 65% 18%))"><span class="up-banner__overlay"><span class="spinner spinner--white" aria-hidden="true"></span></span></span>
          <button class="up-banner__text" type="button" tabindex="-1"><span class="up-banner__title">Uploading Video...</span><span class="up-banner__sub">34% uploaded • Keep app open</span></button>
          <button class="icon-btn up-banner__close" type="button" aria-label="Cancel upload"><i class="icon" data-lucide="circle-x"></i></button>
        </div>
        <div class="up-banner__bar"><div class="up-banner__fill" style="width:34%"></div></div>
      </div>

      <!-- Interrupted -->
      <div class="up-banner" role="status" aria-live="polite">
        <div class="up-banner__info">
          <span class="up-banner__thumb" style="background:linear-gradient(135deg,hsl(30 55% 32%),hsl(80 65% 18%))"></span>
          <button class="up-banner__text" type="button"><span class="up-banner__title">Upload Interrupted</span><span class="up-banner__sub">46% uploaded • Tap Resume to continue</span></button>
          <button class="icon-btn up-banner__close up-banner__close--error" type="button" aria-label="Cancel upload"><i class="icon" data-lucide="circle-alert"></i></button>
        </div>
        <div class="up-banner__bar"><div class="up-banner__fill" style="width:46%"></div></div>
        <div class="up-banner__actions"><button class="up-banner__resume" type="button">Resume</button><button class="up-banner__discard" type="button">Discard</button></div>
      </div>

      <!-- Failed, with no thumbnail -->
      <div class="up-banner" role="status" aria-live="polite">
        <div class="up-banner__info">
          <span class="up-banner__thumb"><i class="icon" data-lucide="video"></i></span>
          <button class="up-banner__text" type="button" tabindex="-1"><span class="up-banner__title">Upload Failed</span><span class="up-banner__sub">Upload failed. Tap to dismiss</span></button>
          <button class="icon-btn up-banner__close up-banner__close--error" type="button" aria-label="Dismiss"><i class="icon" data-lucide="circle-alert"></i></button>
        </div>
      </div>
    `,
    rn: `
      import { UploadProgressBanner } from '@/features/home/components/UploadProgressBanner';

      // Render it once at the app root, above the screens, so it floats over whichever screen is open.
      // It takes no props: it follows the current upload and switches itself between
      // uploading, paused, interrupted (with Resume and Discard), failed and done.
      <UploadProgressBanner />
    `,
    rnKind: "usage",
    frameCSS: ".cd-phone{padding:0 16px}.cd-phone .up-banner{position:relative;top:auto;left:auto;right:auto}",
    note: "On a screen the banner is position:absolute at the top of the phone. Here the three states are stacked in place.",
  },
  {
    id: "content-tabs",
    name: "Content tabs and filters",
    group: "Creator studio",
    order: 120,
    app: "",
    css: ["app/css/studio.css"],
    screens: ["manage-contents.html", "manage-contents.html?state=shorts", "manage-contents.html?state=scheduled"],
    text: "Equal-width tabs for the content type with a red underline on the chosen one, then outlined filter buttons for published and scheduled content, and a red Delete all link.",
    keywords: "manage contents tabs filter published scheduled delete all segmented",
    html: `
      <div class="mc-tabs" role="tablist" aria-label="Content type">
        <button class="mc-tab" type="button" role="tab" aria-selected="true">Videos</button>
        <button class="mc-tab" type="button" role="tab" aria-selected="false">Shorts</button>
        <button class="mc-tab" type="button" role="tab" aria-selected="false">Lives</button>
      </div>
      <div class="mc-divider"></div>
      <div class="mc-filters">
        <button class="mc-filter" type="button" aria-pressed="true">Published</button>
        <button class="mc-filter" type="button" aria-pressed="false">Scheduled</button>
        <button class="mc-delete-all" type="button"><i class="icon" data-lucide="trash-2"></i>Delete all</button>
      </div>
    `,
    js: `
      document.addEventListener("click", (e) => {
        const tab = e.target.closest(".mc-tab");
        const filter = e.target.closest(".mc-filter");
        if (tab) document.querySelectorAll(".mc-tab").forEach((t) => t.setAttribute("aria-selected", t === tab));
        if (filter) document.querySelectorAll(".mc-filter").forEach((f) => f.setAttribute("aria-pressed", f === filter));
      });
    `,
    rn: `
      import { useState } from 'react';
      import { View, Pressable, StyleSheet } from 'react-native';
      import { Lucide } from '@react-native-vector-icons/lucide';
      import { AppText } from '@/core/components';
      import { useTheme } from '@/core/hooks';

      const { colors } = useTheme();
      const [tab, setTab] = useState('Videos');
      const [filter, setFilter] = useState('Published');

      <View style={styles.tabs}>
        {['Videos', 'Shorts', 'Lives'].map(t => (
          <Pressable key={t} onPress={() => setTab(t)} style={[styles.tab, t === tab && { borderBottomColor: colors.primary }]}>
            <AppText variant="titleSmall" align="center">{t}</AppText>
          </Pressable>
        ))}
      </View>
      <View style={styles.filters}>
        {['Published', 'Scheduled'].map(f => (
          <Pressable key={f} onPress={() => setFilter(f)} style={[styles.filter, { borderColor: colors.white }, f === filter && { backgroundColor: colors.white }]}>
            <AppText variant="labelLarge" color={f === filter ? 'black' : 'white'}>{f}</AppText>
          </Pressable>
        ))}
        <Pressable onPress={() => {}} style={styles.deleteAll}>
          <Lucide name="trash-2" size={18} color={colors.primary} />
          <AppText variant="labelLarge" color="primary">Delete all</AppText>
        </Pressable>
      </View>

      const styles = StyleSheet.create({
        tabs: { flexDirection: 'row', paddingHorizontal: 24 },
        tab: { flex: 1, paddingVertical: 16, borderBottomWidth: 2, borderBottomColor: 'transparent' },
        filters: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 16 },
        filter: { paddingVertical: 10, paddingHorizontal: 20, borderWidth: 1.5, borderRadius: 8 },
        deleteAll: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 'auto' },
      });
    `,
    rnKind: "pattern",
    rnWhere: "ContentStudioScreen",
    frameCSS: ".cd-phone{gap:0}",
  },
  {
    id: "content-item",
    name: "Content item",
    group: "Creator studio",
    order: 130,
    app: "",
    css: ["app/css/studio.css"],
    screens: ["manage-contents.html", "manage-contents.html?state=lives", "manage-contents.html?state=scheduled", "manage-contents.html?state=menu"],
    text: "One of the creator's own videos in Manage contents: a 16:9 thumbnail, title, views or scheduled time, and a menu to edit or delete. Live recordings add a Live badge and a view count on the thumbnail.",
    keywords: "manage contents video item menu edit delete scheduled live badge",
    html: `
      <article class="mc-item">
        <a class="mc-thumb" href="watch.html?id=v2" style="background:linear-gradient(135deg,hsl(94 55% 32%),hsl(144 65% 18%))" tabindex="-1" aria-hidden="true"></a>
        <div class="mc-foot">
          <a class="mc-body" href="watch.html?id=v2"><span class="mc-title">Writing a song in one hour</span><span class="mc-meta"><span>19K views • 1 day ago</span></span></a>
          <button class="icon-btn" type="button" aria-label="More options" aria-haspopup="menu" aria-expanded="true"><i class="icon" data-lucide="ellipsis-vertical"></i></button>
          <div class="mc-menu" role="menu">
            <button type="button" role="menuitem"><i class="icon" data-lucide="pencil"></i>Edit</button>
            <button type="button" role="menuitem"><i class="icon" data-lucide="trash-2"></i>Delete</button>
          </div>
        </div>
      </article>

      <!-- A live recording -->
      <article class="mc-item">
        <a class="mc-thumb" href="watch.html?id=v9" style="background:linear-gradient(135deg,hsl(12 55% 32%),hsl(62 65% 18%))" tabindex="-1" aria-hidden="true"><span class="mc-badge mc-badge--live"><span class="mc-badge__dot"></span>Live</span><span class="mc-badge mc-badge--views">12.5K</span></a>
        <div class="mc-foot">
          <a class="mc-body" href="watch.html?id=v9"><span class="mc-title">Late-night ranked with chat</span><span class="mc-meta"><span>12.5K views • 2 days ago</span></span></a>
          <button class="icon-btn" type="button" aria-label="More options" aria-haspopup="menu" aria-expanded="false"><i class="icon" data-lucide="ellipsis-vertical"></i></button>
          <div class="mc-menu" role="menu" hidden>
            <button type="button" role="menuitem"><i class="icon" data-lucide="trash-2"></i>Delete</button>
          </div>
        </div>
      </article>
    `,
    js: `
      document.addEventListener("click", (e) => {
        const btn = e.target.closest("[aria-haspopup='menu']");
        document.querySelectorAll(".mc-foot").forEach((foot) => {
          const own = foot.querySelector("[aria-haspopup='menu']");
          const open = own === btn && foot.querySelector(".mc-menu").hidden;
          foot.querySelector(".mc-menu").hidden = !open;
          own.setAttribute("aria-expanded", open);
        });
      });
    `,
    rn: `
      import { View, Pressable, ImageBackground, StyleSheet } from 'react-native';
      import { Lucide } from '@react-native-vector-icons/lucide';
      import { AppText } from '@/core/components';
      import { useTheme } from '@/core/hooks';

      const { colors, radius } = useTheme();

      <View style={styles.item}>
        <ImageBackground source={{ uri: thumbnailUri }} style={[styles.thumb, { backgroundColor: colors.surfaceVariant }]}>
          {isLive && (
            <View style={[styles.badge, { left: 12, borderRadius: radius.pill, backgroundColor: colors.overlayBlack }]}>
              <View style={[styles.dot, { backgroundColor: colors.primary }]} />
              <AppText variant="labelSmall">Live</AppText>
            </View>
          )}
        </ImageBackground>
        <View style={styles.foot}>
          <View style={styles.body}>
            <AppText variant="titleSmall" numberOfLines={2}>Writing a song in one hour</AppText>
            <AppText variant="bodySmall" color="white50">19K views • 1 day ago</AppText>
          </View>
          {/* Opens Edit (videos only) and Delete */}
          <Pressable onPress={() => {}} accessibilityLabel="More options" hitSlop={8}>
            <Lucide name="ellipsis-vertical" size={20} color={colors.white} />
          </Pressable>
        </View>
      </View>

      const styles = StyleSheet.create({
        item: { gap: 12, marginBottom: 24 },
        thumb: { aspectRatio: 16 / 9, borderRadius: 16, overflow: 'hidden' },
        badge: { position: 'absolute', top: 12, flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 12 },
        dot: { width: 8, height: 8, borderRadius: 4 },
        foot: { flexDirection: 'row', gap: 8 },
        body: { flex: 1, gap: 4 },
      });
    `,
    rnKind: "pattern",
    rnWhere: "ContentStudioScreen",
    frameCSS: ".cd-phone{padding:0 24px;gap:0}",
    note: "Only videos have Edit in the menu. A scheduled item shows two meta lines instead of views, such as Scheduled for Nov 5 and 3:00 PM.",
  },
  {
    id: "live-setting",
    name: "Setting row with light switch",
    group: "Creator studio",
    order: 140,
    app: "",
    css: ["app/css/studio.css"],
    screens: ["go-live.html", "go-live.html?state=tips-off"],
    text: "A label and a grey hint on the left with a switch on the right. On Go Live the switch is the light variant: solid red when on, a white track when off, and a white thumb either way.",
    keywords: "go live tips toggle switch--light setting",
    html: `
      <div class="live-setting">
        <div>
          <div class="live-setting__label" id="tips-label">Enable Tips</div>
          <div class="live-setting__hint" id="tips-hint">Allow viewers to send coins during stream</div>
        </div>
        <button class="switch switch--light" type="button" role="switch" aria-checked="true" aria-labelledby="tips-label" aria-describedby="tips-hint"></button>
      </div>

      <!-- Off -->
      <div class="live-setting">
        <div>
          <div class="live-setting__label" id="tips-label-2">Enable Tips</div>
          <div class="live-setting__hint">Allow viewers to send coins during stream</div>
        </div>
        <button class="switch switch--light" type="button" role="switch" aria-checked="false" aria-labelledby="tips-label-2"></button>
      </div>
    `,
    js: `
      document.querySelectorAll(".switch").forEach((s) => s.addEventListener("click", () => s.setAttribute("aria-checked", s.getAttribute("aria-checked") !== "true")));
    `,
    rn: `
      import { useState } from 'react';
      import { View, Switch, StyleSheet } from 'react-native';
      import { AppText } from '@/core/components';
      import { useTheme } from '@/core/hooks';

      const { colors } = useTheme();
      const [tips, setTips] = useState(true);

      <View style={styles.row}>
        <View style={styles.text}>
          <AppText variant="bodyLarge">Enable Tips</AppText>
          <AppText variant="bodySmall" color="white50">Allow viewers to send coins during stream</AppText>
        </View>
        {/* Light variant: a white track when off */}
        <Switch
          value={tips}
          onValueChange={setTips}
          trackColor={{ false: colors.white, true: colors.primary }}
          thumbColor={colors.white}
          accessibilityLabel="Enable Tips"
        />
      </View>

      const styles = StyleSheet.create({
        row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
        text: { flex: 1 },
      });
    `,
    rnKind: "pattern",
    rnWhere: "StartLiveScreen",
    frameCSS: ".cd-phone{padding:0 16px;gap:0}",
  },
  {
    id: "channel-photo",
    name: "Channel photo picker",
    group: "Creator studio",
    order: 150,
    app: "",
    css: ["app/css/studio.css"],
    screens: ["create-channel.html", "create-channel.html?state=errors", "create-channel.html?mode=edit"],
    text: "A round channel photo with buttons to upload or remove it. Before a photo is picked it shows a person icon, and a red message appears below if the form is sent without one.",
    keywords: "create channel avatar photo upload remove outline red",
    html: `
      <div class="ch-avatar-row">
        <span class="ch-avatar" role="img" aria-label="No channel photo"><i class="icon" data-lucide="user-round"></i></span>
        <div class="ch-avatar-actions">
          <button class="btn" type="button"><i class="icon icon--sm" data-lucide="camera"></i><span class="ch-long">Upload photo</span><span class="ch-short">Upload</span></button>
          <button class="btn btn-outline-red" type="button">Remove</button>
        </div>
      </div>
      <p class="s-error ch-avatar-error" role="alert">Upload profile image</p>
    `,
    rn: `
      import { View, StyleSheet } from 'react-native';
      import { Lucide } from '@react-native-vector-icons/lucide';
      import { AppAvatar, AppButton, AppText } from '@/core/components';
      import { useTheme } from '@/core/hooks';

      const { colors } = useTheme();

      <View style={styles.row}>
        {photoUri ? (
          <AppAvatar uri={photoUri} size={72} />
        ) : (
          <View style={[styles.empty, { backgroundColor: colors.surfaceVariant }]} accessibilityLabel="No channel photo">
            <Lucide name="user-round" size={48} color={colors.white50} />
          </View>
        )}
        <View style={styles.actions}>
          <AppButton label="Upload photo" icon="camera" variant="outlined" size="sm" textColor={colors.white} onPress={() => {}} />
          <AppButton label="Remove" variant="outlined" size="sm" textColor={colors.primary} style={{ borderColor: colors.primary }} onPress={() => {}} />
        </View>
      </View>
      {photoError && <AppText variant="bodySmall" color="error">Upload profile image</AppText>}

      const styles = StyleSheet.create({
        row: { flexDirection: 'row', alignItems: 'center', gap: 16 },
        empty: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
        actions: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
      });
    `,
    rnKind: "pattern",
    rnWhere: "CreateChannelScreen",
    frameCSS: ".cd-phone{padding:0 24px;gap:0}",
    note: "Under 400px wide the photo shrinks to 64px and the button says Upload. A picked photo is set as the circle's background-image. This grey placeholder is how the app draws a missing photo on this screen and on Edit profile; everywhere else a missing picture is the gradient Avatar.",
  },
  {
    id: "channel-success",
    name: "Channel success",
    group: "Creator studio",
    order: 160,
    app: "",
    css: ["app/css/studio.css"],
    screens: ["create-channel.html?state=success", "create-channel.html?state=edit-success"],
    text: "A centred confirmation that replaces the form after a channel is created or saved: a tick icon, a title, a short line and a full-width button.",
    keywords: "create channel done confirmation live",
    html: `
      <div class="ch-success">
        <i class="icon" data-lucide="circle-check-big"></i>
        <h1 class="ch-success__title">Your channel is live!</h1>
        <p class="ch-success__text">Start creating<br>content and grow your audience.</p>
        <a class="btn btn--primary" href="discover.html">Continues</a>
      </div>
    `,
    rn: `
      import { View, StyleSheet } from 'react-native';
      import { Lucide } from '@react-native-vector-icons/lucide';
      import { AppButton, AppText } from '@/core/components';
      import { useTheme } from '@/core/hooks';

      const { colors } = useTheme();

      <View style={styles.success}>
        <Lucide name="circle-check-big" size={40} color={colors.white} style={styles.icon} />
        <AppText variant="titleLarge" align="center" style={styles.title}>Your channel is live!</AppText>
        <AppText variant="bodyMedium" align="center">Start creating content and grow your audience.</AppText>
        <AppButton label="Continues" fullWidth onPress={() => {}} />
      </View>

      const styles = StyleSheet.create({
        success: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 24 },
        icon: { marginBottom: 12 },
        title: { fontWeight: '700' },
      });
    `,
    rnKind: "pattern",
    rnWhere: "CreateChannelScreen",
    note: "The button label matches the app as it is today.",
  },
  {
    id: "studio-field",
    name: "Studio form field",
    group: "Inputs and forms",
    order: 50,
    app: "AppInput",
    css: ["app/css/studio.css"],
    screens: ["upload.html", "create-channel.html", "create-channel.html?state=errors", "create-channel.html?mode=edit", "go-live.html"],
    text: "The larger outlined field used on the creator forms, with a bold label above. It can show a character count, a red error message or an orange hint, and can start with an icon.",
    keywords: "input textarea label error hint counter s-field s-input",
    html: `
      <div class="s-field">
        <label class="s-label" for="title">Title</label>
        <input class="s-input" id="title" type="text" placeholder="Enter video title..." autocomplete="off">
      </div>

      <div class="s-field">
        <label class="s-label" for="desc">Description</label>
        <textarea class="s-input" id="desc" rows="4" maxlength="250" placeholder="Describe your video..." aria-describedby="desc-count"></textarea>
        <span class="s-count" id="desc-count" aria-live="polite">0/250</span>
      </div>

      <!-- With an error -->
      <div class="s-field s-field--invalid">
        <label class="s-label" for="name">Channel name</label>
        <input class="s-input" id="name" type="text" placeholder="e.g. King Pin" autocomplete="off" aria-invalid="true">
        <p class="s-error" role="alert">Enter your channel name</p>
      </div>

      <!-- With a hint -->
      <div class="s-field">
        <label class="s-label" for="handle">Channel handle</label>
        <input class="s-input" id="handle" type="text" value="@pixelforge" autocomplete="off" spellcheck="false">
        <p class="s-hint">If you change your channel handle, you won't be able to change it again for 30 days.</p>
      </div>

      <!-- With an icon -->
      <div class="s-field">
        <label class="s-label" for="stream-title">Stream Title</label>
        <div class="s-input-icon"><i class="icon" data-lucide="pencil"></i><input class="s-input" id="stream-title" type="text" placeholder="What's your stream about?" autocomplete="off"></div>
      </div>
    `,
    js: `
      const desc = document.getElementById("desc");
      desc.addEventListener("input", () => { document.getElementById("desc-count").textContent = desc.value.length + "/250"; });
    `,
    rn: `
      import { useState } from 'react';
      import { AppInput, AppSearchBar, AppText } from '@/core/components';

      const [desc, setDesc] = useState('');
      const [streamTitle, setStreamTitle] = useState('');

      <AppInput label="Title" placeholder="Enter video title..." onChangeText={() => {}} />

      <AppInput label="Description" placeholder="Describe your video..." value={desc} onChangeText={setDesc} multiline numberOfLines={4} maxLength={250} />
      <AppText variant="bodySmall" color="white50" align="right">{desc.length}/250</AppText>

      {/* With an error */}
      <AppInput label="Channel name" placeholder="e.g. King Pin" onChangeText={() => {}} errorText="Enter your channel name" />

      {/* With a hint. helperText shows in grey, so the orange hint is its own line */}
      <AppInput label="Channel handle" defaultValue="@pixelforge" autoCapitalize="none" onChangeText={() => {}} />
      <AppText variant="bodySmall" color="orange">If you change your channel handle, you won't be able to change it again for 30 days.</AppText>

      {/* With an icon. AppSearchBar takes Material Community Icons names */}
      <AppText variant="labelLarge">Stream Title</AppText>
      <AppSearchBar leftIcon="pencil" placeholder="What's your stream about?" value={streamTitle} onChangeText={setStreamTitle} />
    `,
    rnKind: "usage",
    rnUses: ["AppInput", "AppText", "AppSearchBar"],
    frameCSS: ".cd-phone{padding:0 24px;gap:0}",
  },
  {
    id: "studio-select",
    name: "Select field",
    group: "Inputs and forms",
    order: 51,
    app: "AppDropdown",
    css: ["app/css/studio.css"],
    screens: ["upload.html", "upload.html?state=scheduled", "go-live.html", "create-channel.html"],
    text: "A field-sized button that shows the chosen option and opens the dropdown list. The picker version, with a calendar or clock icon, opens the phone's date or time picker.",
    keywords: "dropdown select category date time picker trigger s-select",
    html: `
      <div class="s-field">
        <span class="s-label" id="category-label">Category</span>
        <button class="s-select" type="button" id="category" aria-haspopup="listbox" aria-labelledby="category-label category"><span class="s-select__value">Gaming</span><i class="icon" data-lucide="chevron-down"></i></button>
      </div>

      <!-- Date and time pickers -->
      <div class="s-field">
        <span class="s-label" id="date-label">Date</span>
        <button class="s-select s-select--picker" type="button" id="date-btn" aria-labelledby="date-label date-btn"><span class="s-select__value">Nov 5, 2026</span><i class="icon" data-lucide="calendar"></i></button>
      </div>
      <div class="s-field">
        <span class="s-label" id="time-label">Time</span>
        <button class="s-select s-select--picker" type="button" id="time-btn" aria-labelledby="time-label time-btn"><span class="s-select__value s-select__value--placeholder">Pick a time</span><i class="icon" data-lucide="clock-9"></i></button>
      </div>
    `,
    rn: `
      import { useState } from 'react';
      import { AppDropdown } from '@/core/components';

      const [category, setCategory] = useState<string | number | null>('Gaming');

      <AppDropdown
        label="Category"
        placeholder="Select a category"
        options={[
          { label: 'Gaming', value: 'Gaming' },
          { label: 'Music', value: 'Music' },
          { label: 'Sports', value: 'Sports' },
        ]}
        value={category}
        onSelect={setCategory}
      />

      // AppDropdown only opens option lists. The Date and Time fields are field-sized
      // Pressables with a calendar or clock icon that open the phone's date or time picker.
    `,
    rnKind: "usage",
    frameCSS: ".cd-phone{padding:0 24px;gap:0}",
    note: "On the upload screen each picker button sits next to a hidden native date or time input (.s-hidden-input) that it opens.",
  },
  {
    id: "studio-dropdown",
    name: "Dropdown list",
    group: "Overlays",
    order: 50,
    app: "AppDropdown",
    css: ["app/css/studio.css"],
    screens: ["upload.html?state=category", "upload.html?state=type", "go-live.html?state=category", "create-channel.html?state=category"],
    text: "A centred card over a dimmed screen with a title, a close button and a list of options. The chosen option is tinted red with a tick. Opened from a select field.",
    keywords: "dropdown select options list category modal s-dd",
    html: `
      <div class="s-dd-backdrop">
        <div class="s-dd" role="dialog" aria-modal="true" aria-labelledby="dd-title" tabindex="-1">
          <div class="s-dd__head"><h2 class="s-dd__title" id="dd-title">Category</h2><button class="icon-btn" type="button" aria-label="Close"><i class="icon" data-lucide="x"></i></button></div>
          <ul class="s-dd__list" role="listbox" aria-labelledby="dd-title">
            <li><button class="s-dd__opt" type="button" role="option" aria-selected="true"><span>Gaming</span><i class="icon" data-lucide="check"></i></button></li>
            <li><button class="s-dd__opt" type="button" role="option" aria-selected="false"><span>Music</span></button></li>
            <li><button class="s-dd__opt" type="button" role="option" aria-selected="false"><span>Sports</span></button></li>
            <li><button class="s-dd__opt" type="button" role="option" aria-selected="false"><span>Tech</span></button></li>
            <li><button class="s-dd__opt" type="button" role="option" aria-selected="false"><span>Entertainment</span></button></li>
          </ul>
        </div>
      </div>
    `,
    js: `
      const list = document.querySelector(".s-dd__list");
      list.addEventListener("click", (e) => {
        const opt = e.target.closest(".s-dd__opt");
        if (!opt) return;
        list.querySelectorAll(".s-dd__opt").forEach((o) => o.setAttribute("aria-selected", o === opt));
        opt.append(list.querySelector(".icon"));
      });
    `,
    rn: `
      import { useState } from 'react';
      import { AppDropdown } from '@/core/components';

      const [category, setCategory] = useState<string | number | null>('Gaming');

      // The list opens when the field is tapped. Its title is the label.
      <AppDropdown
        label="Category"
        options={['Gaming', 'Music', 'Sports', 'Tech', 'Entertainment'].map(c => ({ label: c, value: c }))}
        value={category}
        onSelect={setCategory}
      />

      // Options can start with an icon, named from Material Community Icons:
      // { label: 'Video', value: 'video', icon: 'video' }
    `,
    rnKind: "usage",
    height: 600,
    note: "Options can start with an icon, as the content type list does with video and circle-play. Long lists scroll inside the card.",
  },
  {
    id: "media-picker",
    name: "Media picker sheet",
    group: "Overlays",
    order: 51,
    app: "AppMediaPickerModal",
    css: ["app/css/studio.css"],
    screens: ["upload.html?state=picker", "create-channel.html?state=picker", "create-channel.html?state=edit-picker"],
    text: "A bottom sheet for choosing where a photo or video comes from: the camera or the library. When there is already a photo, a red row below a divider removes it.",
    keywords: "bottom sheet camera gallery library photo video remove upload",
    html: `
      <div class="sheet-backdrop">
        <div class="sheet-panel s-sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title" tabindex="-1">
          <div class="sheet-panel__handle"></div>
          <div class="s-sheet__head"><h2 class="s-sheet__title" id="sheet-title">Change channel photo</h2><button class="icon-btn" type="button" aria-label="Close"><i class="icon" data-lucide="x"></i></button></div>
          <div class="s-sheet__list">
            <label class="s-pick"><input class="s-hidden-input" type="file" accept="image/*" capture="environment"><span class="s-pick__box s-pick__box--camera"><i class="icon" data-lucide="camera"></i></span><span class="s-pick__label">Take Photo</span><i class="icon" data-lucide="chevron-right"></i></label>
            <label class="s-pick"><input class="s-hidden-input" type="file" accept="image/*"><span class="s-pick__box s-pick__box--gallery"><i class="icon" data-lucide="images"></i></span><span class="s-pick__label">Choose from Library</span><i class="icon" data-lucide="chevron-right"></i></label>
            <div class="s-sheet__divider"></div>
            <button class="s-pick s-pick--remove" type="button"><span class="s-pick__box s-pick__box--remove"><i class="icon" data-lucide="trash-2"></i></span><span class="s-pick__label">Remove Profile Picture</span></button>
          </div>
        </div>
      </div>
    `,
    rn: `
      import { useState } from 'react';
      import { AppMediaPickerModal } from '@/core/components';

      const [pickerOpen, setPickerOpen] = useState(false);

      <AppMediaPickerModal
        isVisible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title="Change channel photo"
        onCameraPress={() => {}}
        onGalleryPress={() => {}}
        onRemovePress={() => {}}
      />

      {/* For a video. Leave out onRemovePress to hide the remove row */}
      <AppMediaPickerModal
        isVisible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title="Select Video"
        cameraTitle="Take Video"
        onCameraPress={() => {}}
        onGalleryPress={() => {}}
      />
    `,
    rnKind: "usage",
    height: 420,
    note: "For a video, the title is Select Video, the camera row says Take Video and the inputs accept video/*. The remove row is left out when there is nothing to remove.",
  },
);
