# App screens

Every screen and state in the Figma reference, and whether it's rebuilt in `app/`. The rebuild follows the live app's code, so some Figma states aren't in it, and some screens are built from Figma because the code doesn't have them. Rebuilt states open with `?state=` on the screen's address.

The list covers what was exported. These aren't in the exports, so ask for references before building them: admin panel, ID check for becoming a creator, Go live, Analytics, Monetization and payout setup, Change password, Blocked users, Child Safety Standards, and the Shorts "report submitted" state.

## Onboarding (`01-onboarding`)

| Screen | Shows | Rebuilt |
|---|---|---|
| `age-check-selfie` | Confirm you are 18+, selfie | Yes |
| `forgot-password` | Forgot password | Yes |
| `forgot-password-email-code` | Enter the emailed code | Yes |
| `login` | Log in | Yes |
| `login-error-apple-account` | Error: this account uses Apple sign-in | Yes |
| `login-error-google-account` | Error: this account uses Google sign-in | Yes |
| `login-error-invalid` | Errors: invalid email, wrong password | Yes |
| `reset-password` | Reset password | Yes |
| `signup` | Create your account | Yes |
| `signup-email-code` | Sign up: enter the emailed code | Yes |
| `signup-email-code-error` | Sign up: incorrect code | Yes |
| `signup-error-email-exists` | Email already has an account | Yes |
| `signup-error-invalid-email` | Invalid email | Yes |
| `signup-handle` | Choose your handle | Yes |
| `signup-handle-available` | Handle available | Yes |
| `signup-handle-taken` | Handle taken | Yes |
| `signup-password` | Set your password | Yes |
| `signup-password-mismatch` | Passwords don't match | Yes |
| `signup-password-too-short` | Password too short | Yes |
| `signup-toast-age-verified` | Message: your age is verified | Yes |
| `signup-toast-under-18` | Message: you must be 18 or older | Yes |
| `social-login-placeholder` | Placeholder for the Google or Apple screen | Yes |
| `welcome` | Welcome screen with logo, Log in and Sign up | Yes |

## Discover (`02-discover`)

| Screen | Shows | Rebuilt |
|---|---|---|
| `discover` | Discover feed | Yes |
| `discover-empty` | No contents yet | Yes |
| `discover-error` | Something went wrong | Yes |
| `discover-offline` | You're offline | Yes |
| `discover-with-live-item` | Discover feed, first item live | Yes |
| `search` | Search with recent searches | Yes |
| `search-no-results` | No search results | Yes |
| `search-results` | Search results with Videos, Shorts, Live and Creators filters | Yes |

## My Feed (`03-my-feed`)

| Screen | Shows | Rebuilt |
|---|---|---|
| `my-feed` | My Feed | Yes |
| `my-feed-all-caught-up` | You're all caught up | No: the app has no such state |
| `my-feed-error` | Something went wrong | Yes |
| `my-feed-offline` | You're offline | Yes |
| `my-feed-welcome` | Welcome to My Feed, follow creators | Yes |

## Shorts (`04-shorts`)

| Screen | Shows | Rebuilt |
|---|---|---|
| `short-from-channel` | Short opened from a channel, with back button | Yes |
| `shorts` | Shorts feed | Yes |
| `shorts-all-caught-up` | End of Shorts, all caught up | Yes |
| `shorts-controls-hidden` | Short with the controls hidden | Yes |
| `shorts-empty` | No contents yet | Yes |
| `shorts-error` | Something went wrong | Yes |
| `shorts-offline` | You're offline | Yes |
| `shorts-report-empty` | Report sheet, nothing chosen | No: the app has no report option |
| `shorts-report-filled` | Report sheet filled in, Submit enabled | No: the app has no report option |

## Watch (`05-watch`)

| Screen | Shows | Rebuilt |
|---|---|---|
| `content-not-found` | Content not available | Yes |
| `popup-delete-comment` | Popup: delete comment | Yes |
| `popup-report-submitted` | Popup: report submitted | Yes |
| `video` | Video page with related videos | |
| `video-comment-added` | Own comment added, with delete icon | Yes |
| `video-comments` | Comments | Yes |
| `video-comments-empty` | No comments yet | Yes |
| `video-description` | Full description | Yes |
| `video-following` | Video, following the creator, bell on | Yes |
| `video-following-notifications-off` | Video, following the creator, bell off | Yes |
| `video-live-chat` | Video with live chat and reward messages | No: the app has no live chat replay |
| `video-no-related` | Video page, no related videos | Yes |
| `video-report-empty` | Report sheet on a video | No: the app has no report option |
| `video-report-submitted` | Report submitted popup over a video | Yes |

## Live (`06-live`)

| Screen | Shows | Rebuilt |
|---|---|---|
| `live-camera-off` | Live stream with the creator's camera off | Yes |
| `live-chat-disabled` | Live chat disabled by the creator | Yes |
| `live-chat-empty` | Live chat, no messages yet | Yes |
| `live-ended` | Live stream ended, Watch the recording | Yes |
| `live-offline` | You're offline | Yes |
| `live-view` | Live stream, back button on the video | Yes |
| `live-view-back-above-video` | Live stream, back button above the video | Yes |

## Rewards (`07-rewards`)

| Screen | Shows | Rebuilt |
|---|---|---|
| `payment-gateway-placeholder` | Placeholder for the payment screen | No: placeholder only |
| `popup-reward-details` | Popup: breakdown of a reward | Yes |
| `reward-activities-contributions` | Reward activities, Contributions tab | Yes |
| `reward-activities-contributions-empty` | Contributions tab empty | Yes |
| `reward-activities-earned` | Reward activities, Earned tab | Yes |
| `reward-activities-earned-empty` | Earned tab empty | Yes |
| `reward-activities-viewer` | Reward activities for a viewer, no tabs | Yes |
| `reward-select` | Reward a creator: choose characters and quantity | Yes |
| `reward-sent` | Reward sent | No: the app's reward sheet just closes when the reward is sent |

