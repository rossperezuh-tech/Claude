# Photos & videos: free the phone, organize in pCloud

Three pieces work together:

1. **pCloud Automatic Upload** gets everything off the iPhone.
2. **`scripts/media-sort.mjs`** files the uploads into a clean library (by date, photos vs videos, by business) and parks duplicates.
3. **Venture HQ → Media** indexes the albums and clips that matter per business so you can find them from the dashboard or Cmd+K.

## 1. Free up the iPhone (do this first, in this order)

Menu names can differ slightly between pCloud app versions.

1. **Check iCloud Photos first.** Settings → your name → iCloud → Photos.
   - If it is **on**, deleting a photo on the phone deletes it from iCloud and every other Apple device too. That is fine once pCloud has it, but know it before you delete.
   - If "Optimize iPhone Storage" is on, full-size originals are in iCloud, and pCloud has to download each one before uploading it. Expect the backup to be slow; keep the phone on Wi-Fi and power.
2. **Turn on Automatic Upload** in the pCloud app (Settings → Automatic Upload). Enable both photos **and videos**, and give the app access to **All Photos** when iOS asks (not "Selected Photos").
3. **Let it finish.** iOS pauses background uploads, so plug the phone in, stay on Wi-Fi, and leave the pCloud app open on screen. Large video libraries can take a night or two.
4. **Verify before deleting anything.** Compare the item count in the iPhone Photos app (bottom of Library → All Photos) with the count in pCloud's `Automatic Upload` folder, and open a few of the newest and oldest videos in pCloud to confirm they play.
5. **Delete from the phone.** Use pCloud's "Free up space" option if your app version has it (it removes only items already uploaded). Otherwise delete in the Photos app, largest videos first: Albums → Media Types → Videos.
6. **Empty Recently Deleted** (Photos → Albums → Recently Deleted → Delete All). Space is not reclaimed until you do; iOS otherwise holds the files for 30 days.

Going forward, leave Automatic Upload on and repeat steps 4-6 monthly.

## 2. Sort the pCloud library

Needs a computer with the **pCloud Drive** desktop app (your pCloud shows up as a normal drive) and Node 18+. No API keys, no extra installs.

```bash
# one time: create the folder skeleton, including an inbox folder per business
npm run media:sort -- --init --dest "/path/to/pCloud Drive/Media Library"

# preview: prints what would happen, moves nothing
npm run media:sort -- "/path/to/pCloud Drive/Automatic Upload" --dest "/path/to/pCloud Drive/Media Library"

# do it
npm run media:sort -- "/path/to/pCloud Drive/Automatic Upload" --dest "/path/to/pCloud Drive/Media Library" --apply
```

Typical pCloud Drive locations: `~/pCloud Drive` on Mac, `P:\` on Windows.

Resulting layout:

```
Media Library/
  _Inbox/<Business>/                    drop a shoot here; next run files it under that business
  Personal/Photos/2026/2026-07/
  Personal/Videos/2026/2026-07/
  Business/Penthouse Yoga/Photos/2026/2026-07/
  Business/Penthouse Yoga/Videos/2026/2026-07/
  _Duplicates/                          exact copies, parked for you to review and delete
  _Reports/                             summary + move list for every run
```

How it decides:

- **Date**: a date in the filename, else the capture date inside the file (EXIF for JPEG/HEIC, header for MOV/MP4), else the file's modified time. The summary shows how many files used each; modified-time is the least reliable.
- **Photos vs videos**: by file type. A Live Photo's short `.mov` stays next to its photo.
- **Business**: the script cannot tell what is in a picture. A file goes under a business only if it sits in a folder named after that business (the `_Inbox/<Business>` folders, or any folder named e.g. `penthouse-yoga`). Everything else is Personal.
- **Duplicates**: byte-identical files (files over 64 MB are compared by size plus their first and last 4 MB). A copy filed under a business is kept over a personal one, otherwise the oldest; the others move to `_Duplicates`. A file already in the library always wins over a new upload.

Safety:

- Dry run is the default. Nothing moves without `--apply`.
- Nothing is ever deleted, including duplicates.
- Every run writes a move list. Reverse a run with
  `npm run media:sort -- --undo "<library>/_Reports/moves-<timestamp>.csv"`.
- Re-running is safe: files already in the library are left alone and only new uploads are filed.

The run summary also lists the 15 largest videos, which is the quickest way to see what is eating space.

Add `--no-metadata` to skip reading inside files (faster over a slow connection, but iPhone files named `IMG_1234` then fall back to modified time).

## 3. Index what matters in Venture HQ

Open **Media** in the top nav (or the Media section on any business page) and add an entry for each album or clip worth finding again: title, type, a pCloud share link or folder path, date shot, tags. Leave the business as "Personal" for non-business media. Entries are searchable from Cmd+K and filterable by type, business and tag.

Like the Documents index, this stores links only. The files stay in pCloud.
