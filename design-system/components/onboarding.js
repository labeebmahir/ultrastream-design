// Components from the sign-in and onboarding screens. Markup matches app/welcome.html, sign-in.html,
// sign-up.html, forgot-password.html, choose-handle.html, experience.html, interests.html,
// age-check.html and creator-benefits.html. Most styles are scoped to .auth, which sits on the phone.
(window.COMPONENTS = window.COMPONENTS || []).push(
  {
    id: "auth-heading",
    name: "Sign-in heading",
    group: "Sign-in and onboarding",
    order: 10,
    app: "SignUpScreen",
    css: ["app/css/onboarding.css"],
    screens: ["sign-up.html", "sign-in.html", "forgot-password.html"],
    text: "The centred title and one line of help at the top of each sign-in step. The first sign-up step adds the logo above it; later steps use the smaller title sizes.",
    keywords: "title hero header logo welcome",
    html: `
      <div class="auth">
        <header class="auth-hero">
          <img class="auth-hero__logo" src="../assets/img/logo-icon.png" alt="UltraStream">
          <h1 class="auth-title auth-title--md">Create your account</h1>
          <p class="auth-sub">Start with your email address.</p>
        </header>
      </div>
      <div class="auth">
        <header class="auth-hero">
          <h1 class="auth-title auth-title--sm">Check your email</h1>
          <p class="auth-sub">We sent a 6-digit code to <strong>alex@example.com</strong>. Enter it below.</p>
        </header>
      </div>`,
    rn: `
      import { Image, StyleSheet, View } from 'react-native';
      import { AppText } from '@/core/components';

      // First sign-up step: logo, title and one line of help
      <View style={styles.hero}>
        <Image source={require('@/assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
        <AppText variant="headlineMedium" align="center" style={styles.bold}>Create your account</AppText>
        <AppText variant="bodyLarge" align="center">Start with your email address.</AppText>
      </View>

      // Later steps drop the logo and use the 22px title
      <AppText variant="titleLarge" align="center" style={styles.bold}>Check your email</AppText>

      const styles = StyleSheet.create({
        hero: { alignItems: 'center', gap: 8 },
        logo: { width: 141, height: 70, marginBottom: 12 },
        bold: { fontWeight: '700' },
      });`,
    rnKind: "pattern",
    rnWhere: "SignUpScreen",
    note: "Title sizes: default 28px, <code>auth-title--md</code> 24px, <code>auth-title--sm</code> 22px. <code>auth-sub--sm</code> makes the line 14px.",
  },
  {
    id: "auth-field",
    name: "Sign-in text field",
    group: "Inputs and forms",
    order: 30,
    app: "AppInput",
    css: ["app/css/onboarding.css"],
    screens: ["sign-in.html", "sign-in.html?state=email-invalid", "sign-up.html?state=email-invalid"],
    text: "The taller field used on the sign-in screens: bold label, 56px box with grey placeholder, and a small red error under it. Inside <code>.auth</code> the shared field gets these sizes.",
    keywords: "email input error label 56",
    html: `
      <div class="auth">
        <div class="auth-form">
          <label class="field">
            <span class="field__label">Email</span>
            <input class="input" type="email" autocomplete="email" placeholder="you@example.com">
            <span class="field__error" hidden></span>
          </label>
          <label class="field field--invalid">
            <span class="field__label">Email</span>
            <input class="input" type="email" value="alex@example" aria-invalid="true">
            <span class="field__error">Enter a valid email address.</span>
          </label>
        </div>
      </div>`,
    rn: `
      import { AppInput } from '@/core/components';

      <AppInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />

      // With errorText the outline turns red and the message shows underneath
      <AppInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        errorText="Enter a valid email address."
      />`,
    rnKind: "usage",
    note: "To show an error, add <code>field--invalid</code> and unhide <code>.field__error</code>. The onboarding script does this with <code>OB.setError(input, message)</code>.",
  },
  {
    id: "auth-password",
    name: "Sign-in password field",
    group: "Inputs and forms",
    order: 31,
    app: "AppInput",
    css: ["app/css/onboarding.css"],
    screens: ["sign-in.html", "sign-up.html?state=password", "forgot-password.html?state=reset-mismatch"],
    text: "A sign-in field with an eye button on the right that shows or hides what was typed. Use it for every password and confirm password box.",
    keywords: "show hide eye toggle secret",
    html: `
      <div class="auth">
        <div class="auth-form">
          <label class="field">
            <span class="field__label">Password</span>
            <span class="input-wrap">
              <input class="input" type="password" autocomplete="new-password" value="password123" placeholder="At least 8 characters">
              <button class="icon-btn input-wrap__btn" type="button" data-toggle-password aria-label="Show password"><i class="icon" data-lucide="eye"></i></button>
            </span>
            <span class="field__error" hidden></span>
          </label>
          <label class="field field--invalid">
            <span class="field__label">Confirm password</span>
            <span class="input-wrap">
              <input class="input" type="password" autocomplete="new-password" value="password124" aria-invalid="true">
              <button class="icon-btn input-wrap__btn" type="button" data-toggle-password aria-label="Show password"><i class="icon" data-lucide="eye"></i></button>
            </span>
            <span class="field__error">Passwords don't match.</span>
          </label>
        </div>
      </div>`,
    js: `
      // Eye button: switch the input between hidden and plain text
      document.querySelectorAll("[data-toggle-password]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const input = btn.parentElement.querySelector("input");
          const show = input.type === "password";
          input.type = show ? "text" : "password";
          btn.setAttribute("aria-label", show ? "Hide password" : "Show password");
          btn.innerHTML = '<i class="icon" data-lucide="' + (show ? "eye-off" : "eye") + '"></i>';
        });
      });`,
    rn: `
      import { useState } from 'react';
      import { TextInput } from 'react-native-paper';
      import { AppInput } from '@/core/components';

      const [showPassword, setShowPassword] = useState(false);

      // AppInput takes Paper's right slot; eye and eye-off are Paper icon names
      <AppInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        placeholder="At least 8 characters"
        autoComplete="new-password"
        secureTextEntry={!showPassword}
        right={<TextInput.Icon icon={showPassword ? 'eye-off' : 'eye'} onPress={() => setShowPassword(!showPassword)} />}
      />

      // Confirm password gets the same eye button, plus the error when they differ
      <AppInput
        label="Confirm password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry={!showConfirm}
        right={<TextInput.Icon icon={showConfirm ? 'eye-off' : 'eye'} onPress={() => setShowConfirm(!showConfirm)} />}
        errorText="Passwords don't match."
      />`,
    rnKind: "usage",
    note: "On screens, <code>OB.setupPasswordToggles()</code> in <code>app/js/onboarding.js</code> wires every <code>data-toggle-password</code> button.",
  },
  {
    id: "handle-status",
    name: "Username availability",
    group: "Inputs and forms",
    order: 32,
    app: "SignUpScreen",
    css: ["app/css/onboarding.css"],
    screens: ["sign-up.html?state=handle-checking", "sign-up.html?state=handle-available", "sign-up.html?state=handle-taken"],
    text: "A line under the username field that says whether the handle is free. It checks a moment after typing stops: grey while checking, green when available, red when taken.",
    keywords: "handle username available taken checking status",
    html: `
      <div class="auth">
        <div class="auth-form">
          <label class="field">
            <span class="field__label">Username</span>
            <input class="input" type="text" autocomplete="username" value="kingpin99">
            <span class="field__status field__status--checking" role="status">Checking availability...</span>
          </label>
          <label class="field">
            <span class="field__label">Username</span>
            <input class="input" type="text" autocomplete="username" value="kingpin99">
            <span class="field__status field__status--ok" role="status"><i class="icon" data-lucide="circle-check"></i>kingpin99 is available</span>
          </label>
          <label class="field">
            <span class="field__label">Username</span>
            <input class="input" type="text" autocomplete="username" value="pixelforge">
            <span class="field__status field__status--bad" role="status"><i class="icon" data-lucide="circle-x"></i>Username is already taken</span>
          </label>
        </div>
      </div>`,
    rn: `
      import { StyleSheet, View } from 'react-native';
      import { Lucide } from '@react-native-vector-icons/lucide';
      import { AppInput, AppText } from '@/core/components';
      import { useTheme } from '@/core/hooks';

      const { colors } = useTheme();

      // status is 'checking', 'available' or 'taken', set a moment after typing stops
      <AppInput label="Username" value={username} onChangeText={setUsername} autoCapitalize="none" autoComplete="username" />
      {status === 'checking' && <AppText variant="bodyMedium" color="white50">Checking availability...</AppText>}
      {status !== 'checking' && (
        <View style={styles.status}>
          <Lucide name={status === 'available' ? 'circle-check' : 'circle-x'} size={14} color={status === 'available' ? colors.success : colors.error} />
          <AppText variant="bodyMedium" color={status === 'available' ? 'success' : 'error'} style={styles.bold}>
            {status === 'available' ? username + ' is available' : 'Username is already taken'}
          </AppText>
        </View>
      )}

      const styles = StyleSheet.create({
        status: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
        bold: { fontWeight: '600' },
      });`,
    rnKind: "pattern",
    rnWhere: "SignUpScreen",
  },
  {
    id: "auth-button-states",
    name: "Sign-in button states",
    group: "Sign-in and onboarding",
    order: 20,
    app: "AppButton",
    css: ["app/css/onboarding.css"],
    screens: ["sign-in.html?state=loading", "sign-up.html?state=confirming", "interests.html"],
    text: "Buttons on these screens fill the width. A disabled one loses its gradient and turns grey. While saving, some keep the gradient and show a spinner, others go grey with the spinner, as in the app.",
    keywords: "loading spinner disabled busy continue",
    html: `
      <div class="auth">
        <div class="auth-form">
          <button class="btn btn--primary btn--lg" type="button">Continue</button>
          <button class="btn btn--primary btn--lg" type="button" disabled>Continue</button>
          <button class="btn btn--primary is-loading" type="button" disabled aria-busy="true"><i class="icon icon--spin" data-lucide="loader-circle"></i>Logging in...</button>
          <button class="btn btn--primary btn--lg" type="button" disabled aria-busy="true"><i class="icon icon--spin" data-lucide="loader-circle"></i>Confirming...</button>
        </div>
      </div>`,
    rn: `
      import { AppButton } from '@/core/components';

      <AppButton label="Continue" size="lg" fullWidth onPress={() => {}} />

      // disabled drops the gradient and turns grey
      <AppButton label="Continue" size="lg" fullWidth disabled onPress={() => {}} />

      // loading alone keeps the gradient and adds a spinner
      <AppButton label="Logging in..." fullWidth loading onPress={() => {}} />

      // loading with disabled goes grey with the spinner
      <AppButton label="Confirming..." size="lg" fullWidth loading disabled onPress={() => {}} />`,
    rnKind: "usage",
    note: "<code>OB.setBusy(button, true, label, { keepGradient })</code> switches a button into the loading look and back.",
  },
  {
    id: "social-sign-in",
    name: "Google and Apple buttons",
    group: "Sign-in and onboarding",
    order: 30,
    app: "LoginForm",
    css: ["app/css/onboarding.css"],
    screens: ["sign-in.html", "sign-up.html", "sign-in.html?platform=android"],
    text: "Outlined buttons to continue with Google or Apple, under the divider. Log in uses the 48px version; sign up uses the taller 52px one with 10px corners. Apple only shows on iPhone.",
    keywords: "google apple social sso oauth continue with",
    html: `
      <div class="auth">
        <div class="auth-stack">
          <button class="btn btn--social" type="button" data-social="google"><span class="social-g" aria-hidden="true">G</span>Continue with Google</button>
          <button class="btn btn--social" type="button" data-social="apple"><i class="icon" data-lucide="apple"></i>Continue with Apple</button>
        </div>
      </div>
      <div class="auth">
        <div class="auth-stack">
          <button class="btn btn--social btn--social-lg" type="button" data-social="google"><span class="social-g" aria-hidden="true">G</span>Continue with Google</button>
          <button class="btn btn--social btn--social-lg" type="button" data-social="apple"><i class="icon" data-lucide="apple"></i>Continue with Apple</button>
        </div>
      </div>`,
    rn: `
      import { Platform } from 'react-native';
      import { Lucide } from '@react-native-vector-icons/lucide';
      import { AppButton } from '@/core/components';

      // Paper calls an icon function with the size and colour to draw it in.
      // GoogleIcon draws the Google G mark the same way.
      const AppleIcon = ({ size, color }: { size: number; color: string }) => (
        <Lucide name="apple" size={size} color={color} />
      );

      <AppButton label="Continue with Google" variant="outlined" fullWidth icon={GoogleIcon} onPress={() => {}} />
      {Platform.OS === 'ios' && (
        <AppButton label="Continue with Apple" variant="outlined" fullWidth icon={AppleIcon} onPress={() => {}} />
      )}`,
    rnKind: "usage",
    rnUses: ["AppButton"],
    note: "Remove the Apple button for Android. Add <code>?platform=android</code> to a screen's address to see it.",
  },
  {
    id: "auth-divider",
    name: "Or divider",
    group: "Sign-in and onboarding",
    order: 40,
    app: "LoginForm",
    css: ["app/css/onboarding.css"],
    screens: ["sign-in.html", "sign-up.html"],
    text: "A thin line either side of a short label, between the email form and the Google and Apple buttons. The small version is used on sign up.",
    keywords: "separator or continue with line",
    html: `
      <div class="auth-divider">or continue with</div>
      <div class="auth-divider auth-divider--sm">or continue with</div>`,
    rn: `
      import { StyleSheet, View } from 'react-native';
      import { AppText } from '@/core/components';
      import { useTheme } from '@/core/hooks';

      const { colors } = useTheme();

      // Sign up uses bodyMedium and 8px above and below
      <View style={styles.divider}>
        <View style={[styles.line, { backgroundColor: colors.outlineVariant }]} />
        <AppText variant="bodySmall">or continue with</AppText>
        <View style={[styles.line, { backgroundColor: colors.outlineVariant }]} />
      </View>

      const styles = StyleSheet.create({
        divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 12 },
        line: { flex: 1, height: 1 },
      });`,
    rnKind: "pattern",
    rnWhere: "LoginForm",
  },
  {
    id: "otp",
    name: "Code boxes",
    group: "Sign-in and onboarding",
    order: 50,
    app: "SignUpScreen",
    css: ["app/css/onboarding.css"],
    screens: ["sign-up.html?state=code", "sign-up.html?state=code-error", "forgot-password.html?state=code"],
    text: "Six joined boxes for the code we email. Typing moves to the next box and a filled box turns red. A wrong code turns the boxes red and shows a message underneath.",
    keywords: "verification code pin otp one-time digits",
    html: `
      <div class="otp">
        <div class="otp__boxes" role="group" aria-label="6-digit code">
          <input class="otp__box is-filled" inputmode="numeric" autocomplete="one-time-code" maxlength="1" aria-label="Digit 1" value="4">
          <input class="otp__box is-filled" inputmode="numeric" maxlength="1" aria-label="Digit 2" value="8">
          <input class="otp__box is-filled" inputmode="numeric" maxlength="1" aria-label="Digit 3" value="2">
          <input class="otp__box" inputmode="numeric" maxlength="1" aria-label="Digit 4">
          <input class="otp__box" inputmode="numeric" maxlength="1" aria-label="Digit 5">
          <input class="otp__box" inputmode="numeric" maxlength="1" aria-label="Digit 6">
        </div>
        <p class="otp__error" role="alert" hidden></p>
      </div>
      <div class="otp otp--invalid">
        <div class="otp__boxes" role="group" aria-label="6-digit code">
          <input class="otp__box is-filled" inputmode="numeric" maxlength="1" aria-label="Digit 1" value="0">
          <input class="otp__box is-filled" inputmode="numeric" maxlength="1" aria-label="Digit 2" value="0">
          <input class="otp__box is-filled" inputmode="numeric" maxlength="1" aria-label="Digit 3" value="0">
          <input class="otp__box is-filled" inputmode="numeric" maxlength="1" aria-label="Digit 4" value="0">
          <input class="otp__box is-filled" inputmode="numeric" maxlength="1" aria-label="Digit 5" value="0">
          <input class="otp__box is-filled" inputmode="numeric" maxlength="1" aria-label="Digit 6" value="0">
        </div>
        <p class="otp__error" role="alert">That code is incorrect. Please try again.</p>
      </div>`,
    js: `
      // Typing a digit fills the box and moves to the next one; Backspace on an empty box goes back
      document.querySelectorAll(".otp").forEach((otp) => {
        const boxes = [...otp.querySelectorAll(".otp__box")];
        boxes.forEach((box, i) => {
          box.addEventListener("input", () => {
            const v = box.value.slice(-1);
            box.value = "0123456789".includes(v) ? v : "";
            box.classList.toggle("is-filled", box.value !== "");
            otp.classList.remove("otp--invalid");
            otp.querySelector(".otp__error").hidden = true;
            if (box.value && i < boxes.length - 1) boxes[i + 1].focus();
          });
          box.addEventListener("keydown", (e) => {
            if (e.key === "Backspace" && !box.value && i > 0) boxes[i - 1].focus();
          });
        });
      });`,
    rn: `
      import { StyleSheet, TextInput, View } from 'react-native';
      import { AppText } from '@/core/components';
      import { useTheme } from '@/core/hooks';

      const { colors } = useTheme();

      // code holds six strings; setDigit stores one and focuses the next box
      <View style={styles.row}>
        {code.map((digit, i) => (
          <TextInput
            key={i}
            ref={el => { boxes.current[i] = el; }}
            value={digit}
            onChangeText={value => setDigit(i, value)}
            keyboardType="number-pad"
            textContentType={i === 0 ? 'oneTimeCode' : 'none'}
            maxLength={1}
            style={[styles.box, i === 0 && styles.first, i === 5 && styles.last, {
              color: colors.white,
              borderColor: error ? colors.error : digit ? colors.primary : colors.white50,
            }]}
          />
        ))}
      </View>
      {error && <AppText variant="bodySmall" color="error" align="center">{error}</AppText>}

      const styles = StyleSheet.create({
        row: { flexDirection: 'row', paddingHorizontal: 8 },
        box: { flex: 1, height: 56, borderWidth: 1, borderRightWidth: 0, textAlign: 'center', fontSize: 22, fontWeight: '700' },
        first: { borderTopLeftRadius: 8, borderBottomLeftRadius: 8 },
        last: { borderRightWidth: 1, borderTopRightRadius: 8, borderBottomRightRadius: 8 },
      });`,
    rnKind: "pattern",
    rnWhere: "SignUpScreen",
    note: "On screens, <code>OB.setupOtp()</code> also handles pasting a whole code, and <code>OB.setOtpError()</code> shows the error.",
  },
  {
    id: "auth-checkbox",
    name: "Checkboxes",
    group: "Sign-in and onboarding",
    order: 60,
    app: "SignUpScreen",
    css: ["app/css/onboarding.css"],
    screens: ["sign-in.html", "sign-up.html", "sign-up.html?state=terms"],
    text: "The plain white checkbox is Remember me on log in. The terms checkbox on sign up turns red when ticked, and shows an error underneath if someone tries to continue without it.",
    keywords: "checkbox terms conditions remember me agree",
    html: `
      <div class="auth">
        <div class="auth-form">
          <label class="check"><input type="checkbox" checked>Remember me</label>
          <label class="check check--terms">
            <input type="checkbox" checked>
            <span>By proceeding, you agree to our <span class="text-link--red">Terms &amp; Conditions</span> here to continue.</span>
          </label>
          <label class="check check--terms is-invalid">
            <input type="checkbox">
            <span>By proceeding, you agree to our <span class="text-link--red">Terms &amp; Conditions</span> here to continue.</span>
          </label>
          <p class="terms-error" role="alert">To proceed, you must agree with terms here to continue.</p>
        </div>
      </div>`,
    rn: `
      import { Pressable, StyleSheet, View } from 'react-native';
      import { Checkbox } from 'react-native-paper';
      import { Lucide } from '@react-native-vector-icons/lucide';
      import { AppText } from '@/core/components';
      import { useTheme } from '@/core/hooks';

      const { colors } = useTheme();

      // Remember me on log in: Paper's checkbox in white
      <Pressable style={styles.row} onPress={() => setRememberMe(!rememberMe)}>
        <Checkbox.Android status={rememberMe ? 'checked' : 'unchecked'} color={colors.white} />
        <AppText variant="bodyMedium">Remember me</AppText>
      </Pressable>

      // Terms on sign up: a small box that fills red when ticked, red outline on error
      <Pressable style={styles.terms} onPress={() => setAgreed(!agreed)} accessibilityRole="checkbox" accessibilityState={{ checked: agreed }}>
        <View style={[styles.box, {
          borderColor: termsError ? colors.error : agreed ? colors.primary : colors.white50,
          backgroundColor: agreed ? colors.primary : colors.transparent,
        }]}>
          {agreed && <Lucide name="check" size={14} color={colors.white} />}
        </View>
        <AppText variant="bodySmall" style={styles.flex}>
          By proceeding, you agree to our <AppText variant="bodySmall" color="primary">Terms & Conditions</AppText> here to continue.
        </AppText>
      </Pressable>
      {termsError && <AppText variant="bodySmall" color="error">{termsError}</AppText>}

      const styles = StyleSheet.create({
        row: { flexDirection: 'row', alignItems: 'center' },
        terms: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
        box: { width: 18, height: 18, marginTop: 2, borderWidth: 1, borderRadius: 3, alignItems: 'center', justifyContent: 'center' },
        flex: { flex: 1 },
      });`,
    rnKind: "pattern",
    rnWhere: "LoginForm and SignUpScreen",
    note: "<code>.terms-error</code> pulls itself up under the checkbox, so keep it inside <code>.auth-form</code>.",
  },
  {
    id: "auth-links",
    name: "Text links",
    group: "Sign-in and onboarding",
    order: 70,
    app: "LoginForm",
    css: ["app/css/onboarding.css"],
    screens: ["sign-in.html", "sign-up.html?state=code", "sign-up.html?state=resend"],
    text: "Small links on the sign-in screens: underlined white links, the bold one at the end of a footer line, and the orange resend link, which is greyed out while it counts down.",
    keywords: "link forgot password sign up resend footer underline",
    html: `
      <div class="auth">
        <div class="auth-form">
          <div class="auth-options">
            <label class="check"><input type="checkbox">Remember me</label>
            <a class="text-link" href="forgot-password.html">Forgot Password?</a>
          </div>
          <p class="auth-footer">Don't have account?&nbsp;<a class="text-link text-link--bold" href="sign-up.html">Sign up</a></p>
          <p class="auth-footer">Didn't receive code?&nbsp;<button class="text-link text-link--orange" type="button" disabled>Resend in 42s</button></p>
          <p class="auth-footer">Didn't receive code?&nbsp;<button class="text-link text-link--orange" type="button">Resend code</button></p>
        </div>
      </div>`,
    rn: `
      import { Pressable, StyleSheet, View } from 'react-native';
      import { AppText } from '@/core/components';

      // On log in, LoginForm draws the first two from onForgotPasswordPress and onRegisterPress
      <Pressable onPress={() => {}}>
        <AppText variant="bodyMedium" style={styles.underline}>Forgot Password?</AppText>
      </Pressable>

      <View style={styles.footer}>
        <AppText variant="bodyMedium">{"Don't have account? "}</AppText>
        <Pressable onPress={() => {}}>
          <AppText variant="bodyMedium" style={[styles.underline, styles.bold]}>Sign up</AppText>
        </Pressable>
      </View>

      // Resend: orange, greyed out while the countdown runs
      <Pressable disabled={secondsLeft > 0} onPress={() => {}}>
        <AppText variant="bodyMedium" color={secondsLeft > 0 ? 'white50' : 'orange'} style={styles.bold}>
          {secondsLeft > 0 ? 'Resend in ' + secondsLeft + 's' : 'Resend code'}
        </AppText>
      </Pressable>

      const styles = StyleSheet.create({
        footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
        underline: { textDecorationLine: 'underline' },
        bold: { fontWeight: '700' },
      });`,
    rnKind: "pattern",
    rnWhere: "LoginForm and SignUpScreen",
    note: "<code>OB.setupResend(button, onResend)</code> runs the 59 second countdown.",
  },
  {
    id: "back-link",
    name: "Go back link",
    group: "Sign-in and onboarding",
    order: 80,
    app: "",
    css: ["app/css/onboarding.css"],
    screens: ["sign-up.html", "sign-in.html", "experience.html"],
    text: "A centred arrow and Go back under the form. The bold 14px one is used between sign-up steps; the larger regular one sits at the bottom of log in, experience type and interests.",
    keywords: "back previous arrow",
    html: `
      <button class="back-link" type="button"><i class="icon" data-lucide="arrow-left"></i>Go back</button>
      <a class="back-link back-link--lg" href="welcome.html"><i class="icon" data-lucide="arrow-left"></i>Go back</a>`,
    rn: `
      import { Pressable, StyleSheet } from 'react-native';
      import { Lucide } from '@react-native-vector-icons/lucide';
      import { AppText } from '@/core/components';
      import { useTheme } from '@/core/hooks';

      const { colors } = useTheme();

      // Between sign-up steps: bold 14px
      <Pressable style={styles.back} onPress={() => {}} accessibilityRole="button">
        <Lucide name="arrow-left" size={18} color={colors.white} />
        <AppText variant="bodyMedium" style={styles.bold}>Go back</AppText>
      </Pressable>

      // Log in, experience type and interests: regular 16px
      <Pressable style={styles.back} onPress={() => {}} accessibilityRole="button">
        <Lucide name="arrow-left" size={16} color={colors.white} />
        <AppText variant="bodyLarge">Go back</AppText>
      </Pressable>

      const styles = StyleSheet.create({
        back: { flexDirection: 'row', alignItems: 'center', alignSelf: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 8 },
        bold: { fontWeight: '600' },
      });`,
    rnKind: "pattern",
    rnWhere: "LoginForm and each onboarding screen",
  },
  {
    id: "auth-toast",
    name: "Sign-in message banner",
    group: "Feedback and states",
    order: 60,
    app: "AppToast",
    css: ["app/css/onboarding.css"],
    screens: ["sign-in.html?state=wrong-password", "sign-in.html?state=reset-success", "sign-up.html?state=email-exists"],
    text: "A banner near the top of the screen for sign-in problems and successes, with an icon and Dismiss. Errors are red and successes brand red, both with white text. It goes after 3 seconds. It's the app's AppToast, the same as the Message banner.",
    keywords: "toast banner alert error success dismiss message",
    html: `
      <div class="auth-toast" role="alert">
        <i class="icon" data-lucide="circle-alert"></i>
        <span class="auth-toast__text">Email and password don't match.</span>
        <button class="auth-toast__action" type="button">Dismiss</button>
      </div>
      <div class="auth-toast auth-toast--success" role="status">
        <i class="icon" data-lucide="circle-check"></i>
        <span class="auth-toast__text">Your password has been reset. Please sign in.</span>
        <button class="auth-toast__action" type="button">Dismiss</button>
      </div>`,
    js: `
      document.querySelectorAll(".auth-toast__action").forEach((b) => b.addEventListener("click", () => b.parentElement.remove()));`,
    rn: `
      import { AppToast } from '@/core/components';

      // Error: red (colors.error) with white text
      <AppToast
        visible={showError}
        message="Email and password don't match."
        type="error"
        onDismiss={() => setShowError(false)}
      />

      // Success: brand red (colors.primary) with white text. Both go after 3 seconds unless you pass duration
      <AppToast
        visible={showReset}
        message="Your password has been reset. Please sign in."
        type="success"
        onDismiss={() => setShowReset(false)}
      />`,
    rnKind: "usage",
    frameCSS: ".cd-phone > .auth-toast { position: static; margin: 0 16px; }",
    note: "The preview stacks both. On a screen the banner is placed 50px from the top of the phone, over everything: add it to the phone with <code>OB.toast(message, \"success\")</code>. Outside the sign-in screens, use <code>US.appToast</code>.",
  },
  {
    id: "experience-choice",
    name: "Choice cards",
    group: "Sign-in and onboarding",
    order: 90,
    app: "ExperienceTypeScreen",
    css: ["app/css/onboarding.css"],
    screens: ["experience.html", "experience.html?from=settings"],
    text: "Large cards for picking one option, used for the experience type. Each has an icon, a title and a line of text. The chosen card fills with the gradient.",
    keywords: "radio select option experience ad supporter premium",
    html: `
      <div class="choice-list" role="radiogroup" aria-label="Experience">
        <button class="choice" type="button" role="radio" aria-checked="true">
          <i class="icon choice__icon" data-lucide="heart-handshake"></i>
          <span class="choice__title">Ad Supporter</span>
          <span class="choice__text">Watch content with occasional ads. Earn coins by engaging with content.</span>
        </button>
        <button class="choice" type="button" role="radio" aria-checked="false">
          <i class="icon choice__icon" data-lucide="star"></i>
          <span class="choice__title">Ad Free Premium</span>
          <span class="choice__text">Enjoy uninterrupted streaming with exclusive perks and bonus coins.</span>
        </button>
      </div>`,
    js: `
      // One card at a time
      const cards = document.querySelectorAll(".choice");
      cards.forEach((card) => card.addEventListener("click", () => {
        cards.forEach((c) => c.setAttribute("aria-checked", String(c === card)));
      }));`,
    rn: `
      import { Pressable, StyleSheet } from 'react-native';
      import LinearGradient from 'react-native-linear-gradient';
      import { Lucide } from '@react-native-vector-icons/lucide';
      import { AppText } from '@/core/components';
      import { useTheme } from '@/core/hooks';

      const { colors, radius } = useTheme();
      const selected = experience === 'ads';

      // Repeat for Ad Free Premium with the star icon
      <Pressable onPress={() => setExperience('ads')} accessibilityRole="radio" accessibilityState={{ checked: selected }}>
        <LinearGradient
          colors={selected ? [colors.red, colors.orange] : [colors.black, colors.black]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.card, { borderRadius: radius.md, borderColor: selected ? colors.transparent : colors.white }]}>
          <Lucide name="heart-handshake" size={36} color={colors.white} />
          <AppText variant="titleLarge" style={styles.title}>Ad Supporter</AppText>
          <AppText variant="bodyMedium">Watch content with occasional ads. Earn coins by engaging with content.</AppText>
        </LinearGradient>
      </Pressable>

      const styles = StyleSheet.create({
        card: { minHeight: 168, paddingVertical: 28, paddingHorizontal: 24, borderWidth: 1 },
        title: { marginTop: 16, marginBottom: 12 },
      });`,
    rnKind: "pattern",
    rnWhere: "ExperienceTypeScreen",
  },
  {
    id: "interest-grid",
    name: "Interest grid",
    group: "Sign-in and onboarding",
    order: 100,
    app: "InterestsScreen",
    css: ["app/css/onboarding.css"],
    screens: ["interests.html", "interests.html?state=selected"],
    text: "Category chips in three equal columns for choosing interests. Picked chips turn white. Continue stays disabled until at least three are picked.",
    keywords: "categories topics chips select multiple",
    html: `
      <div class="interest-grid" role="group" aria-label="Interests">
        <button class="chip" type="button" aria-pressed="true" title="Gaming">Gaming</button>
        <button class="chip" type="button" aria-pressed="true" title="Music">Music</button>
        <button class="chip" type="button" aria-pressed="false" title="Sports">Sports</button>
        <button class="chip" type="button" aria-pressed="true" title="Tech">Tech</button>
        <button class="chip" type="button" aria-pressed="false" title="Entertainment">Entertainment</button>
        <button class="chip" type="button" aria-pressed="false" title="Art">Art</button>
        <button class="chip" type="button" aria-pressed="false" title="Education">Education</button>
        <button class="chip" type="button" aria-pressed="false" title="Food">Food</button>
        <button class="chip" type="button" aria-pressed="false" title="Travel">Travel</button>
      </div>`,
    js: `
      document.querySelectorAll(".interest-grid .chip").forEach((chip) => chip.addEventListener("click", () => {
        chip.setAttribute("aria-pressed", String(chip.getAttribute("aria-pressed") !== "true"));
      }));`,
    rn: `
      import { Pressable, StyleSheet, View } from 'react-native';
      import { AppText } from '@/core/components';
      import { useTheme } from '@/core/hooks';

      const { colors, radius } = useTheme();

      // Continue stays disabled until three are picked: disabled={picked.length < 3}
      <View style={styles.grid}>
        {categories.map(name => {
          const on = picked.includes(name);
          return (
            <Pressable
              key={name}
              onPress={() => togglePicked(name)}
              accessibilityState={{ selected: on }}
              style={[styles.chip, { borderRadius: radius.sm, borderColor: colors.white, backgroundColor: on ? colors.white : colors.transparent }]}>
              <AppText variant="bodyMedium" numberOfLines={1} color={on ? 'black' : 'white'} style={on && styles.bold}>{name}</AppText>
            </Pressable>
          );
        })}
      </View>

      const styles = StyleSheet.create({
        grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
        chip: { width: '31.5%', height: 44, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
        bold: { fontWeight: '700' },
      });`,
    rnKind: "pattern",
    rnWhere: "InterestsScreen",
    note: "The screen builds the chips from <code>US.CATEGORIES</code>. Long names are cut short with an ellipsis, so keep the full name in <code>title</code>.",
  },
  {
    id: "welcome-features",
    name: "Welcome feature row",
    group: "Sign-in and onboarding",
    order: 110,
    app: "WelcomeScreen",
    css: ["app/css/onboarding.css"],
    screens: ["welcome.html"],
    text: "Three icons with one-word labels on the welcome screen, above the Log in and Sign up buttons.",
    keywords: "welcome discover rewards connect icons",
    html: `
      <ul class="welcome__features" aria-label="What you can do">
        <li><i class="icon" data-lucide="compass"></i>Discover</li>
        <li><i class="icon" data-lucide="coins"></i>Rewards</li>
        <li><i class="icon" data-lucide="users"></i>Connect</li>
      </ul>`,
    rn: `
      import { StyleSheet, View } from 'react-native';
      import { Lucide } from '@react-native-vector-icons/lucide';
      import { AppText } from '@/core/components';
      import { useTheme } from '@/core/hooks';

      const { colors } = useTheme();
      const FEATURES = [
        { icon: 'compass', label: 'Discover' },
        { icon: 'coins', label: 'Rewards' },
        { icon: 'users', label: 'Connect' },
      ] as const;

      <View style={styles.row}>
        {FEATURES.map(f => (
          <View key={f.label} style={styles.item}>
            <Lucide name={f.icon} size={24} color={colors.white} />
            <AppText variant="labelMedium">{f.label}</AppText>
          </View>
        ))}
      </View>

      const styles = StyleSheet.create({
        row: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 64, marginBottom: 70 },
        item: { alignItems: 'center', gap: 4 },
      });`,
    rnKind: "pattern",
    rnWhere: "WelcomeScreen",
  },
  {
    id: "benefits-list",
    name: "Benefits list",
    group: "Sign-in and onboarding",
    order: 120,
    app: "CreatorBenefitsScreen",
    css: ["app/css/onboarding.css"],
    screens: ["creator-benefits.html"],
    text: "A short list of what creators get, each with a large icon. The first item stacks two small icons.",
    keywords: "creator benefits earn community grow",
    html: `
      <ul class="benefits__list">
        <li class="benefits__item">
          <span class="benefits__icon"><span class="benefits__stack"><i class="icon" data-lucide="clock"></i><i class="icon" data-lucide="dollar-sign"></i></span></span>
          Earn from your content
        </li>
        <li class="benefits__item">
          <span class="benefits__icon"><i class="icon" data-lucide="users"></i></span>
          Build your community
        </li>
        <li class="benefits__item">
          <span class="benefits__icon"><i class="icon" data-lucide="compass"></i></span>
          Grow your channel
        </li>
      </ul>`,
    rn: `
      import { StyleSheet, View } from 'react-native';
      import { Lucide } from '@react-native-vector-icons/lucide';
      import { AppText } from '@/core/components';
      import { useTheme } from '@/core/hooks';

      const { colors } = useTheme();

      <View style={styles.list}>
        <View style={styles.item}>
          <View style={[styles.icon, styles.stack]}>
            <Lucide name="clock" size={24} color={colors.white} style={styles.stackTop} />
            <Lucide name="dollar-sign" size={18} color={colors.white} style={styles.stackBottom} />
          </View>
          <AppText variant="bodyLarge">Earn from your content</AppText>
        </View>
        <View style={styles.item}>
          <View style={styles.icon}><Lucide name="users" size={28} color={colors.white} /></View>
          <AppText variant="bodyLarge">Build your community</AppText>
        </View>
        {/* Grow your channel: the same row with compass */}
      </View>

      const styles = StyleSheet.create({
        list: { gap: 32 },
        item: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 32 },
        icon: { width: 40, height: 40, marginRight: 16, alignItems: 'center', justifyContent: 'center' },
        stack: { flexDirection: 'row' },
        stackTop: { marginTop: -8, marginRight: -8 },
        stackBottom: { marginTop: 8 },
      });`,
    rnKind: "pattern",
    rnWhere: "CreatorBenefitsScreen",
  },
  {
    id: "age-oval",
    name: "Selfie oval",
    group: "Sign-in and onboarding",
    order: 130,
    app: "",
    css: ["app/css/onboarding.css"],
    screens: ["age-check.html", "age-check.html?state=checking"],
    text: "The face outline on the age check, with a hint underneath and the Take Selfie button. While the selfie is checked, a spinner sits in the oval and the button is busy.",
    keywords: "age check selfie camera face verify 18",
    html: `
      <div class="auth">
        <div class="age">
          <div class="age__oval" aria-hidden="true"><i class="icon icon--spin" data-lucide="loader-circle"></i></div>
          <p class="age__hint" role="status">Checking your selfie...</p>
          <div class="age__action"><button class="btn btn--primary btn--block" type="button" disabled aria-busy="true"><i class="icon icon--spin" data-lucide="loader-circle"></i>Take Selfie</button></div>
        </div>
      </div>`,
    rn: `
      import { ActivityIndicator, StyleSheet, View } from 'react-native';
      import { AppButton, AppText } from '@/core/components';
      import { useTheme } from '@/core/hooks';

      const { colors } = useTheme();

      // The camera preview would sit inside the oval
      <View style={[styles.oval, { borderColor: colors.white }]}>
        {checking && <ActivityIndicator size="large" color={colors.orange} />}
      </View>
      <AppText variant="bodyLarge" align="center" style={styles.hint}>
        {checking ? 'Checking your selfie...' : 'Center your face in the oval'}
      </AppText>
      <AppButton label="Take Selfie" fullWidth loading={checking} disabled={checking} onPress={() => {}} style={styles.action} />

      const styles = StyleSheet.create({
        oval: { width: 293, maxWidth: '100%', aspectRatio: 293 / 326, marginTop: 44, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: '50%' },
        hint: { marginTop: 20 },
        action: { marginTop: 56 },
      });`,
    rnKind: "pattern",
    rnWhere: "an age check screen, which the app doesn't have yet",
    frameCSS: ".cd-phone .age { padding-top: 0; padding-bottom: 0; }",
    note: "Built from the design file: the app's code has no age check screen yet. Before checking, the oval is empty and the hint reads \"Center your face in the oval\". The preview trims the screen's top padding.",
  },
);
