// Components from the profile, settings and wallet screens. Markup matches app/profile.html, app/settings.html, app/edit-profile.html, app/change-password.html, app/appearance.html, app/wallet.html and app/reward-activities.html.
(window.COMPONENTS = window.COMPONENTS || []).push(
  {
    id: "profile-header",
    name: "Profile header",
    group: "Profile and wallet",
    order: 210,
    app: "",
    css: ["app/css/profile.css"],
    screens: ["profile.html", "profile.html?as=creator"],
    text: "Top of the Profile tab: a 28px Profile title with the settings icon, then the signed-in person's 56px avatar and username. With no profile picture, the avatar is the usual gradient with a person icon.",
    keywords: "profile user avatar username settings",
    html: `
      <header class="pr-top">
        <h1 class="pr-top__title">Profile</h1>
        <a class="icon-btn" href="settings.html" aria-label="Settings"><i class="icon" data-lucide="settings-2"></i></a>
      </header>
      <div class="pr-scroll">
        <div class="pr-user">
          <span class="avatar avatar--56" aria-hidden="true"><i class="icon" data-lucide="user"></i></span>
          <span class="pr-user__name">nova.lane</span>
        </div>
      </div>`,
    rn: `
      import { Pressable, StyleSheet, View } from 'react-native';
      import { Lucide } from '@react-native-vector-icons/lucide';
      import { AppAvatar, AppText } from '@/core/components';
      import { useTheme } from '@/core/hooks';

      const { colors } = useTheme();

      <View style={styles.top}>
        <AppText variant="headlineLarge">Profile</AppText>
        <Pressable onPress={openSettings} accessibilityRole="button" accessibilityLabel="Settings" hitSlop={8}>
          <Lucide name="settings-2" size={24} color={colors.white} />
        </Pressable>
      </View>
      <View style={styles.user}>
        <AppAvatar uri={avatarUrl} size={56} />
        <AppText variant="titleMedium" style={styles.name}>nova.lane</AppText>
      </View>

      const styles = StyleSheet.create({
        top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8 },
        user: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
        name: { fontWeight: '600' },
      });`,
    rnKind: "pattern",
    rnWhere: "ProfileScreen",
  },
  {
    id: "promo-card",
    name: "Promo card",
    group: "Profile and wallet",
    order: 220,
    app: "",
    css: ["app/css/profile.css"],
    screens: ["profile.html", "profile.html?as=creator&state=no-channel"],
    text: "Grey cards on the Profile tab that point people to something new: Become a Creator opens Create, and Become an Advertiser is marked coming soon and can't be tapped.",
    keywords: "creator advertiser coming soon card promo",
    html: `
      <div class="pr-cards">
        <a class="box pr-promo" href="create.html">
          <span class="pr-promo__head"><i class="icon" data-lucide="file-video"></i><span class="pr-promo__title">Become a Creator</span></span>
          <p class="pr-promo__text">Start uploading content and earn rewards from your audience.</p>
        </a>
        <div class="box pr-promo" aria-disabled="true">
          <span class="pr-promo__head"><i class="icon" data-lucide="megaphone"></i><span class="pr-promo__title">Become an Advertiser <span class="pr-promo__soon">(coming soon)</span></span></span>
          <p class="pr-promo__text">Promote your content/product to a wider audience on UltraStream.</p>
        </div>
      </div>`,
    rn: `
      import { Pressable, StyleSheet, View } from 'react-native';
      import { Lucide } from '@react-native-vector-icons/lucide';
      import { AppText } from '@/core/components';
      import { useTheme } from '@/core/hooks';

      const { colors } = useTheme();

      <Pressable onPress={openCreate} style={[styles.card, { backgroundColor: colors.surfaceVariant }]}>
        <View style={styles.head}>
          <Lucide name="file-video" size={24} color={colors.white} />
          <AppText variant="titleMedium" style={styles.title}>Become a Creator</AppText>
        </View>
        <AppText variant="labelSmall">Start uploading content and earn rewards from your audience.</AppText>
      </Pressable>
      {/* Become an Advertiser (coming soon): the same card in a plain View, with megaphone and no onPress */}

      const styles = StyleSheet.create({
        card: { padding: 16, borderRadius: 6 },
        head: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
        title: { flex: 1, fontWeight: '600' },
      });`,
    rnKind: "pattern",
    rnWhere: "ProfileScreen",
    note: "A creator without a channel sees Ultra studio in place of Become a Creator, linking to channel setup.",
  },
  {
    id: "reward-card",
    name: "Reward activities card",
    group: "Profile and wallet",
    order: 230,
    app: "RewardActivitiesCard",
    css: ["app/css/profile.css"],
    screens: ["profile.html?as=creator"],
    text: "A creator's gradient card with what they've earned and what they've given. Tapping it opens Reward Activities.",
    keywords: "earned contributions rewards stats gradient",
    html: `
      <a class="pr-reward" href="reward-activities.html">
        <span class="pr-reward__head"><span class="pr-reward__title">Reward Activities</span><i class="icon" data-lucide="chevron-right"></i></span>
        <span class="pr-reward__stats">
          <span class="pr-reward__stat"><span class="pr-reward__label"><i class="icon" data-lucide="trending-up"></i>Earned</span><span class="pr-reward__value">$ 180</span></span>
          <span class="pr-reward__stat"><span class="pr-reward__label"><i class="icon" data-lucide="hand-coins"></i>Contributions</span><span class="pr-reward__value">$ 45</span></span>
        </span>
      </a>`,
    rn: `
      import { RewardActivitiesCard } from '@/features/profile/components/RewardActivitiesCard';

      // Pass plain numbers; the card formats them as dollar amounts
      <RewardActivitiesCard
        earnedAmount={180}
        contributionsAmount={45}
        onPress={openRewardActivities}
      />`,
    rnKind: "usage",
  },
  {
    id: "manage-channel-card",
    name: "Manage channel card",
    group: "Profile and wallet",
    order: 240,
    app: "ManageChannelCard",
    css: ["app/css/profile.css"],
    screens: ["profile.html?as=creator"],
    text: "A creator's channel on the Profile tab: avatar, channel name, handle and Manage channel. Tapping it opens Ultra Studio.",
    keywords: "channel creator studio manage",
    html: `
      <a class="pr-channel" href="ultra-studio.html">
        <span class="avatar avatar--56" aria-hidden="true"><i class="icon" data-lucide="user"></i></span>
        <span class="pr-channel__text"><span class="pr-channel__name">Nova Lane</span><span class="pr-channel__handle">@novalane</span><span class="pr-channel__manage">Manage channel</span></span>
        <i class="icon" data-lucide="chevron-right"></i>
      </a>`,
    rn: `
      import { ManageChannelCard } from '@/features/profile/components/ManageChannelCard';

      // channelHandle goes in without the @; the card adds it
      <ManageChannelCard
        channelName="Nova Lane"
        channelHandle="novalane"
        avatarUrl={channelAvatarUrl}
        onPress={openUltraStudio}
      />`,
    rnKind: "usage",
  },
  {
    id: "history-section",
    name: "Watch history section",
    group: "Profile and wallet",
    order: 250,
    app: "",
    css: ["app/css/profile.css"],
    screens: ["profile.html", "profile.html?state=empty"],
    text: "A section heading with View all on the right, followed by its content. With nothing watched yet, a grey card says so.",
    keywords: "section heading view all see all history empty",
    html: `
      <div>
        <div class="pr-section-head">
          <h2 class="pr-section-head__title">Watch History</h2>
          <a class="pr-section-head__link" href="watch-history.html">View all</a>
        </div>
        <div class="pr-history-empty">
          <i class="icon" data-lucide="history"></i>
          <h3 class="pr-history-empty__title">No watch history yet</h3>
          <p class="pr-history-empty__text">Videos you watch will appear here.</p>
        </div>
      </div>`,
    rn: `
      import { Pressable, StyleSheet, View } from 'react-native';
      import { Lucide } from '@react-native-vector-icons/lucide';
      import { AppText } from '@/core/components';
      import { useTheme } from '@/core/hooks';

      const { colors } = useTheme();

      <View style={styles.head}>
        <AppText variant="titleLarge">Watch History</AppText>
        <Pressable onPress={openWatchHistory}><AppText variant="bodyMedium">View all</AppText></Pressable>
      </View>
      <View style={[styles.empty, { backgroundColor: colors.surfaceVariant }]}>
        <Lucide name="history" size={48} color={colors.white50} />
        <AppText variant="titleMedium" color="white50" style={styles.bold}>No watch history yet</AppText>
        <AppText variant="bodySmall" color="white50">Videos you watch will appear here.</AppText>
      </View>

      const styles = StyleSheet.create({
        head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
        empty: { alignItems: 'center', gap: 8, paddingVertical: 40, paddingHorizontal: 24, borderRadius: 16 },
        bold: { fontWeight: '600' },
      });`,
    rnKind: "pattern",
    rnWhere: "ProfileScreen",
    note: 'With history, video cards go in <code>&lt;div class="pr-history"&gt;</code> under the heading.',
  },
  {
    id: "settings-list",
    name: "Settings list",
    group: "Profile and wallet",
    order: 260,
    app: "",
    css: ["app/css/profile.css"],
    screens: ["settings.html", "settings.html?state=logout"],
    text: "Rows of settings with a 22px icon, a 16px semibold label and a chevron. Log out is red, has no chevron and asks for confirmation.",
    keywords: "settings menu rows log out danger",
    html: `
      <div class="screen-body pr-settings">
        <a class="list-row" href="edit-profile.html"><i class="icon" data-lucide="user-round"></i><span class="list-row__label">Edit profile</span><i class="icon" data-lucide="chevron-right"></i></a>
        <a class="list-row" href="change-password.html"><i class="icon" data-lucide="lock"></i><span class="list-row__label">Change password</span><i class="icon" data-lucide="chevron-right"></i></a>
        <button class="list-row pr-danger" type="button"><i class="icon" data-lucide="log-out"></i><span class="list-row__label">Log out</span></button>
      </div>`,
    rn: `
      import { Pressable, StyleSheet } from 'react-native';
      import { Lucide } from '@react-native-vector-icons/lucide';
      import { AppConfirmModal, AppText } from '@/core/components';
      import { useTheme } from '@/core/hooks';

      const { colors } = useTheme();

      <Pressable style={styles.row} onPress={openEditProfile}>
        <Lucide name="user-round" size={22} color={colors.white} />
        <AppText variant="titleMedium" style={styles.label}>Edit profile</AppText>
        <Lucide name="chevron-right" size={22} color={colors.white} />
      </Pressable>
      <Pressable style={styles.row} onPress={() => setShowLogout(true)}>
        <Lucide name="log-out" size={22} color={colors.red} />
        <AppText variant="titleMedium" color="red" style={styles.label}>Log out</AppText>
      </Pressable>
      <AppConfirmModal visible={showLogout} title="Log out" confirmLabel="Log out" cancelLabel="Cancel"
        onConfirm={logOut} onCancel={() => setShowLogout(false)} />

      const styles = StyleSheet.create({
        row: { flexDirection: 'row', alignItems: 'center', gap: 16, minHeight: 52 },
        label: { flex: 1, fontWeight: '600' },
      });`,
    rnKind: "pattern",
    rnWhere: "SettingsScreen",
  },
  {
    id: "option-group",
    name: "Radio option group",
    group: "Inputs and forms",
    order: 210,
    app: "",
    css: ["app/css/profile.css"],
    screens: ["appearance.html"],
    text: "A titled card of choices where only one can be on, as on Appearance. Each row has a round tinted icon, a label and a radio on the right.",
    keywords: "radio choice theme appearance select option",
    html: `
      <section class="pr-group" aria-labelledby="theme-title">
        <h2 class="pr-group__title" id="theme-title">Theme</h2>
        <div class="pr-group__card" role="radiogroup" aria-labelledby="theme-title">
          <button class="pr-option" type="button" role="radio" aria-checked="true">
            <span class="pr-option__left"><span class="pr-option__icon"><i class="icon" data-lucide="sun"></i></span>Light Mode</span>
            <span class="pr-radio" aria-hidden="true"></span>
          </button>
          <button class="pr-option" type="button" role="radio" aria-checked="false">
            <span class="pr-option__left"><span class="pr-option__icon"><i class="icon" data-lucide="moon"></i></span>Dark Mode</span>
            <span class="pr-radio" aria-hidden="true"></span>
          </button>
        </div>
      </section>`,
    js: `
      document.querySelectorAll(".pr-option").forEach((o, i, all) => o.addEventListener("click", () => {
        all.forEach((x) => x.setAttribute("aria-checked", x === o));
      }));`,
    rn: `
      import { Pressable, StyleSheet, View } from 'react-native';
      import { Lucide } from '@react-native-vector-icons/lucide';
      import { AppText } from '@/core/components';
      import { useTheme } from '@/core/hooks';

      const { colors } = useTheme();
      const on = theme === 'light';

      <AppText variant="titleMedium" style={styles.title}>Theme</AppText>
      <View accessibilityRole="radiogroup" style={[styles.card, { backgroundColor: colors.surfaceVariant, borderColor: colors.overlayWhite }]}>
        <Pressable style={styles.option} accessibilityRole="radio" accessibilityState={{ checked: on }} onPress={() => setTheme('light')}>
          <View style={[styles.icon, { backgroundColor: colors.primaryContainer }]}><Lucide name="sun" size={20} color={colors.red} /></View>
          <AppText variant="titleMedium" style={styles.label}>Light Mode</AppText>
          <View style={[styles.radio, { borderColor: on ? colors.red : colors.white50, borderWidth: on ? 6 : 2 }]} />
        </Pressable>
      </View>

      const styles = StyleSheet.create({
        title: { fontWeight: '700', marginBottom: 12, paddingHorizontal: 8 },
        card: { borderWidth: 1, borderRadius: 16, overflow: 'hidden' },
        option: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
        icon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
        label: { flex: 1, fontWeight: '600' },
        radio: { width: 20, height: 20, borderRadius: 10 },
      });`,
    rnKind: "pattern",
    rnWhere: "AppearanceScreen",
    note: "Appearance in the app has only the Light Mode row. The second row is here to show the unselected look.",
  },
  {
    id: "form-field-helper",
    name: "Field with helper text",
    group: "Inputs and forms",
    order: 220,
    app: "AppInput",
    css: ["app/css/profile.css"],
    screens: ["edit-profile.html", "edit-profile.html?state=username-available", "edit-profile.html?state=username-taken"],
    text: "The profile forms' field: label, input and a line under it that is grey while checking, orange for a warning, green when fine and red for an error. A small button appears once the value changes.",
    keywords: "input label helper warning error success available taken username",
    html: `
      <div class="pr-form">
        <div class="pr-field">
          <label class="pr-field__label" for="f-user-1">Username</label>
          <input class="input pr-input" id="f-user-1" value="nova.lane" autocomplete="off">
          <p class="pr-helper pr-helper--warn">If you change your username, you won't be able to change it again for 30 days.</p>
        </div>
        <div class="pr-field">
          <label class="pr-field__label" for="f-user-2">Username</label>
          <input class="input pr-input" id="f-user-2" value="nova.streams" autocomplete="off">
          <p class="pr-helper pr-helper--ok">nova.streams is available!</p>
          <button class="btn btn--primary pr-btn-sm" type="button">Change username</button>
        </div>
        <div class="pr-field">
          <label class="pr-field__label" for="f-user-3">Username</label>
          <input class="input pr-input" id="f-user-3" value="pixelforge" aria-invalid="true" autocomplete="off">
          <p class="pr-helper pr-helper--error">Username is taken</p>
          <button class="btn btn--primary pr-btn-sm" type="button" disabled>Change username</button>
        </div>
      </div>`,
    rn: `
      import { AppButton, AppInput, AppText } from '@/core/components';

      // helperText is always grey and errorText always red, so the orange and green lines are an AppText
      <AppInput
        label="Username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      <AppText variant="bodySmall" color="darkOrange">
        If you change your username, you won't be able to change it again for 30 days.
      </AppText>
      {/* Available: color="success". Taken: color="error". Checking: color="onSurfaceVariant" */}
      {usernameChanged && (
        <AppButton label="Change username" size="sm" disabled={isTaken} onPress={saveUsername} />
      )}`,
    rnKind: "usage",
    rnUses: ["AppInput", "AppText", "AppButton"],
    note: "Plain <code>pr-helper</code> with no modifier is the grey version, for example Checking availability...",
  },
  {
    id: "settings-password",
    name: "Settings password field",
    group: "Inputs and forms",
    order: 230,
    app: "AppInput",
    css: ["app/css/profile.css"],
    screens: ["change-password.html", "change-password.html?state=errors", "change-password.html?state=mismatch"],
    text: "A password input with an eye button that shows or hides what was typed. Help or error text sits just under it.",
    keywords: "password eye show hide reveal error",
    html: `
      <div class="pr-form">
        <div class="pr-field pr-field--tight">
          <label class="pr-field__label" for="f-new">New password</label>
          <div class="pr-input-wrap">
            <input class="input pr-input" id="f-new" type="password" autocomplete="off" placeholder="Enter new password">
            <button class="icon-btn" type="button" data-reveal="f-new" aria-label="Show password"><i class="icon" data-lucide="eye"></i></button>
          </div>
          <p class="pr-helper">Minimum 8 characters</p>
        </div>
        <div class="pr-field pr-field--tight">
          <label class="pr-field__label" for="f-confirm">Confirm new password</label>
          <div class="pr-input-wrap">
            <input class="input pr-input" id="f-confirm" type="password" value="sample-pass" aria-invalid="true" autocomplete="off" placeholder="Re-enter new password">
            <button class="icon-btn" type="button" data-reveal="f-confirm" aria-label="Show password"><i class="icon" data-lucide="eye"></i></button>
          </div>
          <p class="pr-helper pr-helper--error">Passwords do not match</p>
        </div>
      </div>`,
    js: `
      // The eye swaps between showing and hiding the password
      document.querySelectorAll("[data-reveal]").forEach((btn) => btn.addEventListener("click", () => {
        const input = document.getElementById(btn.dataset.reveal);
        const show = input.type === "password";
        input.type = show ? "text" : "password";
        btn.setAttribute("aria-label", show ? "Hide password" : "Show password");
        btn.innerHTML = '<i class="icon" data-lucide="' + (show ? "eye-off" : "eye") + '"></i>';
        US.renderIcons();
      }));`,
    rn: `
      import { useState } from 'react';
      import { TextInput } from 'react-native-paper';
      import { AppInput } from '@/core/components';

      const [show, setShow] = useState(false);

      <AppInput
        label="New password"
        value={password}
        onChangeText={setPassword}
        placeholder="Enter new password"
        secureTextEntry={!show}
        helperText="Minimum 8 characters"
        right={<TextInput.Icon icon={show ? 'eye-off' : 'eye'} onPress={() => setShow(s => !s)} />}
      />
      {/* Mismatch: errorText="Passwords do not match" turns the line red */}`,
    rnKind: "usage",
  },
  {
    id: "email-code",
    name: "Email change code",
    group: "Inputs and forms",
    order: 240,
    app: "",
    css: ["app/css/profile.css"],
    screens: ["edit-profile.html?state=email-code"],
    text: "Six joined boxes for a code sent by email. Typing moves to the next box, and Verify turns on once all six are filled. Resend counts down first.",
    keywords: "otp code digits verify email resend",
    html: `
      <div class="pr-code">
        <h2 class="pr-code__title">Check your email</h2>
        <p class="pr-code__text">We sent a 6-digit code to <strong>nova.streams@example.com</strong>. Enter it below.</p>
        <div class="pr-code__boxes" role="group" aria-label="6-digit code">
          <input class="pr-code__box" inputmode="numeric" autocomplete="one-time-code" maxlength="1" aria-label="Digit 1">
          <input class="pr-code__box" inputmode="numeric" maxlength="1" aria-label="Digit 2">
          <input class="pr-code__box" inputmode="numeric" maxlength="1" aria-label="Digit 3">
          <input class="pr-code__box" inputmode="numeric" maxlength="1" aria-label="Digit 4">
          <input class="pr-code__box" inputmode="numeric" maxlength="1" aria-label="Digit 5">
          <input class="pr-code__box" inputmode="numeric" maxlength="1" aria-label="Digit 6">
        </div>
        <p class="pr-code__text">Didn't receive it? <button class="pr-code__resend" type="button" disabled>Resend in 59s</button></p>
        <button class="btn btn--primary" type="button" id="verify" disabled>Verify email</button>
        <p class="pr-code__text">Wrong email? <button class="pr-link" type="button">Change it</button></p>
      </div>`,
    js: `
      // Digits only, one per box; focus moves on, and back on Backspace
      const boxes = [...document.querySelectorAll(".pr-code__box")];
      boxes.forEach((box, i) => {
        box.addEventListener("input", () => {
          box.value = box.value.replace(/[^0-9]/g, "").slice(-1);
          if (box.value && boxes[i + 1]) boxes[i + 1].focus();
          document.getElementById("verify").disabled = boxes.some((b) => !b.value);
        });
        box.addEventListener("keydown", (e) => { if (e.key === "Backspace" && !box.value && boxes[i - 1]) boxes[i - 1].focus(); });
      });`,
    rn: `
      import { useRef, useState } from 'react';
      import { StyleSheet, TextInput, View } from 'react-native';
      import { AppButton } from '@/core/components';
      import { useTheme } from '@/core/hooks';

      const { colors } = useTheme();
      const [code, setCode] = useState(['', '', '', '', '', '']);
      const boxes = useRef<Array<TextInput | null>>([]);
      const setDigit = (i: number, text: string) => {
        setCode(c => c.map((d, j) => (j === i ? text.slice(-1) : d)));
        if (text && i < 5) boxes.current[i + 1]?.focus();
      };

      <View style={styles.row}>
        {code.map((d, i) => (
          <TextInput key={i} ref={el => { boxes.current[i] = el; }} value={d} onChangeText={t => setDigit(i, t)}
            keyboardType="number-pad" maxLength={1} accessibilityLabel={'Digit ' + (i + 1)}
            style={[styles.box, { borderColor: colors.white, color: colors.white, borderLeftWidth: i ? 0 : 1 }]} />
        ))}
      </View>
      <AppButton label="Verify email" disabled={code.some(d => !d)} onPress={verify} />

      const styles = StyleSheet.create({
        row: { flexDirection: 'row', marginVertical: 24 },
        box: { width: 40, height: 48, borderWidth: 1, textAlign: 'center', fontSize: 18, fontWeight: '600' },
      });`,
    rnKind: "pattern",
    rnWhere: "ForgotPasswordScreen",
  },
  {
    id: "action-sheet",
    name: "Action sheet",
    group: "Overlays",
    order: 210,
    app: "",
    css: ["app/css/profile.css"],
    screens: ["edit-profile.html?state=photo"],
    text: "A bottom sheet of choices with a title and close X. Each row has an icon in a rounded square; a destructive choice goes last, in red, below a divider.",
    keywords: "sheet menu photo camera library remove danger",
    html: `
      <div class="sheet-backdrop">
        <div class="sheet-panel" role="dialog" aria-modal="true" aria-labelledby="photo-title">
          <div class="sheet-panel__handle"></div>
          <div class="pr-sheet-head"><h2 id="photo-title">Change Profile Photo</h2><button class="icon-btn" type="button" aria-label="Close"><i class="icon" data-lucide="x"></i></button></div>
          <button class="pr-sheet-row" type="button"><span class="pr-sheet-row__icon"><i class="icon" data-lucide="camera"></i></span><span class="pr-sheet-row__label">Take Photo</span><i class="icon" data-lucide="chevron-right"></i></button>
          <button class="pr-sheet-row" type="button"><span class="pr-sheet-row__icon"><i class="icon" data-lucide="images"></i></span><span class="pr-sheet-row__label">Choose from Library</span><i class="icon" data-lucide="chevron-right"></i></button>
          <div class="pr-sheet-divider"></div>
          <button class="pr-sheet-row pr-sheet-row--danger" type="button"><span class="pr-sheet-row__icon"><i class="icon" data-lucide="trash-2"></i></span><span class="pr-sheet-row__label">Remove Profile Picture</span></button>
        </div>
      </div>`,
    rn: `
      import { AppMediaPickerModal } from '@/core/components';

      // Rows are fixed: camera, library and an optional red remove row.
      // Leave out onRemovePress to hide the remove row
      <AppMediaPickerModal
        isVisible={showPhotoSheet}
        onClose={() => setShowPhotoSheet(false)}
        title="Change Profile Photo"
        mediaType="image"
        onCameraPress={takePhoto}
        onGalleryPress={chooseFromLibrary}
        onRemovePress={removePhoto}
      />`,
    rnKind: "usage",
    rnUses: ["AppMediaPickerModal"],
    height: 420,
  },
  {
    id: "reward-activity",
    name: "Reward activity",
    group: "Profile and wallet",
    order: 270,
    app: "",
    css: ["app/css/profile.css"],
    screens: ["reward-activities.html", "reward-activities.html?state=contributions", "reward-activities.html?state=details"],
    text: "Earned and Contributions tabs, then one row per reward: amount and gift, who sent it, date and time, and an icon for where it was sent. Tapping a row shows the gift breakdown.",
    keywords: "reward earned contributions gift tabs history",
    html: `
      <div class="pr-tabs" role="tablist" aria-label="Reward activities">
        <button class="pr-tab" type="button" role="tab" aria-selected="true"><i class="icon" data-lucide="trending-up"></i>Earned</button>
        <button class="pr-tab" type="button" role="tab" aria-selected="false"><i class="icon" data-lucide="hand-coins"></i>Contributions</button>
      </div>
      <div class="pr-activities">
        <button class="pr-activity" type="button" aria-label="$100.00 from @mira.k, Oct 28, 2026. Show details">
          <span class="pr-activity__amount"><span class="pr-activity__value">$ 100.00</span><span class="pr-activity__gift"><span class="pr-gift" style="background:linear-gradient(135deg,hsl(48 80% 65%),hsl(88 70% 40%))" aria-hidden="true"></span>Star x 10</span></span>
          <span class="pr-activity__user"><span class="avatar avatar--28" aria-hidden="true"><i class="icon" data-lucide="user"></i></span><span class="pr-activity__name">@mira.k</span></span>
          <span class="pr-activity__time"><span class="pr-activity__date">Oct 28, 2026</span><span class="pr-activity__clock">10:32 PM</span></span>
          <i class="icon" data-lucide="video" aria-label="On a video"></i>
        </button>
        <button class="pr-activity" type="button" aria-label="$45.00 from @tessa.w, Oct 21, 2026. Show details">
          <span class="pr-activity__amount"><span class="pr-activity__value">$ 45.00</span><span class="pr-activity__gift"><span class="pr-gift" style="background:linear-gradient(135deg,hsl(48 80% 65%),hsl(88 70% 40%))" aria-hidden="true"></span><span class="pr-gift" style="background:linear-gradient(135deg,hsl(28 80% 65%),hsl(68 70% 40%))" aria-hidden="true"></span><span class="pr-gift" style="background:linear-gradient(135deg,hsl(350 80% 65%),hsl(30 70% 40%))" aria-hidden="true"></span><span class="pr-activity__more">x 11</span></span></span>
          <span class="pr-activity__user"><span class="avatar avatar--28" aria-hidden="true"><i class="icon" data-lucide="user"></i></span><span class="pr-activity__name">@tessa.w</span></span>
          <span class="pr-activity__time"><span class="pr-activity__date">Oct 21, 2026</span><span class="pr-activity__clock">9:47 AM</span></span>
          <i class="icon" data-lucide="user-round" aria-label="On a profile"></i>
        </button>
      </div>`,
    js: `
      document.querySelectorAll(".pr-tab").forEach((t, i, all) => t.addEventListener("click", () => {
        all.forEach((x) => x.setAttribute("aria-selected", x === t));
      }));`,
    rn: `
      import { Pressable, StyleSheet, View } from 'react-native';
      import { Lucide } from '@react-native-vector-icons/lucide';
      import { AppAvatar, AppText } from '@/core/components';
      import { useTheme } from '@/core/hooks';

      const { colors } = useTheme();

      // One row. The Earned and Contributions tabs above are outlined; the selected one fills white
      <Pressable onPress={showDetails} style={[styles.row, { backgroundColor: colors.surfaceVariant }]}>
        <View style={styles.amount}>
          <AppText variant="titleMedium" style={styles.bold}>$ 100.00</AppText>
          <AppText variant="bodySmall" color="white50">Star x 10</AppText>
        </View>
        <View style={styles.user}>
          <AppAvatar uri={avatarUrl} size={28} />
          <AppText variant="labelMedium" numberOfLines={1}>@mira.k</AppText>
        </View>
        <View style={styles.time}>
          <AppText variant="labelMedium">Oct 28, 2026</AppText>
          <AppText variant="bodySmall" color="white50">10:32 PM</AppText>
        </View>
        <Lucide name="video" size={22} color={colors.white} />
      </Pressable>

      const styles = StyleSheet.create({
        row: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 6 },
        amount: { width: 88, gap: 4 },
        bold: { fontWeight: '700' },
        user: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
        time: { alignItems: 'flex-end', gap: 2 },
      });`,
    rnKind: "pattern",
    rnWhere: "RewardActivitiesScreen",
    note: "Where it was sent: <code>video</code> on a video, <code>radio</code> during a live stream, <code>user-round</code> on a profile. A viewer sees Contributions only, with no tabs.",
  },
  {
    id: "reward-empty",
    name: "No rewards yet",
    group: "Feedback and states",
    order: 210,
    app: "RewardActivitiesEmptyState",
    css: ["app/css/profile.css"],
    screens: ["reward-activities.html?state=earned-empty", "reward-activities.html?state=contributions-empty"],
    text: "Shown on Reward Activities when a tab has nothing yet: a coins icon, a title, a line of help and a large button to go and do something about it.",
    keywords: "empty rewards earnings contributions",
    html: `
      <div class="empty-state pr-empty pr-empty--reward">
        <i class="icon empty-state__icon" data-lucide="coins"></i>
        <h2 class="empty-state__title">No Earnings Yet</h2>
        <p class="empty-state__text">Start creating content and growing your audience. Your earnings will appear here once you receive support or contributions.</p>
        <a class="btn btn--primary btn--lg" href="create.html">Create Content</a>
      </div>`,
    rn: `
      import { FlatList } from 'react-native';
      import { RewardActivitiesEmptyState } from '@/features/profile/components/RewardActivitiesEmptyState';

      // tab picks the wording and the button: 'earned' or 'contributions'
      <FlatList
        data={activities}
        renderItem={renderActivity}
        ListEmptyComponent={<RewardActivitiesEmptyState tab="earned" />}
      />`,
    rnKind: "usage",
    note: "Contributions uses the same layout: You Haven't Supported Any Creators Yet, with Go to discovery.",
  },
  {
    id: "wallet-balance",
    name: "Wallet balance",
    group: "Profile and wallet",
    order: 280,
    app: "AppCard",
    css: ["app/css/profile.css"],
    screens: ["wallet.html", "wallet.html?state=add", "wallet.html?state=withdraw"],
    text: "The coin balance in a white-outlined card with Add coins and Withdraw, then this month's earned and spent coins in two smaller cards.",
    keywords: "wallet balance coins add withdraw earned spent stats",
    html: `
      <section class="pr-balance" aria-labelledby="balance-title">
        <div class="pr-balance__head" id="balance-title"><i class="icon" data-lucide="coins"></i>Available Balance</div>
        <p class="pr-balance__amount">1,250</p>
        <div class="pr-balance__actions">
          <button class="btn" type="button"><i class="icon" data-lucide="download"></i>Add coins</button>
          <button class="btn" type="button"><i class="icon" data-lucide="upload"></i>Withdraw</button>
        </div>
      </section>
      <div class="pr-stats">
        <div class="pr-stat"><div class="pr-stat__head"><i class="icon" data-lucide="trending-up"></i>Earned</div><span class="pr-stat__value">+620</span><span class="pr-stat__note">This month</span></div>
        <div class="pr-stat"><div class="pr-stat__head"><i class="icon" data-lucide="box"></i>Spent</div><span class="pr-stat__value">-125</span><span class="pr-stat__note">This month</span></div>
      </div>`,
    rn: `
      import { StyleSheet, View } from 'react-native';
      import { Lucide } from '@react-native-vector-icons/lucide';
      import { AppButton, AppCard, AppText } from '@/core/components';
      import { useTheme } from '@/core/hooks';

      const { colors } = useTheme();

      <AppCard>
        <View style={styles.row}>
          <Lucide name="coins" size={20} color={colors.white} />
          <AppText variant="titleMedium">Available Balance</AppText>
        </View>
        <AppText variant="displayMedium">1,250</AppText>
        <View style={styles.row}>
          <AppButton label="Add coins" variant="tonal" icon="tray-arrow-down" onPress={openAddCoins} />
          <AppButton label="Withdraw" variant="tonal" icon="tray-arrow-up" onPress={openWithdraw} />
        </View>
      </AppCard>
      <AppCard style={styles.stat}>
        <AppText variant="labelLarge">Earned</AppText>
        <AppText variant="titleLarge">+620</AppText>
        <AppText variant="bodySmall" color="white50">This month</AppText>
      </AppCard>
      {/* Spent: the same small card with -125, side by side in a row */}

      const styles = StyleSheet.create({
        row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
        stat: { flex: 1 },
      });`,
    rnKind: "usage",
    rnUses: ["AppCard", "AppButton", "AppText"],
    note: "The white buttons only get their look inside <code>.phone</code>.",
  },
  {
    id: "coin-packages",
    name: "Coin packages",
    group: "Profile and wallet",
    order: 290,
    app: "",
    css: ["app/css/profile.css"],
    screens: ["wallet.html", "wallet.html?state=add"],
    text: "Coin bundles in a sideways-scrolling row. In the Add coins sheet the picked one gets an orange outline and tint.",
    keywords: "coins buy packages bundles price wallet",
    html: `
      <h2 class="pr-h2">Buy Coins <span class="tag tag--placeholder">Placeholder prices</span></h2>
      <div class="pr-packages" role="group" aria-label="Coin packages">
        <button class="pr-package" type="button" aria-pressed="false"><i class="icon" data-lucide="coins"></i><span class="pr-package__amount">100</span><span class="pr-package__price">$0.99</span></button>
        <button class="pr-package" type="button" aria-pressed="true"><i class="icon" data-lucide="coins"></i><span class="pr-package__amount">500</span><span class="pr-package__price">$4.99</span></button>
        <button class="pr-package" type="button" aria-pressed="false"><i class="icon" data-lucide="coins"></i><span class="pr-package__amount">1000</span><span class="pr-package__price">$9.99</span></button>
      </div>`,
    js: `
      document.querySelectorAll(".pr-package").forEach((p, i, all) => p.addEventListener("click", () => {
        all.forEach((x) => x.setAttribute("aria-pressed", x === p));
      }));`,
    rn: `
      import { Pressable, ScrollView, StyleSheet } from 'react-native';
      import { Lucide } from '@react-native-vector-icons/lucide';
      import { AppText } from '@/core/components';
      import { useTheme } from '@/core/hooks';

      const { colors } = useTheme();
      // Placeholder packages and prices
      const packages = [{ coins: 100, price: '$0.99' }, { coins: 500, price: '$4.99' }, { coins: 1000, price: '$9.99' }];

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {packages.map(p => {
          const on = p.coins === picked;
          return (
            <Pressable key={p.coins} onPress={() => setPicked(p.coins)} accessibilityState={{ selected: on }}
              style={[styles.card, { borderColor: on ? colors.orange : colors.overlayWhite }, on && { backgroundColor: colors.orange + '1F' }]}>
              <Lucide name="coins" size={24} color={colors.white} />
              <AppText variant="titleLarge" style={styles.amount}>{p.coins}</AppText>
              <AppText variant="labelMedium">{p.price}</AppText>
            </Pressable>
          );
        })}
      </ScrollView>

      const styles = StyleSheet.create({
        row: { gap: 12, paddingHorizontal: 16 },
        card: { minWidth: 112, alignItems: 'center', paddingVertical: 16, paddingHorizontal: 24, borderWidth: 1, borderRadius: 22 },
        amount: { marginTop: 12, fontWeight: '700' },
      });`,
    rnKind: "pattern",
    rnWhere: "WalletScreen",
  },
  {
    id: "transaction-row",
    name: "Transaction row",
    group: "Profile and wallet",
    order: 300,
    app: "",
    css: ["app/css/profile.css"],
    screens: ["wallet.html"],
    text: "One line of wallet history: a coin icon, who it was for or what happened, when, and the coins in or out.",
    keywords: "transaction history wallet coins spent added",
    html: `
      <div class="pr-transactions">
        <div class="pr-transaction"><span class="pr-transaction__icon"><i class="icon" data-lucide="coins"></i></span><span class="pr-transaction__info"><span class="pr-transaction__name">PixelForge</span><span class="pr-transaction__time">5 minutes ago</span></span><span class="pr-transaction__amount">-50</span></div>
        <div class="pr-transaction"><span class="pr-transaction__icon"><i class="icon" data-lucide="coins"></i></span><span class="pr-transaction__info"><span class="pr-transaction__name">Coins added</span><span class="pr-transaction__time">3 days ago</span></span><span class="pr-transaction__amount">+500</span></div>
      </div>`,
    rn: `
      import { StyleSheet, View } from 'react-native';
      import { Lucide } from '@react-native-vector-icons/lucide';
      import { AppText } from '@/core/components';
      import { useTheme } from '@/core/hooks';

      const { colors } = useTheme();

      <View style={[styles.row, { borderColor: colors.white }]}>
        <View style={[styles.icon, { backgroundColor: colors.white }]}>
          <Lucide name="coins" size={20} color={colors.black} />
        </View>
        <View style={styles.info}>
          <AppText variant="titleMedium" style={styles.bold}>PixelForge</AppText>
          <AppText variant="labelSmall">5 minutes ago</AppText>
        </View>
        <AppText variant="titleMedium" style={styles.bold}>-50</AppText>
      </View>

      const styles = StyleSheet.create({
        row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderWidth: 1, borderRadius: 16 },
        icon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
        info: { flex: 1 },
        bold: { fontWeight: '700' },
      });`,
    rnKind: "pattern",
    rnWhere: "WalletScreen",
  },
);
