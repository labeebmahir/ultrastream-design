// Shared components, styled by assets/css/app.css and used across many screens.
(window.COMPONENTS = window.COMPONENTS || []).push(
  {
    id: "button",
    name: "Button",
    group: "Actions",
    order: 10,
    app: "AppButton",
    screens: ["sign-in.html", "watch.html", "upload.html"],
    text: "The main action is the red-to-orange gradient. Outlined white is for secondary actions, and red outline for destructive ones. Inside a screen, buttons are 48px tall with 6px corners.",
    keywords: "cta primary secondary outline gradient destructive",
    html: `
      <button class="btn btn--primary btn--block" type="button">Continue</button>
      <button class="btn btn--block" type="button">Cancel</button>
      <button class="btn btn--danger btn--block" type="button">Delete channel</button>
      <button class="btn btn--primary btn--lg btn--block" type="button">Go to discovery</button>
      <div style="display:flex;gap:8px">
        <button class="btn btn--primary btn--sm" type="button">Follow</button>
        <button class="btn btn--sm" type="button"><i class="icon icon--sm" data-lucide="share"></i>Share</button>
      </div>`,
    rn: `
      import { Lucide } from '@react-native-vector-icons/lucide';
      import { AppButton } from '@/core/components';
      import { useTheme } from '@/core/hooks';

      const { colors } = useTheme();

      <AppButton label="Continue" onPress={handleContinue} fullWidth />
      <AppButton label="Cancel" variant="outlined" onPress={() => {}} fullWidth />
      {/* No destructive variant: textColor turns the label red, but in dark mode the outline stays white */}
      <AppButton label="Delete channel" variant="outlined" textColor={colors.red} onPress={handleDelete} fullWidth />
      <AppButton label="Go to discovery" size="lg" onPress={() => {}} fullWidth />
      <AppButton label="Follow" size="sm" onPress={handleFollow} />
      <AppButton
        label="Share"
        variant="outlined"
        size="sm"
        icon={({ size, color }) => <Lucide name="share" size={size} color={color} />}
        onPress={handleShare}
      />`,
    rnKind: "usage",
    note: "Sizes: <code>btn--sm</code> 40px, default 48px, <code>btn--lg</code> 56px. Add <code>btn--block</code> for full width.",
  },
  {
    id: "icon-button",
    name: "Icon button",
    group: "Actions",
    order: 20,
    app: "",
    screens: ["discover.html", "watch.html"],
    text: "A tappable icon with no label, such as notifications or search. Always give it an <code>aria-label</code>. The boxed version sits over the video player.",
    keywords: "back close more",
    html: `
      <div style="display:flex;gap:8px;align-items:center">
        <button class="icon-btn" type="button" aria-label="Notifications"><i class="icon" data-lucide="bell-dot"></i></button>
        <button class="icon-btn" type="button" aria-label="Search"><i class="icon" data-lucide="search"></i></button>
        <button class="icon-btn" type="button" aria-label="More"><i class="icon" data-lucide="ellipsis-vertical"></i></button>
        <button class="icon-btn icon-btn--boxed" type="button" aria-label="Back"><i class="icon" data-lucide="chevron-left"></i></button>
      </div>`,
    rn: `
      import { Pressable, StyleSheet } from 'react-native';
      import { Lucide } from '@react-native-vector-icons/lucide';
      import { useTheme } from '@/core/hooks';

      const { colors } = useTheme();

      <Pressable style={styles.iconButton} onPress={() => {}} accessibilityRole="button" accessibilityLabel="More">
        <Lucide name="ellipsis-vertical" size={24} color={colors.white} />
      </Pressable>
      {/* Boxed, over the video player */}
      <Pressable style={[styles.iconButton, styles.boxed, { borderColor: colors.white }]} onPress={goBack} accessibilityRole="button" accessibilityLabel="Back">
        <Lucide name="chevron-left" size={24} color={colors.white} />
      </Pressable>

      const styles = StyleSheet.create({
        iconButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
        boxed: { width: 40, height: 40, borderRadius: 10, borderWidth: 1 },
      });`,
    rnKind: "pattern",
    rnWhere: "SingleVideoScreen",
  },
  {
    id: "action-row",
    name: "Video action row",
    group: "Actions",
    order: 30,
    app: "AppActionBar",
    css: ["app/css/watch.css"],
    screens: ["watch.html"],
    text: "The row of pills under a video: like and dislike joined together, comments, Reward, then share as an icon. It scrolls sideways on narrow phones. A pressed like turns white.",
    keywords: "like dislike comments reward share pill",
    html: `
      <div class="watch-page">
      <div class="actions-row">
        <span class="pill-group">
          <button class="pill-btn" type="button" aria-pressed="false" aria-label="Like, 12.5K"><i class="icon" data-lucide="thumbs-up"></i><span>12.5K</span></button>
          <button class="pill-btn pill-btn--icon" type="button" aria-pressed="false" aria-label="Dislike"><i class="icon" data-lucide="thumbs-down"></i></button>
        </span>
        <button class="pill-btn" type="button" aria-label="Comments, 4"><i class="icon" data-lucide="message-circle"></i><span>4</span></button>
        <button class="pill-btn pill-btn--reward" type="button"><i class="icon" data-lucide="hand-coins"></i>Reward</button>
        <button class="pill-btn pill-btn--share" type="button" aria-label="Share"><i class="icon" data-lucide="share"></i></button>
      </div>
      </div>`,
    note: "The sizes here only apply inside <code>.watch-page</code>, the video page's body class. On a screen, put the class on <code>&lt;body&gt;</code> instead of the wrapper.",
    js: `
      // Like and dislike: one at a time, tap again to undo
      document.querySelectorAll(".pill-group .pill-btn").forEach((b) => b.addEventListener("click", () => {
        const on = b.getAttribute("aria-pressed") !== "true";
        b.parentElement.querySelectorAll(".pill-btn").forEach((x) => { x.setAttribute("aria-pressed", "false"); x.classList.remove("pill-btn--on"); });
        b.setAttribute("aria-pressed", on);
        b.classList.toggle("pill-btn--on", on);
      }));`,
    rn: `
      import { AppActionBar } from '@/core/components';

      <AppActionBar
        likes="12.5K"
        isLiked={isLiked}
        isDisliked={isDisliked}
        comments={4}
        tips="Reward"
        onLikePress={handleLike}
        onDislikePress={handleDislike}
        onCommentsPress={openComments}
        onTipsPress={openRewards}
        onSharePress={handleShare}
        hideLikeDislikeReward={isOwnVideo}
      />`,
    rnKind: "usage",
  },
  {
    id: "top-bar",
    name: "Top bar",
    group: "Navigation",
    order: 10,
    app: "AppTopBar",
    screens: ["discover.html", "my-feed.html", "shorts.html"],
    text: "The bar at the top of the main tabs: the logo, then notifications and search. Leave the header empty and <code>app.js</code> fills it in.",
    keywords: "header logo notifications",
    html: `<header class="topbar" data-topbar></header>`,
    rn: `
      import { AppTopBar } from '@/core/components';

      // Each main tab screen renders the bar itself, first thing in the screen.
      // logo is the app's logo image source.
      <AppTopBar
        logoSource={logo}
        onNotificationsPress={openNotifications}
        onSearchPress={openSearch}
      />`,
    rnKind: "usage",
    note: "Filled by <code>US.renderChrome()</code>, which runs on every page.",
  },
  {
    id: "screen-header",
    name: "Screen header",
    group: "Navigation",
    order: 20,
    app: "",
    screens: ["settings.html", "manage-contents.html", "watch-history.html"],
    text: "The header on every screen below the main tabs: a back arrow and the screen's title, with optional actions on the right.",
    keywords: "back title app bar",
    html: `
      <header class="app-header">
        <a class="icon-btn" href="profile.html" aria-label="Back"><i class="icon" data-lucide="arrow-left"></i></a>
        <h1 class="app-header__title">Watch history</h1>
        <button class="icon-btn" type="button" aria-label="Search"><i class="icon" data-lucide="search"></i></button>
      </header>`,
    rn: `
      import { Pressable, StyleSheet, View } from 'react-native';
      import { Lucide } from '@react-native-vector-icons/lucide';
      import { AppText } from '@/core/components';
      import { useTheme } from '@/core/hooks';

      const { colors } = useTheme();

      <View style={styles.header}>
        <Pressable style={styles.iconButton} onPress={goBack} accessibilityRole="button" accessibilityLabel="Back">
          <Lucide name="arrow-left" size={24} color={colors.white} />
        </Pressable>
        <AppText variant="titleLarge" color="white" style={styles.title} numberOfLines={1}>Watch history</AppText>
        <Pressable style={styles.iconButton} onPress={openSearch} accessibilityRole="button" accessibilityLabel="Search">
          <Lucide name="search" size={24} color={colors.white} />
        </Pressable>
      </View>

      const styles = StyleSheet.create({
        header: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 56, paddingHorizontal: 12 },
        iconButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
        title: { flex: 1, fontSize: 20, fontWeight: '700' },
      });`,
    rnKind: "pattern",
    rnWhere: "ContentStudioScreen",
  },
  {
    id: "tab-bar",
    name: "Tab bar",
    group: "Navigation",
    order: 30,
    app: "AppNavigator",
    screens: ["discover.html", "profile.html"],
    text: "The five main tabs at the bottom. Set <code>data-tabbar</code> to the current tab and <code>app.js</code> fills it in, marking that tab orange.",
    keywords: "bottom navigation discover feed create shorts profile",
    html: `<nav class="tabbar" data-tabbar="discover"></nav>`,
    rn: `
      import { useNavigation } from '@react-navigation/native';
      import { AppButton } from '@/core/components';

      // The tab bar is drawn by the bottom tab navigator in AppNavigator.tsx,
      // so screens never render it. The current tab is tinted colors.orange.
      // Tab names: Discover, MyFeed, Create, Shorts, Profile
      const navigation = useNavigation();

      <AppButton label="Go to discovery" onPress={() => navigation.navigate('Discover')} />`,
    rnKind: "usage",
    note: "Tab names: <code>discover</code>, <code>my-feed</code>, <code>create</code>, <code>shorts</code>, <code>profile</code>.",
  },
  {
    id: "chips",
    name: "Category chips",
    group: "Navigation",
    order: 40,
    app: "AppFilterBar",
    screens: ["discover.html", "manage-contents.html"],
    text: "A sideways-scrolling row of chips for categories, and for tabs inside a screen. The selected chip is filled white with bold black text. Discover starts with All.",
    keywords: "filter tabs categories pills",
    html: `
      <div class="chips" role="group" aria-label="Filter by category" style="margin:0 -16px">
        <button class="chip" type="button" aria-pressed="true">All</button>
        <button class="chip" type="button" aria-pressed="false">Gaming</button>
        <button class="chip" type="button" aria-pressed="false">Music</button>
        <button class="chip" type="button" aria-pressed="false">Food</button>
        <button class="chip" type="button" aria-pressed="false">Travel</button>
      </div>`,
    js: `
      const chips = document.querySelector(".chips");
      chips.addEventListener("click", (e) => {
        const chip = e.target.closest(".chip");
        if (chip) chips.querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-pressed", c === chip));
      });`,
    rn: `
      import { useState } from 'react';
      import { AppFilterBar } from '@/core/components';

      const categories = [
        { id: 'all', label: 'All' },
        { id: 'gaming', label: 'Gaming' },
        { id: 'music', label: 'Music' },
        { id: 'food', label: 'Food' },
        { id: 'travel', label: 'Travel' },
      ];
      const [category, setCategory] = useState('all');

      <AppFilterBar options={categories} selectedId={category} onSelect={setCategory} />`,
    rnKind: "usage",
    note: "For the Discover categories, <code>US.setupChips(container, onChange)</code> builds the row for you.",
  },
  {
    id: "video-card",
    name: "Video card",
    group: "Cards and lists",
    order: 10,
    app: "AppVideoCard",
    screens: ["discover.html", "my-feed.html", "watch.html"],
    text: "A full-width video in a feed: 16:9 thumbnail with 16px corners and the length, then a row with the creator's 36px avatar and, beside it, the title (up to two lines) and a grey line of creator, views and age. Live videos show the Live and viewer badges instead of a length. On Discover each row has 12px above it and 16px below.",
    keywords: "feed thumbnail video item",
    html: `
      <a class="card" href="watch.html?id=v1" style="margin:0">
        <span class="card__thumb" style="background:linear-gradient(135deg,hsl(47 55% 32%),hsl(97 65% 18%))"><span class="duration">12:41</span></span>
        <span class="card__row">
          <span class="avatar" aria-hidden="true"><i class="icon" data-lucide="user"></i></span>
          <span class="card__info">
            <span class="card__title">Late-night noodles from three stalls</span>
            <span class="card__sub">StreetPlate • 94K views • 3 days ago</span>
          </span>
        </span>
      </a>`,
    rn: `
      import { AppVideoCard } from '@/core/components';

      {/* Every screen gets the same card: the layout prop ('default' or 'compact') doesn't change how it looks */}
      <AppVideoCard
        thumbnailSource={{ uri: video.thumbnailUrl }}
        avatarSource={{ uri: video.creatorAvatarUrl }}
        title="Late-night noodles from three stalls"
        subtitle="StreetPlate • 94K views • 3 days ago"
        channelName="StreetPlate"
        duration="12:41"
        aspectRatio={16 / 9}
        onPress={() => openVideo(video.id)}
      />`,
    rnKind: "usage",
    note: "Or render from the sample data: <code>US.cardHTML(US.CONTENT[1])</code>. Put cards in a <code>.feed</code>, not in <code>.screen-body</code>. The app's <code>layout</code> prop is accepted but draws the same card, so there's only one version here. Related videos on the video page pass no length, so they have no length badge.",
  },
  {
    id: "single-video-card",
    name: "Live video card",
    group: "Cards and lists",
    order: 15,
    app: "AppSingleVideoCard",
    screens: ["discover.html", "profile.html"],
    text: "The same card for a live stream: a white Live badge at the top left and the viewer count at the top right instead of a length. The line underneath is the same as any video: creator, views and age.",
    keywords: "live stream badge",
    html: `
      <a class="card" href="watch.html?live=1" style="margin:0">
        <span class="card__thumb" style="background:linear-gradient(135deg,hsl(0 55% 32%),hsl(50 65% 18%))">
          <span class="live-badge"><i class="icon" data-lucide="radio"></i>Live</span>
          <span class="views-badge"><i class="icon" data-lucide="eye"></i>12.5K</span>
        </span>
        <span class="card__row">
          <span class="avatar" aria-hidden="true"><i class="icon" data-lucide="user"></i></span>
          <span class="card__info">
            <span class="card__title">Ranked grind to the final circle</span>
            <span class="card__sub">PixelForge • 48K views • 2 days ago</span>
          </span>
        </span>
      </a>`,
    rn: `
      import { AppVideoCard } from '@/core/components';

      // The feeds show live streams with AppVideoCard. AppSingleVideoCard also takes isLive,
      // but only shows a LIVE label. liveBadge and viewersBadge: see Thumbnail badges.
      <AppVideoCard
        thumbnailSource={{ uri: stream.thumbnailUrl }}
        avatarSource={{ uri: stream.creatorAvatarUrl }}
        title="Ranked grind to the final circle"
        subtitle="PixelForge • 48K views • 2 days ago"
        channelName="PixelForge"
        isLive
        topLeftBadge={liveBadge}
        topRightBadge={viewersBadge}
        onPress={() => openStream(stream.id)}
      />`,
    rnKind: "usage",
    rnUses: ["AppVideoCard"],
  },
  {
    id: "shorts-card",
    name: "Shorts pair",
    group: "Cards and lists",
    order: 20,
    app: "AppShortsCard",
    screens: ["discover.html", "channel-shorts.html"],
    text: "Shorts sit two across in the feed, each 49% wide and 9:16 with 16px corners, with the same avatar row as a video card underneath.",
    keywords: "short vertical grid",
    html: `
      <div class="short-row" style="margin:0;column-gap:2%">
        <a class="card" href="shorts.html">
          <span class="card__thumb" style="background:linear-gradient(135deg,hsl(140 55% 32%),hsl(190 65% 18%))"><span class="duration">0:42</span></span>
          <span class="card__row"><span class="avatar" aria-hidden="true"><i class="icon" data-lucide="user"></i></span><span class="card__info"><span class="card__title">One-take loop</span><span class="card__sub">LoopHouse • 8K views • 2 days ago</span></span></span>
        </a>
        <a class="card" href="shorts.html">
          <span class="card__thumb" style="background:linear-gradient(135deg,hsl(280 55% 32%),hsl(330 65% 18%))"><span class="duration">0:28</span></span>
          <span class="card__row"><span class="avatar" aria-hidden="true"><i class="icon" data-lucide="user"></i></span><span class="card__info"><span class="card__title">Speed sketch</span><span class="card__sub">OpenCanvas • 3K views • 3 days ago</span></span></span>
        </a>
      </div>`,
    rn: `
      import { StyleSheet, View } from 'react-native';
      import { AppVideoCard } from '@/core/components';

      // Discover shows shorts with AppVideoCard at 9:16, two across.
      // AppShortsCard exists too, but no screen uses it.
      <View style={styles.row}>
        <AppVideoCard
          style={styles.cell}
          thumbnailSource={{ uri: first.thumbnailUrl }}
          avatarSource={{ uri: first.creatorAvatarUrl }}
          title="One-take loop"
          subtitle="LoopHouse • 8K views • 2 days ago"
          duration="0:42"
          aspectRatio={9 / 16}
          onPress={() => openShort(first.id)}
        />
        <AppVideoCard style={styles.cell} thumbnailSource={{ uri: second.thumbnailUrl }} avatarSource={{ uri: second.creatorAvatarUrl }} title="Speed sketch" subtitle="OpenCanvas • 3K views • 3 days ago" duration="0:28" aspectRatio={9 / 16} onPress={() => openShort(second.id)} />
      </View>

      const styles = StyleSheet.create({
        row: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12 },
        cell: { width: '49%', marginBottom: 16 },
      });`,
    rnKind: "usage",
    rnUses: ["AppVideoCard"],
  },
  {
    id: "people-card",
    name: "Creator card",
    group: "Cards and lists",
    order: 30,
    app: "AppPeopleCard",
    screens: ["discover.html", "search-results.html"],
    text: "A suggested creator with a Follow button. In Discover these sit in a sideways strip after the second row.",
    keywords: "person follow suggested creators",
    html: `
      <div class="person-card">
        <span class="avatar avatar--40" aria-hidden="true"><i class="icon" data-lucide="user"></i></span>
        <span class="person-card__body"><a class="person-card__name" href="channel.html">ByteBench</a><span class="person-card__meta">210K followers</span></span>
        <button class="btn btn--primary" type="button">Follow</button>
      </div>`,
    rn: `
      import { AppPeopleCard } from '@/core/components';

      <AppPeopleCard
        avatarSource={{ uri: creator.avatarUrl }}
        title="ByteBench"
        subtitle="210K followers"
        userId={creator.id}
        actionLabel="Follow"
        onActionPress={handleFollow}
      />`,
    rnKind: "usage",
    note: "The whole strip: <code>US.peopleStripHTML()</code>.",
  },
  {
    id: "avatar",
    name: "Avatar",
    group: "Cards and lists",
    order: 40,
    app: "AppAvatar",
    screens: ["discover.html", "watch.html", "profile.html"],
    text: "A round picture. With no picture, which is how every sample person here appears, it's the red-to-orange gradient with a white person icon at 60% of the size. Never a first letter. 36px in feed cards, 40px in creator cards, 56px on profiles. The signed-in person's avatar on the Profile tab looks the same.",
    keywords: "profile picture person icon gradient",
    html: `
      <div style="display:flex;gap:12px;align-items:center">
        <span class="avatar" aria-hidden="true"><i class="icon" data-lucide="user"></i></span>
        <span class="avatar avatar--40" aria-hidden="true"><i class="icon" data-lucide="user"></i></span>
        <span class="avatar avatar--56" aria-hidden="true"><i class="icon" data-lucide="user"></i></span>
      </div>`,
    rn: `
      import { AppAvatar } from '@/core/components';

      <AppAvatar uri={creator.avatarUrl} size={36} />
      <AppAvatar uri={creator.avatarUrl} size={40} />
      {/* With no picture it shows the brand gradient with a white Lucide user icon */}
      <AppAvatar uri={user.avatarUrl} size={56} />`,
    rnKind: "usage",
    note: "Write one with <code>US.avatarHTML(name, \"avatar--40\")</code>. Edit profile and Create channel draw their own 72px placeholder instead, grey with a person icon: see their entries.",
  },
  {
    id: "list-row",
    name: "List row",
    group: "Cards and lists",
    order: 50,
    app: "",
    screens: ["settings.html", "profile.html"],
    text: "A settings-style row with an icon, a label, an optional value and a chevron. Put rows straight into <code>.screen-body</code>.",
    keywords: "settings menu row",
    html: `
      <div>
        <a class="list-row" href="watch-history.html"><i class="icon" data-lucide="history"></i><span class="list-row__label">Watch history</span><span class="list-row__meta">12</span><i class="icon icon--sm" data-lucide="chevron-right"></i></a>
        <a class="list-row" href="appearance.html"><i class="icon" data-lucide="sun"></i><span class="list-row__label">Appearance</span><span class="list-row__meta">Dark</span><i class="icon icon--sm" data-lucide="chevron-right"></i></a>
      </div>`,
    rn: `
      import { Pressable, StyleSheet } from 'react-native';
      import { Lucide } from '@react-native-vector-icons/lucide';
      import { AppText } from '@/core/components';
      import { useTheme } from '@/core/hooks';

      const { colors } = useTheme();

      <Pressable style={styles.row} onPress={openWatchHistory} accessibilityRole="button">
        <Lucide name="history" size={24} color={colors.white} />
        <AppText variant="bodyMedium" color="white" style={styles.label}>Watch history</AppText>
        <AppText variant="bodyMedium" color="onSurfaceVariant">12</AppText>
        <Lucide name="chevron-right" size={20} color={colors.white} />
      </Pressable>

      const styles = StyleSheet.create({
        row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52, paddingVertical: 8 },
        label: { flex: 1 },
      });`,
    rnKind: "pattern",
    rnWhere: "SettingsScreen",
  },
  {
    id: "box",
    name: "Box",
    group: "Cards and lists",
    order: 60,
    app: "AppCard",
    screens: ["profile.html", "ultra-studio.html"],
    text: "A raised grey box with 16px corners, for promo cards, stat tiles and grouped content.",
    keywords: "card surface panel",
    html: `
      <div class="box">
        <h3 style="margin:0 0 4px;font-size:16px;line-height:24px">Become a Creator</h3>
        <p style="margin:0;font-size:14px;line-height:20px">Start uploading content and earn rewards from your audience.</p>
      </div>`,
    rn: `
      import { AppCard, AppText } from '@/core/components';

      <AppCard
        title="Become a Creator"
        subtitle="Start uploading content and earn rewards from your audience."
      />
      {/* Or put your own content inside */}
      <AppCard>
        <AppText variant="titleMedium" color="white">Total supported</AppText>
        <AppText variant="bodyMedium" color="onSurfaceVariant">0 creators</AppText>
      </AppCard>`,
    rnKind: "usage",
    rnUses: ["AppCard", "AppText"],
  },
  {
    id: "video-player",
    name: "Video player and details",
    group: "Video",
    order: 10,
    app: "AppVideoPlayer",
    css: ["app/css/watch.css"],
    screens: ["watch.html", "watch.html?live=1"],
    text: "The top of the video page: a 16:9 player with a boxed back button, then the title, views and age, and the creator with a Follow button.",
    keywords: "watch player title owner follow",
    html: `
      <div style="position:relative;margin:-24px -16px 0">
        <div class="player" style="background:linear-gradient(135deg,hsl(47 55% 32%),hsl(97 65% 18%))"></div>
        <a class="icon-btn icon-btn--boxed player__back" href="discover.html" aria-label="Back"><i class="icon" data-lucide="chevron-left"></i></a>
      </div>
      <div class="watch-page" style="display:flex;flex-direction:column;gap:16px">
      <div><h1 class="watch__title">Late-night noodles from three stalls</h1><p class="watch__meta">94K views • 3 days ago</p></div>
      <div class="owner">
        <a class="owner__profile" href="channel.html">
          <span class="avatar avatar--40" aria-hidden="true"><i class="icon" data-lucide="user"></i></span>
          <span class="owner__text"><span class="owner__name">StreetPlate</span>@streetplate • 94K followers</span>
        </a>
        <button class="btn btn--primary" type="button">Follow</button>
      </div>
      </div>`,
    rn: `
      import { AppPeopleCard, AppText, AppVideoPlayer } from '@/core/components';

      <AppVideoPlayer
        videoUrl={video.url}
        posterUrl={video.thumbnailUrl}
        autoPlay
        paused={!isFocused}
        onPlaybackError={showPlaybackError}
      />
      {/* The boxed back button sits over the player: see Icon button */}
      <AppText variant="titleLarge" color="white">Late-night noodles from three stalls</AppText>
      <AppText variant="bodySmall" color="onSurfaceVariant">94K views • 3 days ago</AppText>
      <AppPeopleCard
        avatarSource={{ uri: creator.avatarUrl }}
        title="StreetPlate"
        username="@streetplate"
        subtitle="94K followers"
        actionLabel="Follow"
        onActionPress={handleFollow}
      />`,
    rnKind: "usage",
    rnUses: ["AppVideoPlayer", "AppText", "AppPeopleCard"],
    note: "The title and creator sizes only apply inside <code>.watch-page</code>, the video page's body class.",
  },
  {
    id: "description",
    name: "Description",
    group: "Video",
    order: 20,
    app: "",
    css: ["app/css/watch.css"],
    screens: ["watch.html"],
    text: "The video's description in a grey box, cut short with See more.",
    keywords: "see more text",
    html: `
      <div class="description">Late-night noodles from three stalls. A full walkthrough from start to finish, with the moments that worked and the <a class="description__more" href="#">See more...</a></div>`,
    rn: `
      import { useState } from 'react';
      import { Pressable, StyleSheet } from 'react-native';
      import { AppText } from '@/core/components';
      import { useTheme } from '@/core/hooks';

      const { colors, radius, spacing } = useTheme();
      const [expanded, setExpanded] = useState(false);

      <Pressable
        style={{ backgroundColor: colors.surfaceVariant, borderRadius: radius.md, padding: spacing.sm }}
        onPress={() => setExpanded(!expanded)}
      >
        <AppText variant="bodyMedium" color="white" numberOfLines={expanded ? undefined : 3}>
          Late-night noodles from three stalls. A full walkthrough from start to finish.
        </AppText>
        {!expanded && <AppText variant="bodyMedium" color="white" style={styles.more}>See more...</AppText>}
      </Pressable>

      const styles = StyleSheet.create({
        more: { fontWeight: '700' },
      });`,
    rnKind: "pattern",
    rnWhere: "SingleVideoScreen",
  },
  {
    id: "badges",
    name: "Thumbnail badges",
    group: "Video",
    order: 30,
    app: "",
    screens: ["discover.html"],
    text: "Small labels on thumbnails: Live (white with red text), viewer count, and the video length at the bottom right.",
    keywords: "live views duration pill",
    html: `
      <span class="card__thumb" style="background:linear-gradient(135deg,hsl(220 55% 32%),hsl(270 65% 18%))">
        <span class="live-badge"><i class="icon" data-lucide="radio"></i>Live</span>
        <span class="views-badge"><i class="icon" data-lucide="eye"></i>12.5K</span>
        <span class="duration">58:03</span>
      </span>`,
    rn: `
      import { StyleSheet, View } from 'react-native';
      import { Lucide } from '@react-native-vector-icons/lucide';
      import { AppText } from '@/core/components';
      import { useTheme } from '@/core/hooks';

      // Pass these to AppVideoCard as topLeftBadge and topRightBadge.
      // Its duration prop draws the length at the bottom right.
      const { colors } = useTheme();

      const liveBadge = (
        <View style={[styles.badge, { backgroundColor: colors.white }]}>
          <Lucide name="radio" size={11} color={colors.red} />
          <AppText variant="labelSmall" color="red" style={styles.bold}>Live</AppText>
        </View>
      );
      const viewersBadge = (
        <View style={[styles.badge, { backgroundColor: colors.translucentBlack }]}>
          <Lucide name="eye" size={12} color={colors.white} />
          <AppText variant="labelSmall" color="white">12.5K</AppText>
        </View>
      );

      const styles = StyleSheet.create({
        badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 999 },
        bold: { fontWeight: '700' },
      });`,
    rnKind: "pattern",
    rnWhere: "HomeScreen",
  },
  {
    id: "empty-state",
    name: "Empty state",
    group: "Feedback and states",
    order: 10,
    app: "AppNoDataComponent",
    screens: ["manage-contents.html?state=empty", "watch-history.html?state=empty"],
    text: "When there's nothing to show yet: a 40px icon, a bold title, one line of help and a full-width action where there is one.",
    keywords: "no data nothing yet",
    html: `
      <div class="empty-state">
        <i class="icon empty-state__icon" data-lucide="clapperboard"></i>
        <h3 class="empty-state__title">No content scheduled yet</h3>
        <p class="empty-state__text">Start scheduling videos, or shorts to share with your audience.</p>
        <button class="btn btn--primary" type="button">Schedule content</button>
      </div>`,
    rn: `
      import { AppButton, AppNoDataComponent } from '@/core/components';

      <AppNoDataComponent
        icon="clapperboard"
        title="No content scheduled yet"
        description="Start scheduling videos, or shorts to share with your audience."
      />
      {/* AppNoDataComponent has no action, so add the button below it */}
      <AppButton label="Schedule content" onPress={openScheduler} fullWidth />`,
    rnKind: "usage",
    rnUses: ["AppNoDataComponent", "AppButton"],
  },
  {
    id: "error-state",
    name: "Error and offline state",
    group: "Feedback and states",
    order: 20,
    app: "AppListErrorState",
    screens: ["discover.html?state=offline", "discover.html?state=error"],
    text: "The same layout when loading fails or there's no connection, with a way to try again.",
    keywords: "offline error retry wifi",
    html: `
      <div class="empty-state">
        <i class="icon empty-state__icon" data-lucide="wifi-off"></i>
        <h3 class="empty-state__title">You're offline</h3>
        <p class="empty-state__text">Check your connection and try again.</p>
        <button class="btn btn--primary" type="button">Try again</button>
      </div>`,
    rn: `
      import { AppListCenteredState, AppListErrorState } from '@/core/components';

      // variant is 'offline' or 'server' and sets the icon and words
      <AppListCenteredState>
        <AppListErrorState variant="offline" onRetry={refetch} retryLabel="Try again" />
      </AppListCenteredState>`,
    rnKind: "usage",
    rnUses: ["AppListErrorState", "AppListCenteredState"],
  },
  {
    id: "loading-state",
    name: "Loading state",
    group: "Feedback and states",
    order: 30,
    app: "AppListCenteredState",
    screens: ["manage-contents.html?state=loading", "shorts.html?state=loading", "watch.html?state=reward-loading"],
    text: "A centred spinner while a list or screen loads, as React Native's ActivityIndicator: a plain ring in the brand red with no text. Large (36px) for lists and screens, small (20px) inline. Only add a line of text where the app has one, such as \"Searching...\". Discover, My Feed and Notifications show skeletons instead. The spinner stops moving for people who turn off motion.",
    keywords: "spinner loader activity indicator",
    html: `
      <div class="empty-state" role="status" aria-label="Loading">
        <span class="spinner spinner--lg" aria-hidden="true"></span>
      </div>
      <div style="display:flex;gap:16px;justify-content:center">
        <span class="spinner" aria-hidden="true"></span>
        <span class="spinner spinner--orange" aria-hidden="true"></span>
      </div>`,
    rn: `
      import { ActivityIndicator } from 'react-native';
      import { AppListCenteredState } from '@/core/components';
      import { useTheme } from '@/core/hooks';

      const { colors } = useTheme();

      <AppListCenteredState>
        <ActivityIndicator size="large" color={colors.primary} />
      </AppListCenteredState>`,
    rnKind: "usage",
    note: "Write one with <code>US.spinnerHTML()</code> (large) or <code>US.spinnerHTML(\"\")</code> (small). Add <code>spinner--orange</code> on the interests screen and <code>spinner--white</code> over a thumbnail, as the app does. Busy buttons keep their own loader: see the button entries.",
  },
  {
    id: "not-found",
    name: "Content not found",
    group: "Feedback and states",
    order: 40,
    app: "AppContentNotFoundState",
    css: ["app/css/watch.css"],
    screens: ["watch.html?id=gone"],
    text: "Shown when a video has been removed or the link is wrong, with a way back to Discover.",
    keywords: "missing removed 404",
    html: `
      <div class="empty-state empty-state--gone">
        <span class="empty-state__message">
          <i class="icon empty-state__icon" data-lucide="party-popper"></i>
          <h1 class="empty-state__title">Content Not Found</h1>
          <p class="empty-state__text">The content you're looking for is no longer available.</p>
        </span>
        <a class="btn btn--primary btn--lg btn--block" href="discover.html">Go to discovery</a>
      </div>`,
    rn: `
      import { AppContentNotFoundState } from '@/core/components';
      import { useTheme } from '@/core/hooks';

      const { colors } = useTheme();

      <AppContentNotFoundState
        title="Content Not Found"
        description="The content you're looking for is no longer available."
        actionLabel="Go to discovery"
        onActionPress={goToDiscovery}
        textColor={colors.white}
        iconColor={colors.white}
      />`,
    rnKind: "usage",
  },
  {
    id: "toast",
    name: "Message banner",
    group: "Feedback and states",
    order: 50,
    app: "AppToast",
    screens: ["manage-contents.html?state=delete-error", "sign-in.html?state=wrong-password"],
    text: "The app's toast: a banner 50px from the top of the screen, 16px in from each side, with an icon, the message and Dismiss. Errors are red and successes brand red, both with white text. It goes after 3 seconds. The app uses it for errors from the server, such as a failed delete or sign-in. Saved changes and form errors use the phone's alert instead.",
    keywords: "toast snackbar banner error message dismiss",
    html: `
      <div class="app-toast" role="alert">
        <i class="icon" data-lucide="circle-alert"></i>
        <span class="app-toast__text">Failed to delete video. Please try again.</span>
        <button class="app-toast__action" type="button">Dismiss</button>
      </div>
      <div class="app-toast app-toast--success" role="status">
        <i class="icon" data-lucide="circle-check"></i>
        <span class="app-toast__text">Your password has been reset. Please sign in.</span>
        <button class="app-toast__action" type="button">Dismiss</button>
      </div>
      <button class="btn btn--block" type="button" id="toast-demo">Show on the phone</button>`,
    js: `
      document.querySelectorAll(".app-toast__action").forEach((b) => b.addEventListener("click", () => b.parentElement.remove()));
      document.getElementById("toast-demo").addEventListener("click", () => US.appToast("Failed to delete video. Please try again."));`,
    rn: `
      import { useState } from 'react';
      import { AppToast } from '@/core/components';

      // type sets the colour and icon: 'error' (the default), 'success' or 'info'.
      // It goes after 3 seconds unless you pass duration.
      const [deleteError, setDeleteError] = useState<string | null>(null);

      <AppToast
        visible={!!deleteError}
        message={deleteError || ''}
        type="error"
        onDismiss={() => setDeleteError(null)}
      />`,
    rnKind: "usage",
    frameCSS: ".cd-phone > .app-toast:nth-child(-n+2) { position: static; }",
    height: 260,
    note: "On a screen, add it with <code>US.appToast(message)</code> or <code>US.appToast(message, \"success\")</code>. The app's 'info' type is cyan, which isn't in the palette, and no screen uses it. Sign-in screens have their own copy, <code>.auth-toast</code>. <code>US.toast(\"Text\")</code> is different: it's a review note for reviewers, such as \"This screen isn't rebuilt yet.\", styled like the screen viewer's compact bar and not part of the app.",
  },
  {
    id: "alert",
    name: "Phone alert",
    group: "Feedback and states",
    order: 55,
    app: "Alert.alert",
    screens: ["edit-profile.html?state=deleted", "upload.html?state=missing-title", "channel-settings.html?state=deleted"],
    text: "The phone's own alert, which the app uses to confirm saved changes (\"Success\", then OK goes back) and for many form errors (\"Error\"). iOS and Android draw it, so it's kept plain here: a centred box with a title, a line of text and buttons such as OK.",
    keywords: "alert system dialog success error ok native",
    html: `
      <div class="sys-alert-backdrop" style="position:static;padding:24px 0;background:none">
        <div class="sys-alert" role="alertdialog" aria-labelledby="alert-demo-title" aria-describedby="alert-demo-text">
          <h2 class="sys-alert__title" id="alert-demo-title">Success</h2>
          <p class="sys-alert__text" id="alert-demo-text">Username updated successfully</p>
          <div class="sys-alert__buttons"><button class="sys-alert__btn" type="button">OK</button></div>
        </div>
      </div>
      <button class="btn btn--block" type="button" id="alert-demo">Show on the phone</button>`,
    js: `
      document.getElementById("alert-demo").addEventListener("click", () => US.alert("Error", "Please enter a video title"));`,
    rn: `
      import { Alert } from 'react-native';

      // A saved change: OK goes back to the previous screen
      Alert.alert('Success', 'Username updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);

      // A form error: one OK button by default
      Alert.alert('Error', 'Please enter a video title');`,
    rnKind: "pattern",
    rnWhere: "ProfileEditScreen, UploadVideoScreen, ChangePasswordScreen and ChannelSettingScreen",
    height: 300,
    note: "Add it with <code>US.alert(title, message, buttons)</code>. Buttons take <code>{ text, onPress, style }</code>, with style <code>\"cancel\"</code> or <code>\"destructive\"</code>, and default to a single OK. For a confirmation in the app's own style, with a close X and a gradient button, use the Confirmation dialog instead.",
  },
  {
    id: "dialog",
    name: "Confirmation dialog",
    group: "Overlays",
    order: 10,
    app: "AppConfirmModal",
    screens: ["manage-contents.html", "settings.html"],
    text: "Asks people to confirm something that can't be undone: a close X, a bold title, one line of text, a gradient confirm button and an outlined Cancel, both 52px tall.",
    keywords: "modal confirm delete alert",
    html: `
      <div class="dialog-backdrop">
        <section class="dialog" role="dialog" aria-labelledby="dlg-title" aria-describedby="dlg-text">
          <button class="dialog__close icon-btn" type="button" aria-label="Close"><i class="icon" data-lucide="x"></i></button>
          <h3 class="dialog__title" id="dlg-title">Delete video?</h3>
          <p class="dialog__text" id="dlg-text">Are you sure you want to delete this video? This cannot be undone.</p>
          <button class="btn btn--primary" type="button">Yes</button>
          <button class="btn" type="button">Cancel</button>
        </section>
      </div>`,
    rn: `
      import { useState } from 'react';
      import { AppConfirmModal } from '@/core/components';

      const [showDelete, setShowDelete] = useState(false);

      <AppConfirmModal
        visible={showDelete}
        title="Delete video?"
        description="Are you sure you want to delete this video? This cannot be undone."
        confirmLabel="Yes"
        cancelLabel="Cancel"
        loading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />`,
    rnKind: "usage",
    height: 400,
  },
  {
    id: "sheet",
    name: "Bottom sheet",
    group: "Overlays",
    order: 20,
    app: "",
    screens: ["watch.html", "manage-contents.html"],
    text: "A panel that slides up from the bottom for comments, rewards, menus and sign-in prompts. It has a handle and rounded top corners.",
    keywords: "drawer panel action sheet",
    html: `
      <div class="sheet-backdrop">
        <div class="sheet-panel" role="dialog" aria-label="Options">
          <div class="sheet-panel__handle"></div>
          <a class="list-row" href="#"><i class="icon" data-lucide="pencil"></i><span class="list-row__label">Edit</span></a>
          <a class="list-row" href="#"><i class="icon" data-lucide="share"></i><span class="list-row__label">Share</span></a>
          <a class="list-row" href="#" style="color:var(--destructive)"><i class="icon" data-lucide="trash-2"></i><span class="list-row__label">Delete</span></a>
        </div>
      </div>`,
    rn: `
      import { useRef } from 'react';
      import { Pressable, StyleSheet } from 'react-native';
      import RBSheet from 'react-native-raw-bottom-sheet';
      import { Lucide } from '@react-native-vector-icons/lucide';
      import { AppText } from '@/core/components';
      import { useTheme } from '@/core/hooks';

      // The app's sheets use react-native-raw-bottom-sheet. Open it with sheetRef.current.open()
      const { colors } = useTheme();
      const sheetRef = useRef<any>(null);

      <RBSheet
        ref={sheetRef}
        height={240}
        draggable
        customStyles={{
          container: { ...styles.panel, backgroundColor: colors.surfaceVariant },
          draggableIcon: { width: 40, backgroundColor: colors.translucentWhite },
        }}
      >
        <Pressable style={styles.row} onPress={handleDelete}>
          <Lucide name="trash-2" size={24} color={colors.red} />
          <AppText variant="bodyMedium" color="red">Delete</AppText>
        </Pressable>
      </RBSheet>

      const styles = StyleSheet.create({
        panel: { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 16 },
        row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52 },
      });`,
    rnKind: "pattern",
    rnWhere: "each sheet (AppTipBottomsheet, AppCommentsBottomsheet)",
    height: 360,
  },
  {
    id: "text-field",
    name: "Text field",
    group: "Inputs and forms",
    order: 10,
    app: "AppInput",
    screens: ["edit-profile.html", "channel-settings.html"],
    text: "Label above, white-bordered input with 10px corners, and help, warning or error text below. Check on submit, then update as the person fixes things.",
    keywords: "input form label error warning textarea",
    html: `
      <div>
        <label class="field"><span class="field__label">Channel name</span><input class="input" value="Alex's Diary"><span class="field__warning">If you change your channel name, you won't be able to change it again for 30 days.</span></label>
        <label class="field field--invalid"><span class="field__label">Email</span><input class="input" value="alex@mail" aria-invalid="true"><span class="field__error">Enter a valid email address.</span></label>
        <label class="field"><span class="field__label">Bio <span class="opt">(optional)</span></span><textarea class="input"></textarea></label>
      </div>`,
    rn: `
      import { AppInput } from '@/core/components';

      {/* label sits above the field. There is no warning style, so warnings go in helperText */}
      <AppInput
        label="Channel name"
        value={channelName}
        onChangeText={setChannelName}
        helperText="If you change your channel name, you won't be able to change it again for 30 days."
      />
      <AppInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        errorText="Enter a valid email address."
      />
      <AppInput label="Bio (optional)" value={bio} onChangeText={setBio} multiline />`,
    rnKind: "usage",
  },
  {
    id: "switch",
    name: "Switch",
    group: "Inputs and forms",
    order: 20,
    app: "",
    screens: ["upload.html", "go-live.html"],
    text: "React Native's own on/off switch. On is solid brand red, not the gradient, with a white thumb. Off is a dark track here, and white on Go Live. Pair it with a visible label.",
    keywords: "toggle checkbox",
    html: `
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span id="sw-label">Schedule for later</span>
        <button class="switch" type="button" role="switch" aria-checked="true" aria-labelledby="sw-label"></button>
      </div>`,
    js: `
      document.querySelectorAll(".switch").forEach((s) => s.addEventListener("click", () => {
        s.setAttribute("aria-checked", s.getAttribute("aria-checked") !== "true");
      }));`,
    rn: `
      import { useState } from 'react';
      import { StyleSheet, Switch, View } from 'react-native';
      import { AppText } from '@/core/components';
      import { useTheme } from '@/core/hooks';

      // A native Switch can't draw the gradient, so on is solid red. Go Live passes colors.white for false
      const { colors } = useTheme();
      const [scheduled, setScheduled] = useState(true);

      <View style={styles.row}>
        <AppText variant="bodyLarge" color="white">Schedule for later</AppText>
        <Switch
          value={scheduled}
          onValueChange={setScheduled}
          trackColor={{ false: colors.surfaceVariant, true: colors.primary }}
          thumbColor={colors.white}
          accessibilityLabel="Schedule for later"
        />
      </View>

      const styles = StyleSheet.create({
        row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
      });`,
    rnKind: "pattern",
    rnWhere: "UploadVideoScreen",
  },
);