## Notifications (`08-notifications`)

| Screen | Shows | Rebuilt |
|---|---|---|
| `notifications-creator-first-read` | Creator notifications, first item read | Yes |
| `notifications-creator-unread` | Creator notifications, all unread | Yes |
| `notifications-empty` | No notifications yet | Yes |
| `notifications-error` | Something went wrong | Yes |
| `notifications-loading` | Loading notifications | Yes |
| `notifications-offline` | You're offline | Yes |
| `notifications-turned-off` | Notifications turned off | Yes |
| `notifications-viewer-some-read` | Viewer notifications, first two read | Yes |
| `notifications-viewer-unread` | Viewer notifications, all unread | Yes |

## Channel view (`09-channel-view`)

| Screen | Shows | Rebuilt |
|---|---|---|
| `channel` | Creator's channel | Yes |
| `channel-empty` | Creator's channel, no content | Yes |
| `followers-list` | Followers list | Yes |
| `following-list` | Following list | Yes |

## Profile and settings (`10-profile-settings`)

| Screen | Shows | Rebuilt |
|---|---|---|
| `edit-profile` | Edit profile | Yes |
| `edit-profile-email-changed` | Edit profile, email changed | Yes |
| `edit-profile-username-changed` | Edit profile, username available | Yes |
| `popup-change-email` | Popup: change email | Yes |
| `popup-change-username` | Popup: change username | Yes |
| `popup-delete-account` | Popup: delete account | Yes |
| `popup-delete-watch-history` | Popup: delete watch history | Yes |
| `popup-log-out` | Popup: log out | Yes |
| `popup-pause-watch-history` | Popup: pause watch history | Yes |
| `profile-creator` | Creator profile: channel card, Become an Advertiser (coming soon), history | Yes |
| `profile-viewer` | Viewer profile: Become a Creator, Become an Advertiser (coming soon), history | Yes |
| `settings` | Settings | Yes |
| `watch-history` | Watch history | Yes |
| `watch-history-empty` | Watch history empty | Yes |
| `watch-history-paused` | Watch history paused | Yes |

## Creator studio (`11-creator-studio`)

| Screen | Shows | Rebuilt |
|---|---|---|
| `channel-own-view` | Creator viewing their own channel | Yes |
| `create-channel` | Create your channel | Yes |
| `edit-channel` | Edit channel, with 30-day lock warnings | Yes |
| `edit-video` | Edit video, no changes yet | Yes |
| `edit-video-18plus-question` | Edit video with the 18+ question | No: not in the app |
| `edit-video-changed` | Edit video after changes, Save enabled | Yes |
| `edit-video-changed-18plus-question` | Edit video after changes, with the 18+ question | No: not in the app |
| `edit-video-scheduled` | Edit a scheduled video, date and time shown | Yes |
| `manage-contents-empty` | Manage contents, no content yet | Yes |
| `manage-contents-published` | Manage contents, Published tab | Yes |
| `manage-contents-scheduled-empty` | Manage contents, Scheduled tab empty | Yes |
| `popup-cancel-upload-short` | Popup: cancel short upload | Yes |
| `popup-cancel-upload-video` | Popup: cancel video upload | Yes |
| `popup-delete-video` | Popup: delete video | Yes |
| `popup-discard-changes` | Popup: discard changes | Yes |
| `reports-my-reports` | Reports, My Reports tab | No: not in the app |
| `reports-on-my-content` | Reports, Report on my content tab | No: not in the app |
| `ultra-studio` | Ultra Studio with stats | Yes |
| `ultra-studio-new-user` | Ultra Studio with zero stats | Yes |
| `upload-short-filled` | Upload short with file and thumbnail | Yes |
| `upload-short-filled-18plus-toggle` | Upload short with file and thumbnail, with 18+ toggle | No: not in the app |
| `upload-short-scheduled` | Upload short, schedule on | Yes |
| `upload-short-scheduled-18plus-toggle` | Upload short, schedule on, with 18+ toggle | No: not in the app |
| `upload-short-scheduled-uploading` | Scheduled short with upload progress | Yes |
| `upload-video-empty` | Upload video, nothing added | Yes |
| `upload-video-empty-18plus-toggle` | Upload video, nothing added, with 18+ toggle | No: not in the app |
| `upload-video-filled` | Upload video with file and thumbnail | Yes |
| `upload-video-filled-18plus-toggle` | Upload video with file and thumbnail, with 18+ toggle | No: not in the app |
| `upload-video-uploading` | Upload video with upload progress | Yes |
| `watch-own-video` | Creator viewing their own video, Go to Ultra Studio | Yes |

## Chat (`12-chat`)

| Screen | Shows | Rebuilt |
|---|---|---|
| `chat-conversation` | Conversation, empty message box | No: not wired up in the app's code yet (1-1 Chat is in testing) |
| `chat-conversation-deleted-account` | Conversation with a deleted user, sending disabled | No: not wired up in the app's code yet (1-1 Chat is in testing) |
| `chat-conversation-typing` | Conversation with text typed, send active | No: not wired up in the app's code yet (1-1 Chat is in testing) |
| `chat-empty` | No messages yet | No: not wired up in the app's code yet (1-1 Chat is in testing) |
| `chat-list` | Chat list | No: not wired up in the app's code yet (1-1 Chat is in testing) |
| `chat-list-deleted-account` | Chat list with a deleted account | No: not wired up in the app's code yet (1-1 Chat is in testing) |
