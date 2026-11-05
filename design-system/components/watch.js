// Components from the video, channel, followers and subscribers screens. Markup matches app/watch.html, app/channel.html, app/followers.html and app/subscribers.html.
(window.COMPONENTS = window.COMPONENTS || []).push(
  {
    id: "comment",
    name: "Comment",
    group: "Video",
    order: 110,
    app: "AppCommentItem",
    css: ["app/css/watch.css"],
    screens: ["watch.html?state=comments", "watch.html?state=delete-comment"],
    text: "One comment: 44px avatar, name, time and the text. Your own comments get a three-dot menu that reveals a red Delete button, which then asks for confirmation.",
    keywords: "reply delete menu ellipsis",
    html: `
      <div>
        <div class="comment">
          <span class="avatar" aria-hidden="true"><i class="icon" data-lucide="user"></i></span>
          <div class="comment__body">
            <div class="comment__head">
              <span class="comment__who"><span class="comment__name">alex.rivera</span><span class="comment__time">just now</span></span>
              <span class="comment__actions">
                <button class="comment__delete" type="button"><i class="icon" data-lucide="trash-2"></i>Delete</button>
                <button class="icon-btn comment__menu" type="button" aria-label="Comment options" aria-expanded="true"><i class="icon" data-lucide="ellipsis-vertical"></i></button>
              </span>
            </div>
            <p class="comment__text">Great video, thanks for sharing!</p>
          </div>
        </div>
        <div class="comment">
          <span class="avatar" aria-hidden="true"><i class="icon" data-lucide="user"></i></span>
          <div class="comment__body">
            <div class="comment__head">
              <span class="comment__who"><span class="comment__name">nightowl.k</span><span class="comment__time">6 hours ago</span></span>
            </div>
            <p class="comment__text">That last round was unreal. How long did this take to film?</p>
          </div>
        </div>
      </div>`,
    js: `
      // The menu shows or hides the Delete button
      document.querySelectorAll(".comment__menu").forEach((menu) => menu.addEventListener("click", () => {
        const del = menu.parentElement.querySelector(".comment__delete");
        const open = menu.getAttribute("aria-expanded") !== "true";
        menu.setAttribute("aria-expanded", open);
        del.hidden = !open;
      }));`,
    rn: `
      import { useState } from 'react';
      import { View } from 'react-native';
      import { AppCommentItem } from '@/core/components';

      const [isMenuOpen, setIsMenuOpen] = useState(true);

      <View>
        <AppCommentItem
          avatarSource={{ uri: avatarUrl }}
          userName="alex.rivera"
          timeAgo="just now"
          content="Great video, thanks for sharing!"
          isOwnComment
          isMenuOpen={isMenuOpen}
          onToggleMenu={() => setIsMenuOpen(open => !open)}
          onDelete={confirmDelete}
        />
        <AppCommentItem
          userName="nightowl.k"
          timeAgo="6 hours ago"
          content="That last round was unreal. How long did this take to film?"
        />
      </View>`,
    rnKind: "usage",
  },
  {
    id: "comments-empty",
    name: "No comments yet",
    group: "Feedback and states",
    order: 110,
    app: "",
    css: ["app/css/watch.css"],
    screens: ["watch.html?state=comments-empty"],
    text: "Shown inside the comments panel when a video has no comments. The comment box stays below it.",
    keywords: "empty comments first",
    html: `
      <div class="comments-empty">
        <i class="icon" data-lucide="message-circle-more"></i>
        <h3 class="comments-empty__title">No comments yet</h3>
        <p class="comments-empty__text">Be the first to share your thoughts</p>
      </div>`,
    rn: `
      import { AppNoDataComponent } from '@/core/components';

      // AppInlineCommentsSheet shows its own empty state. Use this for the same look elsewhere
      <AppNoDataComponent
        icon="message-circle-more"
        title="No comments yet"
        description="Be the first to share your thoughts"
      />`,
    rnKind: "usage",
    rnUses: ["AppNoDataComponent"],
  },
  {
    id: "creator-row",
    name: "Creator row",
    group: "Video",
    order: 130,
    app: "",
    css: ["app/css/watch.css"],
    screens: ["watch.html", "watch.html?state=following", "watch.html?state=notifications-off"],
    text: "Under the video title: the creator's 52px avatar, name and follower count, with Follow. Once followed, the button shows a bell and opens the notification choices.",
    keywords: "owner channel follow following bell",
    html: `
      <div class="watch-page">
        <div class="owner">
          <a class="owner__profile" href="channel.html">
            <span class="avatar" aria-hidden="true"><i class="icon" data-lucide="user"></i></span>
            <span class="owner__text"><span class="owner__name">PixelForge</span><span>128K followers</span></span>
          </a>
          <button class="btn btn--primary" type="button">Follow</button>
        </div>
        <div class="owner">
          <a class="owner__profile" href="channel.html">
            <span class="avatar" aria-hidden="true"><i class="icon" data-lucide="user"></i></span>
            <span class="owner__text"><span class="owner__name">StreetPlate</span><span>94K followers</span></span>
          </a>
          <button class="btn" type="button" aria-label="Following. Notifications on"><i class="icon" data-lucide="bell"></i>Following</button>
        </div>
      </div>`,
    rn: `
      import { View } from 'react-native';
      import { AppPeopleCard } from '@/core/components';

      <View>
        <AppPeopleCard
          avatarSource={{ uri: avatarUrl }}
          title="PixelForge"
          subtitle="128K followers"
          actionLabel="Follow"
          onActionPress={toggleFollow}
        />
        {/* actionIcon takes a Material Community name: bell, bell-off-outline */}
        <AppPeopleCard
          title="StreetPlate"
          subtitle="94K followers"
          actionLabel="Following"
          actionIcon="bell"
          onActionPress={openNotificationChoices}
        />
      </View>`,
    rnKind: "usage",
    rnUses: ["AppPeopleCard"],
    note: "The sizes here only apply inside <code>.watch-page</code>, which is the video page's body class.",
  },
  {
    id: "channel-header",
    name: "Channel header",
    group: "Cards and lists",
    order: 110,
    app: "",
    css: ["app/css/watch.css"],
    screens: ["channel.html", "channel.html?state=following", "channel.html?state=bio"],
    text: "Top of a creator's channel: 56px avatar, name, follower count and Follow, then the bio in a grey box. Bios longer than 20 words end with See more.",
    keywords: "profile channel follow bio about",
    html: `
      <div>
        <div class="channel__head">
          <span class="avatar avatar--56" aria-hidden="true"><i class="icon" data-lucide="user"></i></span>
          <div class="channel__info">
            <h1 class="channel__name">PixelForge</h1>
            <span class="channel__followers">128K followers</span>
          </div>
          <button class="btn btn--primary" type="button">Follow</button>
        </div>
        <div class="bio">Welcome to PixelForge. New gaming videos every week, shorts most days and a live stream every Friday night. Follow to <button class="bio__more" type="button">See more</button></div>
      </div>`,
    js: `
      // Follow and Following swap on tap
      const follow = document.querySelector(".channel__head .btn");
      follow.addEventListener("click", () => {
        const on = follow.textContent === "Follow";
        follow.className = on ? "btn" : "btn btn--primary";
        follow.textContent = on ? "Following" : "Follow";
      });`,
    rn: `
      import { StyleSheet, View } from 'react-native';
      import { AppAvatar, AppButton, AppText } from '@/core/components';
      import { useTheme } from '@/core/hooks';

      const { colors, spacing, radius } = useTheme();

      <View style={styles.head}>
        <AppAvatar uri={avatarUrl} size={56} />
        <View style={styles.info}>
          <AppText variant="titleMedium" numberOfLines={1} style={styles.name}>PixelForge</AppText>
          <AppText variant="labelSmall" color="white50">128K followers</AppText>
        </View>
        <AppButton label={isFollowing ? 'Following' : 'Follow'} size="sm" onPress={toggleFollow} />
      </View>
      <View style={{ padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surfaceVariant }}>
        <AppText variant="bodyMedium" numberOfLines={3}>Welcome to PixelForge. New gaming videos every week...</AppText>
      </View>

      const styles = StyleSheet.create({
        head: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
        info: { flex: 1 },
        name: { fontWeight: '700' },
      });`,
    rnKind: "pattern",
    rnWhere: "OtherProfileScreen",
  },
  {
    id: "tab-pills",
    name: "Tab pills",
    group: "Navigation",
    order: 110,
    app: "",
    css: ["app/css/watch.css"],
    screens: ["channel.html", "channel.html?state=shorts", "channel.html?state=live"],
    text: "Switches between a channel's Videos, Shorts and Live. Outlined pills with 8px corners; the selected one fills white.",
    keywords: "tabs segmented videos shorts live",
    html: `
      <div class="tab-pills" role="tablist" aria-label="Content type">
        <button class="tab-pill" type="button" role="tab" aria-selected="true">Videos</button>
        <button class="tab-pill" type="button" role="tab" aria-selected="false">Shorts</button>
        <button class="tab-pill" type="button" role="tab" aria-selected="false">Live</button>
      </div>`,
    js: `
      document.querySelectorAll(".tab-pill").forEach((tab, i, all) => tab.addEventListener("click", () => {
        all.forEach((t) => t.setAttribute("aria-selected", t === tab));
      }));`,
    rn: `
      import { Pressable, StyleSheet, View } from 'react-native';
      import { AppText } from '@/core/components';
      import { useTheme } from '@/core/hooks';

      const { colors } = useTheme();

      <View style={styles.row}>
        {['Videos', 'Shorts', 'Live'].map(tab => {
          const on = tab === activeTab;
          return (
            <Pressable key={tab} accessibilityRole="tab" accessibilityState={{ selected: on }} onPress={() => setActiveTab(tab)}
              style={[styles.pill, { borderColor: colors.white }, on && { backgroundColor: colors.white }]}>
              <AppText variant="labelLarge" color={on ? 'black' : 'white'}>{tab}</AppText>
            </Pressable>
          );
        })}
      </View>

      const styles = StyleSheet.create({
        row: { flexDirection: 'row', gap: 12 },
        pill: { height: 34, justifyContent: 'center', paddingHorizontal: 16, borderWidth: 1, borderRadius: 8 },
      });`,
    rnKind: "pattern",
    rnWhere: "OtherProfileScreen",
  },
  {
    id: "line-tabs",
    name: "Underline tabs",
    group: "Navigation",
    order: 120,
    app: "",
    css: ["app/css/watch.css"],
    screens: ["followers.html", "followers.html?state=following"],
    text: "Two equal tabs with a white underline under the selected one, such as Followers and Following.",
    keywords: "tabs followers following underline",
    html: `
      <div class="line-tabs" role="tablist" aria-label="Followers or following">
        <button class="line-tab" type="button" role="tab" aria-selected="true">Followers</button>
        <button class="line-tab" type="button" role="tab" aria-selected="false">Following</button>
      </div>`,
    js: `
      document.querySelectorAll(".line-tab").forEach((tab, i, all) => tab.addEventListener("click", () => {
        all.forEach((t) => t.setAttribute("aria-selected", t === tab));
      }));`,
    rn: `
      import { Pressable, StyleSheet, View } from 'react-native';
      import { AppText } from '@/core/components';
      import { useTheme } from '@/core/hooks';

      const { colors } = useTheme();

      <View style={[styles.row, { borderBottomColor: colors.surfaceVariant }]}>
        {['Followers', 'Following'].map(tab => {
          const on = tab === activeTab;
          return (
            <Pressable key={tab} accessibilityRole="tab" accessibilityState={{ selected: on }} onPress={() => setActiveTab(tab)}
              style={[styles.tab, on && { borderBottomColor: colors.white }]}>
              <AppText variant="titleMedium" align="center" color={on ? 'white' : 'white50'}>{tab}</AppText>
            </Pressable>
          );
        })}
      </View>

      const styles = StyleSheet.create({
        row: { flexDirection: 'row', borderBottomWidth: 1 },
        tab: { flex: 1, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
      });`,
    rnKind: "pattern",
    rnWhere: "FollowersScreen",
  },
  {
    id: "list-header",
    name: "List header",
    group: "Navigation",
    order: 130,
    app: "",
    css: ["app/css/watch.css"],
    screens: ["followers.html", "subscribers.html"],
    text: "Back arrow and a large 24px title for list screens like Followers. All Subscribers uses a 16px title with icons on the right.",
    keywords: "header title back followers subscribers",
    html: `
      <header class="list-header">
        <a class="icon-btn" href="profile.html" aria-label="Back"><i class="icon" data-lucide="arrow-left"></i></a>
        <h1 class="list-header__title">Followers</h1>
      </header>
      <header class="sub-header">
        <div class="sub-header__left">
          <a class="icon-btn sub-header__back" href="ultra-studio.html" aria-label="Back"><i class="icon" data-lucide="arrow-left"></i></a>
          <h1 class="list-header__title list-header__title--sm">All Subscribers</h1>
        </div>
        <div class="sub-header__right">
          <a class="icon-btn" href="notifications.html" aria-label="Notifications"><i class="icon" data-lucide="bell-dot"></i></a>
          <a class="icon-btn" href="search.html" aria-label="Search"><i class="icon" data-lucide="search"></i></a>
        </div>
      </header>`,
    rn: `
      import { Pressable, StyleSheet, View } from 'react-native';
      import { Lucide } from '@react-native-vector-icons/lucide';
      import { AppText } from '@/core/components';
      import { useTheme } from '@/core/hooks';

      const { colors } = useTheme();

      <View style={styles.header}>
        <Pressable onPress={goBack} accessibilityRole="button" accessibilityLabel="Back" hitSlop={8}>
          <Lucide name="arrow-left" size={24} color={colors.white} />
        </Pressable>
        <AppText variant="headlineMedium" style={styles.title}>Followers</AppText>
        {/* All Subscribers: variant="titleMedium", then bell-dot and search icons on the right */}
      </View>

      const styles = StyleSheet.create({
        header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 8 },
        title: { flex: 1, fontWeight: '700' },
      });`,
    rnKind: "pattern",
    rnWhere: "FollowersScreen and AllSubscribersScreen",
  },
  {
    id: "search-pill",
    name: "List search bar",
    group: "Inputs and forms",
    order: 110,
    app: "AppSearchBar",
    css: ["app/css/watch.css"],
    screens: ["followers.html", "followers.html?state=no-results"],
    text: "A rounded grey search field that filters a list as you type, as on Followers.",
    keywords: "search filter find input",
    html: `
      <div class="search-pill">
        <input class="input" type="search" placeholder="Search followers..." aria-label="Search followers" autocomplete="off">
      </div>`,
    rn: `
      import { useState } from 'react';
      import { AppSearchBar } from '@/core/components';

      const [query, setQuery] = useState('');

      <AppSearchBar
        value={query}
        onChangeText={setQuery}
        placeholder="Search followers..."
      />`,
    rnKind: "usage",
  },
  {
    id: "person-row",
    name: "Person row",
    group: "Cards and lists",
    order: 120,
    app: "AppPeopleCard",
    css: ["app/css/watch.css"],
    screens: ["followers.html", "followers.html?state=following"],
    text: "One person in a followers or following list: avatar, name and handle with a Follow or Following button, in a grey card with an inner outline.",
    keywords: "follower following user follow",
    html: `
      <div class="people-list">
        <div class="person-row"><div class="person-row__card">
          <a class="person-row__link" href="channel.html"><span class="avatar" aria-hidden="true"><i class="icon" data-lucide="user"></i></span><span class="person-row__text"><span class="person-row__name">LoopHouse</span><span class="person-row__sub">@loophouse</span></span></a>
          <button class="btn btn--primary" type="button" aria-pressed="false">Follow</button>
        </div></div>
        <div class="person-row"><div class="person-row__card">
          <a class="person-row__link" href="channel.html"><span class="avatar" aria-hidden="true"><i class="icon" data-lucide="user"></i></span><span class="person-row__text"><span class="person-row__name">PlainTerms</span><span class="person-row__sub">@plainterms</span></span></a>
          <button class="btn" type="button" aria-pressed="true">Following</button>
        </div></div>
      </div>`,
    js: `
      document.querySelectorAll(".person-row .btn").forEach((b) => b.addEventListener("click", () => {
        const on = b.getAttribute("aria-pressed") !== "true";
        b.setAttribute("aria-pressed", on);
        b.className = on ? "btn" : "btn btn--primary";
        b.textContent = on ? "Following" : "Follow";
      }));`,
    rn: `
      import { View } from 'react-native';
      import { AppPeopleCard } from '@/core/components';

      <View>
        <AppPeopleCard
          avatarSource={{ uri: avatarUrl }}
          title="LoopHouse"
          subtitle="@loophouse"
          actionLabel="Follow"
          buttonVariant="contained"
          onPress={openChannel}
          onActionPress={toggleFollow}
        />
        <AppPeopleCard
          title="PlainTerms"
          subtitle="@plainterms"
          actionLabel="Following"
          buttonVariant="outlined"
          onActionPress={toggleFollow}
        />
      </View>`,
    rnKind: "usage",
  },
  {
    id: "subscriber-stats",
    name: "Subscriber totals",
    group: "Creator studio",
    order: 110,
    app: "",
    css: ["app/css/watch.css"],
    screens: ["subscribers.html", "subscribers.html?state=empty"],
    text: "A gradient banner with total, paid and free subscriber counts, at the top of All Subscribers.",
    keywords: "subscribers stats total paid free",
    html: `
      <div class="sub-stats" aria-label="Subscriber totals">
        <span class="sub-stats__col"><span class="sub-stats__label">Total</span><span class="sub-stats__value">1.25k</span></span>
        <span class="sub-stats__col"><span class="sub-stats__label">Paid</span><span class="sub-stats__value">1k</span></span>
        <span class="sub-stats__col"><span class="sub-stats__label">Free</span><span class="sub-stats__value">250</span></span>
      </div>`,
    rn: `
      import { StyleSheet, View } from 'react-native';
      import LinearGradient from 'react-native-linear-gradient';
      import { AppText } from '@/core/components';
      import { useTheme } from '@/core/hooks';

      const { colors } = useTheme();
      const stats = [['Total', '1.25k'], ['Paid', '1k'], ['Free', '250']];

      <LinearGradient colors={[colors.red, colors.orange]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.banner}>
        {stats.map(([label, value]) => (
          <View key={label} style={styles.col}>
            <AppText variant="labelLarge">{label}</AppText>
            <AppText variant="headlineMedium" style={styles.value}>{value}</AppText>
          </View>
        ))}
      </LinearGradient>

      const styles = StyleSheet.create({
        banner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 88, paddingHorizontal: 20, borderRadius: 16 },
        col: { gap: 4 },
        value: { fontWeight: '700' },
      });`,
    rnKind: "pattern",
    rnWhere: "AllSubscribersScreen",
  },
  {
    id: "subscriber-row",
    name: "Subscriber row",
    group: "Creator studio",
    order: 120,
    app: "",
    css: ["app/css/watch.css"],
    screens: ["subscribers.html", "subscribers.html?state=paid", "subscribers.html?state=free"],
    text: "One subscriber: avatar, name, when they joined and a Paid or Free badge. Rows are divided by a thin line.",
    keywords: "subscriber paid free joined badge",
    html: `
      <div class="sub-list">
        <div class="sub-row"><span class="avatar" aria-hidden="true"><i class="icon" data-lucide="user"></i></span><span class="sub-row__body"><span class="sub-row__name">Gamecreators</span><span class="sub-row__joined">Join 5 weeks ago</span></span><span class="sub-badge">Paid</span></div>
        <div class="sub-row"><span class="avatar" aria-hidden="true"><i class="icon" data-lucide="user"></i></span><span class="sub-row__body"><span class="sub-row__name">Streamlab</span><span class="sub-row__joined">Join 5 days ago</span></span><span class="sub-badge">Paid</span></div>
        <div class="sub-row"><span class="avatar" aria-hidden="true"><i class="icon" data-lucide="user"></i></span><span class="sub-row__body"><span class="sub-row__name">Madcreators</span><span class="sub-row__joined">Join 2 days ago</span></span><span class="sub-badge">Free</span></div>
      </div>`,
    rn: `
      import { StyleSheet, View } from 'react-native';
      import { AppAvatar, AppText } from '@/core/components';
      import { useTheme } from '@/core/hooks';

      const { colors } = useTheme();

      // Rows after the first get a thin top border: borderTopWidth 1, colors.translucentWhite
      <View style={styles.row}>
        <AppAvatar uri={avatarUrl} size={48} />
        <View style={styles.body}>
          <AppText variant="labelLarge" numberOfLines={1}>Gamecreators</AppText>
          <AppText variant="bodySmall" color="white50">Join 5 weeks ago</AppText>
        </View>
        <View style={[styles.badge, { borderColor: colors.white50 }]}>
          <AppText variant="labelSmall">Paid</AppText>
        </View>
      </View>

      const styles = StyleSheet.create({
        row: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 16 },
        body: { flex: 1, gap: 2 },
        badge: { paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1, borderRadius: 10 },
      });`,
    rnKind: "pattern",
    rnWhere: "AllSubscribersScreen",
    note: "The wording follows the app: Join 5 days ago.",
  },
  {
    id: "comments-panel",
    name: "Video comments panel",
    group: "Overlays",
    order: 110,
    app: "AppInlineCommentsSheet",
    css: ["app/css/watch.css"],
    screens: ["watch.html?state=comments", "watch.html?state=comment-added"],
    text: "Slides up over the area under the video, which stays playing above it. Handle, title, the comments, and a comment box pinned to the bottom whose send button lights up once you type.",
    keywords: "comments sheet composer send input panel",
    html: `
      <div class="panel" role="dialog" aria-label="Comments">
        <button class="panel__handle" type="button" aria-label="Close comments"><span></span></button>
        <h2 class="panel__title">Comments</h2>
        <div class="panel__body">
          <div class="comment">
            <span class="avatar" aria-hidden="true"><i class="icon" data-lucide="user"></i></span>
            <div class="comment__body">
              <div class="comment__head"><span class="comment__who"><span class="comment__name">nightowl.k</span><span class="comment__time">6 hours ago</span></span></div>
              <p class="comment__text">That last round was unreal. How long did this take to film?</p>
            </div>
          </div>
          <div class="comment">
            <span class="avatar" aria-hidden="true"><i class="icon" data-lucide="user"></i></span>
            <div class="comment__body">
              <div class="comment__head"><span class="comment__who"><span class="comment__name">mira_draws</span><span class="comment__time">9 hours ago</span></span></div>
              <p class="comment__text">Watched this twice already.</p>
            </div>
          </div>
        </div>
        <form class="composer">
          <input class="input" type="text" placeholder="Comment..." aria-label="Add a comment" maxlength="500" autocomplete="off">
          <button class="composer__send" type="submit" disabled aria-label="Post comment"><i class="icon" data-lucide="send"></i></button>
        </form>
      </div>`,
    js: `
      // Send is only active when there is text
      const input = document.querySelector(".composer .input");
      const send = document.querySelector(".composer__send");
      input.addEventListener("input", () => { send.disabled = !input.value.trim(); });`,
    rn: `
      import { useState } from 'react';
      import { AppInlineCommentsSheet } from '@/core/components';

      const [showComments, setShowComments] = useState(false);

      // The sheet brings its own comments, comment box and send button.
      // On tab screens such as Shorts, add presentation="modal"
      <AppInlineCommentsSheet
        isVisible={showComments}
        onClose={() => setShowComments(false)}
        videoId={videoId}
        onCommentPosted={() => setCommentCount(n => n + 1)}
        onCommentDeleted={() => setCommentCount(n => Math.max(0, n - 1))}
      />`,
    rnKind: "usage",
    height: 520,
    note: "Live chat uses the same panel and comment box, with a boxed Reward icon button after Send.",
  },
  {
    id: "reward-sheet",
    name: "Reward sheet",
    group: "Overlays",
    order: 120,
    app: "AppTipBottomsheet",
    css: ["app/css/watch.css"],
    screens: ["watch.html?state=reward", "watch.html?state=reward-selected", "watch.html?state=reward-loading", "channel.html?state=reward"],
    text: "Lets people send gifts to a creator. Each gift has a price and a quantity stepper; the footer button shows the total and stays grey until something is picked. Sending closes the sheet straight away, with no confirmation. While the gifts load it shows only the app's spinner.",
    keywords: "tip gift reward quantity stepper plus minus coins",
    html: `
      <div class="sheet-backdrop">
        <div class="sheet-panel reward-sheet" role="dialog" aria-label="Reward creator">
          <div class="sheet-panel__handle"></div>
          <div class="reward-sheet__scroll">
            <h2 class="reward-sheet__title">Reward creator</h2>
            <p class="reward-sheet__note"><span class="tag tag--placeholder">Placeholder items and prices</span></p>
            <div class="gift-list">
              <div class="gift" data-price="1">
                <span class="gift__icon gift__icon--rose"><i class="icon" data-lucide="gift"></i></span>
                <span class="gift__info"><span class="gift__name">Rose</span><span class="gift__price">$1.00</span></span>
                <span class="qty">
                  <button class="qty__btn" type="button" data-step="-1" aria-label="One less Rose"><i class="icon" data-lucide="minus"></i></button>
                  <span class="qty__value" aria-live="polite">2</span>
                  <button class="qty__btn" type="button" data-step="1" aria-label="One more Rose"><i class="icon" data-lucide="plus"></i></button>
                </span>
              </div>
              <div class="gift" data-price="5">
                <span class="gift__icon gift__icon--star"><i class="icon" data-lucide="gift"></i></span>
                <span class="gift__info"><span class="gift__name">Star</span><span class="gift__price">$5.00</span></span>
                <span class="qty">
                  <button class="qty__btn" type="button" data-step="-1" aria-label="One less Star"><i class="icon" data-lucide="minus"></i></button>
                  <span class="qty__value" aria-live="polite">1</span>
                  <button class="qty__btn" type="button" data-step="1" aria-label="One more Star"><i class="icon" data-lucide="plus"></i></button>
                </span>
              </div>
              <div class="gift" data-price="20">
                <span class="gift__icon gift__icon--teddy"><i class="icon" data-lucide="gift"></i></span>
                <span class="gift__info"><span class="gift__name">Teddy</span><span class="gift__price">$20.00</span></span>
                <span class="qty">
                  <button class="qty__btn" type="button" data-step="-1" aria-label="One less Teddy" disabled><i class="icon" data-lucide="minus"></i></button>
                  <span class="qty__value" aria-live="polite">0</span>
                  <button class="qty__btn" type="button" data-step="1" aria-label="One more Teddy"><i class="icon" data-lucide="plus"></i></button>
                </span>
              </div>
            </div>
          </div>
          <div class="reward-sheet__footer"><button class="btn btn--primary btn--lg btn--block" type="button" id="reward-send">Reward $7.00</button></div>
        </div>
      </div>`,
    js: `
      // Steppers change the quantity; minus is disabled at zero and the footer shows the total
      const sheet = document.querySelector(".reward-sheet");
      const send = document.getElementById("reward-send");
      sheet.addEventListener("click", (e) => {
        const step = e.target.closest("[data-step]");
        if (!step) return;
        const value = step.parentElement.querySelector(".qty__value");
        const n = Math.max(0, Number(value.textContent) + Number(step.dataset.step));
        value.textContent = n;
        step.parentElement.querySelector('[data-step="-1"]').disabled = n === 0;
        let total = 0;
        sheet.querySelectorAll(".gift").forEach((g) => { total += g.dataset.price * g.querySelector(".qty__value").textContent; });
        send.textContent = "Reward $" + total.toFixed(2);
        send.disabled = total <= 0;
      });`,
    rn: `
      import { useState } from 'react';
      import { AppTipBottomsheet, TipRewardPayload } from '@/core/components';

      const [showReward, setShowReward] = useState(false);

      // Gifts, steppers and the total live inside the sheet.
      // onSendTip gets totalUsd, totalCoins and the picked gifts, then the sheet closes
      <AppTipBottomsheet
        isVisible={showReward}
        onClose={() => setShowReward(false)}
        recipientName="PixelForge"
        recipientAvatar={creatorAvatarUrl}
        onSendTip={(payload: TipRewardPayload) => sendReward(payload)}
      />`,
    rnKind: "usage",
    height: 720,
    note: "The sheet is 58% of the screen tall and scrolls inside when there are more gifts. On a screen, open it with <code>WatchArea.openReward()</code>.",
  },
  {
    id: "notification-sheet",
    name: "Notification choices",
    group: "Overlays",
    order: 140,
    app: "AppNotificationsSheet",
    css: ["app/css/watch.css"],
    screens: ["watch.html?state=notifications"],
    text: "Opens from the Following button on a video. All or None for new-upload notifications, or Unfollow. A tick marks the current choice.",
    keywords: "bell notifications unfollow follow options",
    html: `
      <div class="sheet-backdrop">
        <div class="sheet-panel notify-sheet" role="dialog" aria-label="Notifications">
          <h2 class="notify-sheet__title">Notifications</h2>
          <button class="notify-option" type="button"><i class="icon" data-lucide="bell"></i><span class="notify-option__label">All</span><i class="icon" data-lucide="check" aria-label="Selected"></i></button>
          <button class="notify-option" type="button"><i class="icon" data-lucide="bell-off"></i><span class="notify-option__label">None</span></button>
          <button class="notify-option" type="button"><i class="icon" data-lucide="user-round-minus"></i><span class="notify-option__label">Unfollow</span></button>
        </div>
      </div>`,
    rn: `
      import { useState } from 'react';
      import { AppNotificationsSheet, NotificationSetting } from '@/core/components';

      const [setting, setSetting] = useState<NotificationSetting>('ALL');

      // Options are All, None and Unfollow; the tick follows currentSetting
      <AppNotificationsSheet
        isVisible={showNotifications}
        onClose={() => setShowNotifications(false)}
        currentSetting={setting}
        onSelectOption={option => (option === 'UNFOLLOW' ? unfollow() : setSetting(option))}
      />`,
    rnKind: "usage",
    height: 360,
  },
);
