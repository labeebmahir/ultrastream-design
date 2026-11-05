// Components from My Feed, Shorts, Search, Notifications and Live. Markup matches what app/js/feeds.js
// renders on app/my-feed.html, shorts.html, search.html, search-results.html, notifications.html and live.html.
(window.COMPONENTS = window.COMPONENTS || []).push(
  {
    id: "search-bar",
    name: "Search header",
    group: "Inputs and forms",
    order: 40,
    app: "AppSearchBar",
    css: ["app/css/feeds.css"],
    screens: ["search.html", "search-results.html"],
    text: "The header on the search screens: a back chevron and a white-outlined search box. A clear button appears once something is typed.",
    keywords: "search input query clear find",
    html: `
      <div class="feeds-search-head">
        <a class="icon-btn" href="discover.html" aria-label="Back"><i class="icon" data-lucide="chevron-left"></i></a>
        <form class="feeds-searchbar" role="search">
          <input type="search" placeholder="Search on UltraStream" aria-label="Search on UltraStream" autocomplete="off" enterkeyhint="search">
          <button class="icon-btn feeds-searchbar__clear" type="button" aria-label="Clear search" hidden><i class="icon" data-lucide="x"></i></button>
          <span class="feeds-searchbar__spacer"></span>
        </form>
      </div>
      <div class="feeds-search-head">
        <a class="icon-btn" href="search.html" aria-label="Back"><i class="icon" data-lucide="chevron-left"></i></a>
        <form class="feeds-searchbar" role="search">
          <input type="search" value="Best games" placeholder="Search on UltraStream" aria-label="Search on UltraStream" autocomplete="off" enterkeyhint="search">
          <button class="icon-btn feeds-searchbar__clear" type="button" aria-label="Clear search"><i class="icon" data-lucide="x"></i></button>
          <span class="feeds-searchbar__spacer" hidden></span>
        </form>
      </div>`,
    js: `
      // The clear button shows only when there is text; a same-sized spacer keeps the box from jumping
      document.querySelectorAll(".feeds-searchbar").forEach((form) => {
        const input = form.querySelector("input");
        const clear = form.querySelector(".feeds-searchbar__clear");
        const spacer = form.querySelector(".feeds-searchbar__spacer");
        const sync = () => { const has = input.value.length > 0; clear.hidden = !has; spacer.hidden = has; };
        input.addEventListener("input", sync);
        clear.addEventListener("click", () => { input.value = ""; sync(); input.focus(); });
      });`,
    rn: `
      import { useState } from 'react';
      import { Pressable, StyleSheet, View } from 'react-native';
      import { Lucide } from '@react-native-vector-icons/lucide';
      import { AppSearchBar } from '@/core/components';
      import { useTheme } from '@/core/hooks';

      const { colors } = useTheme();
      const [query, setQuery] = useState('');

      // AppSearchBar draws the box and its clear button; the back chevron sits beside it
      <View style={styles.head}>
        <Pressable onPress={() => {}} accessibilityLabel="Back" hitSlop={8}>
          <Lucide name="chevron-left" size={24} color={colors.white} />
        </Pressable>
        <AppSearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Search on UltraStream"
          onSubmitEditing={() => {}}
          autoFocus
          style={styles.bar}
        />
      </View>

      const styles = StyleSheet.create({
        head: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16 },
        bar: { flex: 1 },
      });`,
    rnKind: "usage",
  },
  {
    id: "search-suggestions",
    name: "Search suggestions",
    group: "Cards and lists",
    order: 60,
    app: "SearchScreen",
    css: ["app/css/feeds.css"],
    screens: ["search.html", "search.html?q=pixel", "search.html?state=empty"],
    text: "Rows under the search bar. With nothing typed they list recent searches with Clear all; while typing they suggest creators and videos. Each row fills the search when tapped.",
    keywords: "history recent suggestion autocomplete clear all",
    html: `
      <div class="feeds-search-list">
        <div class="feeds-history-head"><h2>Recent searches</h2><button class="feeds-link-btn" type="button">Clear all</button></div>
        <button class="feeds-suggestion" type="button">
          <span class="feeds-suggestion__left"><i class="icon" data-lucide="clock-8"></i><span class="feeds-suggestion__text">Best games</span></span><i class="icon" data-lucide="arrow-up-left"></i>
        </button>
        <button class="feeds-suggestion" type="button">
          <span class="feeds-suggestion__left"><i class="icon" data-lucide="clock-8"></i><span class="feeds-suggestion__text">street food</span></span><i class="icon" data-lucide="arrow-up-left"></i>
        </button>
      </div>
      <div class="feeds-search-list feeds-search-list--pad">
        <button class="feeds-suggestion" type="button">
          <span class="feeds-suggestion__left"><i class="icon" data-lucide="user"></i><span class="feeds-suggestion__text">PixelForge</span></span><i class="icon" data-lucide="arrow-up-left"></i>
        </button>
        <button class="feeds-suggestion" type="button">
          <span class="feeds-suggestion__left"><i class="icon" data-lucide="search"></i><span class="feeds-suggestion__text">Speedrun attempts until I win</span></span><i class="icon" data-lucide="arrow-up-left"></i>
        </button>
      </div>`,
    rn: `
      import { Pressable, StyleSheet, View } from 'react-native';
      import { Lucide } from '@react-native-vector-icons/lucide';
      import { AppText } from '@/core/components';
      import { useTheme } from '@/core/hooks';

      const { colors } = useTheme();

      <View style={styles.head}>
        <AppText variant="titleMedium" style={styles.semi}>Recent searches</AppText>
        <Pressable onPress={() => {}}><AppText variant="bodyMedium" style={styles.semi}>Clear all</AppText></Pressable>
      </View>
      {/* While typing, use user for a creator and search for a video */}
      {recent.map(term => (
        <Pressable key={term} style={styles.row} onPress={() => setQuery(term)}>
          <View style={styles.left}>
            <Lucide name="clock-8" size={24} color={colors.white50} />
            <AppText variant="bodyLarge" numberOfLines={1} style={styles.flex}>{term}</AppText>
          </View>
          <Lucide name="arrow-up-left" size={24} color={colors.white50} />
        </Pressable>
      ))}

      const styles = StyleSheet.create({
        head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, marginBottom: 12 },
        row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, paddingVertical: 16 },
        left: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 16 },
        flex: { flex: 1 },
        semi: { fontWeight: '600' },
      });`,
    rnKind: "pattern",
    rnWhere: "SearchScreen",
    note: "Icons: <code>clock-8</code> for a recent search, <code>user</code> for a creator, <code>search</code> for a video. With no history the list shows a <code>history</code> icon and \"No recent searches yet.\"",
  },
  {
    id: "people-result",
    name: "Creator search result",
    group: "Cards and lists",
    order: 70,
    app: "AppPeopleCard",
    css: ["app/css/feeds.css"],
    screens: ["search-results.html?filter=accounts"],
    text: "A creator in search results: a 52px avatar, name, handle and follower count, and Follow. Once followed, the button turns outlined and reads Following.",
    keywords: "person creator account follow following search result",
    html: `
      <div class="feeds-results__people">
        <div class="feeds-people">
          <a class="feeds-people__link" href="channel.html?c=PixelForge"><span class="avatar" aria-hidden="true"><i class="icon" data-lucide="user"></i></span><span class="feeds-people__text"><span class="feeds-people__name">PixelForge</span><span class="feeds-people__meta">pixelforge • 128K followers</span></span></a>
          <button class="btn btn--primary" type="button" aria-pressed="false">Follow</button>
        </div>
        <div class="feeds-people">
          <a class="feeds-people__link" href="channel.html?c=StreetPlate"><span class="avatar" aria-hidden="true"><i class="icon" data-lucide="user"></i></span><span class="feeds-people__text"><span class="feeds-people__name">StreetPlate</span><span class="feeds-people__meta">streetplate • 94K followers</span></span></a>
          <button class="btn" type="button" aria-pressed="true">Following</button>
        </div>
      </div>`,
    js: `
      document.querySelectorAll(".feeds-people .btn").forEach((b) => b.addEventListener("click", () => {
        const on = b.getAttribute("aria-pressed") !== "true";
        b.setAttribute("aria-pressed", on);
        b.textContent = on ? "Following" : "Follow";
        b.classList.toggle("btn--primary", !on);
      }));`,
    rn: `
      import { AppPeopleCard } from '@/core/components';

      <AppPeopleCard
        avatarSource={{ uri: avatarUrl }}
        title="PixelForge"
        username="pixelforge"
        subtitle="128K followers"
        onPress={() => {}}
        actionLabel="Follow"
        onActionPress={() => {}}
      />

      // Once followed: outlined, reading Following
      <AppPeopleCard
        avatarSource={{ uri: avatarUrl }}
        title="StreetPlate"
        username="streetplate"
        subtitle="94K followers"
        onPress={() => {}}
        actionLabel="Following"
        buttonVariant="outlined"
        onActionPress={() => {}}
      />`,
    rnKind: "usage",
    note: "The smaller creator card in Discover is <a href=\"#c-people-card\">Creator card</a>.",
  },
  {
    id: "notification-row",
    name: "Notification row",
    group: "Cards and lists",
    order: 80,
    app: "NotificationsScreen",
    css: ["app/css/feeds.css"],
    screens: ["notifications.html", "notifications.html?state=read"],
    text: "One notification: an avatar with a small badge for the type, the name in bold with the message, and the time. Unread ones end with a dot; tapping marks it read.",
    keywords: "notification alert activity unread dot follow reward comment like",
    html: `
      <div class="feeds-notifs">
        <button class="feeds-notif" type="button" aria-label="PixelForge started following you. 5m ago, unread">
          <span class="feeds-notif__avatar"><i class="icon" data-lucide="user-round"></i><span class="feeds-notif__type"><i class="icon" data-lucide="user-round-plus"></i></span></span>
          <span class="feeds-notif__body"><span><b>PixelForge</b> started following you.</span><span class="feeds-notif__time">5m ago</span></span>
          <span class="feeds-notif__dot"></span>
        </button>
        <button class="feeds-notif" type="button" aria-label="StreetPlate sent you a reward. 1h ago, unread">
          <span class="feeds-notif__avatar"><i class="icon" data-lucide="user-round"></i><span class="feeds-notif__type"><i class="icon" data-lucide="hand-coins"></i></span></span>
          <span class="feeds-notif__body"><span><b>StreetPlate</b> sent you a reward.</span><span class="feeds-notif__time">1h ago</span></span>
          <span class="feeds-notif__dot"></span>
        </button>
        <button class="feeds-notif" type="button" aria-label="ByteBench commented on your video: “Clean setup.” 3h ago">
          <span class="feeds-notif__avatar"><i class="icon" data-lucide="user-round"></i><span class="feeds-notif__type"><i class="icon" data-lucide="message-square-text"></i></span></span>
          <span class="feeds-notif__body"><span><b>ByteBench</b> commented on your video: “Clean setup.”</span><span class="feeds-notif__time">3h ago</span></span>
        </button>
      </div>`,
    js: `
      // Tapping a notification marks it read
      document.querySelectorAll(".feeds-notif").forEach((n) => n.addEventListener("click", () => n.querySelector(".feeds-notif__dot")?.remove()));`,
    rn: `
      import { Pressable, StyleSheet, View } from 'react-native';
      import { Lucide } from '@react-native-vector-icons/lucide';
      import { AppText } from '@/core/components';
      import { useTheme } from '@/core/hooks';

      const { colors } = useTheme();

      <Pressable style={[styles.row, { borderColor: colors.white50 }]} onPress={() => {}}>
        <View style={[styles.avatar, { backgroundColor: colors.surfaceVariant }]}>
          <Lucide name="user-round" size={40} color={colors.white50} />
          <View style={[styles.badge, { backgroundColor: colors.surfaceVariant, borderColor: colors.white }]}>
            <Lucide name="user-round-plus" size={12} color={colors.white} />
          </View>
        </View>
        <View style={styles.body}>
          <AppText variant="bodyLarge"><AppText variant="bodyLarge" style={styles.bold}>PixelForge</AppText> started following you.</AppText>
          <AppText variant="bodyMedium" color="white50">5m ago</AppText>
        </View>
        {unread && <View style={[styles.dot, { backgroundColor: colors.white50 }]} />}
      </Pressable>

      const styles = StyleSheet.create({
        row: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16, borderWidth: 1, borderRadius: 22 },
        avatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
        badge: { position: 'absolute', right: -2, bottom: -2, padding: 4, borderWidth: 2, borderRadius: 999 },
        body: { flex: 1, gap: 2 },
        bold: { fontWeight: '700' },
        dot: { width: 8, height: 8, borderRadius: 4 },
      });`,
    rnKind: "pattern",
    rnWhere: "NotificationsScreen",
    note: "Type badges: <code>hand-coins</code> reward, <code>message-square-text</code> comment, <code>heart</code> like, <code>user-round-plus</code> follow, <code>bell</code> anything else.",
  },
  {
    id: "notification-skeleton",
    name: "Notification loading rows",
    group: "Feedback and states",
    order: 70,
    app: "AppSkeleton",
    css: ["app/css/feeds.css"],
    screens: ["notifications.html?state=loading"],
    text: "Grey placeholder rows in the shape of notifications, gently pulsing while the list loads.",
    keywords: "skeleton placeholder loading shimmer pulse",
    html: `
      <div class="feeds-notifs">
        <div class="feeds-notif feeds-notif--skeleton feeds-pulse" aria-hidden="true"><span class="feeds-notif__avatar"></span><span class="feeds-notif__body"><span class="feeds-skeleton__line" style="width:80%;height:16px"></span><span class="feeds-skeleton__line" style="width:50%"></span></span></div>
        <div class="feeds-notif feeds-notif--skeleton feeds-pulse" aria-hidden="true"><span class="feeds-notif__avatar"></span><span class="feeds-notif__body"><span class="feeds-skeleton__line" style="width:80%;height:16px"></span><span class="feeds-skeleton__line" style="width:50%"></span></span></div>
        <div class="feeds-notif feeds-notif--skeleton feeds-pulse" aria-hidden="true"><span class="feeds-notif__avatar"></span><span class="feeds-notif__body"><span class="feeds-skeleton__line" style="width:80%;height:16px"></span><span class="feeds-skeleton__line" style="width:50%"></span></span></div>
      </div>`,
    rn: `
      import { StyleSheet, View } from 'react-native';
      import { AppSkeleton } from '@/core/components';

      // One row; show three while the list loads. AppSkeleton pulses on its own
      <View style={styles.row}>
        <AppSkeleton width={56} height={56} borderRadius={28} />
        <View style={styles.lines}>
          <AppSkeleton width="80%" height={16} />
          <AppSkeleton width="50%" height={14} />
        </View>
      </View>

      const styles = StyleSheet.create({
        row: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16 },
        lines: { flex: 1, gap: 4 },
      });`,
    rnKind: "usage",
  },
  {
    id: "feed-skeleton",
    name: "Video loading cards",
    group: "Feedback and states",
    order: 71,
    app: "AppSkeleton",
    css: ["app/css/feeds.css"],
    screens: ["my-feed.html?state=loading"],
    text: "Grey placeholders in the shape of video cards: a 16:9 thumbnail, a round avatar and two lines. They pulse while the feed loads, and stay still for people who turn off motion.",
    keywords: "skeleton placeholder loading shimmer pulse card",
    html: `
      <div class="feeds-list">
        <div class="feeds-skeleton feeds-pulse" aria-hidden="true">
          <div class="feeds-skeleton__thumb"></div>
          <div class="feeds-skeleton__row"><span class="feeds-skeleton__dot"></span><span class="feeds-skeleton__lines"><span class="feeds-skeleton__line"></span><span class="feeds-skeleton__line feeds-skeleton__line--short"></span></span></div>
        </div>
        <div class="feeds-skeleton feeds-pulse" aria-hidden="true">
          <div class="feeds-skeleton__thumb"></div>
          <div class="feeds-skeleton__row"><span class="feeds-skeleton__dot"></span><span class="feeds-skeleton__lines"><span class="feeds-skeleton__line"></span><span class="feeds-skeleton__line feeds-skeleton__line--short"></span></span></div>
        </div>
      </div>`,
    rn: `
      import { StyleSheet, View } from 'react-native';
      import { AppSkeleton } from '@/core/components';

      // One card. Width defaults to 100%; height "auto" lets the 16:9 ratio set it
      <View style={styles.card}>
        <AppSkeleton height="auto" borderRadius={16} style={styles.thumb} />
        <View style={styles.row}>
          <AppSkeleton width={36} height={36} borderRadius={18} />
          <View style={styles.lines}>
            <AppSkeleton height={14} />
            <AppSkeleton width="55%" height={14} />
          </View>
        </View>
      </View>

      const styles = StyleSheet.create({
        card: { paddingTop: 12 },
        thumb: { aspectRatio: 16 / 9 },
        row: { flexDirection: 'row', gap: 12, paddingTop: 12 },
        lines: { flex: 1, gap: 8 },
      });`,
    rnKind: "usage",
  },
  {
    id: "feed-states",
    name: "Feed offline and end states",
    group: "Feedback and states",
    order: 72,
    app: "AppListErrorState",
    css: ["app/css/feeds.css"],
    screens: ["my-feed.html?state=offline", "shorts.html?state=caught-up", "notifications.html?state=error", "search.html?state=no-results"],
    text: "The centred state on My Feed, Shorts, Notifications, Search and Live. Offline has a larger icon and grey 16px text. The same layout covers errors, no results and the end of the shorts feed.",
    keywords: "offline error retry caught up no results wifi refresh",
    html: `
      <div class="empty-state feeds-state feeds-state--offline">
        <i class="icon empty-state__icon" data-lucide="wifi-off"></i>
        <h2 class="empty-state__title">You're offline</h2>
        <p class="empty-state__text">Connect to the internet and try again</p>
        <button class="btn btn--primary" type="button" data-retry>Retry</button>
      </div>
      <div class="empty-state feeds-state">
        <i class="icon empty-state__icon" data-lucide="party-popper"></i>
        <h2 class="empty-state__title">You're all caught up</h2>
        <p class="empty-state__text">You've watched all available shorts. Check back later for new content</p>
        <button class="btn btn--primary" type="button" data-retry>Refresh</button>
      </div>`,
    rn: `
      import { AppButton, AppListCenteredState, AppListErrorState, AppNoDataComponent } from '@/core/components';

      // Offline. variant="server" shows Something went wrong instead
      <AppListErrorState variant="offline" onRetry={() => {}} />

      // End of the shorts feed
      <AppListCenteredState>
        <AppNoDataComponent
          icon="party-popper"
          title="You're all caught up"
          description="You've watched all available shorts. Check back later for new content"
        />
        <AppButton label="Refresh" onPress={() => {}} />
      </AppListCenteredState>

      // No results: AppNoDataComponent with icon="search-x" and no button`,
    rnKind: "usage",
    rnUses: ["AppListErrorState", "AppListCenteredState", "AppNoDataComponent", "AppButton"],
    note: "Error: <code>triangle-alert</code>, \"Something went wrong\". No results: <code>search-x</code> with <code>feeds-state__icon-lg</code> and no button. The shared version is <a href=\"#c-error-state\">Error and offline state</a>.",
  },
  {
    id: "guest-state",
    name: "Sign-up required state",
    group: "Feedback and states",
    order: 73,
    app: "AppLoginRequired",
    css: ["app/css/feeds.css"],
    screens: ["my-feed.html?state=guest", "notifications.html?state=guest"],
    text: "Fills a tab that needs an account when someone is browsing without one, with a Sign up button.",
    keywords: "guest login required sign up account",
    html: `
      <div class="empty-state feeds-state">
        <i class="icon empty-state__icon" data-lucide="sparkles"></i>
        <h2 class="empty-state__title">Sign up to explore everything</h2>
        <p class="empty-state__text">The next-gen streaming platform where<br>creators earn and viewers engage</p>
        <a class="btn btn--primary" href="sign-up.html">Sign up</a>
      </div>`,
    rn: `
      import { AppLoginRequired } from '@/core/components';

      // The default title, two-line text and sparkles icon match this design
      <AppLoginRequired onLoginPress={() => {}} />

      // title, description and icon (a Lucide name) can be changed per tab
      <AppLoginRequired title="Sign up to explore everything" icon="sparkles" onLoginPress={() => {}} />`,
    rnKind: "usage",
  },
  {
    id: "auth-sheet",
    name: "Join prompt",
    group: "Overlays",
    order: 40,
    app: "AppAuthModal",
    css: ["app/css/feeds.css"],
    screens: ["shorts.html?state=guest"],
    text: "A bottom sheet that appears when someone without an account taps like, comment or reward, asking them to sign up or sign in.",
    keywords: "guest login sign up modal auth required lock",
    html: `
      <div class="sheet-backdrop">
        <div class="sheet-panel" role="dialog" aria-modal="true">
          <div class="sheet-panel__handle"></div>
          <div class="feeds-auth">
            <span class="feeds-auth__icon"><i class="icon" data-lucide="lock"></i></span>
            <h2 class="feeds-auth__title">Join UltraStream</h2>
            <p class="feeds-auth__text">Sign up to like, comment, share and reward<br>your favourite creators.</p>
            <a class="btn btn--primary" href="sign-up.html">Create a free account</a>
            <p class="feeds-auth__alt">Already have an account? <a href="sign-in.html">Sign in</a></p>
          </div>
        </div>
      </div>`,
    rn: `
      import { useState } from 'react';
      import { AppAuthModal } from '@/core/components';

      const [authOpen, setAuthOpen] = useState(false);

      // Open it when a guest taps like, comment or reward. The sheet has its own
      // Create a free account and Sign in actions
      <AppAuthModal
        isVisible={authOpen}
        onClose={() => setAuthOpen(false)}
        message="Sign up to like, comment, share and reward your favourite creators."
      />`,
    rnKind: "usage",
    height: 480,
    note: "On the shorts screen, tap like on any short with <code>?state=guest</code> to open it.",
  },
  {
    id: "short-comments",
    name: "Short comments sheet",
    group: "Overlays",
    order: 41,
    app: "AppInlineCommentsSheet",
    css: ["app/css/feeds.css"],
    screens: ["shorts.html"],
    text: "Comments on a short, in a sheet that covers the lower half of the screen so the video stays visible. A box at the bottom adds a comment.",
    keywords: "comments sheet reply compose short",
    html: `
      <div class="sheet-backdrop">
        <div class="sheet-panel feeds-comments" role="dialog" aria-modal="true">
          <div class="sheet-panel__handle"></div>
          <h2 class="feeds-comments__title">Comments</h2>
          <div class="feeds-comments__list">
            <div class="feeds-comment"><span class="avatar" aria-hidden="true"><i class="icon" data-lucide="user"></i></span><div><span class="feeds-comment__name">PlainTerms<span class="feeds-comment__when">1h ago</span></span>This is so satisfying to watch.</div></div>
            <div class="feeds-comment"><span class="avatar" aria-hidden="true"><i class="icon" data-lucide="user"></i></span><div><span class="feeds-comment__name">FarRoutes<span class="feeds-comment__when">3h ago</span></span>Need a longer version of this.</div></div>
            <div class="feeds-comment"><span class="avatar" aria-hidden="true"><i class="icon" data-lucide="user"></i></span><div><span class="feeds-comment__name">OpenCanvas<span class="feeds-comment__when">5h ago</span></span>The ending got me.</div></div>
          </div>
          <form class="feeds-compose"><input class="input" name="comment" placeholder="Add a comment..." aria-label="Add a comment" autocomplete="off"><button class="btn btn--primary btn--sm" type="submit" aria-label="Post comment"><i class="icon icon--sm" data-lucide="send"></i></button></form>
        </div>
      </div>`,
    rn: `
      import { useState } from 'react';
      import { AppInlineCommentsSheet } from '@/core/components';

      const [commentsOpen, setCommentsOpen] = useState(false);

      // Loads and posts the comments for videoId itself. modal covers the tab bar on Shorts
      <AppInlineCommentsSheet
        isVisible={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        videoId={short.id}
        presentation="modal"
        modalHeightRatio={0.5}
        onCommentPosted={() => {}}
      />`,
    rnKind: "usage",
    height: 640,
    note: "Tap the comments button on any short to open it.",
  },
  {
    id: "short-video",
    name: "Short video",
    group: "Video",
    order: 40,
    app: "ShortVideoItem",
    css: ["app/css/feeds.css"],
    screens: ["shorts.html", "shorts.html?state=controls-hidden", "shorts.html?state=video-error", "channel-shorts.html"],
    text: "One full-screen short: title, creator and description at the top, like, dislike, comments, reward and share along the bottom, and a thin progress bar you can drag. Tap the video to pause. The eye button hides everything but itself.",
    keywords: "shorts vertical video reel like dislike progress seek pause",
    html: `
      <section class="feeds-shorts__page">
        <article class="short">
          <div class="short__video" style="background:linear-gradient(135deg,hsl(47 55% 32%),hsl(97 65% 18%))"></div>
          <button class="short__tap" type="button" aria-label="Play or pause"><span class="short__pill"><i class="icon" data-lucide="pause"></i></span></button>
          <div class="short__top">
            <div class="short__row"><span class="avatar avatar--40" aria-hidden="true"><i class="icon" data-lucide="user"></i></span>
              <div class="short__text"><h2 class="short__title">One-pan garlic noodles</h2><span class="short__sub"><a href="channel.html?c=StreetPlate">StreetPlate</a> • 210K views • 5 hours ago</span></div>
            </div>
            <p class="short__desc">Shot in one take. Let me know what you want to see next.</p>
          </div>
          <div class="short__bottom">
            <div class="short__actions">
              <button class="short-btn" type="button" data-like aria-pressed="true" aria-label="Like"><i class="icon" data-lucide="thumbs-up"></i><span>12.6k</span></button>
              <button class="short-btn" type="button" data-dislike aria-pressed="false" aria-label="Dislike"><i class="icon" data-lucide="thumbs-down"></i></button>
              <button class="short-btn" type="button" aria-label="Comments"><i class="icon" data-lucide="message-circle"></i><span>120</span></button>
              <button class="short-btn" type="button" aria-label="Reward"><i class="icon" data-lucide="hand-coins"></i></button>
              <button class="short-btn" type="button" aria-label="Share"><i class="icon" data-lucide="share"></i></button>
            </div>
            <button class="short-btn" type="button" data-eye aria-label="Hide controls"><i class="icon" data-lucide="eye"></i></button>
          </div>
          <div class="short__progress" role="slider" tabindex="0" aria-label="Seek" aria-valuemin="0" aria-valuemax="100" aria-valuenow="35"><div class="short__track"><div class="short__fill" style="width:35%"></div><span class="short__thumb" style="left:35%"></span></div></div>
        </article>
      </section>`,
    js: `
      const short = document.querySelector(".short");
      const icon = (name) => '<i class="icon" data-lucide="' + name + '"></i>';
      // Tap the video to pause; the round pill shows play while paused
      short.querySelector(".short__tap").addEventListener("click", () => {
        const paused = short.classList.toggle("short--paused");
        short.querySelector(".short__pill").innerHTML = icon(paused ? "play" : "pause");
      });
      // Like and dislike: pressed buttons turn white, one at a time
      short.querySelectorAll("[data-like], [data-dislike]").forEach((b) => b.addEventListener("click", () => {
        const on = b.getAttribute("aria-pressed") !== "true";
        short.querySelectorAll("[data-like], [data-dislike]").forEach((x) => x.setAttribute("aria-pressed", "false"));
        b.setAttribute("aria-pressed", on);
      }));
      // The eye hides the text and actions
      const eye = short.querySelector("[data-eye]");
      eye.addEventListener("click", () => {
        const hidden = short.classList.toggle("short--hidden");
        eye.setAttribute("aria-label", hidden ? "Show controls" : "Hide controls");
        eye.innerHTML = icon(hidden ? "eye-off" : "eye");
      });`,
    rn: `
      import { useState } from 'react';
      import { ShortVideoItem } from '@/features/shorts/components/ShortVideoItem';

      const [controlsVisible, setControlsVisible] = useState(true);

      // short is a DiscoverItem from the shorts feed; render one per full-screen page.
      // Like, dislike, pause and seeking are handled inside the item
      <ShortVideoItem
        item={short}
        isActive={index === activeIndex}
        isUIVisible={controlsVisible}
        onToggleUIVisibility={() => setControlsVisible(!controlsVisible)}
        onCommentsPress={() => setCommentsOpen(true)}
        onTipPress={() => {}}
        onSharePress={() => {}}
        commentCount={120}
        overlayTop={120}
        videoResizeMode="cover"
      />`,
    rnKind: "usage",
    frameCSS: ".cd-phone > .feeds-shorts__page { height: 720px; }",
    note: "Each short fills a page of <code>.feeds-shorts__list</code>, which snaps one short at a time; the preview gives it a fixed height. The text starts 120px down to clear the top bar and chips. While dragging, the bar gets <code>short__progress--seeking</code>. A broken video adds <code>short--error</code> and a <code>.short__error</code> overlay.",
  },
  {
    id: "live-player",
    name: "Live stream player",
    group: "Video",
    order: 50,
    app: "StreamScreen",
    css: ["app/css/feeds.css"],
    screens: ["live.html", "live.html?state=camera-off"],
    text: "The 300px video at the top of a live stream: back, a red LIVE badge and the viewer count across the top, with round like and reward buttons in the corner. A liked heart turns red.",
    keywords: "live stream badge viewers heart reward player",
    html: `
      <div class="feeds-live__video" style="background:linear-gradient(135deg,hsl(0 55% 32%),hsl(50 65% 18%))">
        <div class="feeds-live__overlay">
          <div class="feeds-live__top">
            <div class="feeds-live__left"><a class="feeds-live__back" href="discover.html" aria-label="Back"><i class="icon" data-lucide="chevron-left"></i></a><span class="feeds-badge feeds-badge--live"><i class="icon" data-lucide="radio"></i>LIVE</span></div>
            <span class="feeds-badge" aria-label="12.5K watching"><i class="icon" data-lucide="eye"></i>12.5K</span>
          </div>
          <div class="feeds-live__side">
            <button class="feeds-live__round" type="button" data-heart aria-pressed="false" aria-label="Like"><i class="icon" data-lucide="heart"></i></button>
            <button class="feeds-live__round" type="button" aria-label="Reward"><i class="icon" data-lucide="hand-coins"></i></button>
          </div>
        </div>
      </div>`,
    js: `
      document.querySelector("[data-heart]").addEventListener("click", (e) => {
        const b = e.currentTarget;
        b.setAttribute("aria-pressed", b.getAttribute("aria-pressed") !== "true");
      });`,
    rn: `
      import { Pressable, StyleSheet, View } from 'react-native';
      import { Lucide } from '@react-native-vector-icons/lucide';
      import { AppText } from '@/core/components';
      import { useTheme } from '@/core/hooks';

      const { colors } = useTheme();
      const dim = { backgroundColor: colors.translucentBlack };

      {/* The player fills styles.video; this overlay sits on top */}
      <View style={styles.video}>
        <View style={styles.top}>
          <View style={styles.row}>
            <Pressable style={[styles.round, styles.back, dim]} onPress={() => {}} accessibilityLabel="Back">
              <Lucide name="chevron-left" size={24} color={colors.white} />
            </Pressable>
            <View style={[styles.badge, { backgroundColor: colors.error }]}>
              <Lucide name="radio" size={14} color={colors.white} />
              <AppText variant="labelMedium" style={styles.bold}>LIVE</AppText>
            </View>
          </View>
          <View style={[styles.badge, dim]}>
            <Lucide name="eye" size={14} color={colors.white} />
            <AppText variant="labelMedium" style={styles.bold}>12.5K</AppText>
          </View>
        </View>
        <View style={styles.side}>
          <Pressable style={[styles.round, dim]} onPress={() => setLiked(!liked)} accessibilityLabel="Like">
            <Lucide name="heart" size={24} color={liked ? colors.error : colors.white} />
          </Pressable>
          <Pressable style={[styles.round, dim]} onPress={() => {}} accessibilityLabel="Reward">
            <Lucide name="hand-coins" size={24} color={colors.white} />
          </Pressable>
        </View>
      </View>

      const styles = StyleSheet.create({
        video: { height: 300, padding: 16 },
        top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
        row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
        round: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
        back: { width: 40, height: 40, borderRadius: 20 },
        badge: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999 },
        side: { position: 'absolute', right: 16, bottom: 16, gap: 16 },
        bold: { fontWeight: '700' },
      });`,
    rnKind: "pattern",
    rnWhere: "StreamScreen",
    note: "When the creator turns the camera off, a <code>.feeds-live__camoff</code> panel goes first inside the video, with a <code>camera-off</code> icon, \"Camera is off\" and one line of text.",
  },
  {
    id: "live-chat",
    name: "Live chat",
    group: "Video",
    order: 51,
    app: "StreamScreen",
    css: ["app/css/feeds.css"],
    screens: ["live.html", "live.html?state=chat-empty", "live.html?state=chat-disabled"],
    text: "Chat under a live stream: each message is the name in bold, a colon and the text. Rewards stand out as a grey card with a coin and a left border.",
    keywords: "chat messages comments reward live stream",
    html: `
      <section class="feeds-chat" aria-label="Live chat">
        <h1 class="feeds-chat__title">Comments</h1>
        <div class="feeds-chat__list" aria-live="polite">
          <p class="feeds-chat__msg"><b>SideLine</b> : This stream is fire!</p>
          <p class="feeds-chat__msg"><b>FarRoutes</b> : Great gameplay!</p>
          <div class="feeds-chat__reward"><span class="feeds-chat__coin"><i class="icon" data-lucide="hand-coins"></i></span><div><p><b>LoopHouse</b> sent a reward!</p><small>Amazing</small></div></div>
          <p class="feeds-chat__msg"><b>OpenCanvas</b> : Keep it up</p>
        </div>
      </section>`,
    rn: `
      import { FlatList, StyleSheet, View } from 'react-native';
      import { Lucide } from '@react-native-vector-icons/lucide';
      import { AppText } from '@/core/components';
      import { useTheme } from '@/core/hooks';

      const { colors } = useTheme();

      <AppText variant="titleLarge" style={[styles.bold, styles.title]}>Comments</AppText>
      <FlatList
        data={messages}
        keyExtractor={m => m.id}
        renderItem={({ item }) => item.isReward ? (
          <View style={[styles.reward, { backgroundColor: colors.surfaceVariant, borderLeftColor: colors.white50 }]}>
            <View style={[styles.coin, { backgroundColor: colors.white50 }]}>
              <Lucide name="hand-coins" size={20} color={colors.primary} />
            </View>
            <View>
              <AppText variant="titleMedium"><AppText variant="titleMedium" style={styles.bold}>{item.name}</AppText> sent a reward!</AppText>
              <AppText variant="bodySmall" color="white50">{item.text}</AppText>
            </View>
          </View>
        ) : (
          <AppText variant="bodyLarge" style={styles.msg}><AppText variant="bodyLarge" style={styles.bold}>{item.name}</AppText> : {item.text}</AppText>
        )}
      />

      const styles = StyleSheet.create({
        title: { marginBottom: 16 },
        msg: { marginBottom: 16 },
        reward: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16, marginBottom: 16, borderLeftWidth: 4, borderRadius: 16 },
        coin: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
        bold: { fontWeight: '700' },
      });`,
    rnKind: "pattern",
    rnWhere: "StreamScreen",
    note: "With no messages, or with chat turned off, the list holds a small <code>.empty-state</code> instead.",
  },
  {
    id: "live-chat-input",
    name: "Live chat box",
    group: "Inputs and forms",
    order: 41,
    app: "StreamScreen",
    css: ["app/css/feeds.css"],
    screens: ["live.html", "live.html?state=chat-disabled"],
    text: "The bar at the bottom of a live stream: a rounded grey message box and a round send button. Both fade when the creator turns chat off.",
    keywords: "chat message send input live footer",
    html: `
      <form class="feeds-live__footer" autocomplete="off">
        <input class="feeds-live__input" name="message" placeholder="Send a message" aria-label="Send a message">
        <button class="feeds-live__send" type="submit" aria-label="Send"><i class="icon" data-lucide="send"></i></button>
      </form>
      <form class="feeds-live__footer" autocomplete="off">
        <input class="feeds-live__input" name="message" placeholder="Chat is turned off" aria-label="Send a message" disabled>
        <button class="feeds-live__send" type="submit" aria-label="Send" disabled><i class="icon" data-lucide="send"></i></button>
      </form>`,
    rn: `
      import { Pressable, StyleSheet, TextInput, View } from 'react-native';
      import { Lucide } from '@react-native-vector-icons/lucide';
      import { useTheme } from '@/core/hooks';

      const { colors } = useTheme();

      // chatOff fades both and stops typing
      <View style={[styles.footer, { borderTopColor: colors.white50 }]}>
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder={chatOff ? 'Chat is turned off' : 'Send a message'}
          placeholderTextColor={colors.white50}
          editable={!chatOff}
          style={[styles.input, { backgroundColor: colors.surfaceVariant, color: colors.white }, chatOff && styles.off]}
        />
        <Pressable onPress={() => {}} disabled={chatOff} accessibilityLabel="Send" style={[styles.send, { backgroundColor: colors.surfaceVariant }, chatOff && styles.off]}>
          <Lucide name="send" size={24} color={colors.white} />
        </Pressable>
      </View>

      const styles = StyleSheet.create({
        footer: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16, borderTopWidth: 1 },
        input: { flex: 1, height: 48, paddingHorizontal: 16, borderRadius: 999, fontSize: 16 },
        send: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
        off: { opacity: 0.5 },
      });`,
    rnKind: "pattern",
    rnWhere: "StreamScreen",
  },
);
